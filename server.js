const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = 3000;

// Configuration de Multer pour le stockage des images
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// Middlewares
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const cardsFilePath = path.join(__dirname, 'cartes.json');

// --- API ---

// Route pour téléverser une image
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Aucun fichier téléversé.');
    }
    res.json({ filePath: `/uploads/${req.file.filename}` });
});

// Route GET améliorée pour être plus robuste
app.get('/api/cards', (req, res) => {
    fs.readFile(cardsFilePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') return res.json([]); // Si le fichier n'existe pas, renvoie un tableau vide
            return res.status(500).send('Erreur lors de la lecture des cartes.');
        }
        try {
            const cards = JSON.parse(data);
            res.json(cards);
        } catch (parseError) {
            console.error("ERREUR DE PARSING JSON:", parseError);
            res.status(500).send('Le fichier cartes.json est corrompu ou mal formé.');
        }
    });
});

// Route POST pour sauvegarder toutes les cartes
app.post('/api/cards', (req, res) => {
    fs.writeFile(cardsFilePath, JSON.stringify(req.body, null, 2), 'utf8', (err) => {
        if (err) return res.status(500).send('Erreur lors de la sauvegarde.');
        res.status(200).send('Sauvegardé.');
    });
});

// Route PUT pour mettre à jour une seule carte
app.put('/api/cards/:id', (req, res) => {
    const cardId = parseInt(req.params.id, 10);
    const updatedData = req.body;
    fs.readFile(cardsFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Erreur lecture.');
        let cards = JSON.parse(data);
        const i = cards.findIndex(c => c.id === cardId);
        if (i === -1) return res.status(404).send('Non trouvé.');
        cards[i] = { ...cards[i], ...updatedData };
        fs.writeFile(cardsFilePath, JSON.stringify(cards, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).send('Erreur sauvegarde.');
            res.status(200).json(cards[i]);
        });
    });
});

// Route DELETE pour supprimer une seule carte
app.delete('/api/cards/:id', (req, res) => {
    const cardId = parseInt(req.params.id, 10);
    fs.readFile(cardsFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Erreur lecture.');
        let cards = JSON.parse(data);
        const filtered = cards.filter(c => c.id !== cardId);
        fs.writeFile(cardsFilePath, JSON.stringify(filtered, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).send('Erreur suppression.');
            res.status(200).send('Supprimé.');
        });
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});