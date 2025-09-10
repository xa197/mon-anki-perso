import React, { useState, useEffect } from 'react';
import QuizView from './components/QuizView';

function App() {
  // --- ÉTATS PRINCIPAUX ---
  const [allCards, setAllCards] = useState([]);
  const [itemsData, setItemsData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // --- ÉTATS POUR LA RUBRIQUE 1 : ATELIER ---
  const [selectedItemAtelier, setSelectedItemAtelier] = useState('');
  const [atelierText, setAtelierText] = useState('');
  const [newItemName, setNewItemName] = useState('');

  // --- ÉTATS POUR LA RUBRIQUE 2 : QUIZ ---
  const [selectedItemsQuiz, setSelectedItemsQuiz] = useState(new Set());
  const [numQCM, setNumQCM] = useState(5);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isQuizActive, setIsQuizActive] = useState(false); // Cet état contrôle l'affichage

  // --- Fonctions de chargement et de sauvegarde ---
  const loadData = async () => {
    try {
      const [cardsRes, itemsDataRes] = await Promise.all([ fetch('/api/cards'), fetch('/api/items-data') ]);
      setAllCards(await cardsRes.json());
      setItemsData(await itemsDataRes.json());
    } catch (e) { console.error("Erreur chargement:", e); }
  };
  useEffect(() => { loadData(); }, []);

  const handleAddNewItem = async () => {
    if (!newItemName.trim()) return alert('Le nom ne peut pas être vide.');
    const response = await fetch('/api/add-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newItemName: newItemName.trim() })
    });
    if (response.ok) {
      setNewItemName('');
      await loadData();
      alert('Item ajouté !');
    } else {
      alert(await response.text());
    }
  };

  const handleSaveText = async () => {
    if (!selectedItemAtelier) return alert('Veuillez sélectionner un item.');
    await fetch('/api/items-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: selectedItemAtelier, text: atelierText })
    });
    alert('Texte enregistré !');
    await loadData();
  };
  
  const handleAtelierSelectChange = (e) => {
    const item = e.target.value;
    setSelectedItemAtelier(item);
    setAtelierText(itemsData[item] || '');
  };

  // --- LOGIQUE QUIZ ---
  const handleQuizItemToggle = (itemName) => {
    const newSelection = new Set(selectedItemsQuiz);
    if (newSelection.has(itemName)) {
      newSelection.delete(itemName);
    } else {
      newSelection.add(itemName);
    }
    setSelectedItemsQuiz(newSelection);
  };

  const handleLaunchQuiz = async () => {
    if (selectedItemsQuiz.size === 0) return alert('Veuillez sélectionner au moins un item.');
    setIsLoading(true);
    const textsToQuiz = Array.from(selectedItemsQuiz).map(item => itemsData[item]).filter(Boolean);
    try {
        const response = await fetch('/api/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: textsToQuiz, numQCM })
        });
        const data = await response.json();
        if (data.error || !data.questions) throw new Error(data.error || 'Pas de questions reçues');
        setQuizQuestions(data.questions);
        setIsQuizActive(true); // On active la vue du quiz
    } catch(e) {
        alert("Impossible de générer le quiz.");
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  // --- AFFICHAGE ---
  const sortedItems = Array.from(new Set(allCards.map(c => c.deck).filter(Boolean)))
    .sort((a, b) => parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10));

  if (isLoading) {
    return <div id="loading-spinner"></div>;
  }

  // Si le quiz est actif, on affiche UNIQUEMENT la vue du quiz
  if (isQuizActive) {
    return <QuizView questions={quizQuestions} onQuizEnd={() => setIsQuizActive(false)} />;
  }

  // Sinon (par défaut), on affiche la page principale avec les deux rubriques
  return (
    <div className="main-container">
      {/* --- RUBRIQUE 1 : ATELIER --- */}
      <section className="rubrique">
        <h2>Atelier de Contenu</h2>
        <div className="form-group">
          <input 
            type="text" 
            value={newItemName} 
            onChange={e => setNewItemName(e.target.value)} 
            placeholder="Nom du nouvel item (ex: 12: Nouveau cours)"
          />
          <button onClick={handleAddNewItem}>Ajouter Item</button>
        </div>
        <div className="form-group">
          <select value={selectedItemAtelier} onChange={handleAtelierSelectChange}>
            <option value="">-- Consulter / Modifier un item --</option>
            {sortedItems.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <textarea 
          value={atelierText} 
          onChange={e => setAtelierText(e.target.value)}
          placeholder="Le contenu de l'item sélectionné apparaîtra ici..."
        />
        <button onClick={handleSaveText} disabled={!selectedItemAtelier}>Enregistrer le Texte</button>
      </section>

      {/* --- RUBRIQUE 2 : QUIZ --- */}
      <section className="rubrique">
        <h2>Générateur de Quiz</h2>
        <p>Choisissez les items à inclure :</p>
        <div className="checkbox-group">
          {sortedItems.map(item => (
            <label key={item}>
              <input 
                type="checkbox" 
                checked={selectedItemsQuiz.has(item)}
                onChange={() => handleQuizItemToggle(item)}
              />
              {item}
            </label>
          ))}
        </div>
        <div className="form-group">
          <label>Nombre de QCM :</label>
          <input 
            type="number"
            value={numQCM}
            onChange={e => setNumQCM(parseInt(e.target.value))}
            min="1"
          />
        </div>
        <button onClick={handleLaunchQuiz}>Lancer le Quiz</button>
      </section>
    </div>
  );
}

export default App;