import { connectToMongoDB, disconnectFromMongoDB } from './db-mongo.js';
import { User, Menu, Dish, Event, Order, type IUser, type IMenu, type IDish, type IEvent, type IOrder } from './models/index.js';
import bcrypt from 'bcrypt';
import session from 'express-session';
import MongoStore from 'connect-mongo';

// Configurar store de sessão para MongoDB
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/sitecard',
  collectionName: 'sessions',
  ttl: 24 * 60 * 60, // 24 horas
});

export class MongoDBStorage {
  // Métodos de usuário
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(userData.password!, 10);
    const user = new User({
      ...userData,
      password: hashedPassword
    });
    return await user.save();
  }

  async findUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() });
  }

  async findUserById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    return await User.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  async getAllUsers(): Promise<IUser[]> {
    return await User.find({}).sort({ createdAt: -1 });
  }

  // Métodos de menu
  async createMenu(menuData: Partial<IMenu>): Promise<IMenu> {
    const menu = new Menu(menuData);
    return await menu.save();
  }

  async findMenuById(id: string): Promise<IMenu | null> {
    return await Menu.findById(id);
  }

  async updateMenu(id: string, updateData: Partial<IMenu>): Promise<IMenu | null> {
    return await Menu.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteMenu(id: string): Promise<boolean> {
    const result = await Menu.findByIdAndDelete(id);
    return !!result;
  }

  async getAllMenus(): Promise<IMenu[]> {
    return await Menu.find({ isActive: true }).sort({ name: 1 });
  }

  // Métodos de prato
  async createDish(dishData: Partial<IDish>): Promise<IDish> {
    const dish = new Dish(dishData);
    return await dish.save();
  }

  async findDishById(id: string): Promise<IDish | null> {
    return await Dish.findById(id);
  }

  async updateDish(id: string, updateData: Partial<IDish>): Promise<IDish | null> {
    return await Dish.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteDish(id: string): Promise<boolean> {
    const result = await Dish.findByIdAndDelete(id);
    return !!result;
  }

  async getAllDishes(): Promise<IDish[]> {
    return await Dish.find({ isActive: true }).sort({ name: 1 });
  }

  async getDishesByMenuId(menuId: string): Promise<IDish[]> {
    return await Dish.find({ 
      menuIds: menuId,
      isActive: true 
    }).sort({ name: 1 });
  }

  async addDishToMenu(dishId: string, menuId: string): Promise<boolean> {
    const result = await Dish.findByIdAndUpdate(
      dishId,
      { $addToSet: { menuIds: menuId } },
      { new: true }
    );
    return !!result;
  }

  async removeDishFromMenu(dishId: string, menuId: string): Promise<boolean> {
    const result = await Dish.findByIdAndUpdate(
      dishId,
      { $pull: { menuIds: menuId } },
      { new: true }
    );
    return !!result;
  }

  // Métodos de evento
  async createEvent(eventData: Partial<IEvent>): Promise<IEvent> {
    const event = new Event(eventData);
    return await event.save();
  }

  async findEventById(id: string): Promise<IEvent | null> {
    return await Event.findById(id);
  }

  async updateEvent(id: string, updateData: Partial<IEvent>): Promise<IEvent | null> {
    return await Event.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await Event.findByIdAndDelete(id);
    return !!result;
  }

  async getAllEvents(): Promise<IEvent[]> {
    return await Event.find({ status: 'active' }).sort({ createdAt: -1 });
  }

  // Métodos de pedido
  async createOrder(orderData: Partial<IOrder>): Promise<IOrder> {
    const order = new Order(orderData);
    return await order.save();
  }

  async findOrderById(id: string): Promise<IOrder | null> {
    return await Order.findById(id)
      .populate('userId', 'name email')
      .populate('eventId', 'title')
      .populate('menuId', 'name')
      .populate('dishes.dishId', 'name price');
  }

  async updateOrder(id: string, updateData: Partial<IOrder>): Promise<IOrder | null> {
    return await Order.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await Order.findByIdAndDelete(id);
    return !!result;
  }

  async getAllOrders(): Promise<IOrder[]> {
    return await Order.find({})
      .populate('userId', 'name email')
      .populate('eventId', 'title')
      .populate('menuId', 'name')
      .sort({ createdAt: -1 });
  }

  async getOrdersByUser(userId: string): Promise<IOrder[]> {
    return await Order.find({ userId })
      .populate('eventId', 'title')
      .populate('menuId', 'name')
      .sort({ createdAt: -1 });
  }

  // Métodos de estatísticas
  async getStats() {
    const [totalUsers, totalMenus, totalDishes, totalEvents, totalOrders] = await Promise.all([
      User.countDocuments(),
      Menu.countDocuments(),
      Dish.countDocuments(),
      Event.countDocuments(),
      Order.countDocuments()
    ]);

    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name')
      .populate('eventId', 'title');

    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    return {
      totalUsers,
      totalMenus,
      totalDishes,
      totalEvents,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentOrders
    };
  }

  // Inicialização
  async initialize() {
    await connectToMongoDB();
  }

  async close() {
    await disconnectFromMongoDB();
  }
}

// Instância global do storage
export const storage = new MongoDBStorage();
export { sessionStore }; 