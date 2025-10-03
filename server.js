// Contenu complet pour server.js - Copiez et remplacez tout votre fichier

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialisation du client OpenAI
if (!process.env.OPENAI_API_KEY) { console.error("ERREUR: OPENAI_API_KEY non définie."); process.exit(1); }
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());
const cardsFilePath = path.join(__dirname, 'cartes.json');
const itemsDataPath = path.join(__dirname, 'items_data.json');

// --- ROUTES API ---

app.post('/api/generate-questions', async (req, res) => {
    const { texts, numQCM } = req.body;
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ error: "Aucun texte fourni." });
    }
    const qcmCount = parseInt(numQCM, 10) || 5;
    const combinedText = texts.join('\n\n---\n\n');

    try {
        // ----- MODIFICATION DU PROMPT -----
        const systemPrompt = `Tu es un assistant expert en création de matériel pédagogique pour des étudiants en médecine.
        Réponds UNIQUEMENT avec un objet JSON valide. Ne rien inclure avant ou après le JSON. N'utilise pas de blocs de code Markdown (\`\`\`json).
        La structure du JSON doit contenir une clé "questions" qui est un tableau d'objets. Chaque objet question doit avoir : une clé "type" ('QCM'), une clé "question", une clé "options" (un tableau de 4 ou 5 chaînes de caractères), et une clé "answers" (un TABLEAU contenant une ou plusieurs réponses correctes, qui doivent être issues des options).`;

        const userPrompt = `Génère ${qcmCount} QCM à partir du texte suivant. Assure-toi que certaines questions aient une seule bonne réponse et d'autres PLUSIEURS bonnes réponses :
        --- DEBUT DU TEXTE ---
        ${combinedText}
        --- FIN DU TEXTE ---`;
        // ----- FIN DE LA MODIFICATION -----

        console.log("Appel à l'API OpenAI...");
        
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" } 
        });

        const jsonString = response.choices[0].message.content;
        const data = JSON.parse(jsonString);
        
        console.log("Réponse d'OpenAI reçue et parsée avec succès !");
        res.status(200).json(data);

    } catch (error) {
        console.error("Erreur génération quiz OpenAI:", error.message);
        res.status(500).json({ error: "Erreur IA." });
    }
});

// Le reste de vos routes
app.post('/api/add-item', (req, res) => {
    const { newItemName } = req.body;
    if (!newItemName || newItemName.trim() === '') { return res.status(400).send('Le nom de l\'item ne peut pas être vide.'); }
    fs.readFile(cardsFilePath, 'utf8', (err, data) => {
        let cards = [];
        if (!err && data) { try { cards = JSON.parse(data); } catch (e) {} }
        const itemExists = cards.some(card => card.deck === newItemName);
        if (itemExists) { return res.status(409).send('Cet item existe déjà.'); }
        const placeholderCard = { id: Date.now(), deck: newItemName, recto: "Carte initiale", verso: "Carte initiale", nextReview: new Date().toISOString() };
        cards.push(placeholderCard);
        fs.writeFile(cardsFilePath, JSON.stringify(cards, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).send('Erreur sauvegarde.');
            res.status(201).send('Item créé avec succès.');
        });
    });
});

app.get('/api/cards', (req, res) => { fs.readFile(cardsFilePath, 'utf8', (err, data) => { if (err) { if (err.code === 'ENOENT') return res.json([]); return res.status(500).send('Erreur lecture cartes.'); } try { res.json(JSON.parse(data)); } catch (e) { res.status(500).send('Fichier cartes.json corrompu.'); } }); });
app.get('/api/items-data', (req, res) => { fs.readFile(itemsDataPath, 'utf8', (err, data) => { if (err) { if (err.code === 'ENOENT') return res.json({}); return res.status(500).send('Erreur lecture données items.'); } if (data.trim() === '') return res.json({}); try { res.json(JSON.parse(data)); } catch (e) { res.status(500).send('Fichier items_data.json corrompu.'); } }); });
app.post('/api/items-data', (req, res) => { const { item, text } = req.body; if (!item) return res.status(400).send('Nom de l\'item manquant.'); fs.readFile(itemsDataPath, 'utf8', (err, data) => { let itemsData = {}; if (!err && data.trim() !== '') { try { itemsData = JSON.parse(data); } catch (e) {} } itemsData[item] = text; fs.writeFile(itemsDataPath, JSON.stringify(itemsData, null, 2), 'utf8', (err) => { if (err) return res.status(500).send('Erreur sauvegarde données item.'); res.status(200).send('Données de l\'item sauvegardées.'); }); }); });

// --- FICHIERS STATIQUES & ROUTE CATCH-ALL ---
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));