import { redirect } from "next/navigation";
import { PendingCompanyInviteView } from "@/app/components/pending-company-invite-view";
import { RegisterCompanyView } from "@/app/components/register-company-view";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
  getCurrentCompanyId,
  hasPendingCompanyInvite,
} from "@/app/lib/companies/current-company";
import { isSystemAdminUser } from "@/app/lib/users/system-admin-repository";

export const dynamic = "force-dynamic";

export default async function RegisterCompanyPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  if (await isSystemAdminUser(user)) {
    redirect("/");
  }

  if (await getCurrentCompanyId()) {
    redirect("/");
  }

  if (await hasPendingCompanyInvite()) {
    return <PendingCompanyInviteView />;
  }

  return <RegisterCompanyView userEmail={user.email ?? ""} />;
}
