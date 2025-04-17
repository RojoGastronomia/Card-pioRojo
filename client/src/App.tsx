import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { CartProvider } from "@/context/cart-context";
import { ProtectedRoute } from "./lib/protected-route";
import { MainLayout } from "@/components/layout/main-layout";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import EventsPage from "@/pages/events-page";
import EventDetailsPage from "@/pages/event-details-page";
import OrderHistoryPage from "@/pages/order-history-page";
import DashboardPage from "@/pages/admin/dashboard-page";
import AdminEventsPage from "@/pages/admin/events-page";
import AdminMenusPage from "@/pages/admin/menus-page";
import AdminUsersPage from "@/pages/admin/users-page";
import AdminOrdersPage from "@/pages/admin/orders-page";
import MasterPage from "@/pages/admin/master-page";
import MenusCrudPage from "@/pages/admin/menus-crud-page";

interface RolePermissions {
  [key: string]: string[];
}

const rolesPermissions: RolePermissions = {
  client: ['Inicio', 'Eventos', 'Meus pedidos'],
  Cliente: ['Inicio', 'Eventos', 'Meus pedidos'],
  Colaborador: ['Cadastro de eventos', 'Confirmação de eventos'],
  Lider: ['Páginas de líderes'],
  Gerente: ['Páginas de gerentes'],
  Administrador: [
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
      <AuthProvider>
        <CartProvider>
          <AppRouter />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppRouter() {
  const { role: userRole = 'client' } = useAuth();
  const pages = rolesPermissions[userRole || 'client'] || [];

  return (
    <MainLayout>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/events/:id" component={EventDetailsPage} />
        <Route path="/" component={HomePage} />
        {pages.includes('Eventos') && <Route path="/events" component={EventsPage} />}
        {pages.includes('Meus pedidos') && <ProtectedRoute path="/orders" component={OrderHistoryPage} />}
        {pages.includes('Cadastro de eventos') && <ProtectedRoute path="/admin/events" component={AdminEventsPage} />}
        {pages.includes('Confirmação de eventos') && <ProtectedRoute path="/admin/orders" component={AdminOrdersPage} />}
        {pages.includes('Páginas de líderes') && <ProtectedRoute path="/admin/dashboard" component={DashboardPage} />}
        {pages.includes('Páginas de gerentes') && <ProtectedRoute path="/admin/menus" component={AdminMenusPage} />}
        {pages.includes('Todas as páginas') && (
          <>
            <ProtectedRoute path="/admin/menus-crud" component={MenusCrudPage} />
            <ProtectedRoute path="/admin/menus/:menuId/dishes" component={AdminMenusPage} />
            <ProtectedRoute path="/admin/events" component={AdminEventsPage} />
            <ProtectedRoute path="/admin/orders" component={AdminOrdersPage} />
            <ProtectedRoute path="/admin/dashboard" component={DashboardPage} />
            <ProtectedRoute path="/admin/users" component={AdminUsersPage} />
            <ProtectedRoute path="/admin/master" component={MasterPage} />
          </>
        )}
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </MainLayout>
  );
}

export default App;