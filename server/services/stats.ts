import { db } from '../db';
import { events, orders, users } from '@shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function getBasicStats() {
  try {
    // Estatísticas básicas
    const [totalEvents] = await db.select({ count: sql<number>`count(*)` }).from(events);
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [totalOrders] = await db.select({ count: sql<number>`count(*)` }).from(orders);

    // Receita total
    const [revenue] = await db.select({
      total: sql<number>`sum(total_amount)`
    }).from(orders).where(eq(orders.status, 'completed'));

    // Receita de pedidos confirmados
    const [confirmedRevenue] = await db.select({
      total: sql<number>`sum(total_amount)`
    }).from(orders).where(eq(orders.status, 'confirmed'));

    // Pedidos por status
    const ordersByStatus = await db.select({
      status: orders.status,
      count: sql<number>`count(*)`
    }).from(orders).groupBy(orders.status);

    // Eventos recentes (últimos 5)
    const recentEvents = await db.select().from(events)
      .orderBy(events.createdAt)
      .limit(5);

    // Pedidos recentes (últimos 5)
    const recentOrders = await db.select().from(orders)
      .orderBy(orders.createdAt)
      .limit(5);

    // Eventos por mês
    const eventsPerMonth = await db.select({
      month: sql<string>`to_char(created_at, 'YYYY-MM')`,
      count: sql<number>`count(*)`
    }).from(events)
      .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
      .orderBy(sql`to_char(created_at, 'YYYY-MM')`);

    // Categorias de eventos
    const eventCategories = await db.select({
      name: events.category,
      value: sql<number>`count(*)`
    }).from(events)
      .groupBy(events.category);

    // Pedidos deste mês
    const [ordersThisMonth] = await db.select({
      count: sql<number>`count(*)`
    }).from(orders)
      .where(
        and(
          gte(orders.createdAt, new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
          lte(orders.createdAt, new Date())
        )
      );

    return {
      totalEvents: totalEvents.count,
      totalUsers: totalUsers.count,
      totalOrders: totalOrders.count,
      totalRevenue: revenue.total || 0,
      confirmedOrdersRevenue: confirmedRevenue.total || 0,
      ordersByStatus: ordersByStatus.reduce((acc, curr) => ({
        ...acc,
        [curr.status]: curr.count
      }), {}),
      recentEvents,
      recentOrders,
      eventsPerMonth,
      eventCategories,
      timestamp: new Date().toISOString(),
      dashboardTotals: {
        ordersThisMonth: ordersThisMonth.count,
        confirmedRevenue: confirmedRevenue.total || 0
      },
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    throw error;
  }
} 