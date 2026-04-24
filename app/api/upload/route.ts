import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Path: /data/uploads for production volume, or public/uploads for dev
    // For this environment, we'll try to use a persistent-like path or public
    // Use UPLOAD_DIR env or default to public/uploads
    const uploadDir = process.env.UPLOAD_DIR 
      ? (process.env.UPLOAD_DIR.startsWith("/") ? process.env.UPLOAD_DIR : join(process.cwd(), process.env.UPLOAD_DIR))
      : join(process.cwd(), "public", "uploads");
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const publicPath = `/uploads/${fileName}`;

    return NextResponse.json({ success: true, path: publicPath });
  } catch (error) {
    console.error("[UPLOAD_ERROR]:", error);
    return NextResponse.json({ error: "Falha ao processar upload" }, { status: 500 });
  }
}
