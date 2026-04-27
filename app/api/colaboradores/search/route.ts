import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/colaboradores/search?q=nome
 * Busca colaboradores por nome parcial (case-insensitive).
 * Sem filtro de sessão, role ou loja — retorna todos.
 * Testável diretamente no browser.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    const where = q.length > 0
      ? { nomeCompleto: { contains: q, mode: "insensitive" as const } }
      : {};

    const colaboradores = await prisma.colaborador.findMany({
      where,
      select: {
        id: true,
        nomeCompleto: true,
        loja: { select: { nome: true } },
        funcao: { select: { nome: true } },
      },
      orderBy: { nomeCompleto: "asc" },
      take: 20,
    });

    return NextResponse.json({ success: true, data: colaboradores });
  } catch (error: any) {
    console.error("[API /colaboradores/search] Erro:", error?.message ?? error);
    return NextResponse.json(
      { success: false, data: [], error: error?.message ?? "Erro interno" },
      { status: 500 }
    );
  }
}
