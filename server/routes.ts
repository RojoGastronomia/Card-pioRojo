import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, notifyDataChange } from "./storage";
import { setupAuth, authenticateJWT, AuthenticatedRequest as AuthReq } from "./auth";
import { z } from "zod";
import { 
  insertEventSchema, 
  insertDishSchema, 
  insertOrderSchema, 
  insertMenuSchema, 
  InsertUser, 
  User,
  insertVenueSchema,
  insertRoomSchema
} from "shared/schema";
import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';
import { spawn } from 'child_process';
import logger from './logger';
import { getBasicStats } from "./basic-stats";
import { cache } from './cache';
import { validateInput, requireRole } from './middleware';
import { ROLES } from './config';
import { db } from './db';
import { settings } from './schema';
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constante para o papel de administrador
const ADMIN_ROLE = ROLES.ADMIN;

// Tipo para erros conhecidos
interface KnownError extends Error {
  code?: string;
  errors?: z.ZodIssue[];
}

// Estendendo o tipo importado para adicionar o método isAuthenticated
type AuthenticatedRequest = AuthReq & {
  isAuthenticated(): boolean;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Middleware isAdmin com tipos corretos
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    logger.info({
      path: req.path,
      method: req.method,
      auth: {
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        user: req.user ? {
          id: req.user.id,
          role: req.user.role,
          email: req.user.email
        } : 'undefined'
      },
      headers: {
        cookie: req.headers.cookie ? 'present' : 'missing'
      }
    }, 'Admin middleware check: Details');
    
    // Verificação estendida para debug
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      logger.warn({ ip: req.ip, path: req.path }, 'Admin middleware check: Not authenticated');
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user) {
      logger.warn({ ip: req.ip, path: req.path }, 'Admin middleware check: User object missing');
      return res.status(401).json({ message: "User data unavailable" });
    }
    
    // Verificar com mais tolerância o papel do administrador
    const adminRoles = ['Administrador', 'Admin', 'administrator', 'admin'];
    if (!adminRoles.includes(req.user.role)) {
      logger.warn({ userId: req.user.id, role: req.user.role, ip: req.ip, path: req.path }, 'Admin middleware check: User is not an admin');
      return res.status(403).json({ message: "Not authorized" });
    }
    
    logger.info({ userId: req.user.id, role: req.user.role, path: req.path }, 'Admin middleware check: Authorized admin access');
    next();
  };

  // Events routes
  app.get("/api/events", async (req: Request, res: Response) => {
    logger.info("[API] GET /api/events - Request received");
    try {
      const events = await cache.getOrSet(
        'events:all',
        () => storage.getAllEvents()
      );
      logger.info(`[API] GET /api/events - Found ${events.length} events`);
      res.json(events);
    } catch (err) {
      const error = err as KnownError;
      logger.error({ error: error.message, stack: error.stack }, "[API] GET /api/events - Error fetching events");
      res.status(500).json({ message: "Error fetching events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    const eventId = parseInt(req.params.id);
    logger.info({ eventId }, `[API] GET /api/events/${eventId} - Request received`);
    try {
      const event = await cache.getOrSet(
        `events:${eventId}`,
        () => storage.getEvent(eventId)
      );
      
      if (!event) {
        logger.warn({ eventId }, `[API] GET /api/events/${eventId} - Event not found`);
        return res.status(404).json({ message: "Event not found" });
      }
      
      logger.info({ eventId, eventTitle: event.title }, `[API] GET /api/events/${eventId} - Event found`);
      res.json(event);
    } catch (err) {
      const error = err as KnownError;
      logger.error({ eventId, error: error.message, stack: error.stack }, `[API] GET /api/events/${eventId} - Error fetching event`);
      res.status(500).json({ message: "Error fetching event" });
    }
  });

  app.post("/api/events", requireRole(ROLES.MANAGER), validateInput(insertEventSchema), async (req: Request, res: Response) => {
    try {
      const event = await storage.createEvent(req.body);
      await cache.invalidatePattern('events:');
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: "Error creating event" });
    }
  });

  app.put("/api/events/:id", requireRole(ROLES.MANAGER), validateInput(insertEventSchema), async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.updateEvent(eventId, req.body);
      if (!event) return res.status(404).json({ message: "Event not found" });
      await cache.invalidatePattern('events:');
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Error updating event" });
    }
  });

  app.delete("/api/events/:id", requireRole(ROLES.MANAGER), async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      await storage.deleteEvent(eventId);
      await cache.invalidatePattern('events:');
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting event" });
    }
  });

  // --- NEW: Routes for Event <-> Menu association ---
  app.get("/api/events/:eventId/menus", async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const menus = await storage.getMenusByEventId(eventId);
      res.json(menus);
    } catch (error) {
      res.status(500).json({ message: "Error fetching menus for event" });
    }
  });

  app.post("/api/events/:eventId/menus/:menuId", isAdmin, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const menuId = parseInt(req.params.menuId);
      await storage.associateMenuToEvent(eventId, menuId);
      res.status(201).send();
    } catch (error) {
      res.status(500).json({ message: "Error associating menu to event" });
    }
  });
  
  app.delete("/api/events/:eventId/menus/:menuId", isAdmin, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const menuId = parseInt(req.params.menuId);
      await storage.dissociateMenuFromEvent(eventId, menuId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error dissociating menu from event" });
    }
  });

  // --- NEW: Menu CRUD routes ---
  app.get("/api/menus", isAdmin, async (req: Request, res: Response) => {
    try {
      const menus = await storage.getAllMenus();
      res.json(menus);
    } catch (error) {
      res.status(500).json({ message: "Error fetching menus" });
    }
  });

  app.post("/api/menus", isAdmin, async (req: Request, res: Response) => {
    try {
      const menuData = insertMenuSchema.parse(req.body);
      const menu = await storage.createMenu(menuData);
      res.status(201).json(menu);
    } catch (error) {
      res.status(400).json({ message: "Invalid menu data" });
    }
  });

  app.put("/api/menus/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const menuId = parseInt(req.params.id);
      const menuData = insertMenuSchema.parse(req.body);
      const updatedMenu = await storage.updateMenu(menuId, menuData);
      if (!updatedMenu) return res.status(404).json({ message: "Menu not found" });
      res.json(updatedMenu);
    } catch (error) {
      res.status(400).json({ message: "Invalid menu data" });
    }
  });

  app.delete("/api/menus/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const menuId = parseInt(req.params.id);
      await storage.deleteMenu(menuId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting menu" });
    }
  });

  // --- UPDATED: Dish (formerly MenuItem) routes ---
  app.get("/api/dishes", isAdmin, async (req: Request, res: Response) => {
    try {
      const allDishes = await storage.getAllDishes();
      res.json(allDishes);
    } catch (error) {
      logger.error("Error fetching all dishes:", error);
      res.status(500).json({ message: "Error fetching dishes" });
    }
  });
  
  // Create a standalone dish without menu association
  app.post("/api/dishes", isAdmin, async (req: Request, res: Response) => {
    try {
      logger.info("[API] POST /api/dishes - Creating standalone dish");
      const dishData = insertDishSchema.parse(req.body);
      
      // Create dish without menuId
      const dish = await storage.createDish(dishData, null);
      
      logger.info(`[API] POST /api/dishes - Dish created with ID: ${dish.id}`);
      res.status(201).json(dish);
    } catch (error) {
      logger.error("[API] POST /api/dishes - Error creating dish:", error);
      res.status(400).json({ message: "Invalid dish data" });
    }
  });
  
  // Route to get dishes for a specific menu
  app.get("/api/menus/:menuId/dishes", async (req: Request, res: Response) => {
    try {
      const menuId = parseInt(req.params.menuId);
      const dishes = await storage.getDishesByMenuId(menuId);
      res.json(dishes);
    } catch (error) {
      logger.error("Error fetching dishes for menu:", error);
      res.status(500).json({ message: "Error fetching dishes for menu" });
    }
  });
  
  app.post("/api/menus/:menuId/dishes", isAdmin, async (req: Request, res: Response) => {
    try {
      const menuId = parseInt(req.params.menuId);
      const dishData = insertDishSchema.parse(req.body);
      const dish = await storage.createDish(dishData, menuId);
      res.status(201).json(dish);
    } catch (error) {
      res.status(400).json({ message: "Invalid dish data" });
    }
  });

  app.put("/api/dishes/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const dishId = parseInt(req.params.id);
      const dishData = insertDishSchema.parse(req.body);
      const updatedDish = await storage.updateDish(dishId, dishData);
      if (!updatedDish) return res.status(404).json({ message: "Dish not found" });
      res.json(updatedDish);
    } catch (error) {
      res.status(400).json({ message: "Invalid dish data" });
    }
  });

  app.delete("/api/dishes/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const dishId = parseInt(req.params.id);
      await storage.deleteDish(dishId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting dish" });
    }
  });

  // Associate existing dish with a menu
  app.post("/api/menus/:menuId/dishes/:dishId", isAdmin, async (req: Request, res: Response) => {
    try {
      const menuId = parseInt(req.params.menuId);
      const dishId = parseInt(req.params.dishId);
      
      // First check if both menu and dish exist
      const menu = await storage.getMenu(menuId);
      if (!menu) {
        return res.status(404).json({ message: "Menu not found" });
      }
      
      const dish = await storage.getDish(dishId);
      if (!dish) {
        return res.status(404).json({ message: "Dish not found" });
      }
      
      // Associate dish with menu
      const result = await storage.associateDishWithMenu(dishId, menuId);
      
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error associating dish with menu:", error);
      res.status(500).json({ message: "Error associating dish with menu" });
    }
  });
  
  // Get all menus that a dish is associated with
  app.get("/api/dishes/:dishId/menus", isAdmin, async (req: Request, res: Response) => {
    try {
      const dishId = parseInt(req.params.dishId);
      const menus = await storage.getMenusByDishId(dishId);
      res.json(menus);
    } catch (error) {
      logger.error("Error fetching menus for dish:", error);
      res.status(500).json({ message: "Error fetching menus for dish" });
    }
  });

  // Orders routes
  app.get("/api/orders", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    const reqStartTime = Date.now();
    const { status, searchTerm, userOnly } = req.query;
    
    const isAdmin = req.user.role === 'admin' || req.user.role === 'Administrador';
    const userId = req.user.id;
    
    logger.debug(`GET /api/orders requested by user ${userId} (admin: ${isAdmin}), filter: ${status || 'none'}, search: ${searchTerm || 'none'}, userOnly: ${userOnly || 'false'}`);
    
    try {
      // Determinar se devemos buscar todos os pedidos ou apenas os do usuário atual
      let orders;
      
      if (isAdmin && userOnly !== 'true') {
        // Admin vendo todos os pedidos (comportamento padrão)
        orders = await storage.getAllOrders();
        logger.info(`[API] GET /api/orders - Admin ${userId} retrieving all orders (${orders.length})`);
      } else {
        // Usuário normal ou admin com userOnly=true
        orders = await storage.getOrdersByUserId(userId);
        logger.info(`[API] GET /api/orders - User ${userId} retrieving their own orders (${orders.length})`);
      }
      
      // Aplicar filtros de status se especificado
      if (status && status !== 'all') {
        orders = orders.filter(order => order.status === status);
        logger.debug(`[API] GET /api/orders - Filtered by status ${status}, remaining: ${orders.length}`);
      }
      
      // Aplicar filtro de busca se especificado
      if (searchTerm) {
        const term = searchTerm.toString().toLowerCase();
        orders = orders.filter(order => 
          order.id.toString().includes(term) || 
          (order.menuSelection && order.menuSelection.toLowerCase().includes(term))
        );
        logger.debug(`[API] GET /api/orders - Filtered by search term ${term}, remaining: ${orders.length}`);
      }
      
      // Verificação final para garantir a segurança
      // Filtro secundário para garantir que usuários não-admin nunca vejam pedidos de outros usuários
      if (!isAdmin) {
        orders = orders.filter(order => order.userId === userId);
        logger.info(`[API] GET /api/orders - Final security filter applied for non-admin user ${userId}`);
      }

      // Verificação final
      if (!orders || orders.length === 0) {
        logger.warn("[API] GET /api/orders - Nenhum pedido encontrado após todas as tentativas");
      } else {
        logger.info(`[API] GET /api/orders - Retornando ${orders.length} pedidos`);
      }
      
      res.json(orders);
    } catch (error) {
      logger.error({ error }, "[API] GET /api/orders - Error fetching orders");
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if user is admin or if the order belongs to the user
      if (req.user.role !== "Administrador" && order.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  app.post("/api/orders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      console.log("Received order data:", JSON.stringify(req.body, null, 2));
      
      // Convert date string to Date object if necessary
      const orderData = {
        ...req.body,
        userId: req.user!.id, // Use non-null assertion as we've already checked isAuthenticated
        // Converter a string de data para objeto Date se necessário
        date: req.body.date instanceof Date ? req.body.date : new Date(req.body.date)
      };
      
      console.log("Validating order data:", JSON.stringify(orderData, null, 2));
      
      try {
        const validatedData = insertOrderSchema.parse(orderData);
        console.log("Validation successful:", JSON.stringify(validatedData, null, 2));
        
        const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
      } catch (validationError: any) {
        console.error("Validation error:", validationError);
        res.status(400).json({ 
          message: "Invalid order data",
          details: validationError.errors || validationError.message
        });
      }
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ message: "Error creating order" });
    }
  });

  app.put("/api/orders/:id/status", isAdmin, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = z.object({ status: z.string() }).parse(req.body);
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "Invalid status data" });
    }
  });

  // Payment endpoint
  app.post("/api/orders/:id/payment", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user owns the order
      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Check if order is in pending status
      if (order.status !== "pending") {
        return res.status(400).json({ 
          message: "Invalid order status",
          details: "Only pending orders can be paid"
        });
      }

      // Extract payment method and data from request
      const { paymentMethod, cardData, installments } = req.body;

      // Here you would integrate with a payment gateway
      // For now, we'll simulate a payment process based on the payment method
      const paymentIntent = {
        paymentIntentId: `pi_${Date.now()}`,
        clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
        amount: order.totalAmount,
        currency: "BRL",
        status: "requires_payment_method"
      };

      // Add method-specific data
      if (paymentMethod === "pix") {
        // In a real implementation, you'd generate an actual PIX QR code using a payment gateway
        // For simulation, we'll just return a sample QR code
        paymentIntent.pixQrCode = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png";
        paymentIntent.pixCopiaECola = "00020101021226830014br.gov.bcb.pix2561pix@exemplo.com.br5204000053039865802BR5921NOME DO RECEBEDOR6008BRASILIA62070503***6304E2CA";
        
        // In a real implementation, we might store this in a database
        global.pendingPixPayments = global.pendingPixPayments || {};
        global.pendingPixPayments[paymentIntent.paymentIntentId] = {
          orderId,
          status: "pending",
          createdAt: new Date()
        };
      } 
      else if (paymentMethod === "boleto") {
        // In a real implementation, you'd generate an actual boleto using a payment gateway
        // For simulation, we'll just simulate a boleto URL
        paymentIntent.boletoUrl = `https://exemplo.com/boletos/simulado-${orderId}-${Date.now()}.pdf`;
        paymentIntent.boletoNumber = `34191.12345 67890.101112 13141.516171 8 ${Math.floor(Math.random() * 10000000000)}`;
      }
      else if (paymentMethod === "credit-card") {
        // In a real implementation, you'd process the card with a payment gateway
        // Here we'll just acknowledge we received the card data
        paymentIntent.last4 = cardData?.number?.slice(-4) || "****";
        paymentIntent.installments = installments || 1;
      }

      // Return payment intent/session data
      res.json(paymentIntent);
    } catch (error) {
      console.error("Payment error:", error);
      res.status(500).json({ message: "Error processing payment" });
    }
  });

  // Payment confirmation endpoint
  app.post("/api/orders/:id/payment/confirm", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const orderId = parseInt(req.params.id);
      const { paymentIntentId } = z.object({ paymentIntentId: z.string() }).parse(req.body);
      
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user owns the order
      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Here you would verify the payment with the payment gateway
      // For now, we'll simulate a successful payment
      
      // If this was a PIX payment, update the status
      if (global.pendingPixPayments && global.pendingPixPayments[paymentIntentId]) {
        global.pendingPixPayments[paymentIntentId].status = "paid";
      }
      
      // Update order status to confirmed
      const updatedOrder = await storage.updateOrderStatus(orderId, "confirmed");
      
      res.json({
        order: updatedOrder,
        payment: {
          id: paymentIntentId,
          status: "succeeded"
        }
      });
    } catch (error) {
      console.error("Payment confirmation error:", error);
      res.status(500).json({ message: "Error confirming payment" });
    }
  });

  // Payment status check endpoint (for PIX payments)
  app.get("/api/orders/:id/payment/status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const orderId = parseInt(req.params.id);
      const { paymentIntentId } = z.object({ paymentIntentId: z.string() }).parse(req.query);
      
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user owns the order
      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // In a real implementation, you would check the payment status with the payment gateway
      // For our simulation, we'll randomly change the status to paid after a few seconds
      
      let status = "pending";
      
      // Check our simulated payment storage
      if (global.pendingPixPayments && global.pendingPixPayments[paymentIntentId]) {
        const pixPayment = global.pendingPixPayments[paymentIntentId];
        
        // For simulation: If the payment has been pending for more than 10 seconds,
        // randomly mark it as paid with a 30% chance
        if (pixPayment.status === "pending") {
          const elapsedTime = new Date().getTime() - pixPayment.createdAt.getTime();
          if (elapsedTime > 10000 && Math.random() < 0.3) {
            pixPayment.status = "paid";
            
            // Also update the order status
            await storage.updateOrderStatus(orderId, "confirmed");
          }
        }
        
        status = pixPayment.status;
      }
      
      res.json({
        status,
        orderId,
        paymentIntentId
      });
    } catch (error) {
      console.error("Payment status check error:", error);
      res.status(500).json({ message: "Error checking payment status" });
    }
  });

  // Users routes (admin only)
  app.get("/api/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/users/:id/history", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const orders = await storage.getOrdersByUserId(userId);
      
      // Buscar os detalhes dos eventos para cada ordem
      const history = await Promise.all(
        orders.map(async (order) => {
          const event = await storage.getEvent(order.eventId);
          return {
            ...order,
            event
          };
        })
      );
      
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user history" });
    }
  });

  app.delete("/api/users/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Não permitir deletar o próprio usuário
      if (req.user.id === userId) {
        return res.status(400).json({ message: "Cannot delete your own user account" });
      }

      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  // Update user route
  app.put("/api/users/:id", isAdmin, async (req: Request, res: Response) => {
    logger.fatal("====== ENTERED PUT /api/users/:id ROUTE ======");
    // isAdmin garante req.user
    const targetUserId = parseInt(req.params.id);
    const adminUserId = req.user!.id;
    logger.info({ adminUserId, targetUserId, body: req.body }, `[API] PUT /api/users/${targetUserId} - Request received`);

    try {
      if (adminUserId === targetUserId && req.body.role && req.body.role !== req.user!.role) {
        logger.warn({ adminUserId, targetUserId }, `[API] PUT /api/users/${targetUserId} - Attempt to change own role denied`);
        return res.status(400).json({ message: "Cannot change your own role" });
      }

      const { password, ...userData } = req.body;
      const updateData: Partial<InsertUser> = password ? { ...userData, password } : userData;
      
      const updatedUser = await storage.updateUser(targetUserId, updateData);

      if (!updatedUser) {
        logger.warn({ adminUserId, targetUserId }, `[API] PUT /api/users/${targetUserId} - User not found`);
        return res.status(404).json({ message: "User not found" });
      }

      logger.info({ adminUserId, targetUserId, updatedFields: Object.keys(updateData) }, `[API] PUT /api/users/${targetUserId} - User updated successfully`);
      res.json(updatedUser);

    } catch (err) {
      const error = err as KnownError;
      if (error instanceof z.ZodError) {
          logger.warn({ adminUserId, targetUserId, error: error.errors }, "[API] PUT /api/users - Invalid user data (Zod)");
          res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
         logger.error({ adminUserId, targetUserId, error: error.message, stack: error.stack }, `[API] PUT /api/users/${targetUserId} - Error updating user`);
         res.status(500).json({ message: "Error updating user" });
      }
    }
  });

  // Master System Management routes
  app.post("/api/admin/system/backup", isAdmin, async (req: Request, res: Response) => {
    try {
      await storage.performSystemBackup();
      res.json({ message: "Backup realizado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao realizar backup" });
    }
  });

  app.get("/api/admin/system/logs", isAdmin, async (req: Request, res: Response) => {
    try {
      const logs = await storage.getSystemLogs();
      res.json(logs);
    } catch (err) {
      const error = err as Error; // Type assertion simples
      logger.error({ error: error.message, stack: error.stack }, "[API] GET /api/admin/system/logs - Error fetching logs");
      res.status(500).json({ message: "Erro ao buscar logs" });
    }
  });

  app.post("/api/admin/system/settings", isAdmin, async (req: Request, res: Response) => {
    try {
      await storage.updateSystemSettings(req.body);
      res.json({ message: "Configurações atualizadas com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar configurações" });
    }
  });

  // Access Control routes
  app.get("/api/admin/access/permissions", isAdmin, async (req: Request, res: Response) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar permissões" });
    }
  });

  app.get("/api/admin/access/roles", isAdmin, async (req: Request, res: Response) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar roles" });
    }
  });

  app.post("/api/admin/access/tokens", isAdmin, async (req: Request, res: Response) => {
    try {
      const token = await storage.generateApiToken(req.body);
      res.json(token);
    } catch (error) {
      res.status(500).json({ message: "Erro ao gerar token" });
    }
  });

  // Database Management routes
  app.post("/api/admin/database/backup", isAdmin, async (req: Request, res: Response) => {
    try {
      await storage.performDatabaseBackup();
      res.json({ message: "Backup do banco realizado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao realizar backup do banco" });
    }
  });

  app.post("/api/admin/database/optimize", isAdmin, async (req: Request, res: Response) => {
    try {
      await storage.optimizeDatabase();
      res.json({ message: "Banco otimizado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao otimizar banco" });
    }
  });

  app.post("/api/admin/database/maintenance", isAdmin, async (req: Request, res: Response) => {
    try {
      await storage.performDatabaseMaintenance();
      res.json({ message: "Manutenção realizada com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao realizar manutenção" });
    }
  });

  // Monitoring routes
  app.get("/api/admin/system/performance", isAdmin, async (req: Request, res: Response) => {
    try {
      const metrics = await storage.getSystemPerformance();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar métricas" });
    }
  });

  app.get("/api/admin/system/resources", isAdmin, async (req: Request, res: Response) => {
    try {
      const resources = await storage.getSystemResources();
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar recursos" });
    }
  });

  app.get("/api/admin/system/alerts", isAdmin, async (req: Request, res: Response) => {
    try {
      const alerts = await storage.getSystemAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar alertas" });
    }
  });

  // Advanced Tools routes
  app.post("/api/admin/tools/console", isAdmin, async (req: Request, res: Response) => {
    try {
      const result = await storage.executeConsoleCommand(req.body.command);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Erro ao executar comando" });
    }
  });

  app.post("/api/admin/tools/cache", isAdmin, async (req: Request, res: Response) => {
    try {
      await storage.manageCacheOperation(req.body);
      res.json({ message: "Operação de cache realizada com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro na operação de cache" });
    }
  });

  app.post("/api/admin/tools/indexing", isAdmin, async (req: Request, res: Response) => {
    try {
      await storage.performIndexing(req.body);
      res.json({ message: "Indexação realizada com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao realizar indexação" });
    }
  });

  // Stats routes (admin only)
  app.get("/api/stats", isAdmin, async (req: Request, res: Response) => {
    try {
      const adminId = req.user?.id;
      logger.info({ userId: adminId }, "[API] GET /api/stats - Request received from admin");
      
      // Extrair parâmetros de data da query
      const startDate = req.query.startDate as string || '';
      const endDate = req.query.endDate as string || '';
      
      logger.info({ userId: adminId, filters: { startDate, endDate } }, "[API] GET /api/stats - Processing request with filters");
      
      // Converter para objetos Date com tratamento de erro
      let startDateObj, endDateObj;
      
      try {
        startDateObj = startDate ? new Date(startDate) : new Date(0);
        if (isNaN(startDateObj.getTime())) {
          logger.warn({ startDate }, "[API] GET /api/stats - Invalid start date, using default");
          startDateObj = new Date(0); // Data mínima como fallback
        }
      } catch (err) {
        logger.warn({ startDate, error: err }, "[API] GET /api/stats - Error parsing start date, using default");
        startDateObj = new Date(0); // Data mínima como fallback
      }
      
      try {
        endDateObj = endDate ? new Date(endDate) : new Date();
        if (isNaN(endDateObj.getTime())) {
          logger.warn({ endDate }, "[API] GET /api/stats - Invalid end date, using default");
          endDateObj = new Date(); // Data atual como fallback
        }
      } catch (err) {
        logger.warn({ endDate, error: err }, "[API] GET /api/stats - Error parsing end date, using default");
        endDateObj = new Date(); // Data atual como fallback
      }
      
      // Ajustar a data final para o final do dia
      endDateObj.setHours(23, 59, 59, 999);
      
      // Log para debug
      logger.info({
        parsedDates: {
          startDate: startDateObj.toISOString(),
          endDate: endDateObj.toISOString()
        }
      }, "[API] GET /api/stats - Parsed date filters");
      
      try {
        // Buscar dados estatísticos reais
      const totalEvents = await storage.getEventCount();
      const totalUsers = await storage.getUserCount();
      const totalOrders = await storage.getOrderCount();
      const totalRevenue = await storage.getTotalRevenue();
      
        logger.info({ 
        totalEvents,
        totalUsers,
        totalOrders,
        totalRevenue,
          dateFilter: { 
            startDate: startDateObj.toISOString(),
            endDate: endDateObj.toISOString() 
          }
        }, "[API] GET /api/stats - Base stats collected");
        
        // Buscar eventos recentes de verdade
        const recentEvents = await storage.getAllEvents();
        logger.info({ eventCount: recentEvents.length }, "[API] GET /api/stats - Events retrieved");
        
        // Filtrar eventos pelo período de data com tratamento de erro
        const filteredEvents = recentEvents.filter(event => {
          try {
            const eventDate = new Date(event.date);
            return !isNaN(eventDate.getTime()) && 
                  eventDate >= startDateObj && 
                  eventDate <= endDateObj;
          } catch (err) {
            logger.warn({ eventId: event.id, date: event.date }, "[API] GET /api/stats - Invalid event date, excluding from filter");
            return false;
          }
        });
        
        // Ordenar eventos por data (mais recentes primeiro)
        const sortedEvents = filteredEvents
          .sort((a, b) => {
            try {
              return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
            } catch (err) {
              return 0; // Em caso de erro, não muda a ordem
            }
          })
          .slice(0, 5); // Limitar a 5 eventos
        
        // Buscar todas as ordens para análise
        const allOrders = await storage.getAllOrders();
        
        // Filtrar ordens pelo período de data com tratamento de erro
        const filteredOrders = allOrders.filter(order => {
          try {
            const orderDate = new Date(order.createdAt || order.date);
            return !isNaN(orderDate.getTime()) && 
                  orderDate >= startDateObj && 
                  orderDate <= endDateObj;
          } catch (err) {
            logger.warn({ orderId: order.id, date: order.createdAt }, "[API] GET /api/stats - Invalid order date, excluding from filter");
            return false;
          }
        });
        
        logger.info({ 
          orderCount: allOrders.length,
          filteredOrderCount: filteredOrders.length,
          dateFilter: { 
            startDate: startDateObj.toISOString(),
            endDate: endDateObj.toISOString()
          }
        }, "[API] GET /api/stats - Orders retrieved and filtered");
        
        // Calcular eventos por mês
        const now = new Date();
        const currentYear = now.getFullYear();
        const eventsPerMonth = [];
        
        // Mapeia meses 0-11 para nomes de meses
        const monthNames = [
          'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        
        // Criar contagem de eventos por mês com tratamento de erro
        for (let month = 0; month < 12; month++) {
          // Filtrar ordens criadas no mês atual
          const ordersInMonth = filteredOrders.filter(order => {
            try {
              const orderDate = new Date(order.createdAt || order.date);
              return !isNaN(orderDate.getTime()) &&
                    orderDate.getMonth() === month && 
                    orderDate.getFullYear() === currentYear;
            } catch (err) {
              return false;
            }
          });
          
          eventsPerMonth.push({
            month: monthNames[month],
            count: ordersInMonth.length
          });
        }
        
        // Calcular distribuição por tipo de evento com tratamento de erro
        const eventTypes = filteredEvents.reduce((acc, event) => {
          try {
            const type = event.eventType || 'Other';
            acc[type] = (acc[type] || 0) + 1;
          } catch (err) {
            logger.warn({ eventId: event.id }, "[API] GET /api/stats - Error processing event type");
          }
          return acc;
        }, {} as Record<string, number>);
        
        const eventCategories = Object.entries(eventTypes).map(([name, count]) => ({
          name,
          count
        }));
        
        // Adicionar últimos pedidos para ter informações mais detalhadas
        const recentOrders = filteredOrders
          .sort((a, b) => {
            try {
              return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
            } catch (err) {
              return 0;
            }
          })
          .slice(0, 5); // Limitar a 5 pedidos recentes
        
        // Calcular valor total dos pedidos filtrados
        const filteredRevenue = filteredOrders.reduce((sum, order) => {
          return sum + (order.totalAmount || 0);
        }, 0);
        
        // Criar objeto de estatísticas com dados reais
        const stats = {
          totalEvents: filteredEvents.length,
          totalUsers,
          totalOrders: filteredOrders.length,
          totalRevenue: filteredRevenue,
          recentEvents: sortedEvents,
          recentOrders,
          eventsPerMonth,
          eventCategories,
          timestamp: new Date().toISOString(), 
          dateFilter: { 
            startDate: startDateObj.toISOString(),
            endDate: endDateObj.toISOString() 
          },
          serverInfo: {
            memory: process.memoryUsage(),
            uptime: process.uptime()
          }
        };
        
        logger.info({ 
          statsDataSent: true,
          filteredDataPoints: filteredOrders.length
        }, "[API] GET /api/stats - Sending statistics data to client");
      res.json(stats);
      } catch (dbError) {
        logger.error({
          error: dbError instanceof Error ? {
            message: dbError.message,
            stack: dbError.stack,
            name: dbError.name
          } : String(dbError),
          step: "database_operations"
        }, "[API] GET /api/stats - Error during database operations");
        
        throw dbError; // Re-lançar para tratamento global
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      logger.error({ 
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : String(error) 
      }, "[API] GET /api/stats - Error fetching statistics");
      
      res.status(500).json({ 
        message: "Error fetching stats", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Rota para estatísticas básicas - agora com verificações explícitas
  app.get("/api/basic-stats", isAdmin, async (req: Request, res: Response) => {
    const adminId = req.user?.id;
    logger.info({ 
      userId: adminId, 
      query: req.query, 
      timestamp: new Date().toISOString() 
    }, "[API] GET /api/basic-stats - Request received");

    const startTime = Date.now();

    try {
      // Tentar obter estatísticas básicas
      logger.info("[API] GET /api/basic-stats - Recuperando estatísticas");
      let basicStats = await getBasicStats();
      
      // VERIFICAÇÃO CRÍTICA: Se não houver pedidos recentes, carregar pedidos garantidos
      if (!basicStats.recentOrders || basicStats.recentOrders.length === 0) {
        logger.warn("[API] GET /api/basic-stats - Nenhum pedido encontrado, buscando pedidos garantidos");
        
        // Usar pedidos garantidos como fallback
        const confirmedOrders = await storage.getConfirmedOrders();
        logger.info(`[API] GET /api/basic-stats - Encontrados ${confirmedOrders.length} pedidos garantidos`);
        
        // Atualizar estatísticas com pedidos garantidos
        basicStats.recentOrders = confirmedOrders;
        
        // Recalcular contagens de status
        const pendingCount = confirmedOrders.filter(o => o.status === 'pending').length;
        const confirmedCount = confirmedOrders.filter(o => o.status === 'confirmed').length;
        const completedCount = confirmedOrders.filter(o => o.status === 'completed').length;
        
        basicStats.ordersByStatus = {
          pending: pendingCount,
          confirmed: confirmedCount,
          completed: completedCount,
          total: confirmedOrders.length
        };
        
        logger.info("[API] GET /api/basic-stats - Estatísticas atualizadas com pedidos garantidos");
      }
      
      // Verificar detalhamento dos pedidos para debug
      logger.info(`[API] GET /api/basic-stats - Eventos recentes: ${basicStats.recentEvents?.length || 0}`);
      logger.info(`[API] GET /api/basic-stats - Pedidos recentes: ${basicStats.recentOrders?.length || 0}`);
      
      // Log detalhado do primeiro evento e pedido para verificação
      if (basicStats.recentEvents && basicStats.recentEvents.length > 0) {
        const firstEvent = basicStats.recentEvents[0];
        logger.info(`[API] Exemplo primeiro evento: ID=${firstEvent.id}, Título=${firstEvent.title}`);
      }
      
      if (basicStats.recentOrders && basicStats.recentOrders.length > 0) {
        const firstOrder = basicStats.recentOrders[0];
        logger.info(`[API] Exemplo primeiro pedido: ID=${firstOrder.id}, Status=${firstOrder.status}, Valor=${firstOrder.totalAmount}`);
      }
      
      // Log de dados para os gráficos
      logger.info(`[API] Dados de gráficos - EventsPerMonth: ${JSON.stringify(basicStats.eventsPerMonth?.slice(0, 3))}...`);
      logger.info(`[API] Dados de gráficos - EventCategories: ${JSON.stringify(basicStats.eventCategories)}`);
      
      // Calcular tempo de processamento
      const processingTime = Date.now() - startTime;
      logger.info(`[API] GET /api/basic-stats - Processamento concluído em ${processingTime}ms`);
      
      // Garantir timestamp atualizado
      basicStats.timestamp = new Date().toISOString();
      
      // Enviar resposta
      res.json(basicStats);
    } catch (err) {
      const error = err as KnownError;
      logger.error({ 
        userId: adminId, 
        error: error.message, 
        stack: error.stack 
      }, "[API] GET /api/basic-stats - Error retrieving stats");
      
      res.status(500).json({ 
        message: "Error retrieving stats",
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  // Rota simplificada para estatísticas - sem autenticação
  app.get("/api/stats-simple", async (req: Request, res: Response) => {
    logger.info({ 
      query: req.query, 
      timestamp: new Date().toISOString() 
    }, "[API] GET /api/stats-simple - Request received");

    const startTime = Date.now();

    try {
      // Obter estatísticas básicas
      logger.info("[API] GET /api/stats-simple - Recuperando estatísticas simplificadas");
      let basicStats = await getBasicStats();
      
      // Log detalhado para diagnóstico
      logger.info({
        revenue: {
          total: basicStats.totalRevenue,
          potential: basicStats.confirmedOrdersRevenue
        },
        orders: {
          total: basicStats.totalOrders,
          byStatus: basicStats.ordersByStatus
        }
      }, "[API] GET /api/stats-simple - Detalhes dos valores financeiros");
      
      // VERIFICAÇÃO CRÍTICA: Se não houver pedidos recentes, carregar pedidos garantidos
      if (!basicStats.recentOrders || basicStats.recentOrders.length === 0) {
        logger.warn("[API] GET /api/stats-simple - Nenhum pedido encontrado, buscando pedidos garantidos");
        
        // Usar pedidos garantidos como fallback
        const confirmedOrders = await storage.getConfirmedOrders();
        logger.info(`[API] GET /api/stats-simple - Encontrados ${confirmedOrders.length} pedidos garantidos`);
        
        // Atualizar estatísticas com pedidos garantidos
        basicStats.recentOrders = confirmedOrders;
        
        // Recalcular contagens de status
        const pendingCount = confirmedOrders.filter(o => o.status === 'pending').length;
        const confirmedCount = confirmedOrders.filter(o => o.status === 'confirmed').length;
        const completedCount = confirmedOrders.filter(o => o.status === 'completed').length;
        
        basicStats.ordersByStatus = {
          pending: pendingCount,
          confirmed: confirmedCount,
          completed: completedCount,
          total: confirmedOrders.length
        };
        
        // Recalcular receitas potenciais baseadas nos pedidos garantidos
        const pendingRevenue = confirmedOrders
          .filter(o => o.status === 'pending')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        const confirmedRevenue = confirmedOrders
          .filter(o => o.status === 'confirmed')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        const completedRevenue = confirmedOrders
          .filter(o => o.status === 'completed')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        // Atualizar valores financeiros
        basicStats.totalRevenue = completedRevenue;
        basicStats.confirmedOrdersRevenue = pendingRevenue + confirmedRevenue;
        
        logger.info({
          updatedRevenue: {
            completed: completedRevenue,
            confirmed: confirmedRevenue,
            pending: pendingRevenue,
            total: completedRevenue,
            potential: pendingRevenue + confirmedRevenue
          }
        }, "[API] GET /api/stats-simple - Valores financeiros recalculados");
      }
      
      // Adicionar informações simplificadas
      const simplifiedStats = {
        totalEvents: basicStats.totalEvents || 0,
        totalUsers: basicStats.totalUsers || 0,
        totalOrders: basicStats.totalOrders || 0,
        totalRevenue: basicStats.totalRevenue || 0,
        potentialRevenue: basicStats.confirmedOrdersRevenue || 0,
        recentOrders: basicStats.recentOrders || [],
        ordersByStatus: basicStats.ordersByStatus || { pending: 0, confirmed: 0, completed: 0, total: 0 },
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      };
      
      logger.info({ 
        statsDataSent: true,
        ordersCount: simplifiedStats.recentOrders.length,
        revenue: {
          realized: simplifiedStats.totalRevenue,
          potential: simplifiedStats.potentialRevenue
        },
        processingTime: simplifiedStats.processingTime
      }, "[API] GET /api/stats-simple - Enviando estatísticas simplificadas");
      
      res.json(simplifiedStats);
    } catch (err) {
      const error = err as KnownError;
      logger.error({ 
        error: error.message, 
        stack: error.stack 
      }, "[API] GET /api/stats-simple - Error retrieving stats");
      
      res.status(500).json({ 
        message: "Error retrieving simplified stats",
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  // Backup endpoint
  app.post("/api/backup", isAdmin, async (req: Request, res: Response) => { 
    console.log('=== BACKUP ENDPOINT CHAMADO ===');
    const userId = req.user!.id;
    logger.info({ userId }, '[API] POST /api/backup - Backup requested');
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        logger.error('[API] POST /api/backup - DATABASE_URL not set');
        throw new Error('DATABASE_URL environment variable is not set.');
      }

      const backupDir = path.resolve(__dirname, 'backups');
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const backupFilename = `backup-${timestamp}.sql`;
      const backupPath = path.join(backupDir, backupFilename);

      // Ensure backup directory exists
      try {
        await fs.access(backupDir);
        logger.debug(`[API] POST /api/backup - Backup directory exists: ${backupDir}`);
      } catch (error) {
        logger.info(`[API] POST /api/backup - Creating backup directory: ${backupDir}`);
        await fs.mkdir(backupDir, { recursive: true });
      }

      // Execute backup command usando spawn para compatibilidade com Windows
      await new Promise((resolve, reject) => {
        const backupProcess = spawn('pg_dump', [dbUrl], { shell: true });
        const writeStream = fs.createWriteStream(backupPath);

        backupProcess.stdout.pipe(writeStream);

        let stderrData = '';
        backupProcess.stderr.on('data', (data) => {
          stderrData += data.toString();
        });

        backupProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            console.error('STDERR do backup:', stderrData);
            reject(new Error(`Erro ao executar backup: ${stderrData}`));
          }
        });

        backupProcess.on('error', (err) => {
          console.error('ERRO AO EXECUTAR COMANDO DE BACKUP:', err);
          reject(new Error(`Erro ao executar backup: ${err.message}`));
        });
      });

      // Verificar se o arquivo foi criado
      const stats = await fs.stat(backupPath);
      if (!stats.isFile()) {
        throw new Error('Arquivo de backup não foi criado corretamente');
      }

      // Limpar backups antigos (manter apenas os últimos 5)
      const files = await fs.readdir(backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
        .sort()
        .reverse();
      
      if (backupFiles.length > 5) {
        const filesToDelete = backupFiles.slice(5);
        for (const file of filesToDelete) {
          await fs.unlink(path.join(backupDir, file));
          logger.info(`[API] POST /api/backup - Deleted old backup: ${file}`);
        }
      }

      res.json({ 
        message: "Backup criado com sucesso",
        filename: backupFilename,
        size: stats.size,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('ERRO AO CRIAR BACKUP:', error);
      logger.error({ error }, '[API] POST /api/backup - Backup failed');
      res.status(500).json({ 
        message: "Erro ao criar backup",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Delete order endpoint (admin only)
  app.delete("/api/orders/:id", isAdmin, async (req: Request, res: Response) => {
    const orderId = parseInt(req.params.id);
    const adminId = req.user?.id;
    
    console.log(`[DEBUG-ROUTES] Received DELETE request for order ID: ${orderId} from admin ${adminId}`);
    console.log(`[DEBUG-ROUTES] Request params:`, req.params);
    
    if (isNaN(orderId)) {
      console.log(`[DEBUG-ROUTES] Invalid order ID (not a number): ${req.params.id}`);
      return res.status(400).json({ message: "Invalid order ID" });
    }
    
    try {
      logger.info({ orderId, adminId }, "[API] Attempting to delete order");
      
      // Verify order exists before attempting deletion
      const order = await storage.getOrder(orderId);
      if (!order) {
        console.log(`[DEBUG-ROUTES] Order with ID ${orderId} not found, cannot delete`);
        logger.warn({ orderId, adminId }, "[API] Delete order failed - order not found");
        return res.status(404).json({ message: "Order not found" });
      }
      
      console.log(`[DEBUG-ROUTES] Order found, proceeding with deletion. Order:`, JSON.stringify(order, null, 2));
      
      // Perform deletion
      await storage.deleteOrder(orderId);
      
      // Force invalidation of any cache
      notifyDataChange(); // Notificar mudanças nos dados para atualizar SSE e outros caches
      
      console.log(`[DEBUG-ROUTES] Order deletion successful for ID: ${orderId}`);
      logger.info({ orderId, adminId }, "[API] Order deleted successfully");
      
      return res.json({ 
        success: true, 
        message: "Order deleted successfully",
        orderId: orderId
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[DEBUG-ROUTES] Error deleting order ${orderId}:`, error);
      logger.error({ orderId, adminId, error: errorMessage }, "[API] Error deleting order");
      
      return res.status(500).json({ 
        success: false,
        message: "Failed to delete order", 
        error: errorMessage
      });
    }
  });

  app.put("/api/orders/:id/admin-notes", isAdmin, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { notes } = req.body;
      // Usa apelido, username ou nome do admin logado
      const adminName = req.user?.apelido || req.user?.username || req.user?.name || "Administrador";
      if (typeof notes !== "string" || !notes.trim()) {
        return res.status(400).json({ message: "Notes must be a non-empty string" });
      }
      // Buscar o pedido atual
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      // Parse do histórico atual
      let notesArr = [];
      if (order.adminNotes) {
        try {
          if (order.adminNotes.trim().startsWith('[')) {
            notesArr = JSON.parse(order.adminNotes);
          } else if (order.adminNotes.trim().length > 0) {
            // Só converte string simples para array uma vez
            notesArr = [{ text: order.adminNotes, author: adminName, date: null }];
          }
          if (!Array.isArray(notesArr)) notesArr = [];
        } catch {
          notesArr = [];
        }
      }
      // Adicionar nova observação
      notesArr.push({
        text: notes,
        author: adminName,
        date: new Date().toISOString()
      });
      // Salvar de volta como string JSON
      const updatedOrder = await storage.updateOrderAdminNotes(orderId, JSON.stringify(notesArr));
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Error updating admin notes" });
    }
  });

  // --- Settings: Garçom Price ---
  app.get("/api/settings/garcom_price", async (req: Request, res: Response) => {
    try {
      const [row] = await db.select().from(settings).where(eq(settings.key, 'garcom_price'));
      if (!row) return res.status(404).json({ message: "Configuração não encontrada" });
      res.json({ value: row.value });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar valor do garçom" });
    }
  });

  app.put("/api/settings/garcom_price", async (req: Request, res: Response) => {
    try {
      const { value } = req.body;
      if (!value || isNaN(Number(value))) return res.status(400).json({ message: "Valor inválido" });
      await db.insert(settings)
        .values({ key: 'garcom_price', value: String(value) })
        .onConflictDoUpdate({ target: settings.key, set: { value: String(value) } });
      res.json({ value: String(value) });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar valor do garçom" });
    }
  });

  // --- Venues Routes ---
  app.get("/api/venues", async (req: Request, res: Response) => {
    try {
      const venues = await storage.getAllVenues();
      res.json(venues);
    } catch (error) {
      logger.error("Error fetching venues:", error);
      res.status(500).json({ message: "Error fetching venues" });
    }
  });

  app.get("/api/venues/:id", async (req: Request, res: Response) => {
    try {
      const venueId = parseInt(req.params.id);
      const venue = await storage.getVenue(venueId);
      
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      
      res.json(venue);
    } catch (error) {
      logger.error("Error fetching venue:", error);
      res.status(500).json({ message: "Error fetching venue" });
    }
  });

  app.post("/api/venues", isAdmin, validateInput(insertVenueSchema), async (req: Request, res: Response) => {
    try {
      const venue = await storage.createVenue(req.body);
      res.status(201).json(venue);
    } catch (error) {
      logger.error("Error creating venue:", error);
      res.status(500).json({ message: "Error creating venue" });
    }
  });

  app.put("/api/venues/:id", isAdmin, validateInput(insertVenueSchema), async (req: Request, res: Response) => {
    try {
      const venueId = parseInt(req.params.id);
      const venue = await storage.updateVenue(venueId, req.body);
      
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      
      res.json(venue);
    } catch (error) {
      logger.error("Error updating venue:", error);
      res.status(500).json({ message: "Error updating venue" });
    }
  });

  app.delete("/api/venues/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const venueId = parseInt(req.params.id);
      await storage.deleteVenue(venueId);
      res.status(204).send();
    } catch (error) {
      logger.error("Error deleting venue:", error);
      res.status(500).json({ message: "Error deleting venue" });
    }
  });

  // --- Rooms Routes ---
  app.get("/api/venues/:venueId/rooms", async (req: Request, res: Response) => {
    try {
      const venueId = parseInt(req.params.venueId);
      const rooms = await storage.getRoomsByVenueId(venueId);
      res.json(rooms);
    } catch (error) {
      logger.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Error fetching rooms" });
    }
  });

  app.get("/api/rooms/:id", async (req: Request, res: Response) => {
    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      res.json(room);
    } catch (error) {
      logger.error("Error fetching room:", error);
      res.status(500).json({ message: "Error fetching room" });
    }
  });

  app.post("/api/venues/:venueId/rooms", isAdmin, validateInput(insertRoomSchema), async (req: Request, res: Response) => {
    try {
      const venueId = parseInt(req.params.venueId);
      const room = await storage.createRoom(venueId, req.body);
      res.status(201).json(room);
    } catch (error) {
      logger.error("Error creating room:", error);
      res.status(500).json({ message: "Error creating room" });
    }
  });

  app.put("/api/rooms/:id", isAdmin, validateInput(insertRoomSchema), async (req: Request, res: Response) => {
    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.updateRoom(roomId, req.body);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      res.json(room);
    } catch (error) {
      logger.error("Error updating room:", error);
      res.status(500).json({ message: "Error updating room" });
    }
  });

  app.delete("/api/rooms/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const roomId = parseInt(req.params.id);
      await storage.deleteRoom(roomId);
      res.status(204).send();
    } catch (error) {
      logger.error("Error deleting room:", error);
      res.status(500).json({ message: "Error deleting room" });
    }
  });

  const server = createServer(app);
  logger.info('Routes registered and server created');
  return server;
}
