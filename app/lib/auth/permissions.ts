export const NAV_PERMISSION_KEYS = [
  "projects",
  "modules",
  "estimate",
  "positions",
  "excluded_positions",
  "todo",
  "workers",
  "tools",
  "timeline",
  "timeline_graph",
  "users",
  "user_groups",
  "settings",
] as const;

export type NavPermissionKey = (typeof NAV_PERMISSION_KEYS)[number];

export const ACTION_PERMISSION_KEYS = [
  "project.create",
  "project.edit",
  "project.delete",
  "project.approve",
  "project.reject",
  "project.complete",
  "estimate.save",
  "estimate.export",
  "estimate.dates",
  "sagatave.save",
  "modules.manage",
  "positions.manage",
  "excluded_positions.manage",
  "project_module.manage",
  "users.invite",
  "users.assign_group",
  "users.manage_company_access",
  "groups.manage",
  "settings.save",
  "materials.assign",
  "materials.order",
  "workers.manage",
  "tools.manage",
  "timeline.manage",
  "timeline_graph.manage",
] as const;

export type ActionPermissionKey = (typeof ACTION_PERMISSION_KEYS)[number];

export type PermissionSet = {
  nav: Record<NavPermissionKey, boolean>;
  actions: Record<ActionPermissionKey, boolean>;
};

export type UserGroupSummary = {
  id: string;
  slug: string;
  name: string;
  isSystem: boolean;
  permissions: PermissionSet;
};

export const NAV_PERMISSION_LABELS: Record<NavPermissionKey, string> = {
  projects: "Projekti",
  modules: "Ēku moduļi",
  estimate: "Sagatave",
  positions: "Pozīcijas",
  excluded_positions: "Neiekļautās pozīcijas",
  todo: "Darāmo darbu saraksts",
  workers: "Darbinieki",
  tools: "Instrumenti",
  timeline: "Termiņu grafiks",
  timeline_graph: "Laika grafiks",
  users: "Lietotāji",
  user_groups: "Grupas un tiesības",
  settings: "Uzstādījumi",
};

export const NAV_PERMISSION_HREFS: Record<NavPermissionKey, string> = {
  projects: "/",
  modules: "/modules",
  estimate: "/estimate",
  positions: "/positions",
  excluded_positions: "/excluded-positions",
  todo: "/tasks",
  workers: "/workers",
  tools: "/tools",
  timeline: "/timeline",
  timeline_graph: "/timeline-graph",
  users: "/users",
  user_groups: "/users/groups",
  settings: "/settings",
};

export const ACTION_PERMISSION_GROUPS: {
  titleKey: string;
  title: string;
  keys: ActionPermissionKey[];
}[] = [
  {
    titleKey: "permissions.groups.projects",
    title: "Projekti",
    keys: [
      "project.create",
      "project.edit",
      "project.delete",
      "project.approve",
      "project.reject",
      "project.complete",
      "estimate.save",
      "estimate.export",
      "estimate.dates",
      "project_module.manage",
    ],
  },
  {
    titleKey: "permissions.groups.estimate_template",
    title: "Sagatave",
    keys: ["sagatave.save"],
  },
  {
    titleKey: "permissions.groups.modules_catalog",
    title: "Moduļi un katalogs",
    keys: [
      "modules.manage",
      "positions.manage",
      "excluded_positions.manage",
    ],
  },
  {
    titleKey: "permissions.groups.materials",
    title: "Materiāli",
    keys: ["materials.assign", "materials.order"],
  },
  {
    titleKey: "permissions.groups.workforce",
    title: "Darbinieki un instrumenti",
    keys: [
      "workers.manage",
      "tools.manage",
      "timeline.manage",
      "timeline_graph.manage",
    ],
  },
  {
    titleKey: "permissions.groups.users_groups",
    title: "Lietotāji un grupas",
    keys: [
      "users.invite",
      "users.assign_group",
      "users.manage_company_access",
      "groups.manage",
    ],
  },
  {
    titleKey: "permissions.groups.settings",
    title: "Uzstādījumi",
    keys: ["settings.save"],
  },
];

export const ACTION_PERMISSION_LABELS: Record<ActionPermissionKey, string> = {
  "project.create": "Veidot projektus",
  "project.edit": "Labot projektus",
  "project.delete": "Dzēst projektus",
  "project.approve": "Apstiprināt projektus",
  "project.reject": "Noraidīt projektus",
  "project.complete": "Atzīmēt kā pabeigtus",
  "estimate.save": "Saglabāt tāmi",
  "estimate.export": "Eksportēt PDF/Excel",
  "estimate.dates": "Labot tāmes datumus",
  "sagatave.save": "Saglabāt sagatavi",
  "modules.manage": "Pārvaldīt ēku moduļus",
  "positions.manage": "Pārvaldīt pozīcijas",
  "excluded_positions.manage": "Pārvaldīt neiekļautās pozīcijas",
  "project_module.manage": "Labot projekta moduļa datus",
  "users.invite": "Uzaicināt lietotājus",
  "users.assign_group": "Piešķirt lietotāju grupas",
  "users.manage_company_access": "Bloķēt un noņemt uzņēmuma lietotājus",
  "groups.manage": "Konfigurēt grupu tiesības",
  "settings.save": "Saglabāt uzstādījumus",
  "materials.assign": "Piešķirt materiālus lietotājiem",
  "materials.order": "Atzīmēt materiālus kā pasūtītus",
  "workers.manage": "Pārvaldīt darbiniekus",
  "tools.manage": "Pārvaldīt instrumentus",
  "timeline.manage": "Pārvaldīt termiņu grafiku",
  "timeline_graph.manage": "Mainīt laika grafika prioritāti",
};

export function createFullPermissions(enabled = true): PermissionSet {
  return {
    nav: Object.fromEntries(
      NAV_PERMISSION_KEYS.map((key) => [key, enabled]),
    ) as Record<NavPermissionKey, boolean>,
    actions: Object.fromEntries(
      ACTION_PERMISSION_KEYS.map((key) => [key, enabled]),
    ) as Record<ActionPermissionKey, boolean>,
  };
}

export function normalizePermissionSet(value: unknown): PermissionSet {
  const full = createFullPermissions(false);
  if (!value || typeof value !== "object") {
    return full;
  }

  const record = value as {
    nav?: Record<string, boolean>;
    actions?: Record<string, boolean>;
  };

  for (const key of NAV_PERMISSION_KEYS) {
    if (typeof record.nav?.[key] === "boolean") {
      full.nav[key] = record.nav[key];
    }
  }

  for (const key of ACTION_PERMISSION_KEYS) {
    if (typeof record.actions?.[key] === "boolean") {
      full.actions[key] = record.actions[key];
    }
  }

  return full;
}

export function hasNavPermission(
  permissions: PermissionSet,
  key: NavPermissionKey,
): boolean {
  return permissions.nav[key] === true;
}

export function hasActionPermission(
  permissions: PermissionSet,
  key: ActionPermissionKey,
): boolean {
  return permissions.actions[key] === true;
}

export const DEFAULT_GROUP_DEFINITIONS: {
  slug: string;
  name: string;
  permissions: PermissionSet;
}[] = [
  {
    slug: "admin",
    name: "Administrators",
    permissions: createFullPermissions(true),
  },
  {
    slug: "viewer",
    name: "Skatītājs",
    permissions: {
      nav: {
        projects: true,
        modules: true,
        estimate: true,
        positions: true,
        excluded_positions: true,
        todo: true,
        workers: true,
        tools: true,
        timeline: true,
        timeline_graph: true,
        users: false,
        user_groups: false,
        settings: false,
      },
      actions: {
        "project.create": false,
        "project.edit": false,
        "project.delete": false,
        "project.approve": false,
        "project.reject": false,
        "project.complete": false,
        "estimate.save": false,
        "estimate.export": true,
        "estimate.dates": false,
        "sagatave.save": false,
        "modules.manage": false,
        "positions.manage": false,
        "excluded_positions.manage": false,
        "project_module.manage": false,
        "users.invite": false,
        "users.assign_group": false,
        "users.manage_company_access": false,
        "groups.manage": false,
        "settings.save": false,
        "materials.assign": false,
        "materials.order": false,
        "workers.manage": false,
        "tools.manage": false,
        "timeline.manage": false,
        "timeline_graph.manage": false,
      },
    },
  },
];
