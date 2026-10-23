import { NextRequest } from "next/server";
import { saveEducation } from "@/lib/education-mutation";

export function POST(request: NextRequest) {
  return saveEducation(request);
}
