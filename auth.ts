import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import prisma from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole } from "@/types/next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  trustHost: true,
  secret: process.env.AUTH_SECRET || "ponto-certo-secret-key-12345",
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      async authorize(credentials, _request) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user as unknown as import("next-auth").User;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // MASTER OVERRIDE: Garantir que este email sempre seja ADMIN (Case Insensitive)
        const isMaster = user.email?.toLowerCase() === 'henriquemendonca060502@gmail.com';
        const finalRole = isMaster ? 'ADMIN' : user.role;
        
        token.role = finalRole as UserRole;
        token.email = user.email; // Garantir que o email está no token
        token.lojaId = (user.lojaId ?? null) as string | null;
        token.teamId = (user.teamId ?? null) as string | null;
        token.colaboradorId = (user.colaboradorId ?? null) as string | null;
        token.name = user.name;
      }
      
      if (trigger === "update" && token.sub) {
        const dbUser = await prisma.user.findUnique({ 
          where: { id: token.sub },
          select: { role: true, name: true, email: true, image: true, lojaId: true, teamId: true, colaboradorId: true }
        });
        if (dbUser) {
          // MASTER OVERRIDE no update também (Case Insensitive)
          const isMaster = dbUser.email?.toLowerCase() === 'henriquemendonca060502@gmail.com';
          const finalRole = isMaster ? 'ADMIN' : dbUser.role;
          
          token.role = finalRole as UserRole;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.image = dbUser.image;
          token.lojaId = (dbUser.lojaId ?? null) as string | null;
          token.teamId = (dbUser.teamId ?? null) as string | null;
          token.colaboradorId = (dbUser.colaboradorId ?? null) as string | null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (session.user) {
        session.user.role = (token.role ?? "EMPLOYEE") as UserRole;
        session.user.lojaId = (token.lojaId ?? null) as string | null;
        session.user.teamId = (token.teamId ?? null) as string | null;
        session.user.colaboradorId = (token.colaboradorId ?? null) as string | null;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
});
