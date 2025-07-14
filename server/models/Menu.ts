import mongoose, { Schema, Document } from 'mongoose';

export interface IMenu extends Document {
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuSchema = new Schema<IMenu>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
MenuSchema.index({ name: 1 });
MenuSchema.index({ isActive: 1 });

export const Menu = mongoose.model<IMenu>('Menu', MenuSchema); 