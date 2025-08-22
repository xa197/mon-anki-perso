require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
const PORT = 3000;

// --- CONFIGURATION ---
if (!process.env.GOOGLE_API_KEY) { console.error("ERREUR CRITIQUE: GOOGLE_API_KEY non définie."); process.exit(1); }
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const storage = multer.diskStorage({ destination: (req, file, cb) => cb(null, 'uploads/'), filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)) });
const upload = multer({ storage: storage });
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const cardsFilePath = path.join(__dirname, 'cartes.json');
const itemsDataPath = path.join(__dirname, 'items_data.json');

// --- API ---

// Route pour générer un quiz (inchangée)
app.post('/api/generate-questions', async (req, res) => { /* ... code inchangé ... */ });

// NOUVELLE ROUTE : pour générer des flashcards
app.post('/api/generate-cards', async (req, res) => {
    const { text, item } = req.body;
    if (!text || !item) {
        return res.status(400).send("Le texte ou l'item est manquant.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const prompt = `
        **Instruction :** Tu es un assistant qui crée des flashcards (cartes de révision) pour un étudiant en médecine.
        **Format de sortie obligatoire :** Réponds UNIQUEMENT avec un objet JSON valide. L'objet doit contenir une clé "newCards" qui est un tableau d'objets. Chaque objet représente une carte et doit avoir deux clés : "recto" (la question ou le terme) et "verso" (la réponse ou la définition).
        
        **Tâche :** Crée 5 flashcards pertinentes, concises et efficaces à partir du texte suivant. Les questions doivent être claires et les réponses précises.
        
        --- DEBUT DU TEXTE ---
        ${text}
        --- FIN DU TEXTE ---
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        let jsonResponse = response.text().trim();
        if (jsonResponse.startsWith('```json')) {
            jsonResponse = jsonResponse.substring(7, jsonResponse.length - 3).trim();
        }

        const generatedData = JSON.parse(jsonResponse);
        
        // Lire le fichier de cartes existant
        fs.readFile(cardsFilePath, 'utf8', (err, data) => {
            if (err) return res.status(500).send('Erreur lecture cartes.');
            let cards = JSON.parse(data);

            // Ajouter les nouvelles cartes générées
            generatedData.newCards.forEach(newCard => {
                cards.push({
                    id: Date.now() + Math.random(), // ID unique
                    deck: item,
                    recto: newCard.recto,
                    verso: newCard.verso,
                    rectoImage: null,
                    versoImage: null,
                    interval: 1,
                    easeFactor: 2.5,
                    nextReview: new Date().toISOString()
                });
            });

            // Sauvegarder le fichier mis à jour
            fs.writeFile(cardsFilePath, JSON.stringify(cards, null, 2), 'utf8', (err) => {
                if (err) return res.status(500).send('Erreur sauvegarde nouvelles cartes.');
                res.status(200).json({ message: `${generatedData.newCards.length} cartes ont été créées avec succès !`, newCards: generatedData.newCards });
            });
        });

    } catch (error) {
        console.error("Erreur de l'API Google Gemini (génération de cartes):", error);
        res.status(500).send("Une erreur est survenue lors de la génération des cartes par l'IA.");
    }
});


// Les autres routes restent inchangées...
app.post('/api/upload', upload.single('image'), (req, res) => { if (!req.file) return res.status(400).send('Aucun fichier.'); res.json({ filePath: `/uploads/${req.file.filename}` }); });
app.get('/api/cards', (req, res) => { fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) { if (err.code === 'ENOENT') return res.json([]); return res.status(500).send('Erreur lecture cartes.'); } try { res.json(JSON.parse(data)); } catch (e) { res.status(500).send('Fichier cartes.json corrompu.'); } }); });
app.get('/api/items-data', (req, res) => { fs.readFile(itemsDataPath, 'utf8', (err, data) => { if (err) { if (err.code === 'ENOENT') return res.json({}); return res.status(500).send('Erreur lecture données items.'); } if (data.trim() === '') return res.json({}); try { res.json(JSON.parse(data)); } catch (e) { res.status(500).send('Fichier items_data.json corrompu.'); } }); });
app.post('/api/cards', (req, res) => { fs.writeFile(cardsFilePath, JSON.stringify(req.body, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde.'); res.status(200).send('Sauvegardé.'); }); });
app.put('/api/cards/:id', (req, res) => { const cardId = parseInt(req.params.id, 10); const updatedData = req.body; fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) return res.status(500).send('Erreur lecture.'); let cards = JSON.parse(data); const i = cards.findIndex(c => c.id === cardId); if (i === -1) return res.status(404).send('Non trouvé.'); cards[i] = { ...cards[i], ...updatedData }; fs.writeFile(cardsFilePath, JSON.stringify(cards, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde.'); res.status(200).json(cards[i]); }); }); });
app.delete('/api/cards/:id', (req, res) => { const cardId = parseInt(req.params.id, 10); fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) return res.status(500).send('Erreur lecture.'); let cards = JSON.parse(data); const filtered = cards.filter(c => c.id !== cardId); fs.writeFile(cardsFilePath, JSON.stringify(filtered, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur suppression.'); res.status(200).send('Supprimé.'); }); }); });
app.post('/api/items-data', (req, res) => { const { item, text } = req.body; if (!item) return res.status(400).send('Nom de l\'item manquant.'); fs.readFile(itemsDataPath, 'utf8', (err, data) => { let itemsData = {}; if (!err && data.trim() !== '') { try { itemsData = JSON.parse(data); } catch (e) { /* on écrase */ } } itemsData[item] = text; fs.writeFile(itemsDataPath, JSON.stringify(itemsData, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde données item.'); res.status(200).send('Données de l\'item sauvegardées.'); }); }); });
app.listen(PORT, () => { console.log(`Serveur démarré sur http://localhost:${PORT}`); });

// Pour la clarté, la route generate-questions a été laissée en pseudo-code en haut, voici sa version complète :
app.post('/api/generate-questions', async (req, res) => { const { text } = req.body; if (!text) return res.status(400).send("Le texte est manquant."); try { const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); const prompt = `**Instruction :** Tu es un assistant expert en création de matériel pédagogique pour des étudiants en médecine. Ton rôle est de générer des questions pertinentes à partir du texte fourni. **Format de sortie obligatoire :** Réponds UNIQUEMENT avec un objet JSON valide. Ne rien inclure avant ou après le JSON. **Structure du JSON :** L'objet JSON doit contenir une clé "questions" qui est un tableau d'objets. Chaque objet question doit avoir : une clé "type" ('QCM' ou 'QRU'), une clé "question" (la question elle-même), une clé "options" (un tableau de 4 chaînes de caractères pour un QCM, ou un tableau vide pour une QRU), et une clé "answer" (la réponse correcte, qui doit être l'une des 4 options pour un QCM). **Tâche :** Génère 3 QCM et 2 QRU (questions à réponse unique) à partir du texte suivant : --- DEBUT DU TEXTE --- ${text} --- FIN DU TEXTE ---`; const result = await model.generateContent(prompt); const response = await result.response; let jsonResponse = response.text().trim(); if (jsonResponse.startsWith('```json')) { jsonResponse = jsonResponse.substring(7, jsonResponse.length - 3).trim(); } res.json(JSON.parse(jsonResponse)); } catch (error) { console.error("Erreur de l'API Google Gemini:", error); res.status(500).send("Une erreur est survenue lors de la génération des questions par l'IA."); } });