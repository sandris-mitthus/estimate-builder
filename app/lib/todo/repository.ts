import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getCurrentCompanyId } from "@/app/lib/companies/current-company";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

type TodoCategoryRow = {
  id: string;
  title: string;
  sort_order: number;
  updated_at: string;
};

type TodoTaskRow = {
  id: string;
  category_id: string;
  title: string;
  description: string;
  sort_order: number;
  updated_at: string;
};

export type TodoTaskSummary = {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  sortOrder: number;
  updatedAt: string;
};

export type TodoCategorySummary = {
  id: string;
  title: string;
  sortOrder: number;
  updatedAt: string;
  tasks: TodoTaskSummary[];
};

export type TodoCategoryInput = {
  title: string;
};

export type TodoTaskInput = {
  categoryId: string;
  title: string;
  description: string;
};

export type TodoTaskReorderItem = {
  id: string;
  categoryId: string;
  sortOrder: number;
};

type TodoScope = {
  companyId: string;
  userId: string;
};

const DEFAULT_UPDATED_AT = "2026-01-01T00:00:00.000Z";
const DEFAULT_TODO_CATEGORY_SOURCE_KEY = "default:tasks";
const DEFAULT_TODO_CATEGORY_TITLE = "Uzdevumi";

const DEFAULT_TODO_CATEGORIES: TodoCategorySummary[] = [
  {
    id: "default-materials",
    title: "Materiālu pasūtīšana",
    sortOrder: 10,
    updatedAt: DEFAULT_UPDATED_AT,
    tasks: [
      {
        id: "default-materials-request",
        categoryId: "default-materials",
        title: "Pārbaudīt materiālu pieprasījumus",
        description: "",
        sortOrder: 10,
        updatedAt: DEFAULT_UPDATED_AT,
      },
    ],
  },
  {
    id: "default-invoices",
    title: "Rēķinu apmaksas",
    sortOrder: 20,
    updatedAt: DEFAULT_UPDATED_AT,
    tasks: [
      {
        id: "default-invoices-review",
        categoryId: "default-invoices",
        title: "Sakārtot apmaksājamos rēķinus",
        description: "",
        sortOrder: 10,
        updatedAt: DEFAULT_UPDATED_AT,
      },
    ],
  },
];

function mapTodoTaskRow(row: TodoTaskRow): TodoTaskSummary {
  return {
    id: row.id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

function mapTodoCategoryRow(
  row: TodoCategoryRow,
  tasks: TodoTaskSummary[],
): TodoCategorySummary {
  return {
    id: row.id,
    title: row.title,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
    tasks,
  };
}

async function getRequiredTodoScope(): Promise<{
  companyId: string;
  userId: string;
} | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const [companyId, user] = await Promise.all([getCurrentCompanyId(), getCurrentUser()]);
  if (!companyId || !user) {
    return null;
  }

  return { companyId, userId: user.id };
}

async function ensureDefaultTodoCategoryForScope(
  scope: TodoScope,
): Promise<TodoCategorySummary | null> {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("todo_categories")
    .select("id, title, sort_order, updated_at")
    .eq("company_id", scope.companyId)
    .eq("user_id", scope.userId)
    .eq("source_key", DEFAULT_TODO_CATEGORY_SOURCE_KEY)
    .maybeSingle();

  if (existing) {
    return mapTodoCategoryRow(existing as TodoCategoryRow, []);
  }

  const { data, error } = await supabase
    .from("todo_categories")
    .upsert(
      {
        company_id: scope.companyId,
        user_id: scope.userId,
        source_key: DEFAULT_TODO_CATEGORY_SOURCE_KEY,
        title: DEFAULT_TODO_CATEGORY_TITLE,
        sort_order: 0,
      },
      { onConflict: "company_id,user_id,source_key" },
    )
    .select("id, title, sort_order, updated_at")
    .single();

  if (error || !data) {
    return null;
  }

  return mapTodoCategoryRow(data as TodoCategoryRow, []);
}

async function listTodoCategoriesForScope(
  scope: TodoScope,
): Promise<TodoCategorySummary[]> {
  const supabase = createAdminClient();
  const [categoriesResult, tasksResult] = await Promise.all([
    supabase
      .from("todo_categories")
      .select("id, title, sort_order, updated_at")
      .eq("company_id", scope.companyId)
      .eq("user_id", scope.userId)
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true }),
    supabase
      .from("todo_tasks")
      .select("id, category_id, title, description, sort_order, updated_at")
      .eq("company_id", scope.companyId)
      .eq("user_id", scope.userId)
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true }),
  ]);

  if (
    categoriesResult.error ||
    tasksResult.error ||
    !categoriesResult.data ||
    !tasksResult.data
  ) {
    return [];
  }

  const tasks = (tasksResult.data as TodoTaskRow[]).map(mapTodoTaskRow);
  const tasksByCategory = new Map<string, TodoTaskSummary[]>();
  tasks.forEach((task) => {
    const categoryTasks = tasksByCategory.get(task.categoryId) ?? [];
    categoryTasks.push(task);
    tasksByCategory.set(task.categoryId, categoryTasks);
  });

  return (categoriesResult.data as TodoCategoryRow[]).map((category) =>
    mapTodoCategoryRow(category, tasksByCategory.get(category.id) ?? []),
  );
}

export async function listTodoCategories(): Promise<TodoCategorySummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return [
      {
        id: "default-tasks",
        title: DEFAULT_TODO_CATEGORY_TITLE,
        sortOrder: 0,
        updatedAt: DEFAULT_UPDATED_AT,
        tasks: [],
      },
      ...DEFAULT_TODO_CATEGORIES,
    ];
  }

  const scope = await getRequiredTodoScope();
  if (!scope) {
    return [];
  }

  await ensureDefaultTodoCategoryForScope(scope);

  return listTodoCategoriesForScope(scope);
}

export async function createTodoCategory(
  input: TodoCategoryInput,
): Promise<{ ok: true; category: TodoCategorySummary } | { ok: false; error: string }> {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "Ievadi kategorijas nosaukumu." };
  }

  const scope = await getRequiredTodoScope();
  if (!scope) {
    return { ok: false, error: "Lietotājs vai uzņēmums nav atrasts." };
  }

  const existingCategories = await listTodoCategories();
  const nextSortOrder =
    Math.max(0, ...existingCategories.map((category) => category.sortOrder)) + 10;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("todo_categories")
    .insert({
      company_id: scope.companyId,
      user_id: scope.userId,
      title,
      sort_order: nextSortOrder,
    })
    .select("id, title, sort_order, updated_at")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās izveidot kategoriju." };
  }

  return {
    ok: true,
    category: mapTodoCategoryRow(data as TodoCategoryRow, []),
  };
}

export async function updateTodoCategory(
  categoryId: string,
  input: TodoCategoryInput,
): Promise<{ ok: true; category: TodoCategorySummary } | { ok: false; error: string }> {
  const id = categoryId.trim();
  const title = input.title.trim();
  if (!id) {
    return { ok: false, error: "Kategorija nav norādīta." };
  }
  if (!title) {
    return { ok: false, error: "Ievadi kategorijas nosaukumu." };
  }

  const scope = await getRequiredTodoScope();
  if (!scope) {
    return { ok: false, error: "Lietotājs vai uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("todo_categories")
    .update({ title })
    .eq("company_id", scope.companyId)
    .eq("user_id", scope.userId)
    .eq("id", id)
    .select("id, title, sort_order, updated_at")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās saglabāt kategoriju." };
  }

  return {
    ok: true,
    category: mapTodoCategoryRow(data as TodoCategoryRow, []),
  };
}

export async function deleteTodoCategory(
  categoryId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = categoryId.trim();
  if (!id) {
    return { ok: false, error: "Kategorija nav norādīta." };
  }

  const scope = await getRequiredTodoScope();
  if (!scope) {
    return { ok: false, error: "Lietotājs vai uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("todo_categories")
    .delete()
    .eq("company_id", scope.companyId)
    .eq("user_id", scope.userId)
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst kategoriju." };
  }

  return { ok: true };
}

export async function upsertDelegatedMaterialTodoTask({
  companyId,
  userId,
  projectId,
  projectName,
  projectAddress,
  positionPriceId,
  materialName,
}: {
  companyId: string;
  userId: string;
  projectId: string;
  projectName: string;
  projectAddress: string;
  positionPriceId: string;
  materialName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const scope = {
    companyId: companyId.trim(),
    userId: userId.trim(),
  };
  const trimmedProjectId = projectId.trim();
  const trimmedMaterialId = positionPriceId.trim();
  if (!scope.companyId || !scope.userId || !trimmedProjectId || !trimmedMaterialId) {
    return { ok: false, error: "Uzdevuma avots nav norādīts." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const category = await ensureDefaultTodoCategoryForScope(scope);
  if (!category) {
    return { ok: false, error: "Neizdevās izveidot noklusējuma uzdevumu kategoriju." };
  }

  const sourceKey = `material-order:${trimmedProjectId}:${trimmedMaterialId}`;
  const title = materialName.trim()
    ? `Pasūtīt materiālu: ${materialName.trim()}`
    : "Pasūtīt piešķirto materiālu";
  const projectParts = [projectName.trim(), projectAddress.trim()].filter(Boolean);
  const description = projectParts.length > 0 ? projectParts.join(" — ") : "";
  const supabase = createAdminClient();
  const { data: existingTask } = await supabase
    .from("todo_tasks")
    .select("id")
    .eq("company_id", scope.companyId)
    .eq("user_id", scope.userId)
    .eq("source_key", sourceKey)
    .maybeSingle();

  if (existingTask?.id) {
    const { error } = await supabase
      .from("todo_tasks")
      .update({ title, description })
      .eq("company_id", scope.companyId)
      .eq("user_id", scope.userId)
      .eq("id", existingTask.id as string);

    if (error) {
      return { ok: false, error: "Neizdevās atjaunot delegēto uzdevumu." };
    }

    return { ok: true };
  }

  const existingCategories = await listTodoCategoriesForScope(scope);
  const taskSortOrders =
    existingCategories.find((item) => item.id === category.id)?.tasks.map((task) => task.sortOrder) ??
    [];
  const nextSortOrder = Math.max(0, ...taskSortOrders) + 10;

  const { error } = await supabase.from("todo_tasks").insert(
    {
      company_id: scope.companyId,
      user_id: scope.userId,
      category_id: category.id,
      source_key: sourceKey,
      title,
      description,
      sort_order: nextSortOrder,
    },
  );

  if (error) {
    return { ok: false, error: "Neizdevās izveidot delegēto uzdevumu." };
  }

  return { ok: true };
}

export async function deleteDelegatedMaterialTodoTask({
  companyId,
  userId,
  projectId,
  positionPriceId,
}: {
  companyId: string;
  userId: string;
  projectId: string;
  positionPriceId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const scope = {
    companyId: companyId.trim(),
    userId: userId.trim(),
  };
  const trimmedProjectId = projectId.trim();
  const trimmedMaterialId = positionPriceId.trim();
  if (!scope.companyId || !scope.userId || !trimmedProjectId || !trimmedMaterialId) {
    return { ok: false, error: "Uzdevuma avots nav norādīts." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const sourceKey = `material-order:${trimmedProjectId}:${trimmedMaterialId}`;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("todo_tasks")
    .delete()
    .eq("company_id", scope.companyId)
    .eq("user_id", scope.userId)
    .eq("source_key", sourceKey);

  if (error) {
    return { ok: false, error: "Neizdevās noņemt delegēto uzdevumu." };
  }

  return { ok: true };
}

export async function createTodoTask(
  input: TodoTaskInput,
): Promise<{ ok: true; task: TodoTaskSummary } | { ok: false; error: string }> {
  const categoryId = input.categoryId.trim();
  const title = input.title.trim();
  const description = input.description.trim();
  if (!categoryId) {
    return { ok: false, error: "Kategorija nav norādīta." };
  }
  if (!title) {
    return { ok: false, error: "Ievadi uzdevuma nosaukumu." };
  }

  const scope = await getRequiredTodoScope();
  if (!scope) {
    return { ok: false, error: "Lietotājs vai uzņēmums nav atrasts." };
  }

  const existingCategories = await listTodoCategories();
  const category = existingCategories.find((item) => item.id === categoryId);
  if (!category) {
    return { ok: false, error: "Kategorija nav atrasta." };
  }

  const nextSortOrder = Math.max(0, ...category.tasks.map((task) => task.sortOrder)) + 10;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("todo_tasks")
    .insert({
      company_id: scope.companyId,
      user_id: scope.userId,
      category_id: categoryId,
      title,
      description,
      sort_order: nextSortOrder,
    })
    .select("id, category_id, title, description, sort_order, updated_at")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās izveidot uzdevumu." };
  }

  return { ok: true, task: mapTodoTaskRow(data as TodoTaskRow) };
}

export async function updateTodoTask(
  taskId: string,
  input: TodoTaskInput,
): Promise<{ ok: true; task: TodoTaskSummary } | { ok: false; error: string }> {
  const id = taskId.trim();
  const categoryId = input.categoryId.trim();
  const title = input.title.trim();
  const description = input.description.trim();
  if (!id) {
    return { ok: false, error: "Uzdevums nav norādīts." };
  }
  if (!categoryId) {
    return { ok: false, error: "Kategorija nav norādīta." };
  }
  if (!title) {
    return { ok: false, error: "Ievadi uzdevuma nosaukumu." };
  }

  const scope = await getRequiredTodoScope();
  if (!scope) {
    return { ok: false, error: "Lietotājs vai uzņēmums nav atrasts." };
  }

  const categories = await listTodoCategories();
  if (!categories.some((category) => category.id === categoryId)) {
    return { ok: false, error: "Kategorija nav atrasta." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("todo_tasks")
    .update({ category_id: categoryId, title, description })
    .eq("company_id", scope.companyId)
    .eq("user_id", scope.userId)
    .eq("id", id)
    .select("id, category_id, title, description, sort_order, updated_at")
    .single();

  if (error || !data) {
    return { ok: false, error: "Neizdevās saglabāt uzdevumu." };
  }

  return { ok: true, task: mapTodoTaskRow(data as TodoTaskRow) };
}

export async function deleteTodoTask(
  taskId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = taskId.trim();
  if (!id) {
    return { ok: false, error: "Uzdevums nav norādīts." };
  }

  const scope = await getRequiredTodoScope();
  if (!scope) {
    return { ok: false, error: "Lietotājs vai uzņēmums nav atrasts." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("todo_tasks")
    .delete()
    .eq("company_id", scope.companyId)
    .eq("user_id", scope.userId)
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Neizdevās dzēst uzdevumu." };
  }

  return { ok: true };
}

export async function reorderTodoTasks(
  items: TodoTaskReorderItem[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const scope = await getRequiredTodoScope();
  if (!scope) {
    return { ok: false, error: "Lietotājs vai uzņēmums nav atrasts." };
  }

  const normalizedItems = items
    .map((item) => ({
      id: item.id.trim(),
      categoryId: item.categoryId.trim(),
      sortOrder: Number.isFinite(item.sortOrder) ? Math.trunc(item.sortOrder) : 0,
    }))
    .filter((item) => item.id && item.categoryId && item.sortOrder > 0);

  if (normalizedItems.length !== items.length) {
    return { ok: false, error: "Uzdevumu secība nav derīga." };
  }

  const categories = await listTodoCategories();
  const categoryIds = new Set(categories.map((category) => category.id));
  const taskIds = new Set(categories.flatMap((category) => category.tasks.map((task) => task.id)));
  if (
    normalizedItems.some(
      (item) => !categoryIds.has(item.categoryId) || !taskIds.has(item.id),
    )
  ) {
    return { ok: false, error: "Uzdevumu secība neatbilst uzņēmuma datiem." };
  }

  const supabase = createAdminClient();
  const updates = await Promise.all(
    normalizedItems.map((item) =>
      supabase
        .from("todo_tasks")
        .update({ category_id: item.categoryId, sort_order: item.sortOrder })
        .eq("company_id", scope.companyId)
        .eq("user_id", scope.userId)
        .eq("id", item.id),
    ),
  );

  if (updates.some((result) => result.error)) {
    return { ok: false, error: "Neizdevās saglabāt uzdevumu secību." };
  }

  return { ok: true };
}
