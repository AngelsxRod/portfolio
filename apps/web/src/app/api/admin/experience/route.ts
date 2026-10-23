import { NextRequest } from "next/server";
import { saveExperience } from "@/lib/experience-mutation";

export function POST(request: NextRequest) {
  return saveExperience(request);
}
