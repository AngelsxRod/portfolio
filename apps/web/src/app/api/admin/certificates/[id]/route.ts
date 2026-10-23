import { NextRequest } from "next/server";
import { saveCertificate } from "@/lib/certificates-mutation";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return saveCertificate(request, id);
}
