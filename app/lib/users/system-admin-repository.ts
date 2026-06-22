import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { mapUserDisplay, resolveAvatarUrl } from "@/app/lib/auth/map-user-display";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

type UserAdminRow = {
  is_admin: boolean;
};

function mapAuthUserProfile(user: User) {
  const { name } = mapUserDisplay(user);

  return {
    id: user.id,
    email: user.email ?? "",
    name,
    avatar_url: resolveAvatarUrl(user) ?? "",
  };
}

export const isSystemAdminUser = cache(async function isSystemAdminUser(
  user: User,
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) {
    return false;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!error && data) {
    await supabase.from("users").update(mapAuthUserProfile(user)).eq("id", user.id);
    return (data as UserAdminRow).is_admin === true;
  }

  const { error: insertError } = await supabase.from("users").insert({
    ...mapAuthUserProfile(user),
    is_admin: false,
  });

  if (insertError) {
    const { data: retryData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    return (retryData as UserAdminRow | null)?.is_admin === true;
  }

  return false;
});
