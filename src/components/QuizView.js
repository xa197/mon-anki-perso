import React, { useState } from 'react';

// On reçoit la nouvelle prop `onQuizComplete`
function QuizView({ navigateTo, questions, onQuizComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  
  // --- NOUVEL ÉTAT POUR L'HISTORIQUE DE LA SESSION ---
  const [sessionResults, setSessionResults] = useState([]);

  if (!questions || questions.length === 0) {
    return (
      <div id="quiz-view">
        <h2>Erreur</h2>
        <p>Aucune question n'a pu être générée.</p>
        <button onClick={() => navigateTo('library')}>Retour à la bibliothèque</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerClick = (answer) => {
    if (selectedAnswer) return;

    const isCorrect = answer === currentQuestion.answer;
    setSelectedAnswer(answer);
    
    if (isCorrect) {
      setFeedback('Bonne réponse !');
      setScore(s => s + 1);
    } else {
      setFeedback(`Mauvaise réponse. La bonne réponse était : ${currentQuestion.answer}`);
    }
    
    // On enregistre le résultat de cette question
    setSessionResults(prevResults => [
      ...prevResults,
      { question: currentQuestion.question, userAnswer: answer, isCorrect }
    ]);
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setFeedback('');
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Fin du quiz, on envoie les résultats au parent AVANT de changer de vue
      onQuizComplete(sessionResults);
      setQuizFinished(true);
    }
  };

  if (quizFinished) {
    return (
      <div id="quiz-results-view">
        <h2>Quiz Terminé !</h2>
        <p>Votre score est de : {score} / {questions.length}</p>
        <button onClick={() => navigateTo('library')}>Retour à la Bibliothèque</button>
      </div>
    );
  }

  return (
    <div id="quiz-view">
      {/* ... (le reste du JSX ne change pas) ... */}
    </div>
  );
}

export default QuizView;