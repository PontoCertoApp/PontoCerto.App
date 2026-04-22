import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock } from "lucide-react";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <Clock className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gradient">PontoCerto</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Recursos</Link>
            <Link href="#como-funciona" className="text-sm font-medium hover:text-primary transition-colors">Como Funciona</Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Preços</Link>
          </nav>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full px-6 shadow-primary/25 shadow-lg">Começar Agora</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold tracking-tight">PontoCerto</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                A solução completa para gestão de ponto e RH da sua empresa. 
                Modernidade, segurança e facilidade em um só lugar.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-primary transition-colors">Recursos</Link></li>
                <li><Link href="#como-funciona" className="hover:text-primary transition-colors">Como funciona</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Preços</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Sobre nós</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Privacidade</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Termos de uso</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PontoCerto. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
