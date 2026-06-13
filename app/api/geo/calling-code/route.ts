import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { detectCallingCodeFromRequest } from "@/app/lib/geo/detect-calling-code";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const callingCode = await detectCallingCodeFromRequest();
  return Response.json({ callingCode });
}
