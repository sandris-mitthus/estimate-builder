import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { detectCallingCodeFromRequest } from "@/app/lib/geo/detect-calling-code";
import { checkRateLimit, rateLimitResponse } from "@/app/lib/security/rate-limit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!(await checkRateLimit(`calling-code:${user.id}`, 30, 60_000))) {
    return rateLimitResponse();
  }

  const callingCode = await detectCallingCodeFromRequest();
  return Response.json({ callingCode });
}
