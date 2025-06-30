import { z } from "zod";

// User schemas
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  username: z.string(),
  password: z.string(),
  role: z.string().default("client"),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()])
});

export const insertUserSchema = userSchema.omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

// Login schema (usado em auth-page.tsx)
export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>; 