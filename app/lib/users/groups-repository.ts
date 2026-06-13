import {
  createFullPermissions,
  DEFAULT_GROUP_DEFINITIONS,
  normalizePermissionSet,
  type ActionPermissionKey,
  type NavPermissionKey,
  type PermissionSet,
  type UserGroupSummary,
} from "@/app/lib/auth/permissions";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

type UserGroupRow = {
  id: string;
  slug: string;
  name: string;
  permissions: unknown;
  is_system: boolean;
};

function mapGroupRow(row: UserGroupRow): UserGroupSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    isSystem: row.is_system,
    permissions: normalizePermissionSet(row.permissions),
  };
}

const DEFAULT_NEW_USER_GROUP_SLUG = "viewer";

async function getGroupIdBySlug(
  supabase: ReturnType<typeof createAdminClient>,
  slug: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("user_groups")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  return data?.id ?? null;
}

async function ensureUserDefaultMembership(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<string | null> {
  const groupId = await getGroupIdBySlug(supabase, DEFAULT_NEW_USER_GROUP_SLUG);
  if (!groupId) {
    return null;
  }

  const { error } = await supabase.from("user_group_members").upsert(
    {
      user_id: userId,
      group_id: groupId,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return null;
  }

  return groupId;
}

function getDefaultGroupDefinition() {
  return (
    DEFAULT_GROUP_DEFINITIONS.find(
      (group) => group.slug === DEFAULT_NEW_USER_GROUP_SLUG,
    ) ?? null
  );
}

function buildFallbackGroupSummary(
  id: string,
  definition: NonNullable<ReturnType<typeof getDefaultGroupDefinition>>,
): UserGroupSummary {
  return {
    id,
    slug: definition.slug,
    name: definition.name,
    isSystem: true,
    permissions: definition.permissions,
  };
}

async function fetchGroupById(
  supabase: ReturnType<typeof createAdminClient>,
  groupId: string,
): Promise<UserGroupSummary | null> {
  const { data, error } = await supabase
    .from("user_groups")
    .select("id, slug, name, permissions, is_system")
    .eq("id", groupId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapGroupRow(data as UserGroupRow);
}

async function ensureDefaultGroups(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<void> {
  for (const group of DEFAULT_GROUP_DEFINITIONS) {
    const { data: existing } = await supabase
      .from("user_groups")
      .select("id")
      .eq("slug", group.slug)
      .maybeSingle();

    if (existing) {
      continue;
    }

    await supabase.from("user_groups").insert({
      slug: group.slug,
      name: group.name,
      permissions: group.permissions,
      is_system: true,
    });
  }
}

export async function listUserGroups(): Promise<UserGroupSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return DEFAULT_GROUP_DEFINITIONS.map((group, index) => ({
      id: `sample-${group.slug}`,
      slug: group.slug,
      name: group.name,
      isSystem: true,
      permissions: group.permissions,
    }));
  }

  const supabase = createAdminClient();
  await ensureDefaultGroups(supabase);

  const { data, error } = await supabase
    .from("user_groups")
    .select("id, slug, name, permissions, is_system")
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as UserGroupRow[]).map(mapGroupRow);
}

export async function getUserGroupById(
  groupId: string,
): Promise<UserGroupSummary | null> {
  if (!isSupabaseAdminConfigured()) {
    const sample = DEFAULT_GROUP_DEFINITIONS.find(
      (group) => `sample-${group.slug}` === groupId,
    );
    if (!sample) {
      return null;
    }

    return {
      id: groupId,
      slug: sample.slug,
      name: sample.name,
      isSystem: true,
      permissions: sample.permissions,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_groups")
    .select("id, slug, name, permissions, is_system")
    .eq("id", groupId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapGroupRow(data as UserGroupRow);
}

export async function getUserGroupMembership(
  userId: string,
): Promise<UserGroupSummary | null> {
  if (!isSupabaseAdminConfigured()) {
    const viewer = getDefaultGroupDefinition();
    if (!viewer) {
      return null;
    }

    return {
      id: "sample-viewer",
      slug: viewer.slug,
      name: viewer.name,
      isSystem: true,
      permissions: viewer.permissions,
    };
  }

  const supabase = createAdminClient();
  await ensureDefaultGroups(supabase);

  const { data: membership } = await supabase
    .from("user_group_members")
    .select("group_id")
    .eq("user_id", userId)
    .maybeSingle();

  let groupId = membership?.group_id ?? null;

  if (!groupId) {
    groupId = await ensureUserDefaultMembership(supabase, userId);
  }

  if (!groupId) {
    const viewer = getDefaultGroupDefinition();
    return viewer ? buildFallbackGroupSummary("fallback-viewer", viewer) : null;
  }

  const group = await fetchGroupById(supabase, groupId);
  if (group) {
    return group;
  }

  const viewer = getDefaultGroupDefinition();
  return viewer ? buildFallbackGroupSummary(groupId, viewer) : null;
}

export async function listUserGroupMemberships(): Promise<
  Record<string, string>
> {
  if (!isSupabaseAdminConfigured()) {
    return {};
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_group_members")
    .select("user_id, group_id");

  if (error || !data) {
    return {};
  }

  return Object.fromEntries(
    data.map((row) => [row.user_id as string, row.group_id as string]),
  );
}

export async function assignUserToGroup(
  userId: string,
  groupId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedUserId = userId.trim();
  const trimmedGroupId = groupId.trim();

  if (!trimmedUserId || !trimmedGroupId) {
    return { ok: false, error: "Lietotājs vai grupa nav norādīta." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const group = await getUserGroupById(trimmedGroupId);
  if (!group) {
    return { ok: false, error: "Grupa nav atrasta." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("user_group_members").upsert(
    {
      user_id: trimmedUserId,
      group_id: trimmedGroupId,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { ok: false, error: "Neizdevās piešķirt grupu." };
  }

  return { ok: true };
}

export async function updateUserGroupPermissions(
  groupId: string,
  permissions: PermissionSet,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Datubāze nav konfigurēta." };
  }

  const supabase = createAdminClient();

  const { data: groupRow } = await supabase
    .from("user_groups")
    .select("slug")
    .eq("id", groupId)
    .maybeSingle();

  const normalized =
    groupRow?.slug === "admin"
      ? createFullPermissions(true)
      : normalizePermissionSet(permissions);

  const { error } = await supabase
    .from("user_groups")
    .update({ permissions: normalized })
    .eq("id", groupId);

  if (error) {
    return { ok: false, error: "Neizdevās saglabāt grupas tiesības." };
  }

  return { ok: true };
}

export type UserAccess = {
  userId: string;
  group: UserGroupSummary;
  permissions: PermissionSet;
};

export async function getUserAccess(userId: string): Promise<UserAccess | null> {
  const group = await getUserGroupMembership(userId);
  if (!group) {
    const viewer = getDefaultGroupDefinition();
    if (!viewer) {
      return null;
    }

    return {
      userId,
      group: buildFallbackGroupSummary("fallback-viewer", viewer),
      permissions: viewer.permissions,
    };
  }

  const permissions =
    group.slug === "admin"
      ? createFullPermissions(true)
      : group.permissions;

  return {
    userId,
    group: {
      ...group,
      permissions,
    },
    permissions,
  };
}

export function canAccessNav(
  access: UserAccess | null,
  key: NavPermissionKey,
): boolean {
  if (!access) {
    return false;
  }

  return access.permissions.nav[key] === true;
}

export function canPerformAction(
  access: UserAccess | null,
  key: ActionPermissionKey,
): boolean {
  if (!access) {
    return false;
  }

  return access.permissions.actions[key] === true;
}

export function getDefaultNewUserGroupId(groups: UserGroupSummary[]): string {
  return (
    groups.find((group) => group.slug === DEFAULT_NEW_USER_GROUP_SLUG)?.id ??
    groups[0]?.id ??
    ""
  );
}

export function getFallbackPermissions(): PermissionSet {
  const viewer = DEFAULT_GROUP_DEFINITIONS.find((group) => group.slug === "viewer");
  return viewer?.permissions ?? createFullPermissions(false);
}
