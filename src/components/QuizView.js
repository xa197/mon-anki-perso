// Contenu complet pour QuizView.js - Version Originale

import React, { useState } from 'react';

// Reçoit les questions et une fonction `onQuizEnd` pour signaler la fin
function QuizView({ questions, onQuizEnd }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div id="quiz-view">
        <h2>Erreur</h2>
        <p>Aucune question n'a pu être générée.</p>
        <button onClick={onQuizEnd}>Retour</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

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

export default QuizView;```

---

### Étape 2 : Restaurer `server.js`

Remplacez tout le contenu de votre fichier `server.js` par ce code original.

```javascript
// Contenu complet pour server.js - Version Originale

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialisation du client OpenAI
if (!process.env.OPENAI_API_KEY) { console.error("ERREUR: OPENAI_API_KEY non définie."); process.exit(1); }
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());
const cardsFilePath = path.join(__dirname, 'cartes.json');
const itemsDataPath = path.join(__dirname, 'items_data.json');

// --- ROUTES API ---

app.post('/api/generate-questions', async (req, res) => {
    const { texts, numQCM } = req.body;
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ error: "Aucun texte fourni." });
    }
    const qcmCount = parseInt(numQCM, 10) || 5;
    const combinedText = texts.join('\n\n---\n\n');

    try {
        const systemPrompt = `Tu es un assistant expert en création de matériel pédagogique pour des étudiants en médecine.
        Réponds UNIQUEMENT avec un objet JSON valide. Ne rien inclure avant ou après le JSON. N'utilise pas de blocs de code Markdown (\`\`\`json).
        La structure du JSON doit contenir une clé "questions" qui est un tableau d'objets. Chaque objet question doit avoir : une clé "type" ('QCM'), une clé "question", une clé "options" (un tableau de 4 chaînes de caractères), et une clé "answer" (la réponse correcte, qui doit être l'une des 4 options).`;

        const userPrompt = `Génère ${qcmCount} QCM à partir du texte suivant :
        --- DEBUT DU TEXTE ---
        ${combinedText}
        --- FIN DU TEXTE ---`;

        console.log("Appel à l'API OpenAI...");
        
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" } 
        });

        const jsonString = response.choices[0].message.content;
        const data = JSON.parse(jsonString);
        
        console.log("Réponse d'OpenAI reçue et parsée avec succès !");
        res.status(200).json(data);

    } catch (error) {
        console.error("Erreur génération quiz OpenAI:", error.message);
        res.status(500).json({ error: "Erreur IA." });
    }
});

// Le reste de vos routes
app.post('/api/add-item', (req, res) => {
    const { newItemName } = req.body;
    if (!newItemName || newItemName.trim() === '') { return res.status(400).send('Le nom de l\'item ne peut pas être vide.'); }
    fs.readFile(cardsFilePath, 'utf8', (err, data) => {
        let cards = [];
        if (!err && data) { try { cards = JSON.parse(data); } catch (e) {} }
        const itemExists = cards.some(card => card.deck === newItemName);
        if (itemExists) { return res.status(409).send('Cet item existe déjà.'); }
        const placeholderCard = { id: Date.now(), deck: newItemName, recto: "Carte initiale", verso: "Carte initiale", nextReview: new Date().toISOString() };
        cards.push(placeholderCard);
        fs.writeFile(cardsFilePath, JSON.stringify(cards, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).send('Erreur sauvegarde.');
            res.status(201).send('Item créé avec succès.');
        });
    });
});

app.get('/api/cards', (req, res) => { fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) { if (err.code === 'ENOENT') return res.json([]); return res.status(500).send('Erreur lecture cartes.'); } try { res.json(JSON.parse(data)); } catch (e) { res.status(500).send('Fichier cartes.json corrompu.'); } }); });
app.get('/api/items-data', (req, res) => { fs.readFile(itemsDataPath, 'utf8', (err, data) => { if (err) { if (err.code === 'ENOENT') return res.json({}); return res.status(500).send('Erreur lecture données items.'); } if (data.trim() === '') return res.json({}); try { res.json(JSON.parse(data)); } catch (e) { res.status(500).send('Fichier items_data.json corrompu.'); } }); });
app.post('/api/items-data', (req, res) => { const { item, text } = req.body; if (!item) return res.status(400).send('Nom de l\'item manquant.'); fs.readFile(itemsDataPath, 'utf8', (err, data) => { let itemsData = {}; if (!err && data.trim() !== '') { try { itemsData = JSON.parse(data); } catch (e) {} } itemsData[item] = text; fs.writeFile(itemsDataPath, JSON.stringify(itemsData, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde données item.'); res.status(200).send('Données de l\'item sauvegardées.'); }); }); });

// --- FICHIERS STATIQUES & ROUTE CATCH-ALL ---
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));