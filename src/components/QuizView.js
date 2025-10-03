// Contenu complet pour QuizView.js - Copiez et remplacez tout votre fichier

import React, { useState } from 'react';

// Fonction utilitaire pour comparer deux tableaux de réponses sans tenir compte de l'ordre
const areArraysEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  const sortedArr1 = [...arr1].sort();
  const sortedArr2 = [...arr2].sort();
  return sortedArr1.every((value, index) => value === sortedArr2[index]);
};

function QuizView({ questions, onQuizEnd }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // On utilise un tableau pour stocker les réponses sélectionnées (au lieu d'une seule chaîne)
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  // Nouvel état pour savoir si l'utilisateur a validé sa réponse pour la question actuelle
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div id="quiz-view">
        <h2>Erreur</h2>
        <p>Aucune question n'a pu être générée.</p>
        <button onClick={onQuizEnd}>Retour</button>
      </div>
    );
  }

  // On renomme la clé "answer" en "answers" pour correspondre au nouveau format
  const currentQuestion = questions[currentQuestionIndex];
  // Mesure de sécurité si l'API renvoie accidentellement "answer" au lieu de "answers"
  const correctAnswers = currentQuestion.answers || [currentQuestion.answer];

  // Gère la sélection/désélection des cases à cocher
  const handleOptionChange = (option) => {
    setSelectedAnswers(prevAnswers => {
      if (prevAnswers.includes(option)) {
        return prevAnswers.filter(item => item !== option); // Désélectionner
      } else {
        return [...prevAnswers, option]; // Sélectionner
      }
    });
  };

  // Logique de validation lors du clic sur "Valider"
  const handleSubmitAnswer = () => {
    setIsAnswerSubmitted(true);
    const isCorrect = areArraysEqual(selectedAnswers, correctAnswers);

    if (isCorrect) {
      setFeedback('Bonne réponse !');
      setScore(s => s + 1);
    } else {
      setFeedback(`Mauvaise réponse. La ou les bonne(s) réponse(s) était(ent) : ${correctAnswers.join(', ')}`);
    }
  };

  // Passe à la question suivante
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setSelectedAnswers([]);
      setFeedback('');
      setIsAnswerSubmitted(false);
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
        
        {/* On utilise des cases à cocher (checkbox) au lieu de boutons */}
        <div id="quiz-options-container" className="checkbox-container">
          {currentQuestion.options.map((option, index) => {
            let labelClass = '';
            // Logique pour le feedback visuel après validation
            if (isAnswerSubmitted) {
              if (correctAnswers.includes(option)) {
                labelClass = 'correct'; // C'est une bonne réponse
              } else if (selectedAnswers.includes(option)) {
                labelClass = 'incorrect'; // C'est une mauvaise réponse que l'utilisateur a cochée
              }
            }
            return (
              <label key={index} className={`checkbox-label ${labelClass}`}>
                <input
                  type="checkbox"
                  checked={selectedAnswers.includes(option)}
                  onChange={() => handleOptionChange(option)}
                  disabled={isAnswerSubmitted}
                />
                {option}
              </label>
            );
          })}
        </div>
        
        <div id="quiz-feedback">{feedback}</div>
        
        {/* On affiche "Valider" avant la validation, et "Question suivante" après */}
        {!isAnswerSubmitted && <button id="submit-answer-btn" onClick={handleSubmitAnswer} disabled={selectedAnswers.length === 0}>Valider</button>}
        {isAnswerSubmitted && <button id="next-question-btn" onClick={handleNextQuestion}>Question suivante →</button>}

      </div>
    </div>
  );
}

export default QuizView;