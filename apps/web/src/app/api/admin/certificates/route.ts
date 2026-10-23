import { NextRequest } from "next/server";
import { saveCertificate } from "@/lib/certificates-mutation";

export function POST(request: NextRequest) {
  return saveCertificate(request);
}
