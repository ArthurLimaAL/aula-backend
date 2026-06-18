import express from 'express';
import cors from 'cors';
import {questions} from './data/questions.mjs';
import {users, findUser, createUser} from './data/users.mjs';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res)=>{
    res.json({message:"Servidor do Quiz API está online e rodando!"});
} );

// LISTAR QUESTOES
app.get('/api/questions', (req, res) => {
    res.status(200).json(questions);
});


// USUARIOS - encontrar e criar
app.post('/api/users', (req, res) => {
    const { username } = req.body;
    if (!username || username.trim() === '') {
        return res.status(400).json({ error: 'O nome de usuário é obrigatório.' });
    }

    let user = findUser(username);
    if (!user) {
        user = createUser(username);
    }

    res.status(200).json(user);
});

app.post('/api/scores', (req, res) => {
    const { username, score } = req.body;
    if (!username || score === undefined) {
        return res.status(400).json({ error: 'Dados Insuficientes para salvar o Score' });
    }

    const user = findUser(username);
    if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    user.scores.push(Number(score));
    res.status(200).json({ message: 'Score salvo com sucesso', updatedUser: user });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log(`[BACKEND] Servidor rodando na porta ${PORT}`);
});