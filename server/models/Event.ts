import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  imageUrl?: string;
  location?: string;
  eventType: string;
  menuOptions: mongoose.Types.ObjectId[]; // Referências para menus
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  titleEn: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  descriptionEn: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  eventType: {
    type: String,
    required: true,
    trim: true
  },
  menuOptions: [{
    type: Schema.Types.ObjectId,
    ref: 'Menu'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Índices
EventSchema.index({ title: 1 });
EventSchema.index({ eventType: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ menuOptions: 1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema); 