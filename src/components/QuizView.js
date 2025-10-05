// Contenu complet pour QuizView.js - Version Modifiée et Sécurisée

import React, { useState } from 'react';

// Reçoit les questions et une fonction `onQuizEnd` pour signaler la fin
function QuizView({ questions, onQuizEnd }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // --- MODIFICATION 1 : Vérification renforcée des données en entrée ---
  // On s'assure que 'questions' est bien un tableau non vide.
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div id="quiz-view">
        <h2>Erreur</h2>
        <p>Aucune question valide n'a pu être chargée pour le quiz.</p>
        <p>Cela peut être dû à une erreur de l'API ou à un problème de connexion.</p>
        <button onClick={onQuizEnd}>Retour</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // --- MODIFICATION 2 : Vérification de l'intégrité de la question actuelle ---
  // On vérifie que l'objet de la question actuelle n'est pas corrompu.
  if (!currentQuestion || !currentQuestion.question || !currentQuestion.options || !Array.isArray(currentQuestion.options)) {
    return (
      <div id="quiz-view">
        <h2>Erreur Critique</h2>
        <p>Les données pour la question actuelle sont incomplètes ou mal formées.</p>
        <button onClick={onQuizEnd}>Retour</button>
      </div>
    );
  }


  const handleAnswerClick = (answer) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    if (answer === currentQuestion.answer) {
      setFeedback('Bonne réponse !');
      setScore(s => s + 1);
    } else {
      setFeedback(`Mauvaise réponse. La bonne réponse était : ${currentQuestion.answer}`);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setSelectedAnswer(null);
      setFeedback('');
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizFinished(true);
    }
  };

  if (quizFinished) {
    return (
      <div id="quiz-results-view">
        <h2>Quiz Terminé !</h2>
        <p>Votre score est de : {score} / {questions.length}</p>
        <button onClick={onQuizEnd}>Retour</button>
      </div>
    );
  }

  return (
    <div id="quiz-view">
      <div className="quiz-header">
        <button onClick={onQuizEnd}>← Quitter</button>
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
              if (option === currentQuestion.answer) { buttonClass = 'correct'; } 
              else if (option === selectedAnswer) { buttonClass = 'incorrect'; }
            }
            return (<button key={index} onClick={() => handleAnswerClick(option)} className={buttonClass} disabled={!!selectedAnswer}>{option}</button>);
          })}
        </div>
        <div id="quiz-feedback">{feedback}</div>
        {selectedAnswer && <button id="next-question-btn" onClick={handleNextQuestion}>Question suivante →</button>}
      </div>
    </div>
  );
}

export default QuizView;