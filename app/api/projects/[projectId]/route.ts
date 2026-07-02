import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { deleteProject } from "@/app/lib/projects/repository";
import { checkRateLimit, rateLimitResponse } from "@/app/lib/security/rate-limit";
import { canPerformAction, getUserAccess } from "@/app/lib/users/groups-repository";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const access = await getUserAccess(user.id);
  if (!canPerformAction(access, "project.delete")) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!(await checkRateLimit(`project-delete:${user.id}`, 30, 60_000))) {
    return rateLimitResponse();
  }

  const { projectId } = await params;
  const result = await deleteProject(projectId);

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true });
}
