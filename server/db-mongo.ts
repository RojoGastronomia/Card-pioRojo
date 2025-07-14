import mongoose from 'mongoose';

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sitecard';

// Conectar ao MongoDB
export async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB com sucesso!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    throw error;
  }
}

// Desconectar do MongoDB
export async function disconnectFromMongoDB() {
  try {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  } catch (error) {
    console.error('❌ Erro ao desconectar do MongoDB:', error);
  }
}

// Configurar eventos de conexão
mongoose.connection.on('error', (error) => {
  console.error('❌ Erro na conexão MongoDB:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB desconectado');
});

export default mongoose; 