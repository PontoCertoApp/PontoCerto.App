import { DefaultSession, DefaultJWT } from "next-auth";

export type UserRole = "ADMIN" | "STORE_MANAGER" | "HR_STAFF" | "EMPLOYEE";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      lojaId: string | null;
      teamId: string | null;
      colaboradorId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    lojaId: string | null;
    teamId: string | null;
    colaboradorId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: UserRole;
    lojaId: string | null;
    teamId: string | null;
    colaboradorId: string | null;
  }
}
