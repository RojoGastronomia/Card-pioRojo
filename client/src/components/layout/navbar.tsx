import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/cart-context";
import CartModal from "@/components/cart/cart-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ShoppingCart, User, Menu, ChevronDown, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/context/language-context";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation, role } = useAuth();
  const { cartItems, openCart } = useCart();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  // DEBUG: Mostrar idioma e tradução de users
  console.log('LANG:', language, 'USERS:', t('admin', 'users'));

  // Determine if the user is admin
  const isAdmin = user?.role === "admin";

  // Check if we're on an admin page
  const isAdminPage = location.startsWith("/admin");

  // Active link style helper
  const isActive = (path: string) => {
    return location === path 
      ? "border-primary text-primary" 
      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:border-gray-600";
  };

  // Admin navigation links (dentro do componente, para recalcular ao trocar idioma)
  const adminLinks = [
    { name: t('admin', 'dashboard'), path: "/admin/dashboard" },
    { name: t('admin', 'users'), path: "/admin/users" },
    { name: t('admin', 'events'), path: "/admin/events" },
    { name: t('admin', 'menus'), path: "/admin/menus-crud" },
    { name: t('admin', 'dishes'), path: "/admin/dishes" },
    { name: t('admin', 'orders'), path: "/admin/orders" },
    { name: t('admin', 'master'), path: "/admin/master" },
  ];

  // Client navigation links (dentro do componente)
  const clientLinks = [
    { name: t('navbar', 'home'), path: "/" },
    { name: t('navbar', 'events'), path: "/events" },
    { name: t('navbar', 'myOrders'), path: "/orders" },
  ];

  const links = isAdminPage ? adminLinks : clientLinks;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutate();
      queryClient.clear();
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema",
      });
      window.location.href = "/auth";
    } catch (error) {
      toast({
        title: "Erro ao realizar logout",
        description: "Ocorreu um erro ao tentar desconectar do sistema",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-['Pacifico'] text-2xl text-primary">Rojo Gastronomia</span>
              </Link>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {links.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive(link.path)}`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {/* Cart Button */}
              {!isAdminPage && (
                <button 
                  className="relative w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                  onClick={openCart}
                >
                  <ShoppingCart size={20} />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {cartItems.length}
                    </span>
                  )}
                </button>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <User size={16} />
                      <span className="font-medium">{user.name.split(' ')[0]}</span>
                      <ChevronDown size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{t('navbar', 'myAccount')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {role !== "client" && role !== "Cliente" && (
                      <>
                        <Link href="/">
                          <DropdownMenuItem className="cursor-pointer">
                            {t('navbar', 'homePage')}
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    {role === "Administrador" && (
                      <>
                        <Link href="/admin/dashboard">
                          <DropdownMenuItem className="cursor-pointer">
                            {t('navbar', 'adminPanel')}
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 cursor-pointer"
                    >
                      {t('navbar', 'logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => window.location.href = "/auth"}>
                  {t('navbar', 'login')}
                </Button>
              )}

              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden bg-white dark:bg-gray-800 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="pt-2 pb-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`block pl-3 pr-4 py-2 text-base font-medium ${
                    location === link.path
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            {user && (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="text-indigo-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.name}</div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                </div>
                
                <div className="mt-3 space-y-1">
                  {isAdmin && !isAdminPage && (
                    <Link 
                      href="/admin/dashboard" 
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {t('navbar', 'adminPanel')}
                    </Link>
                  )}
                  {!isAdmin && (
                    <Link 
                      href="/orders" 
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {t('navbar', 'myOrders')}
                    </Link>
                  )}
                  <button
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                  >
                    {t('navbar', 'logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
      
      {/* Cart Modal */}
      <CartModal />
    </>
  );
}
