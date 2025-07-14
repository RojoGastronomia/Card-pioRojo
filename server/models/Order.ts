import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  menuId: mongoose.Types.ObjectId;
  dishes: Array<{
    dishId: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  guestCount: number;
  eventDate: Date;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  menuId: {
    type: Schema.Types.ObjectId,
    ref: 'Menu',
    required: true
  },
  dishes: [{
    dishId: {
      type: Schema.Types.ObjectId,
      ref: 'Dish',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  guestCount: {
    type: Number,
    required: true,
    min: 1
  },
  eventDate: {
    type: Date,
    required: true
  },
  specialRequests: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices
OrderSchema.index({ userId: 1 });
OrderSchema.index({ eventId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ eventDate: 1 });
OrderSchema.index({ createdAt: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema); 