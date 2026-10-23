import { NextRequest } from "next/server";
import { mutateDraft } from "@/lib/draft-mutation";

export function POST(request: NextRequest) {
  return mutateDraft(request);
}
