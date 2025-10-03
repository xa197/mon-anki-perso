import React, { useState, useEffect } from 'react';

function AtelierView({ allCards, itemsData, onSave, onAddItem }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [text, setText] = useState('');
  const [newItemName, setNewItemName] = useState('');

  const sortedItems = Array.from(new Set(allCards.map(c => c.deck).filter(Boolean)))
    .sort((a, b) => parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10));

  useEffect(() => {
    setText(itemsData[selectedItem] || '');
  }, [selectedItem, itemsData]);

  const handleAddItem = () => {
    onAddItem(newItemName, () => setNewItemName(''));
  };

  return (
    <div className="view-container">
      <h2>Atelier de Contenu</h2>
      
      <div className="form-group">
        <input 
          type="text" 
          value={newItemName} 
          onChange={e => setNewItemName(e.target.value)} 
          placeholder="Nom du nouvel item (ex: 12: Nouveau cours)"
        />
        <button onClick={handleAddItem}>Ajouter Item</button>
      </div>
      
      <div className="form-group">
        <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
          <option value="">-- Consulter / Modifier un item --</option>
          {sortedItems.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      
      <textarea 
        value={text} 
        onChange={e => setText(e.target.value)}
        placeholder="Le contenu de l'item sélectionné apparaîtra ici..."
      />
      <button onClick={() => onSave(selectedItem, text)} disabled={!selectedItem}>Enregistrer le Texte</button>
    </div>
  );
}

export default AtelierView;