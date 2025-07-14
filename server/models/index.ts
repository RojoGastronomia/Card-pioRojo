// Exportar todos os modelos MongoDB
export { User, type IUser } from './User';
export { Menu, type IMenu } from './Menu';
export { Dish, type IDish } from './Dish';
export { Event, type IEvent } from './Event';
export { Order, type IOrder } from './Order';

// Re-exportar mongoose para conveniência
export { default as mongoose } from 'mongoose'; 