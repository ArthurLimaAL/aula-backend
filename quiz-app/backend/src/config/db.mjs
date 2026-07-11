import mongoose from 'mongoose';

// Variável global para controlar se o banco de dados está ativo
export let isDatabaseConnected = false;

// Schema de cada tentativa do quiz
const attemptSchema = new mongoose.Schema({
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  percentage: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { _id: false });

// Define a estrutura do usuário no banco de dados - SÓ 1 VEZ
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'O nome de usuário é obrigatório.'],
    unique: true,
    trim: true,
    lowercase: true
  },
  history: {
    type: [attemptSchema], // Novo campo pro histórico
    default: []
  },
  scores: {
    type: [Number], // Mantém pra compatibilidade
    default: []
  }
}, {
  timestamps: true
});

// Cria o modelo 'User' baseado no schema acima
const User = mongoose.model('User', userSchema);

export default User;

export const connectDB = async () => {
  try {
    const dbName = process.env.MONGODB_DB_NAME || 'quiz-db';
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
  }
};