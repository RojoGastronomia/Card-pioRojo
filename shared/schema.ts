import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  username: z.string(),
  password: z.string(),
  role: z.enum(["client", "Administrador", "Comercial"]).default("client"),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const insertUserSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres" }),
  username: z.string().min(2, { message: "O nome de usuário deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "Por favor, insira um endereço de e-mail válido" }),
  password: z.string()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres" })
    .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula" })
    .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula" })
    .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número" })
    .regex(/[^A-Za-z0-9]/, { message: "A senha deve conter pelo menos um caractere especial (ex: @, #, $, !)" }),
  role: z.enum(["client", "Administrador", "Comercial"]).default("client"),
  phone: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  titleEn: text("title_en"),
  descriptionEn: text("description_en"),
  imageUrl: text("image_url").notNull(),
  location: text("location"),
  eventType: text("event_type").notNull(),
  menuOptions: integer("menu_options").notNull().default(2),
  status: text("status").notNull().default("available"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Menus table
export const menus = pgTable("menus", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  nameEn: text("name_en"),
  descriptionEn: text("description_en"),
  price: real("price").notNull(),
  image_url: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMenuSchema = createInsertSchema(menus).omit({ id: true, createdAt: true });
export type InsertMenu = typeof menus.$inferInsert;
export type Menu = typeof menus.$inferSelect;

// Dishes table
export const dishes = pgTable("dishes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  nameEn: text("name_en"),
  descriptionEn: text("description_en"),
  price: real("price").notNull(),
  category: text("category").notNull(),
  categoryEn: text("category_en"),
  menuId: integer("menu_id").references(() => menus.id),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDishSchema = createInsertSchema(dishes).omit({ id: true, createdAt: true, menuId: true });
export type InsertDish = z.infer<typeof insertDishSchema>;
export type Dish = typeof dishes.$inferSelect;

// EventMenus join table
export const eventMenus = pgTable("event_menus", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  menuId: integer("menu_id").notNull().references(() => menus.id),
});

// Menu Dishes join table
export const menuDishes = pgTable("menu_dishes", {
  id: serial("id").primaryKey(),
  menuId: integer("menu_id").notNull().references(() => menus.id),
  dishId: integer("dish_id").notNull().references(() => dishes.id),
});

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
  venueId: integer("venue_id"),
  roomId: integer("room_id"),
  status: text("status").notNull().default("pending"),
  date: timestamp("date", { withTimezone: true }).notNull(),
  guestCount: integer("guest_count").notNull(),
  menuSelection: text("menu_selection"),
  location: text("location"),
  totalAmount: real("total_amount").notNull(),
  waiterFee: real("waiter_fee").notNull().default(0),
  additionalInfo: text("additional_info"),
  adminNotes: text("admin_notes"),
  boletoUrl: text("boleto_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
  location: z.string().optional(),
  totalAmount: z.number(),
  waiterFee: z.number().default(0),
  additionalInfo: z.any().optional(),
  adminNotes: z.string().optional(),
  boletoUrl: z.string().optional(),
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
  location?: string;
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVenueSchema = createInsertSchema(venues).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venues.$inferSelect;

// Rooms table
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venues.id),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  description: text("description"),
  status: text("status").notNull().default("available"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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

// Categories table
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    nameEn: text("name_en"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  { schema: "public" }
);

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
