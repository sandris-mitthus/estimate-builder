import { detectCallingCodeFromRequest } from "@/app/lib/geo/detect-calling-code";

export async function GET() {
  const callingCode = await detectCallingCodeFromRequest();
  return Response.json({ callingCode });
}
