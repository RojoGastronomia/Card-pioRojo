import { pgTable, text, serial, integer, timestamp, boolean, doublePrecision, json, varchar, primaryKey, numeric } from "drizzle-orm/pg-core"; "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("client"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  username: z.string(),
  password: z.string(),
  role: z.string().default("client"),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const insertUserSchema = userSchema.omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  location: text("location"),
  eventType: text("event_type").notNull(),
  menuOptions: integer("menu_options").notNull().default(2),
  status: text("status").notNull().default("available"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Menus table
export const menus = pgTable("menus", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  image_url: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMenuSchema = createInsertSchema(menus).omit({ id: true, createdAt: true });
export type InsertMenu = typeof menus.$inferInsert;
export type Menu = typeof menus.$inferSelect;

// Dishes table
export const dishes = pgTable("dishes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  category: text("category").notNull(),
  menuId: integer("menu_id"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDishSchema = createInsertSchema(dishes).omit({ id: true, createdAt: true, menuId: true });
export type InsertDish = z.infer<typeof insertDishSchema>;
export type Dish = typeof dishes.$inferSelect;

// EventMenus join table
export const eventMenus = pgTable("event_menus", {
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  menuId: integer("menu_id").notNull().references(() => menus.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.eventId, table.menuId] })
}));

// Menu Dishes join table
export const menuDishes = pgTable("menu_dishes", {
  menuId: integer("menu_id").notNull().references(() => menus.id, { onDelete: 'cascade' }),
  dishId: integer("dish_id").notNull().references(() => dishes.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.menuId, table.dishId] })
}));

// Dishes relation to Menus (Many-to-One)
export const dishesRelations = relations(dishes, ({ one, many }) => ({
  menu: one(menus, {
    fields: [dishes.menuId],
    references: [menus.id],
  }),
  menuDishes: many(menuDishes)
}));

// Menus relations to Dishes (One-to-Many) and EventMenus (Many-to-Many)
export const menusRelations = relations(menus, ({ many }) => ({
  dishes: many(dishes),
  menuDishes: many(menuDishes),
  eventMenus: many(eventMenus),
}));

// Menu Dishes relations
export const menuDishesRelations = relations(menuDishes, ({ one }) => ({
  menu: one(menus, {
    fields: [menuDishes.menuId],
    references: [menus.id],
  }),
  dish: one(dishes, {
    fields: [menuDishes.dishId],
    references: [dishes.id],
  }),
}));

// Events relations to EventMenus (Many-to-Many)
export const eventsRelations = relations(events, ({ many }) => ({
  eventMenus: many(eventMenus),
}));

// EventMenus relations to Events and Menus (Many-to-One links)
export const eventMenusRelations = relations(eventMenus, ({ one }) => ({
  event: one(events, {
    fields: [eventMenus.eventId],
    references: [events.id],
  }),
  menu: one(menus, {
    fields: [eventMenus.menuId],
    references: [menus.id],
  }),
}));

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  eventId: integer("event_id").notNull(),
  venueId: integer("venue_id").references(() => venues.id),
  roomId: integer("room_id").references(() => rooms.id),
  status: text("status").notNull().default("pending"),
  date: timestamp("date").notNull(),
  guestCount: integer("guest_count").notNull(),
  menuSelection: text("menu_selection"),
  totalAmount: doublePrecision("total_amount").notNull(),
  waiterFee: doublePrecision("waiter_fee").notNull().default(0),
  additionalInfo: text("additional_info"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderSchema = z.object({
  id: z.number(),
  userId: z.number(),
  eventId: z.number(),
  venueId: z.number().optional(),
  roomId: z.number().optional(),
  status: z.string().default("pending"),
  date: z.union([
    z.string().transform((str) => new Date(str)),
    z.date()
  ]),
  guestCount: z.number(),
  menuSelection: z.string().optional(),
  totalAmount: z.number(),
  waiterFee: z.number().default(0),
  additionalInfo: z.any().optional(),
  adminNotes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const insertOrderSchema = orderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Cart type (not stored in database)
export type CartItem = {
  id: number;
  eventId: number;
  title: string;
  imageUrl: string;
  date: string;
  time?: string;
  guestCount: number;
  menuSelection: string;
  price: number;
  quantity: number;
  waiterFee?: number;
};

// Venues table
export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  capacity: integer("capacity").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVenueSchema = createInsertSchema(venues).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venues.$inferSelect;

// Rooms table
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venues.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  description: text("description"),
  status: text("status").notNull().default("available"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

// Venues relations to Rooms (One-to-Many)
export const venuesRelations = relations(venues, ({ many }) => ({
  rooms: many(rooms),
  orders: many(orders),
}));

// Rooms relations to Venues (Many-to-One)
export const roomsRelations = relations(rooms, ({ one, many }) => ({
  venue: one(venues, {
    fields: [rooms.venueId],
    references: [venues.id],
  }),
  orders: many(orders),
}));

// Orders relations
export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [orders.eventId],
    references: [events.id],
  }),
  venue: one(venues, {
    fields: [orders.venueId],
    references: [venues.id],
  }),
  room: one(rooms, {
    fields: [orders.roomId],
    references: [rooms.id],
  }),
}));
