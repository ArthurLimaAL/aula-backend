import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; // Importa o gerenciador de variáveis de ambiente
import User, { connectDB, isDatabaseConnected } from './config/db.mjs'; // Importa conexão, status e modelo do usuário
import Question from './models/Question.mjs';
import { questions } from './data/questions.mjs';
import { users, findUser, createUser } from './data/users.mjs';

// Carrega as configurações do arquivo .env para o process.env
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

const seedQuestionsIfNeeded = async () => {
  if (!isDatabaseConnected) return;

  try {
    const dbQuestions = await Question.find({}, { question: 1, _id: 0 }).lean();
    const existingQuestionTexts = new Set(dbQuestions.map(q => q.question));

    const sanitizedQuestions = questions.map(({ question, options, answer }) => ({
      question,
      options,
      answer
    }));

    const missingQuestions = sanitizedQuestions.filter(q => !existingQuestionTexts.has(q.question));

    if (missingQuestions.length === 0) {
      return;
    }

    await Question.insertMany(missingQuestions);
    console.log(`[MONGO] Perguntas do array cadastradas: ${missingQuestions.length}`);
  } catch (error) {
    console.error('[ERRO MONGO] Falha ao cadastrar perguntas iniciais:', error);
  }
};

const bootstrap = async () => {
  await connectDB();
  await seedQuestionsIfNeeded();
};

bootstrap();

// Rota Raiz
app.get('/', (req, res) => {
  res.json({ message: "Servidor do Quiz API está online e conectado ao banco!" });
});


// Rota GET - Listar Perguntas
app.get('/api/questions', async (req, res) => {
  if (isDatabaseConnected) {
    try {
      const dbQuestions = await Question.find({}, { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }).lean();
      return res.status(200).json(dbQuestions);
    } catch (error) {
      console.error('[ERRO MONGO] Falha ao buscar perguntas:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar perguntas.' });
    }
  }

  res.status(200).json(questions);
});

// Rota GET --- NOVA (Capítulo 6: Ranking Global) ---
app.get('/api/ranking', async (req, res) => {
  if (isDatabaseConnected) {
    try {
      const dbUsers = await User.find({}, { username: 1, scores: 1, _id: 0 }).lean();

      const leaderboard = dbUsers
        .map(u => {
          const topScore = u.scores.length > 0 ? Math.max(...u.scores) : 0;
          return { username: u.username, topScore };
        })
        .sort((a, b) => b.topScore - a.topScore);

      return res.status(200).json(leaderboard);
    } catch (error) {
      console.error('[ERRO MONGO] Falha ao montar ranking:', error);
      return res.status(500).json({ error: 'Erro interno ao gerar ranking.' });
    }
  }

  // Fallback em memória quando o Mongo não está conectado
  const leaderboard = users
    .map(u => {
      const topScore = u.scores.length > 0 ? Math.max(...u.scores) : 0;
      return { username: u.username, topScore };
    })
    .sort((a, b) => b.topScore - a.topScore);

  res.status(200).json(leaderboard);
});

// Rota GET - Status de persistência para debug rápido
app.get('/api/database-status', async (req, res) => {
  if (isDatabaseConnected) {
    try {
      const totalUsers = await User.countDocuments();
      return res.status(200).json({
        connected: true,
        storage: 'mongodb',
        totalUsers,
        totalQuestions: await Question.countDocuments()
      });
    } catch (error) {
      console.error('[ERRO MONGO] Falha ao consultar status do banco:', error);
      return res.status(500).json({ error: 'Erro ao consultar status do banco.' });
    }
  }

  return res.status(200).json({
    connected: false,
    storage: 'memory',
    totalUsers: users.length
  });
});

// Rota POST - Registrar ou Logar Usuário
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "O nome de usuário é obrigatório." });
  }

    const normalizedUsername = username.trim().toLowerCase();

  // --- FLUXO DO MONGO DB ATLAS ---
  if (isDatabaseConnected) {
    try {
      // Procura o usuário no banco de dados
      let user = await User.findOne({ username: normalizedUsername });

      // Se não encontrar, registra o novo usuário no Atlas
      if (!user) {
        user = await User.create({ username: normalizedUsername });
        console.log(`[MONGO] Novo usuário registrado: ${normalizedUsername}`);
      } else {
        console.log(`[MONGO] Usuário logado: ${normalizedUsername}`);
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error("[ERRO MONGO] Falha ao gerenciar usuário:", error);
      return res.status(500).json({ error: "Erro interno no servidor de banco de dados." });
    }
  }

  // --- FLUXO DE FALLBACK (Memória antiga) ---
  console.log(`[FALLBACK ACTIVE] Processando login em memória.`);
  let user = findUser(normalizedUsername);
  if (!user) {
    user = createUser(normalizedUsername);
  }
  res.status(200).json(user);
});

// Rota POST - Salvar Pontuação
app.post('/api/scores', async (req, res) => {
  const { username, score } = req.body;
  if (!username || score === undefined) {
    return res.status(400).json({ error: "Dados insuficientes." });
  }

  if (isDatabaseConnected) {
    try {
      const updatedUser = await User.findOneAndUpdate(
        { username: username.trim().toLowerCase() },
        { $push: { scores: Number(score) } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      return res.status(200).json({ message: "Pontuação salva!", updatedUser });
    } catch (error) {
      console.error("[ERRO MONGO] Falha ao salvar pontuação:", error);
      return res.status(500).json({ error: "Erro interno no servidor de banco de dados." });
    }
  }

  const user = findUser(username);
  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  user.scores.push(Number(score));
  res.status(200).json({ message: "Pontuação salva!", updatedUser: user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[BACKEND] Servidor rodando na porta ${PORT}`);
});