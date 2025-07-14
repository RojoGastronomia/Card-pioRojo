import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminNavbar() {
  const [location] = useLocation();

  return (
    <div className="bg-card shadow border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto py-3 gap-2">
          <Link href="/admin/dashboard">
            <Button variant={location === '/admin/dashboard' ? 'default' : 'outline'} className="rounded-full">Dashboard</Button>
          </Link>
          <Link href="/admin/users">
            <Button variant={location === '/admin/users' ? 'default' : 'outline'} className="rounded-full">Usuários</Button>
          </Link>
          <Link href="/admin/events">
            <Button variant={location === '/admin/events' ? 'default' : 'outline'} className="rounded-full">Cadastrar Eventos</Button>
          </Link>
          <Link href="/admin/menus">
            <Button variant={location === '/admin/menus' ? 'default' : 'outline'} className="rounded-full">Cardápios</Button>
          </Link>
          <Link href="/admin/dishes">
            <Button variant={location === '/admin/dishes' ? 'default' : 'outline'} className="rounded-full">Pratos</Button>
          </Link>

          <Link href="/admin/orders">
            <Button variant={location === '/admin/orders' ? 'default' : 'outline'} className="rounded-full">Pedidos</Button>
          </Link>
          <Link href="/admin/master">
            <Button variant={location === '/admin/master' ? 'default' : 'outline'} className="rounded-full">Master</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
