import React, { useState, useEffect } from 'react';
import AccueilView from './components/AccueilView';
import AtelierView from './components/AtelierView';
import QuizGeneratorView from './components/QuizGeneratorView';
import QuizView from './components/QuizView';

function App() {
  // --- ÉTATS ---
  const [view, setView] = useState('accueil'); // accueil, atelier, quizGenerator, quiz
  const [allCards, setAllCards] = useState([]);
  const [itemsData, setItemsData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);

  // --- LOGIQUE DE DONNÉES ---
  const loadData = async () => {
    try {
      const [cardsRes, itemsDataRes] = await Promise.all([ fetch('/api/cards'), fetch('/api/items-data') ]);
      setAllCards(await cardsRes.json());
      setItemsData(await itemsDataRes.json());
    } catch (e) { console.error("Erreur chargement:", e); }
  };
  useEffect(() => { loadData(); }, []);

  const handleSaveText = async (item, text) => {
    if (!item) return alert('Veuillez sélectionner un item.');
    await fetch('/api/items-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item, text }) });
    alert('Texte enregistré !');
    await loadData();
  };

  const handleAddNewItem = async (newItemName, callback) => {
    if (!newItemName.trim()) return alert('Le nom ne peut pas être vide.');
    const response = await fetch('/api/add-item', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newItemName: newItemName.trim() }) });
    if (response.ok) {
      if (callback) callback();
      await loadData();
      alert('Item ajouté !');
    } else {
      alert(await response.text());
    }
  };

  const handleLaunchQuiz = async (selectedItems, numQCM) => {
    if (!selectedItems || selectedItems.length === 0) return alert('Veuillez sélectionner au moins un item.');
    setIsLoading(true);
    const itemValues = selectedItems.map(item => item.value);
    const textsToQuiz = itemValues.map(item => itemsData[item]).filter(Boolean);
    try {
        const response = await fetch('/api/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: textsToQuiz, numQCM })
        });
        const data = await response.json();
        if (data.error || !data.questions) throw new Error(data.error || 'Pas de questions reçues');
        setQuizQuestions(data.questions);
        setView('quiz');
    } catch(e) {
        alert("Impossible de générer le quiz.");
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  // --- AFFICHAGE ---
  if (isLoading) { return <div id="loading-spinner"></div>; }

  switch (view) {
    case 'atelier':
      return <AtelierView navigateTo={setView} allCards={allCards} itemsData={itemsData} onSave={handleSaveText} onAddItem={handleAddNewItem} />;
    case 'quizGenerator':
      return <QuizGeneratorView navigateTo={setView} allCards={allCards} onLaunchQuiz={handleLaunchQuiz} />;
    case 'quiz':
      return <QuizView questions={quizQuestions} onQuizEnd={() => setView('quizGenerator')} />;
    case 'accueil':
    default:
      return <AccueilView navigateTo={setView} />;
  }
}

export default App;