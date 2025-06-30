import { 
  type Event, type Order, type User, 
  type InsertEvent, type InsertOrder, type InsertUser, 
  type Menu, type Dish, type InsertMenu, type InsertDish,
  users, events, menus, dishes, orders, eventMenus, menuDishes,
  type Venue, type Room, type InsertVenue, type InsertRoom,
  type Category, type InsertCategory, categories
} from "shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import logger from './logger'; // Importar o logger
import fs from 'fs/promises'; // Usar fs/promises para async/await
import path from 'path';
import { EventEmitter } from 'events';
import { hashPassword } from './auth';
import { notifyDataChange } from './sse';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string, role?: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;
  getClientCount(): Promise<number>;

  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: InsertEvent): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<void>;
  getEventCount(): Promise<number>;
  getRecentEvents(): Promise<Event[]>;
  getMenusByEventId(eventId: number): Promise<Menu[]>;
  associateMenuToEvent(eventId: number, menuId: number): Promise<void>;
  dissociateMenuFromEvent(eventId: number, menuId: number): Promise<void>;

  // Menu operations
  getMenu(id: number): Promise<Menu | undefined>;
  getAllMenus(): Promise<Menu[]>;
  createMenu(menu: InsertMenu): Promise<Menu>;
  updateMenu(id: number, menu: InsertMenu): Promise<Menu | undefined>;
  deleteMenu(id: number): Promise<void>;

  // Dish operations
  getDish(id: number): Promise<Dish | undefined>;
  getAllDishes(): Promise<Dish[]>;
  getDishesByMenuId(menuId: number): Promise<Dish[]>;
  createDish(dish: InsertDish, menuId: number | null): Promise<Dish>;
  updateDish(id: number, dish: InsertDish): Promise<Dish | undefined>;
  deleteDish(id: number): Promise<void>;
  getMenusByDishId(dishId: number): Promise<Menu[]>;
  associateDishWithMenu(dishId: number, menuId: number): Promise<Dish>;
  dissociateDishFromMenu(dishId: number, menuId: number): Promise<void>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<void>;
  getOrderCount(): Promise<number>;
  getTotalRevenue(): Promise<number>;
  getPotentialRevenue(): Promise<number>;
  updateOrderAdminNotes(id: number, notes: string): Promise<Order | undefined>;
  updateOrderBoleto(id: number, boletoUrl: string): Promise<Order | undefined>;

  // Session store
  sessionStore: session.Store;

  // System/Master operations
  performSystemBackup(): Promise<void>;
  getSystemLogs(): Promise<any[]>;
  updateSystemSettings(settings: any): Promise<void>;
  getPermissions(): Promise<any[]>;
  getRoles(): Promise<any[]>;
  generateApiToken(data: any): Promise<any>;
  performDatabaseBackup(): Promise<void>;
  optimizeDatabase(): Promise<void>;
  performDatabaseMaintenance(): Promise<void>;
  getSystemPerformance(): Promise<any>;
  getSystemResources(): Promise<any>;
  getSystemAlerts(): Promise<any[]>;
  executeConsoleCommand(command: string): Promise<any>;
  manageCacheOperation(operation: any): Promise<void>;
  performIndexing(config: any): Promise<void>;

  // New method
  getUsersByRole(role: string): Promise<User[]>;

  // Additional method
  deleteUser(id: number): Promise<void>;

  // New method
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;

  // New method
  getConfirmedOrders(): Promise<any[]>;

  // Venue operations
  getAllVenues(): Promise<Venue[]>;
  getVenue(id: number): Promise<Venue | undefined>;
  createVenue(insertVenue: InsertVenue): Promise<Venue>;
  updateVenue(id: number, venueData: InsertVenue): Promise<Venue | undefined>;
  deleteVenue(id: number): Promise<void>;

  // Room operations
  getRoomsByVenueId(venueId: number): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(venueId: number, insertRoom: InsertRoom): Promise<Room>;
  updateRoom(id: number, roomData: InsertRoom): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<void>;

  // Categories methods
  getAllCategories(): Promise<Category[]>;
  createCategory(categoryData: InsertCategory): Promise<Category>;
  updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<void>;
}

const MemoryStore = createMemoryStore(session);

// Implementação do DatabaseStorage
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Limpar sessões expiradas a cada 24h
    });
  }

  // Implementação de métodos de usuário
  async getUser(id: number): Promise<User | undefined> {
    console.log(`[Storage] getUser called with ID: ${id}`);
    try {
      const result = await db.query.users.findFirst({
        where: eq(users.id, id)
      });
      console.log(`[Storage] getUser query returned: ${result ? result.username : 'undefined'}`);
      return result;
    } catch (error) {
      console.error(`[Storage] Error in getUser for ID ${id}:`, error); // Log error
      throw error; // Re-throw the error to be caught by auth
    }
  }

  async getUserByUsername(username: string, role?: string): Promise<User | undefined> {
    if (role) {
      const [user] = await db.select().from(users).where(and(eq(users.username, username), eq(users.role, role)));
      return user;
    } else {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count || 0;
  }

  async getClientCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users)
      .where(eq(users.role, "client"));
    return result[0].count || 0;
  }

  // Implementação de métodos de evento
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getAllEvents(): Promise<Event[]> {
    console.log("[Storage] getAllEvents - Starting query");
    try {
      const result = await db.select().from(events);
      console.log(`[Storage] getAllEvents - Found ${result.length} events`);
      return result;
    } catch (error) {
      console.error("[Storage] getAllEvents - Error:", error);
      throw error;
    }
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: number, eventData: InsertEvent): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async getEventCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(events);
    return result[0].count || 0;
  }

  async getRecentEvents(): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .orderBy(desc(events.createdAt))
      .limit(5);
  }

  async getMenusByEventId(eventId: number): Promise<Menu[]> {
    const results = await db.select({ menu: menus })
                           .from(eventMenus)
                           .innerJoin(menus, eq(eventMenus.menuId, menus.id))
                           .where(eq(eventMenus.eventId, eventId));
    return results.map(r => r.menu);
  }

  async associateMenuToEvent(eventId: number, menuId: number): Promise<void> {
    await db.insert(eventMenus).values({ eventId, menuId }).onConflictDoNothing();
  }

  async dissociateMenuFromEvent(eventId: number, menuId: number): Promise<void> {
    await db.delete(eventMenus).where(and(eq(eventMenus.eventId, eventId), eq(eventMenus.menuId, menuId)));
  }

  // Menu operations
  async getMenu(id: number): Promise<Menu | undefined> {
    const [menu] = await db.select().from(menus).where(eq(menus.id, id));
    return menu;
  }

  async getAllMenus(): Promise<Menu[]> {
    return await db.select().from(menus);
  }

  async createMenu(insertMenu: InsertMenu): Promise<Menu> {
    const [menu] = await db.insert(menus).values(insertMenu).returning();
    return menu;
  }

  async updateMenu(id: number, menuData: InsertMenu): Promise<Menu | undefined> {
    const [updatedMenu] = await db.update(menus).set(menuData).where(eq(menus.id, id)).returning();
    return updatedMenu;
  }

  async deleteMenu(id: number): Promise<void> {
    await db.delete(menus).where(eq(menus.id, id));
  }

  // Dish operations
  async getDish(id: number): Promise<Dish | undefined> {
    const [dish] = await db.select().from(dishes).where(eq(dishes.id, id));
    return dish;
  }

  async getAllDishes(): Promise<Dish[]> {
    return await db.select().from(dishes);
  }

  async getDishesByMenuId(menuId: number): Promise<Dish[]> {
    console.log(`[Storage] getDishesByMenuId called with menuId: ${menuId}`);
    try {
      // First try the modern approach with the junction table
      const dishResults = await db
        .select({ dish: dishes })
        .from(menuDishes)
        .innerJoin(dishes, eq(menuDishes.dishId, dishes.id))
        .where(eq(menuDishes.menuId, menuId))
        .orderBy(dishes.category, dishes.name);
      
      console.log(`[Storage] getDishesByMenuId found ${dishResults.length} dishes using junction table`);
      
      // If no results from junction table, try the legacy approach with menuId in dishes
      if (dishResults.length === 0) {
        console.log(`[Storage] No dishes found in junction table, trying legacy approach`);
        const legacyResults = await db
          .select()
          .from(dishes)
          .where(eq(dishes.menuId, menuId))
          .orderBy(dishes.category, dishes.name);
          
        console.log(`[Storage] getDishesByMenuId found ${legacyResults.length} dishes using legacy approach`);
        
        // If we found legacy results, migrate them to the junction table
        if (legacyResults.length > 0) {
          console.log(`[Storage] Migrating ${legacyResults.length} legacy dish associations to junction table`);
          for (const dish of legacyResults) {
            await db.insert(menuDishes)
              .values({ menuId, dishId: dish.id })
              .onConflictDoNothing();
          }
        }
        
        return legacyResults;
      }
      
      return dishResults.map(r => r.dish);
    } catch (error) {
      console.error(`[Storage] Error in getDishesByMenuId for menuId ${menuId}:`, error);
      throw error;
    }
  }

  async createDish(insertDish: InsertDish, menuId: number | null): Promise<Dish> {
    const [dish] = await db.insert(dishes).values({ ...insertDish, menuId }).returning();
    return dish;
  }

  async updateDish(id: number, dishData: InsertDish): Promise<Dish | undefined> {
    const [updatedDish] = await db.update(dishes).set(dishData).where(eq(dishes.id, id)).returning();
    return updatedDish;
  }

  async deleteDish(id: number): Promise<void> {
    await db.delete(dishes).where(eq(dishes.id, id));
  }

  async getMenusByDishId(dishId: number): Promise<Menu[]> {
    try {
      console.log(`[Storage] Getting menus for dish ${dishId} using junction table`);
      
      const results = await db.select({ menu: menus })
        .from(menuDishes)
        .innerJoin(menus, eq(menuDishes.menuId, menus.id))
        .where(eq(menuDishes.dishId, dishId));
      
      console.log(`[Storage] Found ${results.length} menus for dish ${dishId}`);
      return results.map(r => r.menu);
    } catch (error) {
      console.error(`[Storage] Error getting menus for dish ${dishId}:`, error);
      throw error;
    }
  }

  async associateDishWithMenu(dishId: number, menuId: number): Promise<Dish> {
    // First check if the dish exists
    const dish = await this.getDish(dishId);
    if (!dish) {
      throw new Error(`Dish with ID ${dishId} not found`);
    }

    // Check if the menu exists
    const menu = await this.getMenu(menuId);
    if (!menu) {
      throw new Error(`Menu with ID ${menuId} not found`);
    }

    // Insert into the junction table
    try {
      await db.insert(menuDishes)
        .values({ menuId, dishId })
        .onConflictDoNothing();
      
      console.log(`[Storage] Associated dish ${dishId} with menu ${menuId} in junction table`);
      
      return dish;
    } catch (error) {
      console.error(`[Storage] Error associating dish ${dishId} with menu ${menuId}:`, error);
      throw error;
    }
  }

  async dissociateDishFromMenu(dishId: number, menuId: number): Promise<void> {
    // First check if the dish exists
    const dish = await this.getDish(dishId);
    if (!dish) {
      throw new Error(`Dish with ID ${dishId} not found`);
    }

    // Check if the menu exists
    const menu = await this.getMenu(menuId);
    if (!menu) {
      throw new Error(`Menu with ID ${menuId} not found`);
    }

    // Remove from the junction table
    try {
      await db.delete(menuDishes)
        .where(and(eq(menuDishes.menuId, menuId), eq(menuDishes.dishId, dishId)));
      
      console.log(`[Storage] Dissociated dish ${dishId} from menu ${menuId} in junction table`);
    } catch (error) {
      console.error(`[Storage] Error dissociating dish ${dishId} from menu ${menuId}:`, error);
      throw error;
    }
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    console.log("[Storage] Buscando todos os pedidos reais do banco de dados...");
    try {
      const realOrders = await db.select().from(orders);
      console.log(`[Storage] Encontrados ${realOrders.length} pedidos reais no banco de dados`);
      
      // Sempre retornar os pedidos reais, mesmo que seja uma lista vazia
      console.log(`[Storage] Retornando ${realOrders.length} pedidos reais do banco`);
      
      // Log detalhado dos pedidos encontrados para debug
      if (realOrders.length > 0) {
        console.log(`[Storage] Detalhes dos pedidos reais encontrados:`);
        realOrders.forEach((order, index) => {
          console.log(`[Storage] Pedido #${index + 1}: ID=${order.id}, Status=${order.status}, Valor=${order.totalAmount}, Data=${order.createdAt}`);
        });
      } else {
        console.log(`[Storage] Nenhum pedido real encontrado no banco de dados`);
      }
      
      return realOrders;
    } catch (error) {
      console.error("[Storage] Erro ao buscar pedidos reais:", error);
      console.log("[Storage] Retornando lista vazia devido ao erro");
      return []; // Em caso de erro, retornar lista vazia
    }
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    if (updatedOrder) {
      notifyDataChange(); // Notifica o SSE para atualizar o dashboard
    }
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<void> {
    logger.info({ orderId: id }, "[DB] Deleting order");
    console.log(`[DEBUG-STORAGE] Attempting to delete order with ID: ${id}`);
    
    try {
      // Primeiro, verifique se o pedido existe
      const existingOrder = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
      
      if (!existingOrder || existingOrder.length === 0) {
        const errorMsg = `Order with ID ${id} not found, cannot delete non-existent order`;
        console.error(`[DEBUG-STORAGE] ${errorMsg}`);
        logger.error({ orderId: id }, errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log(`[DEBUG-STORAGE] Order found, proceeding with deletion:`, JSON.stringify(existingOrder[0], null, 2));
      
      // Execute a exclusão com transação
      const result = await db.transaction(async (tx) => {
        // Log para depuração
        console.log(`[DEBUG-STORAGE] Starting transaction to delete order ${id}`);
        
        try {
          // Execute a consulta de exclusão
          const deleteResult = await tx.delete(orders).where(eq(orders.id, id));
          console.log(`[DEBUG-STORAGE] Delete operation completed in transaction:`, deleteResult);
          
          // Tente buscar o pedido novamente para confirmar exclusão
          const checkOrder = await tx.select().from(orders).where(eq(orders.id, id));
          
          if (checkOrder && checkOrder.length > 0) {
            // O pedido ainda existe, a exclusão falhou
            console.error(`[DEBUG-STORAGE] Delete failed: Order ${id} still exists after deletion attempt`);
            throw new Error(`Failed to delete order ${id}`);
          }
          
          return { success: true };
        } catch (txError) {
          console.error(`[DEBUG-STORAGE] Transaction error:`, txError);
          throw txError; // Re-throw para rollback da transação
        }
      });
      
      console.log(`[DEBUG-STORAGE] Delete transaction result:`, result);
      logger.info({ orderId: id, result }, "[DB] Order successfully deleted");
    } catch (error) {
      console.error(`[DEBUG-STORAGE] Error deleting order with ID ${id}:`, error);
      logger.error({ orderId: id, error }, "[DB] Error deleting order");
      throw error;
    }
  }

  async getOrderCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(orders);
    return result[0].count || 0;
  }

  async getTotalRevenue(): Promise<number> {
    try {
      console.log("[Storage] Getting total revenue from completed orders only");
      
      // Buscar a soma apenas de pedidos completados
      const completedResult = await db
        .select({ sum: sql<number>`sum(total_amount)` })
      .from(orders)
      .where(eq(orders.status, "completed"));
      
      const completedRevenue = completedResult[0]?.sum || 0;
      
      console.log(`[Storage] Total completed revenue from DB: ${completedRevenue}`);
      
      // ALTERAÇÃO: Retornar o valor real obtido do banco de dados
      return completedRevenue;
    } catch (error) {
      console.error("[Storage] Error getting completed revenue:", error);
      return 0;
    }
  }

  async getPotentialRevenue(): Promise<number> {
    try {
      console.log("[Storage] Getting potential revenue from pending AND confirmed orders");
      
      // Usar valores reais do banco de dados
      console.log("[Storage] Using REAL DATABASE VALUES for potential revenue calculation");
      const allOrders = await db.select().from(orders);
      
      // Filtrar por status
      const confirmedOrders = allOrders.filter(order => order.status === "confirmed");
      const pendingOrders = allOrders.filter(order => order.status === "pending");
      
      // Detectar valores anormais (outliers) - consideramos anormal valores acima de 1 milhão
      const MAX_REASONABLE_ORDER_VALUE = 1000000; // 1 milhão como valor máximo razoável
      
      // Somar valores com limitação para valores anormais
      const confirmedRevenue = confirmedOrders.reduce((total, order) => {
        // Se o valor for acima do limite, use o limite
        const safeAmount = order.totalAmount && order.totalAmount > MAX_REASONABLE_ORDER_VALUE 
          ? MAX_REASONABLE_ORDER_VALUE 
          : (order.totalAmount || 0);
        return total + safeAmount;
      }, 0);
      
      const pendingRevenue = pendingOrders.reduce((total, order) => {
        // Se o valor for acima do limite, use o limite
        const safeAmount = order.totalAmount && order.totalAmount > MAX_REASONABLE_ORDER_VALUE 
          ? MAX_REASONABLE_ORDER_VALUE 
          : (order.totalAmount || 0);
        return total + safeAmount;
      }, 0);
      
      const totalPotential = confirmedRevenue + pendingRevenue;
      
      console.log(`[Storage] REAL DB Potential revenue breakdown:
        - Confirmed (${confirmedOrders.length} orders): ${confirmedRevenue}
        - Pending (${pendingOrders.length} orders): ${pendingRevenue}
        - Total NORMALIZED Potential: ${totalPotential}`);
      
      return totalPotential;
    } catch (error) {
      console.error("[Storage] Error getting potential revenue:", error);
      return 0;
    }
  }

  // System Management
  async performSystemBackup(): Promise<void> {
    // Simulação de backup
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async getSystemLogs(limit: number = 100): Promise<any[]> {
    logger.info('[Storage] getSystemLogs called');
    const logFilePath = path.resolve(__dirname, '..' , 'logs', 'app.log'); // Caminho corrigido
    logger.debug({ logFilePath }, '[Storage] Attempting to read log file');

    try {
      // Verificar se o arquivo existe
      await fs.access(logFilePath);

      // Ler o conteúdo do arquivo
      const logContent = await fs.readFile(logFilePath, 'utf-8');

      // Dividir em linhas, remover linhas vazias e pegar as últimas 'limit' linhas
      const lines = logContent.split('\n').filter(line => line.trim() !== '');
      const recentLines = lines.slice(-limit);

      // Tentar parsear cada linha como JSON
      const logs = recentLines.map((line, index) => {
        try {
          return JSON.parse(line);
        } catch (parseError) {
          logger.warn({ lineNumber: lines.length - limit + index + 1, lineContent: line, error: parseError.message }, '[Storage] Failed to parse log line as JSON');
          // Retornar um objeto com a linha original em caso de erro de parse
          return { level: 30, time: Date.now(), msg: line, parseError: true }; 
        }
      });

      logger.info(`[Storage] Returning ${logs.length} log entries`);
      return logs.reverse(); // Reverter para mostrar os mais recentes primeiro

    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn({ logFilePath }, '[Storage] Log file does not exist yet.');
        return []; // Retorna array vazio se o arquivo não existe
      } else {
        logger.error({ logFilePath, error: error.message, stack: error.stack }, '[Storage] Error reading or processing log file');
        // Retorna um array com uma entrada de erro em caso de outros problemas
        return [{ level: 50, time: Date.now(), msg: `Error reading log file: ${error.message}` }];
      }
    }
  }

  async updateSystemSettings(settings: any): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Access Control
  async getPermissions(): Promise<any[]> {
    if (!this._permissions) {
      this._permissions = [
        { id: 1, name: "read:users", description: "Ler usuários" },
        { id: 2, name: "write:users", description: "Modificar usuários" },
        { id: 3, name: "delete:users", description: "Deletar usuários" }
      ];
    }
    return this._permissions;
  }

  async createPermission({ name, description }: { name: string, description: string }): Promise<any> {
    if (!this._permissions) await this.getPermissions();
    const newId = this._permissions.length > 0 ? Math.max(...this._permissions.map(p => p.id)) + 1 : 1;
    const newPerm = { id: newId, name, description };
    this._permissions.push(newPerm);
    return newPerm;
  }

  async deletePermission(id: number): Promise<void> {
    if (!this._permissions) await this.getPermissions();
    this._permissions = this._permissions.filter(p => p.id !== id);
  }

  async getRoles(): Promise<any[]> {
    if (!this._roles) {
      this._roles = [
        { id: 1, name: "admin", permissions: ["read:users", "write:users", "delete:users"] },
        { id: 2, name: "manager", permissions: ["read:users", "write:users"] },
        { id: 3, name: "user", permissions: ["read:users"] }
      ];
    }
    return this._roles;
  }

  async createRole({ name, permissions }: { name: string, permissions: string[] }): Promise<any> {
    if (!this._roles) await this.getRoles();
    const newId = this._roles.length > 0 ? Math.max(...this._roles.map(r => r.id)) + 1 : 1;
    const newRole = { id: newId, name, permissions };
    this._roles.push(newRole);
    return newRole;
  }

  async deleteRole(id: number): Promise<void> {
    if (!this._roles) await this.getRoles();
    this._roles = this._roles.filter(r => r.id !== id);
  }

  async generateApiToken(data: any): Promise<any> {
    return { token: "api_" + Math.random().toString(36).substring(7) };
  }

  // Database Management
  async performDatabaseBackup(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async optimizeDatabase(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async performDatabaseMaintenance(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Monitoring
  async getSystemPerformance(): Promise<any> {
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100
    };
  }

  async getSystemResources(): Promise<any> {
  //tem que deixar essa bomba retornando dados reais
    return {
      totalMemory: "16GB",
      usedMemory: "8GB",
      totalDisk: "500GB",
      usedDisk: "250GB"
    };
  }

  async getSystemAlerts(): Promise<any[]> {
    //retornando dados reais também
    return [
      { type: "warning", message: "Alto uso de CPU", timestamp: new Date().toISOString() },
      { type: "info", message: "Backup agendado", timestamp: new Date().toISOString() }
    ];
  }

  // Advanced Tools
  async executeConsoleCommand(command: string): Promise<any> {
    return { output: `Executed: ${command}`, timestamp: new Date().toISOString() };
  }

  async manageCacheOperation(operation: any): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  async performIndexing(config: any): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    let dataToUpdate = { ...userData };
    if (userData.password) {
      dataToUpdate.password = await hashPassword(userData.password);
    }
    const [updatedUser] = await db
      .update(users)
      .set(dataToUpdate)
      .where(eq(users.id, id))
      .returning();
    if (updatedUser) notifyDataChange();
    return updatedUser;
  }

  async getConfirmedOrders(): Promise<any[]> {
    console.log("[Storage] Buscando pedidos confirmados reais do banco de dados");
    
    try {
      // Buscar pedidos reais do banco de dados
      const realOrders = await db.select().from(orders);
      
      console.log(`[Storage] Encontrados ${realOrders.length} pedidos reais no banco`);
      
      // Se não há pedidos reais, retornar lista vazia
      if (realOrders.length === 0) {
        console.log("[Storage] Nenhum pedido encontrado no banco, retornando lista vazia");
        return [];
      }
      
      // Processar pedidos reais para incluir informações de eventos e usuários
      const processedOrders = await Promise.all(realOrders.map(async (order) => {
        try {
          // Buscar evento associado
          const event = order.eventId ? await db.select().from(events).where(eq(events.id, order.eventId)).limit(1) : null;
          const eventData = event && event.length > 0 ? event[0] : null;
          
          // Buscar usuário associado
          const user = order.userId ? await db.select().from(users).where(eq(users.id, order.userId)).limit(1) : null;
          const userData = user && user.length > 0 ? user[0] : null;
          
          return {
            id: order.id,
            status: order.status,
            eventId: order.eventId,
            totalAmount: order.totalAmount,
            guestCount: order.guestCount,
            date: order.date || order.createdAt,
            menuSelection: order.menuSelection,
            event: eventData ? {
              id: eventData.id,
              title: eventData.title,
              description: eventData.description,
              date: eventData.date,
              status: eventData.status
            } : null,
            user: userData ? {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              role: userData.role
            } : null
          };
        } catch (error) {
          console.error(`[Storage] Erro ao processar pedido ${order.id}:`, error);
          // Retornar pedido básico se houver erro ao buscar dados relacionados
          return {
            id: order.id,
            status: order.status,
            eventId: order.eventId,
            totalAmount: order.totalAmount,
            guestCount: order.guestCount,
            date: order.date || order.createdAt,
            menuSelection: order.menuSelection,
            event: null,
            user: null
          };
        }
      }));
      
      console.log(`[Storage] Processados ${processedOrders.length} pedidos reais com dados relacionados`);
      
      return processedOrders;
    } catch (error) {
      console.error("[Storage] Erro ao buscar pedidos confirmados:", error);
      return [];
    }
  }

  async updateOrderAdminNotes(id: number, notes: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ adminNotes: notes, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateOrderBoleto(id: number, boletoUrl: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ boletoUrl: boletoUrl, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Venue operations
  async getAllVenues(): Promise<Venue[]> {
    return await db.select().from(venues);
  }

  async getVenue(id: number): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue;
  }

  async createVenue(insertVenue: InsertVenue): Promise<Venue> {
    const [venue] = await db.insert(venues).values(insertVenue).returning();
    return venue;
  }

  async updateVenue(id: number, venueData: InsertVenue): Promise<Venue | undefined> {
    const [updatedVenue] = await db
      .update(venues)
      .set(venueData)
      .where(eq(venues.id, id))
      .returning();
    return updatedVenue;
  }

  async deleteVenue(id: number): Promise<void> {
    await db.delete(venues).where(eq(venues.id, id));
  }

  // Room operations
  async getRoomsByVenueId(venueId: number): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.venueId, venueId));
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(venueId: number, insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db.insert(rooms).values({ ...insertRoom, venueId }).returning();
    return room;
  }

  async updateRoom(id: number, roomData: InsertRoom): Promise<Room | undefined> {
    const [updatedRoom] = await db
      .update(rooms)
      .set(roomData)
      .where(eq(rooms.id, id))
      .returning();
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<void> {
    await db.delete(rooms).where(eq(rooms.id, id));
  }

  // Categories methods
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    if (!category) {
      throw new Error("Falha ao criar categoria");
    }
    notifyDataChange();
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...categoryData, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    if (updatedCategory) notifyDataChange();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
    notifyDataChange();
  }

  // Propriedade interna para armazenar permissões em memória
  private _permissions: any[] = undefined;

  // Propriedade interna para armazenar roles em memória
  private _roles: any[] = undefined;

  async updateRole({ id, name, permissions }: { id: number, name: string, permissions: string[] }): Promise<any> {
    if (!this._roles) await this.getRoles();
    const idx = this._roles.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Role não encontrado');
    this._roles[idx] = { ...this._roles[idx], name, permissions };
    return this._roles[idx];
  }
}

// Export an instance of DatabaseStorage
export const storage = new DatabaseStorage();

// Criar um emissor de eventos para notificar sobre mudanças nos dados
export const dataChangeEmitter = new EventEmitter();

// Adicionar um listener para mudanças nos dados
export function listenForDataChanges(callback: () => void) {
  dataChangeEmitter.on('data-change', callback);
  return () => {
    dataChangeEmitter.off('data-change', callback);
  };
}

// Emitir evento de mudança nos dados
export function notifyDataChange() {
  console.log('[Storage] Notificando mudanças nos dados');
  dataChangeEmitter.emit('data-change');
}

// Adicionar chamadas para notifyDataChange em métodos críticos
const originalCreateEvent = DatabaseStorage.prototype.createEvent;
DatabaseStorage.prototype.createEvent = async function(...args) {
  const result = await originalCreateEvent.apply(this, args);
  notifyDataChange();
  return result;
};

const originalUpdateEvent = DatabaseStorage.prototype.updateEvent;
DatabaseStorage.prototype.updateEvent = async function(...args) {
  const result = await originalUpdateEvent.apply(this, args);
  notifyDataChange();
  return result;
};

const originalCreateOrder = DatabaseStorage.prototype.createOrder;
DatabaseStorage.prototype.createOrder = async function(...args) {
  const result = await originalCreateOrder.apply(this, args);
  notifyDataChange();
  return result;
};

const originalUpdateOrderStatus = DatabaseStorage.prototype.updateOrderStatus;
DatabaseStorage.prototype.updateOrderStatus = async function(...args) {
  const result = await originalUpdateOrderStatus.apply(this, args);
  notifyDataChange();
  return result;
};