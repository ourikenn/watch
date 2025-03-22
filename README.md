# WatchParty - Application de visionnage en groupe

WatchParty est une application web qui permet à plusieurs utilisateurs de regarder des vidéos YouTube et d'autres plateformes ensemble, en synchronisant la lecture et en discutant en temps réel.

## Configuration de l'API YouTube

Pour utiliser la fonctionnalité de recherche de vidéos YouTube, vous devez configurer une clé API YouTube Data v3. Voici comment procéder :

1. **Créer un projet Google Cloud**
   - Allez sur [Google Cloud Console](https://console.cloud.google.com/)
   - Connectez-vous avec votre compte Google
   - Créez un nouveau projet en cliquant sur le sélecteur de projet en haut de la page

2. **Activer l'API YouTube Data v3**
   - Dans le menu de navigation, allez à "APIs et Services" > "Bibliothèque"
   - Recherchez "YouTube Data API v3" et sélectionnez-la
   - Cliquez sur le bouton "Activer"

3. **Créer une clé API**
   - Dans le menu de navigation, allez à "APIs et Services" > "Identifiants"
   - Cliquez sur "Créer des identifiants" et sélectionnez "Clé API"
   - Une boîte de dialogue affichera votre nouvelle clé API
   - Copiez cette clé

4. **Configurer l'application**
   - Ouvrez le fichier `.env` à la racine du projet
   - Remplacez `YOUR_YOUTUBE_API_KEY` par la clé API que vous avez copiée
   - Exemple : `YOUTUBE_API_KEY=AIzaSyD5XbF5gHGJ6VhH3m0l7Kn1Z5XzY5yYyYy`

5. **Redémarrer le serveur**
   - La nouvelle clé API sera prise en compte

## Notes importantes

- La clé API YouTube a des quotas limités (généralement 10 000 unités par jour)
- Chaque recherche consomme environ 100 unités
- Nous recommandons de restreindre l'utilisation de votre clé API :
  - Allez dans "Identifiants" > cliquez sur votre clé API
  - Sous "Restrictions des requêtes API", sélectionnez "Restreindre la clé"
  - Choisissez "YouTube Data API v3" dans la liste déroulante

## Fonctionnalités de l'application

- Création et partage de rooms pour regarder des vidéos en groupe
- Recherche de vidéos YouTube
- Chat en temps réel
- Contrôles de lecture synchronisés
- Gestion de playlist
- Support pour différentes sources vidéo (YouTube, Vimeo, Dailymotion, fichiers directs)

## Installation et démarrage

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

L'application sera accessible à l'adresse : http://localhost:3000

## Déploiement sur Render

1. Créez un compte sur [Render](https://render.com)
2. Connectez votre compte GitHub à Render
3. Créez un nouveau Web Service
4. Sélectionnez le dépôt de votre projet WatchParty
5. Utilisez ces paramètres:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

Une fois déployé, vous recevrez une URL comme `https://watchparty-xxxx.onrender.com`

## Configuration dans l'application

1. Ouvrez l'application
2. Cliquez sur "Serveur" dans la barre de navigation
3. Entrez l'URL complète de votre service Render
4. Cliquez sur "Enregistrer"

Vos utilisateurs pourront maintenant se connecter directement à votre application déployée!

## Utilisation

1. Créez une salle en cliquant sur "Créer une room"
2. Partagez l'ID de la salle ou le lien avec vos amis
3. Ils peuvent rejoindre en saisissant l'ID sur la page d'accueil ou en utilisant le lien direct
4. Une fois dans la salle, vous pouvez ajouter des vidéos et discuter en temps réel

## Développement local

```
npm install
npm run dev
```

Le serveur sera accessible sur http://localhost:3000

## Fonctionnalités

- Création de rooms pour regarder des vidéos ensemble
- Synchronisation en temps réel de la lecture vidéo
- Chat en direct pendant le visionnage
- Liste de lecture collaborative
- Support des vidéos YouTube
- Interface responsive adaptée à tous les appareils

## Technologies utilisées

- HTML5
- CSS3 (Flexbox, Grid, Variables CSS)
- JavaScript (ES6+)
- API YouTube
- WebRTC (simulé pour la version actuelle)

## Structure du projet

```
watchparty/
│
├── index.html              # Page d'accueil
├── room.html               # Page de room de visionnage
├── css/
│   ├── style.css           # Styles globaux
│   └── room.css            # Styles spécifiques à la room
├── js/
│   ├── main.js             # JavaScript pour la page d'accueil
│   └── room.js             # JavaScript pour la room de visionnage
└── img/
    └── hero-image.svg      # Image d'illustration
```

## Limitations actuelles

Cette version est un prototype fonctionnel, avec quelques limitations :

- La communication en temps réel est simulée (pas de vraie connexion WebRTC)
- Seules les vidéos YouTube sont prises en charge
- Les données ne sont pas persistantes entre les sessions (localStorage uniquement)

## Développement futur

Voici les améliorations prévues pour les versions futures :

- Implémentation complète de WebRTC pour la communication en temps réel
- Support pour d'autres plateformes vidéo (Vimeo, Dailymotion, etc.)
- Système d'authentification des utilisateurs
- Base de données pour la persistance des rooms et des utilisateurs
- Personnalisation avancée de l'interface
- Applications mobiles natives

## Licence

Ce projet est sous licence MIT. Vous êtes libre de l'utiliser, le modifier et le distribuer.

---

Créé par [Votre Nom] - [Année] 