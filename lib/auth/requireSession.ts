import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Centralised session guard for server components and server actions.
 * Usage: const session = await requireSession();
 * Redirects to /login if unauthenticated.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * Returns true if the user has RH or ADMIN privileges (case-insensitive).
 */
export function isRHOrAdmin(role: string | undefined | null): boolean {
  return ["RH", "ADMIN"].includes((role || "").toUpperCase());
}
