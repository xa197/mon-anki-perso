# Mon Anki Perso

Ceci est une application personnelle de type Anki (système de répétition espacée) conçue pour la révision de cours, notamment en médecine. Elle permet de gérer des notes par "item" (cours) et de générer des QCM via une IA pour s'entraîner.

---

## Architecture Technique

Le projet est une application web complète qui se compose de deux parties principales :

1.  **Frontend (Client)** : Une interface utilisateur moderne construite avec **React**. Le code source se trouve dans le dossier `/src`.
2.  **Backend (Serveur)** : Un serveur **Node.js** avec le framework **Express**. Il gère la logique métier, la sauvegarde des données dans des fichiers JSON et les appels à l'API de Google Gemini. Le code du serveur se trouve dans `server.js`.

---

## Lancer le Projet en Local

Pour faire fonctionner l'application sur un ordinateur (Mac/Windows/Linux), suivez ces étapes.

### Prérequis

*   **Node.js** (version 18 ou supérieure)
*   **VS Code** ou un autre éditeur de code

### Étapes d'installation

1.  **Cloner le projet depuis GitHub :**
    ```bash
    git clone https://github.com/xa197/mon-anki-perso.git
    ```

2.  **Se placer dans le dossier du projet :**
    ```bash
    cd mon-anki-perso
    ```

3.  **Installer les dépendances :**
    Cette commande lit le `package.json` et télécharge toutes les librairies nécessaires (React, Express, etc.).
    ```bash
    npm install
    ```

4.  **Créer le fichier d'environnement :**
    Créez un fichier nommé `.env` à la racine du projet et ajoutez votre clé d'API Google :
    ```
    GOOGLE_API_KEY=VOTRE_CLE_API_ICI
    ```

### Lancement

L'application doit être "construite" avant d'être lancée.

1.  **Construire l'application React :**
    Cette commande prend le code du dossier `/src` et le transforme en fichiers optimisés dans un nouveau dossier `/build`. **Cette étape est obligatoire à chaque modification du code du frontend.**
    ```bash
    npm run build
    ```

2.  **Démarrer le serveur :**
    Cette commande lance le serveur Node.js, qui va servir l'application construite.
    ```bash
    npm run start:server
    ```

3.  **Accéder à l'application :**
    Ouvrez votre navigateur et allez à l'adresse : **[http://localhost:3000](http://localhost:3000)**

---

## Structure des Fichiers Clés

*   `/src/App.js`: Le composant principal de l'application React. Il gère la navigation et l'état global.
*   `/src/components/`: Contient les différents "écrans" (pages) de l'application.
*   `/src/style.css`: La feuille de style principale.
*   `/server.js`: Le serveur backend qui gère toute la logique.
*   `/cartes.json`: La "base de données" qui stocke les flashcards.
*   `/items_data.json`: La "base de données" qui stocke les notes textuelles pour chaque item.