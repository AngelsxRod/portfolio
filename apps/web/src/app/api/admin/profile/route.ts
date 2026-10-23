import { NextRequest } from "next/server";
import { saveProfile } from "@/lib/profile-mutation";

export function PUT(request: NextRequest) {
  return saveProfile(request);
}
