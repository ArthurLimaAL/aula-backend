import mongoose from 'mongoose';

// Variável global para controlar se o banco de dados está ativo
export let isDatabaseConnected = false;

// Define a estrutura do usuário no banco de dados
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'O nome de usuário é obrigatório.'],
    unique: true, // Garante que não haverá dois usuários com o mesmo nome
    trim: true,   // Remove espaços em branco no início e no fim (Ex: " alex " vira "alex")
    lowercase: true // Salva sempre em minúsculo para facilitar a busca/login
  },
  scores: {
    type: [Number], // Array de números
    default: []     // Se não for informado, começa como um array vazio
  }
}, {
  timestamps: true // Cria automaticamente os campos createdAt e updatedAt no documento
});

// Cria o modelo 'User' baseado no schema acima
const User = mongoose.model('User', userSchema);


export default User;

export const connectDB = async () => {
  try {
    const dbName = process.env.MONGODB_DB_NAME || 'quiz-db';

    // Define um limite de tempo curto (5 segundos) para tentar conectar
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      dbName
    });
    
    isDatabaseConnected = true;
    console.log(`[DATABASE] MongoDB conectado com sucesso: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    isDatabaseConnected = false;
    console.error(`[AVISO DATABASE] Falha na conexão: ${error.message}`);
    console.log(`[FALLBACK] O servidor continuará rodando utilizando dados em memória.`);
    // REMOVIDO: process.exit(1) para evitar o crash do nodemon
  }
};