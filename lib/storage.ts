import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export async function uploadFile(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    
    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    await fs.writeFile(filePath, buffer);
    
    // Return the relative path for database storage
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error("Falha no upload do arquivo");
  }
}
