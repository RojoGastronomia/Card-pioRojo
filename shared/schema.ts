import { z } from "zod";

// Tipos básicos para MongoDB (sem Drizzle)

// User types
export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string(),
  username: z.string(),
  password: z.string(),
  role: z.enum(["client", "Administrador", "Comercial"]).default("client"),
  phone: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
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
export type User = z.infer<typeof userSchema>;

// Event types
export const eventSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  titleEn: z.string().optional(),
  descriptionEn: z.string().optional(),
  imageUrl: z.string(),
  location: z.string().optional(),
  eventType: z.string(),
  menuOptions: z.number().default(2),
  status: z.string().default("available"),
  createdAt: z.date().optional(),
});

export const insertEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  titleEn: z.string().optional(),
  descriptionEn: z.string().optional(),
  imageUrl: z.string(),
  location: z.string().optional(),
  eventType: z.string(),
  menuOptions: z.number().default(2),
  status: z.string().default("available"),
}) as z.ZodType<any>;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = z.infer<typeof eventSchema>;

// Menu types
export const menuSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  nameEn: z.string().optional(),
  descriptionEn: z.string().optional(),
  price: z.number(),
  image_url: z.string().optional(),
  createdAt: z.date().optional(),
});

export const insertMenuSchema = z.object({
  name: z.string(),
  description: z.string(),
  nameEn: z.string().optional(),
  descriptionEn: z.string().optional(),
  price: z.number(),
  image_url: z.string().optional(),
});

export type InsertMenu = z.infer<typeof insertMenuSchema>;
export type Menu = z.infer<typeof menuSchema>;

// Dish types
export const dishSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  nameEn: z.string().optional(),
  descriptionEn: z.string().optional(),
  price: z.number(),
  category: z.string(),
  categoryEn: z.string().optional(),
  menuId: z.string().optional(),
  imageUrl: z.string().optional(),
  createdAt: z.date().optional(),
});

export const insertDishSchema = z.object({
  name: z.string(),
  description: z.string(),
  nameEn: z.string().optional(),
  descriptionEn: z.string().optional(),
  price: z.number(),
  category: z.string(),
  categoryEn: z.string().optional(),
  imageUrl: z.string().optional(),
}) as z.ZodType<any>;

export type InsertDish = z.infer<typeof insertDishSchema>;
export type Dish = z.infer<typeof dishSchema>;

// Order types
export const orderSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  eventId: z.string(),
  venueId: z.string().optional(),
  roomId: z.string().optional(),
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
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertOrderSchema = z.object({
  userId: z.string(),
  eventId: z.string(),
  venueId: z.string().optional(),
  roomId: z.string().optional(),
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
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = z.infer<typeof orderSchema>;

// Cart types
export type CartItem = {
  id: string;
  eventId: string;
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

// Venue types
export const venueSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  address: z.string(),
  capacity: z.number(),
  description: z.string().optional(),
  createdAt: z.date().optional(),
});

export const insertVenueSchema = z.object({
  name: z.string(),
  address: z.string(),
  capacity: z.number(),
  description: z.string().optional(),
}) as z.ZodType<any>;

export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = z.infer<typeof venueSchema>;

// Room types
export const roomSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  venueId: z.string(),
  capacity: z.number(),
  description: z.string().optional(),
  createdAt: z.date().optional(),
});

export const insertRoomSchema = z.object({
  name: z.string(),
  venueId: z.string(),
  capacity: z.number(),
  description: z.string().optional(),
}) as z.ZodType<any>;

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = z.infer<typeof roomSchema>;

// Category types
export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.date().optional(),
});

export const insertCategorySchema = z.object({
  name: z.string(),
  nameEn: z.string().optional(),
  description: z.string().optional(),
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = z.infer<typeof categorySchema>;

// Placeholder tables for compatibility (empty objects)
export const users = {};
export const events = {};
export const menus = {};
export const dishes = {};
export const orders = {};
export const eventMenus = {};
export const menuDishes = {};
export const venues = {};
export const rooms = {};
export const categories = {};
