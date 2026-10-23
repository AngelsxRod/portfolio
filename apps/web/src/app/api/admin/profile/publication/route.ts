import { NextRequest } from "next/server";
import { changeProfilePublication } from "@/lib/profile-mutation";

export function POST(request: NextRequest) {
  return changeProfilePublication(request);
}
