const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.json());

const cardsFilePath = path.join(__dirname, 'cartes.json');

// --- API ---

// GET /api/cards - Obtenir toutes les cartes (inchangé)
app.get('/api/cards', (req, res) => {
    fs.readFile(cardsFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Erreur lecture cartes.');
        res.json(JSON.parse(data));
    });
});

// POST /api/cards - Sauvegarder TOUTES les cartes (inchangé)
// Utile pour la synchronisation générale et l'ajout de nouvelles cartes
app.post('/api/cards', (req, res) => {
    const newCardsData = req.body;
    fs.writeFile(cardsFilePath, JSON.stringify(newCardsData, null, 2), 'utf8', (err) => {
        if (err) return res.status(500).send('Erreur sauvegarde cartes.');
        res.status(200).send('Cartes sauvegardées.');
    });
});

// NOUVEAU : PUT /api/cards/:id - Mettre à jour UNE SEULE carte
app.put('/api/cards/:id', (req, res) => {
    const cardId = parseInt(req.params.id, 10);
    const updatedCardData = req.body;

    fs.readFile(cardsFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Erreur lecture cartes.');
        
        let cards = JSON.parse(data);
        const cardIndex = cards.findIndex(c => c.id === cardId);

        if (cardIndex === -1) {
            return res.status(404).send('Carte non trouvée.');
        }
        
        // On met à jour la carte en gardant ses stats de révision
        cards[cardIndex] = { ...cards[cardIndex], ...updatedCardData };
        
        fs.writeFile(cardsFilePath, JSON.stringify(cards, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).send('Erreur sauvegarde carte.');
            res.status(200).json(cards[cardIndex]);
        });
    });
});

// NOUVEAU : DELETE /api/cards/:id - Supprimer UNE SEULE carte
app.delete('/api/cards/:id', (req, res) => {
    const cardId = parseInt(req.params.id, 10);

    fs.readFile(cardsFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Erreur lecture cartes.');
        
        let cards = JSON.parse(data);
        const filteredCards = cards.filter(c => c.id !== cardId);

        if (cards.length === filteredCards.length) {
            return res.status(404).send('Carte non trouvée.');
        }

        fs.writeFile(cardsFilePath, JSON.stringify(filteredCards, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).send('Erreur suppression carte.');
            res.status(200).send('Carte supprimée.');
        });
    });
});


// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});