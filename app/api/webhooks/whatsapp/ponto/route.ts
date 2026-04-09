import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Webhook para receber registro de ponto via WhatsApp (Integração Externa)
 * Exemplo de payload esperado: { "cpf": "12345678901", "gestorId": "...", "timestamp": "...", "localizacao": "..." }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cpf, statusPonto } = body;

    if (!cpf) return NextResponse.json({ error: "CPF obrigatório" }, { status: 400 });

    const colaborador = await prisma.colaborador.findUnique({
      where: { cpf },
    });

    if (!colaborador) {
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 });
    }

    // Lógica para registrar o ponto automático via webhook
    // ...
    
    return NextResponse.json({ 
      success: true, 
      message: `Ponto registrado para ${colaborador.nomeCompleto}` 
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
