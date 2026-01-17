import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type WaitlistPayload = {
  email?: string;
  source?: string;
};

const isValidEmail = (value: string) => /.+@.+\..+/.test(value);

const csvEscape = (value: string) => `"${value.replace(/"/g, "\"\"")}"`;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as WaitlistPayload;
    const email = payload.email?.trim().toLowerCase() || "";
    const source = payload.source?.trim() || "unknown";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const submittedAt = new Date().toISOString();
    const useBlobStorage =
      process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_TOKEN;

    if (supabase) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
      const userAgent = request.headers.get("user-agent") || "";
      const { error } = await supabase.from("waitlist").insert({
        email,
        created_at: submittedAt,
        ip,
        user_agent: userAgent,
      });

      if (error) {
        throw new Error(error.message);
      }
    } else if (useBlobStorage) {
      const entry = { email, submittedAt, source };
      const fileName = `waitlist/${submittedAt}-${crypto.randomUUID()}.json`;
      await put(fileName, JSON.stringify(entry), {
        access: "public",
        contentType: "application/json",
      });
    } else {
      const dir = path.join(process.cwd(), "data");
      await fs.mkdir(dir, { recursive: true });
      const filePath = path.join(dir, "waitlist.csv");

      const exists = await fs
        .stat(filePath)
        .then(() => true)
        .catch(() => false);

      const header = "email,submitted_at,source\n";
      const line = `${csvEscape(email)},${csvEscape(submittedAt)},${csvEscape(
        source
      )}\n`;

      await fs.appendFile(filePath, `${exists ? "" : header}${line}`, "utf8");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Waitlist signup failed", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
