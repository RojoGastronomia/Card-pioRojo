import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { CartProvider } from "./context/cart-context";
import { LanguageProvider, useLanguage } from "./context/language-context";
import { ThemeProvider } from "./context/theme-context";
import { ProtectedRoute } from "./lib/protected-route";
import { MainLayout } from "./components/layout/main-layout";
import NotFound from "./pages/not-found";
import HomePage from "./pages/home-page";
import AuthPage from "./pages/auth-page";
import EventsPage from "./pages/events-page";
import EventDetailsPage from "./pages/event-details-page";
import OrderHistoryPage from "./pages/order-history-page";
import DashboardPage from "./pages/admin/dashboard-page";
import AdminEventsPage from "./pages/admin/events-page";
import AdminMenusPage from "./pages/admin/menus-page";
import AdminUsersPage from "./pages/admin/users-page";
import AdminOrdersPage from "./pages/admin/orders-page";
import MasterPage from "./pages/admin/master-page";
import MenusCrudPage from "./pages/admin/menus-crud-page";
import DishesPage from "./pages/admin/dishes-page";
import MenusDishesPage from "./pages/admin/menus-dishes-page";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface RolePermissions {
  [key: string]: string[];
}

// Componente simples de loading
function Loading() {
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-gray-600 font-medium">{t('common', 'loading')}</p>
      </div>
    </div>
  );
}

const rolesPermissions: RolePermissions = {
  client: ['Inicio', 'Eventos', 'Meus pedidos'],
  Cliente: ['Inicio', 'Eventos', 'Meus pedidos'],
  Colaborador: ['Inicio', 'Eventos', 'Meus pedidos', 'Cadastro de eventos', 'Confirmação de eventos'],
  Lider: ['Inicio', 'Eventos', 'Meus pedidos', 'Páginas de líderes'],
  Gerente: ['Inicio', 'Eventos', 'Meus pedidos', 'Páginas de gerentes'],
  Admin: ['Inicio', 'Eventos', 'Meus pedidos', 'Todas as páginas'],
  admin: ['Inicio', 'Eventos', 'Meus pedidos', 'Todas as páginas'],
  Administrador: [
    'Inicio', 
    'Eventos', 
    'Meus pedidos',
    'Cadastro de eventos',
    'Confirmação de eventos',
    'Páginas de líderes',
    'Páginas de gerentes',
    'Todas as páginas'
  ],
  administrator: [
    'Inicio', 
    'Eventos', 
    'Meus pedidos',
    'Cadastro de eventos',
    'Confirmação de eventos',
    'Páginas de líderes',
    'Páginas de gerentes',
    'Todas as páginas'
  ]
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <CartProvider>
              <AppRouter />
              <Toaster />
            </CartProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppRouter() {
  const { role: userRole, isAuthenticated, isLoading, error } = useAuth();
  const [, navigate] = useLocation();
  // Garantir páginas padrão para usuários sem papel definido
  const defaultPages = ['Inicio', 'Eventos', 'Meus pedidos'];
  const userPages = (userRole && rolesPermissions[userRole]) || defaultPages;
  
  // Log para depuração
  console.log('Current user role:', userRole);
  console.log('Available pages:', userPages);
  console.log('Auth state:', { isAuthenticated, isLoading, error });

  // Fechar todos os modais/dialogs ao trocar de rota
  useEffect(() => {
    window.dispatchEvent(new Event('closeAllModals'));
  }, [window.location.pathname]);

  // Se estiver carregando, mostrar loading
  if (isLoading) {
    return <Loading />;
  }

  // Se houver erro de autenticação, redirecionar para login
  if (error) {
    console.error('Auth error:', error);
    navigate('/auth');
    return null;
  }

  return (
    <MainLayout>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/events/:id" component={EventDetailsPage} />
        <Route path="/" component={HomePage} />
        
        {/* Rotas básicas disponíveis para todos os usuários autenticados */}
        <Route path="/events" component={EventsPage} />
        <Route 
          path="/orders" 
          component={() => {
            // Se não estiver autenticado, redirecionar para login
            if (!isAuthenticated) {
              const currentPath = window.location.pathname;
              const returnUrl = encodeURIComponent(currentPath);
              navigate(`/auth?returnTo=${returnUrl}`);
              return null;
            }
            
            return <OrderHistoryPage />;
          }} 
        />

        {/* Rotas administrativas */}
        {userPages.includes('Todas as páginas') && (
          <>
            <ProtectedRoute path="/admin/dashboard" component={DashboardPage} />
            <ProtectedRoute path="/admin/menus-crud" component={MenusCrudPage} />
            <ProtectedRoute path="/admin/menus/:menuId/dishes" component={AdminMenusPage} />
            <ProtectedRoute path="/admin/menus" component={AdminMenusPage} />
            <ProtectedRoute path="/admin/events" component={AdminEventsPage} />
            <ProtectedRoute path="/admin/orders" component={AdminOrdersPage} />
            <ProtectedRoute path="/admin/users" component={AdminUsersPage} />
            <ProtectedRoute path="/admin/master" component={MasterPage} />
            <ProtectedRoute path="/admin/dishes" component={DishesPage} />
            <ProtectedRoute path="/admin/menus-dishes" component={MenusDishesPage} />
          </>
        )}
        
        {/* Rotas especiais por função */}
        {!userPages.includes('Todas as páginas') && userPages.includes('Cadastro de eventos') && 
          <ProtectedRoute path="/admin/events" component={AdminEventsPage} />}
        
        {!userPages.includes('Todas as páginas') && userPages.includes('Confirmação de eventos') && 
          <ProtectedRoute path="/admin/orders" component={AdminOrdersPage} />}
        
        {!userPages.includes('Todas as páginas') && userPages.includes('Páginas de líderes') && 
          <ProtectedRoute path="/admin/dashboard" component={DashboardPage} />}
        
        {!userPages.includes('Todas as páginas') && userPages.includes('Páginas de gerentes') && 
          <ProtectedRoute path="/admin/menus" component={AdminMenusPage} />}
        
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </MainLayout>
  );
}

export default App;