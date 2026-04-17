import { auth } from "@/auth";
import { z } from "zod";

export type ActionState<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

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

    if (allowedRoles && !allowedRoles.includes(session.user.role as string)) {
      return { success: false, error: "Permissão insuficiente" };
    }

    let validatedData = {} as any;
    if (schema) {
      const result = schema.safeParse(await schema.parseAsync({})); // This is a placeholder logic, usually we pass data to the wrapper
      // For Next.js Server Actions, we usually wrap the handler
    }

    return { success: true }; // This wrapper needs to be more functional
  } catch (error: any) {
    return { success: false, error: error.message || "Erro desconhecido" };
  }
}

// Senior way: Functional wrapper
export const createAction = <T, S extends z.ZodType>(
  schema: S | null,
  roles: string[] | null,
  handler: (data: z.infer<S>, userId: string) => Promise<T>
) => {
  return async (data: z.infer<S>): Promise<ActionState<T>> => {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Não autenticado" };
    if (roles && !roles.includes(session.user.role as string)) {
      return { success: false, error: "Permissão negada" };
    }

    try {
      if (schema) schema.parse(data);
      const result = await handler(data, session.user.id!);
      return { success: true, data: result };
    } catch (e: any) {
      console.error("[ACTION_ERROR]:", e);
      return { success: false, error: e.message || "Ocorreu um erro interno" };
    }
  };
};
