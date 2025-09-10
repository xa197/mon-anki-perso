import React, { useState } from 'react';
import Select from 'react-select'; // On importe la librairie

function QuizGeneratorView({ navigateTo, allCards, onLaunchQuiz }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [numQCM, setNumQCM] = useState(5);

  const itemOptions = Array.from(new Set(allCards.map(c => c.deck).filter(Boolean)))
    .sort((a, b) => parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10))
    .map(item => ({ value: item, label: item })); // Format requis par react-select

  // Styles personnalisés pour que react-select s'intègre à notre thème sombre
  const customStyles = {
    control: (provided) => ({ ...provided, backgroundColor: '#3e5062', borderColor: '#4a6572' }),
    menu: (provided) => ({ ...provided, backgroundColor: '#3e5062' }),
    option: (provided, state) => ({ ...provided, backgroundColor: state.isFocused ? '#2c3e50' : '#3e5062', color: '#ecf0f1' }),
    multiValue: (provided) => ({ ...provided, backgroundColor: '#3498db' }),
    multiValueLabel: (provided) => ({ ...provided, color: 'white' }),
  };

  return (
    <div className="view-container">
      <button className="back-btn" onClick={() => navigateTo('accueil')}>← Accueil</button>
      <h2>Générateur de Quiz</h2>
      
      <label>Choisissez les items à inclure :</label>
      <Select
        isMulti
        options={itemOptions}
        value={selectedItems}
        onChange={setSelectedItems}
        styles={customStyles}
        placeholder="Rechercher et sélectionner des items..."
      />
      
      <div className="form-group" style={{ marginTop: '20px' }}>
        <label>Nombre de QCM :</label>
        <input type="number" value={numQCM} onChange={e => setNumQCM(parseInt(e.target.value))} min="1" />
      </div>
      
      <button onClick={() => onLaunchQuiz(selectedItems, numQCM)}>Lancer le Quiz</button>
    </div>
  );
}

export default QuizGeneratorView;