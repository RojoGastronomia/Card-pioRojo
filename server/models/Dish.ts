import mongoose, { Schema, Document } from 'mongoose';

export interface IDish extends Document {
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  isActive: boolean;
  menuIds: mongoose.Types.ObjectId[]; // Referências para menus
  createdAt: Date;
  updatedAt: Date;
}

const DishSchema = new Schema<IDish>({
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
  category: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  menuIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Menu'
  }]
}, {
  timestamps: true
});

// Índices
DishSchema.index({ name: 1 });
DishSchema.index({ category: 1 });
DishSchema.index({ isActive: 1 });
DishSchema.index({ menuIds: 1 });

export const Dish = mongoose.model<IDish>('Dish', DishSchema); 