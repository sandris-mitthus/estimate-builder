import type { User } from "@supabase/supabase-js";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { SAMPLE_USERS } from "@/app/lib/users/sample-users";
import type { UserSummary } from "@/app/lib/users/types";

function mapAuthUser(user: User): UserSummary {
  const { name, avatarUrl } = mapUserDisplay(user);

  return {
    id: user.id,
    name,
    email: user.email ?? "—",
    avatarUrl,
  };
}

export async function listUsers(): Promise<UserSummary[]> {
  if (!isSupabaseAdminConfigured()) {
    return SAMPLE_USERS;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    return [];
  }

  if (!data.users.length) {
    return [];
  }

  return data.users
    .map(mapAuthUser)
    .sort((a, b) => a.name.localeCompare(b.name, "lv"));
}
