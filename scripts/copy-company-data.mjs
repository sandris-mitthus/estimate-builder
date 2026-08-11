/**
 * One-off: copy company-scoped demo data from SOURCE → DEST.
 * Remaps primary keys and rewrites UUID / storage path refs in JSONB.
 *
 * Destructive on DEST (deletes existing company rows). CLI-only — not an HTTP route.
 *
 * Usage:
 *   SOURCE_COMPANY_ID=… DEST_COMPANY_ID=… node scripts/copy-company-data.mjs --confirm
 *   SOURCE_COMPANY_ID=… DEST_COMPANY_ID=… node scripts/copy-company-data.mjs --dry-run
 */
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const { Client } = pg;

function loadEnv(file) {
  const env = {};
  for (const line of readFileSync(join(process.cwd(), file), "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  return env;
}

function connectCandidates(env) {
  if (env.DATABASE_URL) return [env.DATABASE_URL];
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const password = env.SUPABASE_DB_PASSWORD;
  if (!url || !password) {
    throw new Error("Missing DATABASE_URL or SUPABASE_DB_PASSWORD");
  }
  const projectRef = url.replace("https://", "").replace(".supabase.co", "");
  const encodedPassword = encodeURIComponent(password);
  const region = env.SUPABASE_DB_REGION || "eu-west-1";
  return [
    `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
  ];
}

async function connectPg(env) {
  for (const connectionString of connectCandidates(env)) {
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    try {
      await client.connect();
      return client;
    } catch {
      // try next
    }
  }
  throw new Error("Could not connect to Postgres");
}

function mapId(map, oldId) {
  if (!oldId) return null;
  if (!map.has(oldId)) map.set(oldId, randomUUID());
  return map.get(oldId);
}

function remapValue(value, maps, sourceCompanyId, destCompanyId) {
  if (value == null) return value;
  if (typeof value === "string") {
    let out = value;
    if (out.includes(sourceCompanyId)) {
      out = out.split(sourceCompanyId).join(destCompanyId);
    }
    for (const map of maps) {
      for (const [from, to] of map) {
        if (out.includes(from)) out = out.split(from).join(to);
      }
    }
    return out;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      remapValue(item, maps, sourceCompanyId, destCompanyId),
    );
  }
  if (typeof value === "object") {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = remapValue(nested, maps, sourceCompanyId, destCompanyId);
    }
    return out;
  }
  return value;
}

async function copyStorageObjects(storage, sourceCompanyId, destCompanyId, idMaps) {
  const buckets = ["module-assets", "company-assets"];
  let copied = 0;
  for (const bucket of buckets) {
    const prefix = `companies/${sourceCompanyId}`;
    const { data: listed, error } = await storage.from(bucket).list(prefix, {
      limit: 1000,
      offset: 0,
    });
    // list is shallow — use DB paths instead via postgres already collected
    if (error && !listed) {
      console.warn(`storage list ${bucket}:`, error.message);
    }
  }

  // Prefer exact paths from DB (passed via idMaps._storagePaths)
  const paths = idMaps._storagePaths ?? [];
  for (const { bucket, path } of paths) {
    const { data, error } = await storage.from(bucket).download(path);
    if (error || !data) {
      console.warn(`download fail ${bucket}/${path}:`, error?.message);
      continue;
    }
    let newPath = path.split(sourceCompanyId).join(destCompanyId);
    for (const map of [idMaps.modules, idMaps.workers]) {
      for (const [from, to] of map) {
        newPath = newPath.split(from).join(to);
      }
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    const { error: upErr } = await storage.from(bucket).upload(newPath, buffer, {
      upsert: true,
      contentType: data.type || undefined,
    });
    if (upErr) {
      console.warn(`upload fail ${bucket}/${newPath}:`, upErr.message);
    } else {
      copied += 1;
    }
  }
  return copied;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const confirmed =
    args.has("--confirm") || process.env.CONFIRM_COPY === "1";

  if (!dryRun && !confirmed) {
    console.error(
      "Refusing to run: pass --confirm (or CONFIRM_COPY=1), or --dry-run.",
    );
    process.exit(1);
  }

  const env = loadEnv(".env.local");
  const SOURCE =
    process.env.SOURCE_COMPANY_ID || "00000000-0000-0000-0000-000000000001";
  const DEST =
    process.env.DEST_COMPANY_ID || "d5a0231e-096b-4559-bf93-bac2fb30fcbf";

  if (SOURCE === DEST) throw new Error("SOURCE and DEST must differ");

  if (dryRun) {
    console.log(`[dry-run] Would copy ${SOURCE} → ${DEST} (no writes).`);
    process.exit(0);
  }

  const client = await connectPg(env);
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const modules = new Map();
  const prices = new Map();
  const priceHistory = new Map();
  const excluded = new Map();
  const sagatave = new Map();
  const projects = new Map();
  const estimates = new Map();
  const workers = new Map();
  const tools = new Map();
  const toolHistory = new Map();

  const allMaps = [
    modules,
    prices,
    priceHistory,
    excluded,
    sagatave,
    projects,
    estimates,
    workers,
    tools,
    toolHistory,
  ];

  console.log(`Copy ${SOURCE} → ${DEST}`);

  await client.query("begin");
  try {
    // Clear existing demo operational data (keep membership / identity)
    const clearOrder = [
      "company_timeline_graph_parallel",
      "company_timeline_graph_people",
      "company_timeline_graph_order",
      "company_tool_assignment_history",
      "company_tools",
      "company_workers",
      "project_material_assignments",
      "estimates",
      "projects",
      "estimate_positions",
      "position_price_history",
      "position_prices",
      "excluded_positions",
      "building_modules",
      "company_frontend_modules",
    ];
    for (const table of clearOrder) {
      await client.query(`delete from public.${table} where company_id = $1`, [
        DEST,
      ]);
    }

    // VIP + modules access for presentations
    await client.query(
      `update public.companies
       set is_vip = true,
           access_blocked = false,
           updated_at = now()
       where id = $1`,
      [DEST],
    );

    // Settings: keep Demo identity, copy operational fields from Mitthus
    await client.query(
      `update public.company_settings dest
       set currency = src.currency,
           estimate_validity_days = src.estimate_validity_days,
           default_hourly_rate = src.default_hourly_rate,
           offer_additional_info = src.offer_additional_info,
           offer_validity_days = src.offer_validity_days,
           updated_at = now()
       from public.company_settings src
       where dest.company_id = $1 and src.company_id = $2`,
      [DEST, SOURCE],
    );

    // Frontend modules
    const { rows: srcModules } = await client.query(
      `select module_key, is_enabled from public.company_frontend_modules where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcModules) {
      await client.query(
        `insert into public.company_frontend_modules (id, company_id, module_key, is_enabled)
         values ($1, $2, $3, $4)`,
        [randomUUID(), DEST, row.module_key, row.is_enabled],
      );
    }

    // Building modules
    const { rows: srcBuilding } = await client.query(
      `select * from public.building_modules where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcBuilding) {
      const newId = mapId(modules, row.id);
      const outline = remapValue(row.outline, allMaps, SOURCE, DEST);
      const visualization_blocks = remapValue(
        row.visualization_blocks,
        allMaps,
        SOURCE,
        DEST,
      );
      const project_blocks = remapValue(row.project_blocks, allMaps, SOURCE, DEST);
      const project_description = remapValue(
        row.project_description,
        allMaps,
        SOURCE,
        DEST,
      );
      await client.query(
        `insert into public.building_modules (
           id, company_id, name, note,
           outline, visualization_blocks, project_blocks, project_description,
           created_at, updated_at
         ) values ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10)`,
        [
          newId,
          DEST,
          row.name,
          row.note,
          JSON.stringify(outline ?? {}),
          JSON.stringify(visualization_blocks ?? []),
          JSON.stringify(project_blocks ?? []),
          JSON.stringify(project_description ?? {}),
          row.created_at,
          row.updated_at,
        ],
      );
    }

    // Catalog
    const { rows: srcPrices } = await client.query(
      `select * from public.position_prices where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcPrices) {
      const newId = mapId(prices, row.id);
      await client.query(
        `insert into public.position_prices (
           id, company_id, name, unit, unit_price, unit_price_updated_at,
           supplier_name, supplier_contact_name, supplier_email, supplier_phone,
           cost_type, variable_quantity, created_at, updated_at
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          newId,
          DEST,
          row.name,
          row.unit,
          row.unit_price,
          row.unit_price_updated_at,
          row.supplier_name,
          row.supplier_contact_name,
          row.supplier_email,
          row.supplier_phone,
          row.cost_type,
          row.variable_quantity,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    const { rows: srcHistory } = await client.query(
      `select * from public.position_price_history where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcHistory) {
      const newId = mapId(priceHistory, row.id);
      const newPriceId = mapId(prices, row.position_price_id);
      await client.query(
        `insert into public.position_price_history (
           id, company_id, position_price_id, unit_price, recorded_at,
           supplier_name, supplier_contact_name, supplier_email, supplier_phone, created_at
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          newId,
          DEST,
          newPriceId,
          row.unit_price,
          row.recorded_at,
          row.supplier_name,
          row.supplier_contact_name,
          row.supplier_email,
          row.supplier_phone,
          row.created_at,
        ],
      );
    }

    // Excluded positions
    const { rows: srcExcluded } = await client.query(
      `select * from public.excluded_positions where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcExcluded) {
      const newId = mapId(excluded, row.id);
      await client.query(
        `insert into public.excluded_positions (
           id, company_id, name, sort_order, created_at, updated_at
         ) values ($1,$2,$3,$4,$5,$6)`,
        [newId, DEST, row.name, row.sort_order, row.created_at, row.updated_at],
      );
    }

    // Sagatave
    const { rows: srcSagatave } = await client.query(
      `select * from public.estimate_positions where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcSagatave) {
      const newId = mapId(sagatave, row.id);
      const sections = remapValue(row.sections, allMaps, SOURCE, DEST);
      await client.query(
        `insert into public.estimate_positions (
           id, company_id, name, title, sections, created_at, updated_at
         ) values ($1,$2,$3,$4,$5::jsonb,$6,$7)`,
        [
          newId,
          DEST,
          row.name,
          row.title,
          JSON.stringify(sections ?? []),
          row.created_at,
          row.updated_at,
        ],
      );
    }

    // Projects
    const { rows: srcProjects } = await client.query(
      `select * from public.projects where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcProjects) {
      const newId = mapId(projects, row.id);
      const buildingModuleId = row.building_module_id
        ? mapId(modules, row.building_module_id)
        : null;
      const visualization_blocks = remapValue(
        row.visualization_blocks,
        allMaps,
        SOURCE,
        DEST,
      );
      const project_blocks = remapValue(row.project_blocks, allMaps, SOURCE, DEST);
      const project_description = remapValue(
        row.project_description,
        allMaps,
        SOURCE,
        DEST,
      );
      await client.query(
        `insert into public.projects (
           id, company_id, name, address, phone, email, status, building_module_id,
           visualization_blocks, project_blocks, project_description,
           created_at, updated_at
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13)`,
        [
          newId,
          DEST,
          row.name,
          row.address,
          row.phone,
          row.email,
          row.status,
          buildingModuleId,
          JSON.stringify(visualization_blocks ?? []),
          JSON.stringify(project_blocks ?? []),
          JSON.stringify(project_description ?? {}),
          row.created_at,
          row.updated_at,
        ],
      );
    }

    // Estimates
    const { rows: srcEstimates } = await client.query(
      `select * from public.estimates where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcEstimates) {
      const newId = mapId(estimates, row.id);
      const newProjectId = mapId(projects, row.project_id);
      const meta = remapValue(row.meta, allMaps, SOURCE, DEST);
      const categories = remapValue(row.categories, allMaps, SOURCE, DEST);
      await client.query(
        `insert into public.estimates (
           id, company_id, project_id, title, display_name, estimate_kind,
           meta, categories, created_at, updated_at
         ) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10)`,
        [
          newId,
          DEST,
          newProjectId,
          row.title,
          row.display_name,
          row.estimate_kind,
          JSON.stringify(meta ?? {}),
          JSON.stringify(categories ?? {}),
          row.created_at,
          row.updated_at,
        ],
      );
    }

    // Workers
    const { rows: srcWorkers } = await client.query(
      `select * from public.company_workers where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcWorkers) {
      const newId = mapId(workers, row.id);
      let photoPath = row.photo_path;
      if (photoPath) {
        photoPath = remapValue(photoPath, allMaps, SOURCE, DEST);
      }
      await client.query(
        `insert into public.company_workers (
           id, company_id, first_name, last_name, phone, phone_calling_code,
           photo_path, sort_order, created_at, updated_at
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          newId,
          DEST,
          row.first_name,
          row.last_name,
          row.phone,
          row.phone_calling_code,
          photoPath,
          row.sort_order,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    // Tools
    const { rows: srcTools } = await client.query(
      `select * from public.company_tools where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcTools) {
      const newId = mapId(tools, row.id);
      const assigned = row.assigned_worker_id
        ? mapId(workers, row.assigned_worker_id)
        : null;
      await client.query(
        `insert into public.company_tools (
           id, company_id, tool_number, name, purchase_date, price, price_type,
           assigned_worker_id, sort_order, created_at, updated_at
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          newId,
          DEST,
          row.tool_number,
          row.name,
          row.purchase_date,
          row.price,
          row.price_type,
          assigned,
          row.sort_order,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    const { rows: srcToolHist } = await client.query(
      `select * from public.company_tool_assignment_history where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcToolHist) {
      const newId = mapId(toolHistory, row.id);
      await client.query(
        `insert into public.company_tool_assignment_history (
           id, company_id, tool_id, worker_id, worker_name, assigned_at, created_at
         ) values ($1,$2,$3,$4,$5,$6,$7)`,
        [
          newId,
          DEST,
          mapId(tools, row.tool_id),
          row.worker_id ? mapId(workers, row.worker_id) : null,
          row.worker_name,
          row.assigned_at,
          row.created_at,
        ],
      );
    }

    // Timeline graph
    const { rows: srcOrder } = await client.query(
      `select * from public.company_timeline_graph_order where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcOrder) {
      await client.query(
        `insert into public.company_timeline_graph_order (
           company_id, project_id, sort_order, created_at, updated_at
         ) values ($1,$2,$3,$4,$5)`,
        [
          DEST,
          mapId(projects, row.project_id),
          row.sort_order,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    const { rows: srcPeople } = await client.query(
      `select * from public.company_timeline_graph_people where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcPeople) {
      await client.query(
        `insert into public.company_timeline_graph_people (
           company_id, project_id, section_id, people_count, created_at, updated_at
         ) values ($1,$2,$3,$4,$5,$6)`,
        [
          DEST,
          mapId(projects, row.project_id),
          row.section_id,
          row.people_count,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    const { rows: srcParallel } = await client.query(
      `select * from public.company_timeline_graph_parallel where company_id = $1`,
      [SOURCE],
    );
    for (const row of srcParallel) {
      await client.query(
        `insert into public.company_timeline_graph_parallel (
           company_id, project_id, section_id, parallel_group_id, created_at, updated_at
         ) values ($1,$2,$3,$4,$5,$6)`,
        [
          DEST,
          mapId(projects, row.project_id),
          row.section_id,
          row.parallel_group_id,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    // Collect storage paths from source
    const { rows: storageRows } = await client.query(
      `select bucket_id, name
       from storage.objects
       where name like $1`,
      [`companies/${SOURCE}/%`],
    );

    await client.query("commit");
    console.log("DB copy committed.");
    console.log({
      modules: modules.size,
      prices: prices.size,
      history: priceHistory.size,
      excluded: excluded.size,
      sagatave: sagatave.size,
      projects: projects.size,
      estimates: estimates.size,
      workers: workers.size,
      tools: tools.size,
      storageObjects: storageRows.length,
    });

    const idMaps = { modules, workers, _storagePaths: storageRows.map((r) => ({
      bucket: r.bucket_id,
      path: r.name,
    })) };
    const copiedFiles = await copyStorageObjects(
      supabase.storage,
      SOURCE,
      DEST,
      idMaps,
    );
    console.log(`Storage files copied: ${copiedFiles}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
