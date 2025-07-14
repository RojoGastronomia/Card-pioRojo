// Exportar todos os modelos MongoDB
export { User, type IUser } from './User.js';
export { Menu, type IMenu } from './Menu.js';
export { Dish, type IDish } from './Dish.js';
export { Event, type IEvent } from './Event.js';
export { Order, type IOrder } from './Order.js';

// Re-exportar mongoose para conveniência
export { default as mongoose } from 'mongoose'; 