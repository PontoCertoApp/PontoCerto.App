import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { auth } from "@/auth";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".pdf"]);
const SAFE_FILENAME_RE = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const session = await auth();

  if (!session) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  if (!SAFE_FILENAME_RE.test(filename)) {
    return new NextResponse("Arquivo inválido", { status: 400 });
  }

  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return new NextResponse("Tipo de arquivo não permitido", { status: 400 });
  }

  const UPLOAD_DIR = process.env.UPLOAD_DIR 
    ? (process.env.UPLOAD_DIR.startsWith("/") ? process.env.UPLOAD_DIR : path.join(process.cwd(), process.env.UPLOAD_DIR))
    : path.join(process.cwd(), "public", "uploads");

  const uploadsRoot = UPLOAD_DIR;
  const filePath = path.join(uploadsRoot, filename);

  if (!filePath.startsWith(uploadsRoot + path.sep) && filePath !== uploadsRoot) {
    return new NextResponse("Acesso negado", { status: 403 });
  }

  try {
    const fileBuffer = await fs.readFile(filePath);
    
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    if (ext === ".pdf") contentType = "application/pdf";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return new NextResponse("Arquivo não encontrado", { status: 404 });
  }
}
