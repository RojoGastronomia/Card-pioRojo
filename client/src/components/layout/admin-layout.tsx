import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <>
      <div className="bg-card shadow mb-6 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto py-3 gap-2">
            <Link href="/admin/dashboard">
              <Button variant={isActive('/admin/dashboard') ? 'default' : 'outline'} className="rounded-full">
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/events">
              <Button variant={isActive('/admin/events') ? 'default' : 'outline'} className="rounded-full">
                Gerenciar Eventos
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant={isActive('/admin/orders') ? 'default' : 'outline'} className="rounded-full">
                Gerenciar Pedidos
              </Button>
            </Link>
            <Link href="/admin/menus">
              <Button variant={isActive('/admin/menus') ? 'default' : 'outline'} className="rounded-full">
                Gerenciar Cardápios
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant={isActive('/admin/users') ? 'default' : 'outline'} className="rounded-full">
                Gerenciar Usuários
              </Button>
            </Link>
            <Link href="/admin/master">
              <Button variant={isActive('/admin/master') ? 'default' : 'outline'} className="rounded-full">
                Configurações Master
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </>
  );
} 