import { auth } from "@/auth";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "Usuário";

  return <DashboardClient userName={userName} />;
}
