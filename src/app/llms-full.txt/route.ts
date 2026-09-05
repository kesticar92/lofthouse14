import { NextResponse } from "next/server";
import { llmsFullTxt } from "@/lib/llms-content";

export function GET() {
  return new NextResponse(llmsFullTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export const dynamic = "force-static";
