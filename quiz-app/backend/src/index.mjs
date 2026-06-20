import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; // Importa o gerenciador de variáveis de ambiente
import { connectDB } from './config/db.mjs'; // Importa nossa função de conexão
import { questions } from './data/questions.mjs';
import { users, findUser, createUser } from './data/users.mjs';

// Carrega as configurações do arquivo .env para o process.env
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Dispara a conexão com o MongoDB Atlas
connectDB();

// Rota Raiz
app.get('/', (req, res) => {
  res.json({ message: "Servidor do Quiz API está online e conectado ao banco!" });
});


// Rota GET - Listar Perguntas
app.get('/api/questions', (req, res) => {
  res.status(200).json(questions);
});

// Rota GET --- NOVA (Capítulo 6: Ranking Global) ---
app.get('/api/ranking', (req, res) => {
  // Processa e ordena os usuários com base no maior score de cada um
  const leaderboard = users
    .map(u => {
      // Pega a maior nota do array de scores, ou 0 se nunca jogou
      const topScore = u.scores.length > 0 ? Math.max(...u.scores) : 0;
      return { username: u.username, topScore };
    })
    // Ordena do maior score para o menor
    .sort((a, b) => b.topScore - a.topScore);

  res.status(200).json(leaderboard);
});

// Rota POST - Registrar ou Logar Usuário
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "O nome de usuário é obrigatório." });
  }

  let user = findUser(username);
  if (!user) {
    user = createUser(username);
  }
  res.status(200).json(user);
});

// Rota POST - Salvar Pontuação
app.post('/api/scores', (req, res) => {
  const { username, score } = req.body;
  if (!username || score === undefined) {
    return res.status(400).json({ error: "Dados insuficientes." });
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