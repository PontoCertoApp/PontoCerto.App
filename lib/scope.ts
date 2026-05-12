import { auth } from "@/auth";

export type UserScope = {
  role: string;
  lojaId: string | null;
  teamId: string | null;
};

/** Resolves the current user's scope from the session. */
export async function getScope(): Promise<UserScope | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    role: (session.user.role || "EMPLOYEE").toUpperCase(),
    lojaId: session.user.lojaId ?? null,
    teamId: session.user.teamId ?? null,
  };
}

/**
 * Returns a Prisma `where` filter for direct Colaborador queries.
 *
 * ADMIN / HR_STAFF → no filter (see everything)
 * STORE_MANAGER   → filter by lojaId
 * EMPLOYEE        → filter by teamId
 */
export function colaboradorScope(scope: UserScope): Record<string, any> {
  switch (scope.role) {
    case "ADMIN":
    case "HR_STAFF":
      return {};
    case "STORE_MANAGER":
      return scope.lojaId ? { lojaId: scope.lojaId } : {};
    case "EMPLOYEE":
      return scope.teamId ? { teamId: scope.teamId } : { id: "__deny__" };
    default:
      return {};
  }
}

/**
 * Returns a Prisma nested filter for models that reach scope through
 * a `colaborador` relation (Documento, Penalidade, Premio, RegistroPonto, etc.).
 */
export function viaColaboradorScope(scope: UserScope): Record<string, any> {
  const filter = colaboradorScope(scope);
  if (Object.keys(filter).length === 0) return {};
  return { colaborador: filter };
}

/**
 * Returns a Prisma `where` filter for direct RegistroPonto / leaderboard queries
 * that use lojaId directly (not through colaborador).
 */
export function pontoScope(scope: UserScope): Record<string, any> {
  switch (scope.role) {
    case "ADMIN":
    case "HR_STAFF":
      return {};
    case "STORE_MANAGER":
      return scope.lojaId ? { lojaId: scope.lojaId } : {};
    case "EMPLOYEE":
      // For ponto, employee sees only their own team via colaborador
      return scope.teamId ? { colaborador: { teamId: scope.teamId } } : { id: "__deny__" };
    default:
      return {};
  }
}
