"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ColaboradorStatus } from "@prisma/client";

const colaboradorSchema = z.object({
  nomeCompleto: z.string().min(3),
  cpf: z.string().length(11),
  rg: z.string().min(5),
  dataNascimento: z.string(),
  telefonePrincipal: z.string(),
  telefoneSecundario: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  contaBancoBrasil: z.string(),
  possuiFilhosMenores14: z.boolean(),
  funcaoId: z.string(),
  setorId: z.string(),
  lojaId: z.string(),
  
  // Paths from upload
  enderecoComprovantePath: z.string().optional(),
  pisFotoPath: z.string().optional(),
  historicoEscolarPath: z.string().optional(),
  ctpsDigitalPath: z.string().optional(),
  certidaoFilhosPath: z.string().optional(),
  fotoPerfilPath: z.string().optional(),
  contratoAssinadoPath: z.string().optional(),
});

export async function createColaborador(data: z.infer<typeof colaboradorSchema>) {
  try {
    const colaborador = await prisma.colaborador.create({
      data: {
        nomeCompleto: data.nomeCompleto,
        cpf: data.cpf,
        rg: data.rg,
        dataNascimento: new Date(data.dataNascimento),
        telefonePrincipal: data.telefonePrincipal,
        telefoneSecundario: data.telefoneSecundario,
        email: data.email || null,
        contaBancoBrasil: data.contaBancoBrasil,
        possuiFilhosMenores14: data.possuiFilhosMenores14,
        funcaoId: data.funcaoId,
        setorId: data.setorId,
        lojaId: data.lojaId,
        status: ColaboradorStatus.EM_EXPERIENCIA,
        
        enderecoComprovantePath: data.enderecoComprovantePath,
        pisFotoPath: data.pisFotoPath,
        historicoEscolarPath: data.historicoEscolarPath,
        ctpsDigitalPath: data.ctpsDigitalPath,
        certidaoFilhosPath: data.certidaoFilhosPath,
        fotoPerfilPath: data.fotoPerfilPath,
        contratoAssinadoPath: data.contratoAssinadoPath,
      },
    });

    revalidatePath("/colaboradores");
    return { success: true, data: colaborador };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao cadastrar colaborador. Verifique se o CPF já existe." };
  }
}

export async function getColaboradores() {
  return await prisma.colaborador.findMany({
    include: {
      funcao: true,
      loja: true,
      setor: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
