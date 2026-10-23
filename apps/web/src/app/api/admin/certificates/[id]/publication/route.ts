import { NextRequest } from "next/server";
import { changeCertificatePublication } from "@/lib/certificates-mutation";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return changeCertificatePublication(request, id);
}
