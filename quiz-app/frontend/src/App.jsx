import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  const [usernameInput, setUsernameInput] = useState('');
  const [user, setUser] = useState(null);
  const [ranking, setRanking] = useState([]);

  // Carrega as perguntas iniciais
  useEffect(() => {
    fetch('/api/questions')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Falha ao buscar perguntas.');
        }

        return response.json();
      })
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Erro ao buscar perguntas:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) {
      setRanking([]);
      return;
    }

    carregarRanking();
  }, [user]);

  const carregarRanking = () => {
    fetch('/api/ranking')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Falha ao buscar ranking: ${res.status}`);
        }

        return res.json();
      })
      .then((data) => setRanking(data))
      .catch((err) => console.error('Erro ao buscar ranking:', err));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Falha ao identificar usuário.');
        }

        return res.json();
      })
      .then((userData) => {
        setUser(userData);
      })
      .catch((err) => console.error('Erro ao identificar usuário:', err));
  };

  const handleAnswerClick = (selectedOption) => {
    const currentQuestion = questions[currentQuestionIndex];
    let finalScore = score;

    if (selectedOption === currentQuestion.answer) {
      finalScore = score + 1;
      setScore(finalScore);
    }

    const nextQuestion = currentQuestionIndex + 1;
    
    if (nextQuestion < questions.length) {
      setCurrentQuestionIndex(nextQuestion);
    } else {
      setQuizFinished(true);
      enviarPontuacao(finalScore);
    }
  };

  const enviarPontuacao = (scoreFinal) => {
    fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, score: scoreFinal })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Falha ao salvar pontuação.');
        }

        return res.json();
      })
      .then((data) => {
        setUser(data.updatedUser);
      })
      .catch((err) => console.error('Erro ao salvar pontuação:', err));
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizFinished(false);
  };

  const handleLogout = () => {
    setUser(null);
    setUsernameInput('');
    resetQuiz();
  };

  if (loading) {
    return <div className="quiz-container"><h3>Carregando perguntas...</h3></div>;
  }

  if (!user) {
    return (
      <div className="quiz-container">
        <h1>App de Quiz 🧠</h1>
        <div className="card">
          <h2>Seja bem-vindo!</h2>
          <p>Digite seu nome de usuário para começar a jogar e salvar seu progresso.</p>
          <form onSubmit={handleLogin} className="login-form">
            <input 
              type="text" 
              placeholder="Ex: alexandre"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
            />
            <button type="submit" className="btn-reset">Entrar e Jogar</button>
          </form>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="quiz-container">
      <div className="user-bar">
        <span>Jogador: <strong>{user.username}</strong></span>
        <button onClick={handleLogout} className="btn-logout">Sair</button>
      </div>

      {quizFinished ? (
        <div className="card result-card">
          <h2>🎉 Quiz Concluído!</h2>
          <p>Você acertou <strong>{score}</strong> de <strong>{questions.length}</strong> perguntas nesta rodada.</p>
          
          <div className="history-section">
            <h3>Seu Histórico Pessoal:</h3>
            {user.scores && user.scores.length > 0 ? (
              <div className="scores-badges">
                {user.scores.map((s, index) => (
                  <span key={index} className="score-badge">Jogo {index + 1}: {s} pts</span>
                ))}
              </div>
            ) : (
              <p>Nenhuma pontuação registrada.</p>
            )}
          </div>

          {/* --- NOVO: TABELA DE RANKING GLOBAL --- */}
          <div className="ranking-section">
            <h3>🏆 Ranking Global (Melhores Pontuações)</h3>
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Jogador</th>
                  <th>Recorde</th>
                </tr>
              </thead>
              <tbody>
                {ranking.length > 0 ? (
                  ranking.map((player, index) => (
                    <tr key={index} className={player.username === user.username ? "current-player-row" : ""}>
                      <td>{index + 1}º</td>
                      <td>{player.username} {player.username === user.username && "(Você)"}</td>
                      <td>{player.topScore} acertos</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">Ranking indisponível no momento.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button onClick={resetQuiz} className="btn-reset" style={{ marginTop: '25px' }}>Jogar Novamente</button>
        </div>
      ) : (
        <div className="card">
          <div className="quiz-header">
            <span>Pergunta {currentQuestionIndex + 1} de {questions.length}</span>
            <span>Pontuação Atual: {score}</span>
          </div>
          
          <h2 className="question-text">{currentQuestion.question}</h2>
          
          <div className="options-container">
            {currentQuestion.options.map((option, index) => (
              <button 
                key={index} 
                onClick={() => handleAnswerClick(option)}
                className="btn-option"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;