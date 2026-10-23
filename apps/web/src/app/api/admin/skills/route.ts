import { NextRequest } from "next/server";
import { saveSkill } from "@/lib/skill-mutation";

export function POST(request: NextRequest) {
  return saveSkill(request);
}
