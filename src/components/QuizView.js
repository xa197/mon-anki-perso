import React, { useState } from 'react';

function QuizView({ navigateTo, questions }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div id="quiz-view">
        <p>Erreur: Aucune question à afficher.</p>
        <button onClick={() => navigateTo('library')}>Retour à la bibliothèque</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerClick = (answer) => {
    if (selectedAnswer) return; // Empêche de répondre plusieurs fois

    setSelectedAnswer(answer);
    if (answer === currentQuestion.answer) {
      setFeedback('Bonne réponse !');
      setScore(score + 1);
    } else {
      setFeedback(`Mauvaise réponse. La bonne réponse était : ${currentQuestion.answer}`);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setFeedback('');
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizFinished(true); // Fin du quiz
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
      <div className="quiz-header">
        <button onClick={() => navigateTo('library')}>← Bibliothèque</button>
        <h2>Quiz</h2>
      </div>
      <div id="quiz-progress-bar">
        <div id="quiz-progress-value" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
      </div>
      <div id="quiz-container">
        <p id="quiz-question-text">{currentQuestion.question}</p>
        <div id="quiz-options-container">
          {currentQuestion.options.map((option, index) => {
            let buttonClass = '';
            if (selectedAnswer) {
              if (option === currentQuestion.answer) {
                buttonClass = 'correct';
              } else if (option === selectedAnswer) {
                buttonClass = 'incorrect';
              }
            }
            return (
              <button key={index} onClick={() => handleAnswerClick(option)} className={buttonClass} disabled={!!selectedAnswer}>
                {option}
              </button>
            );
          })}
        </div>
        <div id="quiz-feedback">{feedback}</div>
        {selectedAnswer && <button id="next-question-btn" onClick={handleNextQuestion}>Question suivante →</button>}
      </div>
    </div>
  );
}

export default QuizView;