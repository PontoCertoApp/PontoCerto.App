import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LandingPageClient from "./landing-client";

export default async function LandingPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return <LandingPageClient />;
}
