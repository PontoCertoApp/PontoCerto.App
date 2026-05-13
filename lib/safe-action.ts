import { auth } from "@/auth";
import { z } from "zod";

export type ActionState<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Normalizes legacy role strings to the new RBAC system.
 * Ensures backward-compatibility for users created before the RBAC migration.
 */
function normalizeRole(role: string | undefined | null): string {
  if (!role) return "";
  const upper = role.toUpperCase();
  if (upper === "RH") return "HR_STAFF";
  if (upper === "GERENTE") return "STORE_MANAGER";
  if (upper === "COLABORADOR") return "EMPLOYEE";
  return upper;
}

export async function safeAction<T, S extends z.ZodType>(
  schema: S | null,
  handler: (data: z.infer<S>, session: any) => Promise<T>,
  allowedRoles?: string[]
): Promise<ActionState<T>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Não autorizado" };
    }

    const isMaster = session.user.email?.toLowerCase() === 'henriquemendonca060502@gmail.com';
    const normalizedRole = isMaster ? "ADMIN" : normalizeRole(session.user.role as string);

    if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
      return { success: false, error: "Permissão insuficiente" };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Erro desconhecido" };
  }
}

// Senior way: Functional wrapper
export const createAction = <T, S extends z.ZodType>(
  schema: S | null,
  roles: string[] | null,
  handler: (data: z.infer<S>, session: any) => Promise<T>
) => {
  return async (data: z.infer<S>): Promise<ActionState<T>> => {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Não autenticado" };

    // MASTER OVERRIDE: O e-mail mestre sempre tem poder total (ADMIN)
    const isMaster = session.user.email?.toLowerCase() === 'henriquemendonca060502@gmail.com';
    const normalizedRole = isMaster ? "ADMIN" : normalizeRole(session.user.role as string);

    if (roles && !roles.includes(normalizedRole)) {
      return { success: false, error: "Permissão negada" };
    }

    try {
      // Parse strips unknown fields — use parsed data, NOT the raw input
      const validatedData = schema ? schema.parse(data) : data;
      const result = await handler(validatedData, session);
      return { success: true, data: result };
    } catch (e: any) {
      console.error("[ACTION_ERROR]:", e);
      return { success: false, error: e.message || "Ocorreu um erro interno" };
    }
  };
};
