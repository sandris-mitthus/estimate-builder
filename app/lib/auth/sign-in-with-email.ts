import { createClient } from "@/app/lib/supabase/client";

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  return { error: error ? new Error(error.message) : null };
}
