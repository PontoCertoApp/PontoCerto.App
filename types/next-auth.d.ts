import { DefaultSession, DefaultJWT } from "next-auth";

export type UserRole = "COLABORADOR" | "GERENTE" | "RH";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      lojaId: string | null;
      colaboradorId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    lojaId: string | null;
    colaboradorId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: UserRole;
    lojaId: string | null;
    colaboradorId: string | null;
  }
}
