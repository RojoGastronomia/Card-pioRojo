import { storage } from "./storage-mongo";
import logger from './logger';

export async function getBasicStats() {
  try {
    // Usar apenas métodos básicos disponíveis no MongoDBStorage
    const [users, menus, dishes, events, orders] = await Promise.all([
      storage.getAllUsers(),
      storage.getAllMenus(),
      storage.getAllDishes(),
      storage.getAllEvents(),
      storage.getAllOrders()
    ]);

    // Calcular estatísticas básicas
    const totalUsers = users.length;
    const totalMenus = menus.length;
    const totalDishes = dishes.length;
    const totalEvents = events.length;
    const totalOrders = orders.length;

    // Calcular receita total (se houver campo totalAmount nos pedidos)
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + (order.totalAmount || 0);
    }, 0);
    
    // Pedidos recentes
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalUsers,
      totalMenus,
      totalDishes,
      totalEvents,
      totalOrders,
      totalRevenue,
      recentOrders
    };
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Error getting basic stats');
    throw error;
  }
}