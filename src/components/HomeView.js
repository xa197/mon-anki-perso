import React, { useState, useEffect } from 'react';

// On reçoit la nouvelle fonction onSaveItem
function HomeView({ navigateTo, allCards, itemsData, onSaveItem }) {
  
  const [selectedItem, setSelectedItem] = useState('');
  const [workshopText, setWorkshopText] = useState('');

  const sortedItems = Array.from(new Set(allCards.map(c => c.deck).filter(Boolean)))
    .sort((a, b) => parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10));
  sortedItems.unshift("500: Divers");

  useEffect(() => {
    if (selectedItem && itemsData[selectedItem]) {
      setWorkshopText(itemsData[selectedItem] || '');
    } else {
      setWorkshopText('');
    }
  }, [selectedItem, itemsData]);

  const handleSaveClick = () => {
    if (!selectedItem) {
      alert('Veuillez choisir un item.');
      return;
    }
    // ON UTILISE LA FONCTION DU PARENT
    onSaveItem(selectedItem, workshopText);
  };

  return (
    <div id="home-view">
      <div className="home-container">
        <h1>Mon Anki Perso</h1>
        <div className="home-actions">{/* ... boutons ... */}
            <button onClick={() => navigateTo('review')} className="home-btn">Réviser</button>
            <button onClick={() => navigateTo('manage')} className="home-btn">Ajouter</button>
            <button onClick={() => navigateTo('library')} className="home-btn">Bibliothèque</button> 
        </div>
        <div className="workshop-container">
          <h2>Atelier de création rapide</h2>
          <div className="workshop-form">
            <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
              <option value="">-- Choisir un item --</option>
              {sortedItems.map(item => (<option key={item} value={item}>{item}</option>))}
            </select>
            <textarea value={workshopText} onChange={(e) => setWorkshopText(e.target.value)} />
            <button onClick={handleSaveClick}>Enregistrer le texte</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeView;