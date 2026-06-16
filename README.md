# aula-backend

Para desenvolver essa solução completa, o raciocínio arquitetural baseia-se em separar a aplicação em duas camadas distintas que se comunicam via HTTP:
 1. **Backend (Express):** Atuará como a fonte da verdade. Ele gerenciará o estado da aplicação temporariamente na memória do servidor (Sessões), identificará quem está fazendo a requisição (Cookies), validará se os dados enviados estão corretos (Validação), processará a lógica antes da resposta (Middlewares/Rotas) e filtrará informações (Parâmetros).
 2. **Frontend (React):** Atuará como a camada de apresentação. Ele consumirá a API do backend, enviando as credenciais (cookies) em cada requisição para garantir que a sessão do usuário seja mantida.
Abaixo, detalho o que vem pronto, o que precisa ser criado do zero e a construção passo a passo.
### 1. O Ponto de Partida: Criado do Zero vs. Alterado
 * **Backend (Node/Express): Criado 100% do zero.** Você iniciará uma pasta vazia, rodará npm init -y para criar o package.json e instalará os pacotes necessários manualmente.
 * **Frontend (React): Gerado por ferramenta e alterado.** Você usará um empacotador (como o Vite: npm create vite@latest my-app -- --template react). Ele trará arquivos base (index.html, main.jsx, App.css). Você precisará **alterar** o arquivo App.jsx, apagando o código de exemplo e inserindo a lógica de integração com a sua API.
### 2. Construção do Backend (Express)
**Dependências a instalar:**
```bash
npm install express express-session cookie-parser cors express-validator

```
#### Arquivo: backend/server.js
Este é o ponto de entrada. Aqui configuramos os middlewares globais, sessões e cookies.
```javascript
// backend/server.js
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// --- CONCEITO: Middlewares Globais ---
// Permite que o frontend (React) converse com o backend e envie Cookies
app.use(cors({
    origin: 'http://localhost:5173', // URL padrão do Vite no React
    credentials: true // Crucial para permitir tráfego de cookies/sessões
}));

// Processa o corpo das requisições em JSON
app.use(express.json()); 

// --- CONCEITO: Cookies ---
// Middleware para ler os cookies que chegam do navegador
app.use(cookieParser());

// --- CONCEITO: Sessões ---
// Configura a sessão do usuário. O Express envia um cookie 'connect.sid' para o React.
app.use(session({
    secret: 'meu_segredo_super_seguro',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 60000 } // Em produção, secure: true (HTTPS)
}));

// Middleware customizado: Rastreia visitas via Cookie personalizado
app.use((req, res, next) => {
    let visitas = req.cookies.visitas || 0;
    res.cookie('visitas', parseInt(visitas) + 1);
    next();
});

// --- CONCEITO: Organização com Roteadores ---
// Delega todas as requisições que começam com '/api/tasks' para o roteador específico
app.use('/api/tasks', taskRoutes);

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

```
#### Arquivo: backend/routes/taskRoutes.js
Aqui extraímos as rotas para manter o server.js limpo.
```javascript
// backend/routes/taskRoutes.js
const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');

// Criação do Roteador
const router = express.Router();

// --- CONCEITO: Rotas e Validação ---

// Rota GET para listar tarefas. Pode receber um Parâmetro de Consulta (Query Param)
router.get('/', taskController.getTasks);

// Rota POST para criar tarefa com Validação encadeada no meio da rota
router.post(
    '/',
    [
        // express-validator verifica se 'title' não está vazio
        body('title').notEmpty().withMessage('O título da tarefa é obrigatório.'),
        body('title').isLength({ min: 3 }).withMessage('Mínimo de 3 caracteres.')
    ],
    taskController.createTask
);

// Rota DELETE para remover. 
// --- CONCEITO: Parâmetros de Rota (Route Params) ---
// O ':id' indica que a URL terá um valor dinâmico (ex: /api/tasks/1)
router.delete('/:id', taskController.deleteTask);

module.exports = router;

```
#### Arquivo: backend/controllers/taskController.js
Separação da lógica de negócio. É aqui que manipulamos a sessão do usuário e os parâmetros.
```javascript
// backend/controllers/taskController.js
const { validationResult } = require('express-validator');

exports.getTasks = (req, res) => {
    // Inicializa a lista de tarefas na SESSÃO do usuário, se não existir
    if (!req.session.tasks) {
        req.session.tasks = [];
    }

    // --- CONCEITO: Parâmetros de Consulta (Query Params) ---
    // Acessado via req.query. Ex: /api/tasks?status=concluida
    const { status } = req.query;
    let filteredTasks = req.session.tasks;

    if (status) {
        filteredTasks = req.session.tasks.filter(t => t.status === status);
    }

    res.json({ 
        visitas: req.cookies.visitas, // Lendo o cookie que criamos
        tasks: filteredTasks 
    });
};

exports.createTask = (req, res) => {
    // --- CONCEITO: Consolidando a Validação ---
    // Verifica se o middleware express-validator encontrou erros
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!req.session.tasks) req.session.tasks = [];

    const newTask = {
        id: Date.now().toString(),
        title: req.body.title,
        status: 'pendente'
    };

    req.session.tasks.push(newTask);
    res.status(201).json(newTask);
};

exports.deleteTask = (req, res) => {
    // --- CONCEITO: Utilizando o Parâmetro de Rota ---
    // Acessado via req.params.id
    const { id } = req.params;

    if (req.session.tasks) {
        req.session.tasks = req.session.tasks.filter(t => t.id !== id);
    }

    res.json({ message: 'Tarefa deletada com sucesso' });
};

```
### 3. Construção do Frontend (React)
Para o frontend, você utilizará a biblioteca axios, pois ela facilita o envio automático de cookies e credenciais de sessão (algo que a API fetch nativa exige mais configuração manual).
**Dependência a instalar no frontend:**
```bash
npm install axios

```
#### Arquivo: frontend/src/App.jsx
Este é o arquivo que você vai **alterar**. Apague o conteúdo padrão gerado pelo Vite/CRA e construa a integração.
```jsx
// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

// Configuração global do Axios para SEMPRE enviar cookies (essencial para a Sessão funcionar)
axios.defaults.withCredentials = true;
const api = axios.create({ baseURL: 'http://localhost:3000/api' });

function App() {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState('');
    const [error, setError] = useState(null);

    // --- CONCEITO: Integração Frontend (Leitura) ---
    const fetchTasks = async () => {
        try {
            // Pode testar o Query Param aqui: api.get('/tasks?status=pendente')
            const response = await api.get('/tasks');
            setTasks(response.data.tasks);
        } catch (err) {
            console.error('Erro ao buscar tarefas', err);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    // --- CONCEITO: Integração Frontend (Escrita e Validação) ---
    const handleAddTask = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await api.post('/tasks', { title });
            setTitle('');
            fetchTasks(); // Atualiza a lista
        } catch (err) {
            // Capturando o erro gerado pelo express-validator no backend
            if (err.response && err.response.data.errors) {
                setError(err.response.data.errors[0].msg);
            }
        }
    };

    // --- CONCEITO: Integração Frontend (Exclusão por Parâmetro) ---
    const handleDelete = async (id) => {
        try {
            // O id vai compor a URL, correspondendo ao Route Param ':id' do Express
            await api.delete(`/tasks/${id}`);
            fetchTasks();
        } catch (err) {
            console.error('Erro ao deletar', err);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Minha Lista de Tarefas (Sessão Ativa)</h1>
            
            <form onSubmit={handleAddTask} style={{ marginBottom: '20px' }}>
                <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Nova tarefa..."
                />
                <button type="submit">Adicionar</button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <ul>
                {tasks.map(task => (
                    <li key={task.id} style={{ marginBottom: '10px' }}>
                        {task.title} - {task.status}
                        <button 
                            onClick={() => handleDelete(task.id)} 
                            style={{ marginLeft: '10px', color: 'red' }}
                        >
                            Excluir
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;

```
