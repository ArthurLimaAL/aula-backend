import {useState, useEffect} from 'react'
import './App.css'

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  const [usernameInput, setUsernameInput] = useState('');
  const [user, setUser] = useState(null);



  useEffect(() => {
    fetch('/api/questions')
      .then((response) => response.json())
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Erro ao buscar perguntas:', error)
        setLoading(false);
      })
  },[])

  const handleLogin = (e) =>{
    e.preventDefault();
    if(!usernameInput.trim()) return;
    
    fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: usernameInput })
    })
    .then(res => res.json())
    .then(userData => {
      setUser(userData);
    })
    .catch(error => {
      console.error('Erro ao identificar usuário:', error);
    })
  };


  function handleAnswerClick(selectedOption) {
    const currentQuestion = questions[currentQuestionIndex];
    if (selectedOption === currentQuestion.answer) {
      setScore(score + 1);
    }

    const nextQuestionIndex = currentQuestionIndex + 1;
    if (nextQuestionIndex < questions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
    } else {
      setQuizFinished(true);
    }
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizFinished(false);
  }

  const enviarPontuacao = (scoreFinal) => {
   
    fetch('/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: user.id, score: scoreFinal })
    })
    .then(response => response.json())
    .then(data => {
      setUser(data.updatedUser);
    })
    .catch(error => {
      console.error('Erro ao salvar pontuação:', error);
    });
  };

  const handleLogout = () => {
    setUser(null);
    setUsernameInput('');
    resetQuiz();
  };

  if (loading) {
    return <h3>Carregando perguntas...</h3>;
  }

  if(questions.length === 0) {
    return <h3>Nenhuma pergunta disponível.</h3>;
  }

  if(!user) {
    return (
      <div className="login-container"> 
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Nome de usuário"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
          />
          <button type="submit">Entrar</button>
        </form>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="App">
      <h1>Quiz App</h1>
      {quizFinished ? (
        <div>
          <h2>Quiz Finalizado!</h2>
          <p>Sua pontuação: {score} de {questions.length}</p>
          <h3>Histórico de Pontuações de {user.scores && user.scores.length >0? (
            user.scores.map((s, index) => (
              <span key={index}> Tentativa {index + 1}: {s} acertos</span>
            ))
          ) : (
            <span>Nenhuma pontuação registrada.</span>
          )}:</h3>

          <button onClick={resetQuiz}>Reiniciar Quiz</button>
        </div>
      ) : (
        <div>
          <h2>{currentQuestion.question}</h2>
          {currentQuestion.options.map((option, index) => (
            <button key={index} onClick={() => handleAnswerClick(option)}>
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
