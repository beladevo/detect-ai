import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type WaitlistPayload = {
  email?: string;
  source?: string;
};

const isValidEmail = (value: string) => /.+@.+\..+/.test(value);

const csvEscape = (value: string) => `"${value.replace(/"/g, "\"\"")}"`;

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

    if (useBlobStorage) {
      const entry = { email, submittedAt, source };
      const fileName = `waitlist/${submittedAt}-${crypto.randomUUID()}.json`;
      await put(fileName, JSON.stringify(entry), {
        access: "private",
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
