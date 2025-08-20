const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000; // On choisit le port 3000

// Middleware pour servir les fichiers statiques (html, css, js, images)
app.use(express.static(path.join(__dirname)));
// Middleware pour comprendre le JSON envoyé par le client
app.use(express.json());

const cardsFilePath = path.join(__dirname, 'cartes.json');

// --- API : La communication entre le frontend et le backend ---

// 1. API pour OBTENIR toutes les cartes
app.get('/api/cards', (req, res) => {
    fs.readFile(cardsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erreur lors de la lecture des cartes.');
        }
        res.json(JSON.parse(data));
    });
});

// 2. API pour SAUVEGARDER toutes les cartes (on envoie tout le paquet d'un coup)
app.post('/api/cards', (req, res) => {
    const newCardsData = req.body; // Les nouvelles données envoyées par le client

    fs.writeFile(cardsFilePath, JSON.stringify(newCardsData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erreur lors de la sauvegarde des cartes.');
        }
        res.status(200).send('Cartes sauvegardées avec succès !');
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log('Votre application est maintenant une application web complète !');
});