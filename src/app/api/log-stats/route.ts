import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    fs.writeFileSync(
      path.join(process.cwd(), "scratch/real_stats_debug.json"),
      JSON.stringify(body, null, 2)
    );
    console.log("[DEBUG] Logged stats:", body);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
