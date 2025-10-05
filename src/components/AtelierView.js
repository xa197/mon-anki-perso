// Contenu complet à mettre dans AtelierView.js pour la gestion des items

import React, { useState, useEffect } from 'react';

// Reçoit une fonction pour revenir à l'accueil
function AtelierView({ navigateTo }) {
    const [items, setItems] = useState([]);
    const [newItemName, setNewItemName] = useState('');
    const [error, setError] = useState('');

    // Fonction pour charger la liste des items depuis le serveur
    const fetchItems = async () => {
        try {
            const response = await fetch('/api/cards');
            if (!response.ok) throw new Error('Erreur réseau');
            const cards = await response.json();
            // On extrait les noms uniques des "decks" pour avoir la liste des items
            const uniqueItems = [...new Set(cards.map(card => card.deck))];
            setItems(uniqueItems);
        } catch (err) {
            setError('Impossible de charger les items.');
        }
    };

    // useEffect se déclenche une fois au chargement du composant pour charger les données
    useEffect(() => {
        fetchItems();
    }, []);

    const handleAddItem = async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page
        if (!newItemName.trim()) {
            setError('Le nom de l\'item ne peut pas être vide.');
            return;
        }

        try {
            const response = await fetch('/api/add-item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newItemName: newItemName.trim() }),
            });

            if (response.status === 409) {
                setError('Cet item existe déjà.');
            } else if (!response.ok) {
                throw new Error('Erreur lors de l\'ajout.');
            } else {
                setNewItemName(''); // Vide le champ de saisie
                setError(''); // Efface les erreurs précédentes
                await fetchItems(); // Rafraîchit la liste des items
            }
        } catch (err) {
            setError(err.message);
        }
    };
    
    const handleDeleteItem = async (itemName) => {
        // On demande confirmation avant une action destructive
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'item "${itemName}" et toutes ses cartes ?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/items/${encodeURIComponent(itemName)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression.');
            }
            setError('');
            await fetchItems(); // Rafraîchit la liste
        } catch (err) {
            setError(err.message);
        }
    };


    return (
        <div className="view-container">
            <div className="quiz-header">
                {/* Assurez-vous d'avoir bien mis à jour App.js pour que navigateTo fonctionne */}
                <button onClick={() => navigateTo('accueil')}>← Retour</button>
                <h1>Atelier de Gestion</h1>
            </div>

            {/* Section pour ajouter un nouvel item */}
            <div className="item-management-section">
                <h2>Ajouter un nouvel item</h2>
                <form onSubmit={handleAddItem}>
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Nom du nouvel item"
                    />
                    <button type="submit">Ajouter</button>
                </form>
            </div>

            {/* Section pour lister et supprimer les items existants */}
            <div className="item-management-section">
                <h2>Items existants</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <ul className="items-list">
                    {items.length > 0 ? items.map(item => (
                        <li key={item}>
                            <span>{item}</span>
                            <button onClick={() => handleDeleteItem(item)} className="delete-btn">Supprimer</button>
                        </li>
                    )) : (
                        <p>Aucun item n'a été créé pour le moment.</p>
                    )}
                </ul>
            </div>
        </div>
    );
}

export default AtelierView;