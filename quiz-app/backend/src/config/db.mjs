import mongoose from 'mongoose';

// Variável global para controlar se o banco de dados está ativo
export let isDatabaseConnected = false;

export const connectDB = async () => {
  try {
    // Define um limite de tempo curto (5 segundos) para tentar conectar
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 
    });
    
    isDatabaseConnected = true;
    console.log(`[DATABASE] MongoDB conectado com sucesso: ${conn.connection.host}`);
  } catch (error) {
    isDatabaseConnected = false;
    console.error(`[AVISO DATABASE] Falha na conexão: ${error.message}`);
    console.log(`[FALLBACK] O servidor continuará rodando utilizando dados em memória.`);
    // REMOVIDO: process.exit(1) para evitar o crash do nodemon
  }
};