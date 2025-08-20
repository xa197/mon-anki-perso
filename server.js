const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = 3000;

// Configuration et Middlewares (inchangés)
const storage = multer.diskStorage({ destination: (req, file, cb) => cb(null, 'uploads/'), filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)) });
const upload = multer({ storage: storage });
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const cardsFilePath = path.join(__dirname, 'cartes.json');
// NOUVEAU : Chemin vers notre nouveau fichier de données
const itemsDataPath = path.join(__dirname, 'items_data.json');

// --- API ---

// Routes pour les cartes (inchangées)
app.post('/api/upload', upload.single('image'), (req, res) => { if (!req.file) return res.status(400).send('Aucun fichier.'); res.json({ filePath: `/uploads/${req.file.filename}` }); });
app.get('/api/cards', (req, res) => { fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) { if (err.code === 'ENOENT') return res.json([]); return res.status(500).send('Erreur lecture cartes.'); } try { res.json(JSON.parse(data)); } catch (e) { res.status(500).send('Fichier cartes.json corrompu.'); } }); });
app.post('/api/cards', (req, res) => { fs.writeFile(cardsFilePath, JSON.stringify(req.body, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde.'); res.status(200).send('Sauvegardé.'); }); });
app.put('/api/cards/:id', (req, res) => { const cardId = parseInt(req.params.id, 10); const updatedData = req.body; fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) return res.status(500).send('Erreur lecture.'); let cards = JSON.parse(data); const i = cards.findIndex(c => c.id === cardId); if (i === -1) return res.status(404).send('Non trouvé.'); cards[i] = { ...cards[i], ...updatedData }; fs.writeFile(cardsFilePath, JSON.stringify(cards, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde.'); res.status(200).json(cards[i]); }); }); });
app.delete('/api/cards/:id', (req, res) => { const cardId = parseInt(req.params.id, 10); fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) return res.status(500).send('Erreur lecture.'); let cards = JSON.parse(data); const filtered = cards.filter(c => c.id !== cardId); fs.writeFile(cardsFilePath, JSON.stringify(filtered, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur suppression.'); res.status(200).send('Supprimé.'); }); }); });


// --- NOUVELLES ROUTES POUR LES DONNÉES DES ITEMS ---

// GET /api/items-data : pour récupérer tous les textes des items
app.get('/api/items-data', (req, res) => {
    fs.readFile(itemsDataPath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') return res.json({}); // Si le fichier n'existe pas, renvoie un objet vide
            return res.status(500).send('Erreur lecture données items.');
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.status(500).send('Fichier items_data.json corrompu.');
        }
    });
});

// POST /api/items-data : pour sauvegarder le texte d'un item
app.post('/api/items-data', (req, res) => {
    const { item, text } = req.body;
    if (!item) {
        return res.status(400).send('Nom de l\'item manquant.');
    }

    fs.readFile(itemsDataPath, 'utf8', (err, data) => {
        let itemsData = {};
        if (!err) {
            try { itemsData = JSON.parse(data); } catch (e) { /* Fichier corrompu, on l'écrase */ }
        }
        
        itemsData[item] = text; // Met à jour ou ajoute le texte pour l'item

        fs.writeFile(itemsDataPath, JSON.stringify(itemsData, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).send('Erreur sauvegarde données item.');
            res.status(200).send('Données de l\'item sauvegardées.');
        });
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});