import { AppNav } from "@/app/components/app-nav";
import { FeedbackToastProvider } from "@/app/components/feedback-toast-provider";
import { LoginGate } from "@/app/components/login-gate";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let currentUser = null;

  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (!user) {
      return <LoginGate />;
    }

    currentUser = mapUserDisplay(user);
  }

  return (
    <FeedbackToastProvider>
      <AppNav currentUser={currentUser} />
      {children}
    </FeedbackToastProvider>
  );
}
