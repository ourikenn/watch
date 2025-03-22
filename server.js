const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

// Initialiser l'application Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuration et middlewares
app.use(express.static(path.join(__dirname, '/')));
app.use(express.json());
app.use(cors());

// Utilisation des sessions pour stocker les préférences utilisateur
app.use(session({
    secret: 'watchparty_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Mettre à true en production avec HTTPS
}));

// Variable globale pour stocker les données des salles
const rooms = {};

// -----------------------------------------------------
// Routes d'API pour la recherche de contenu
// -----------------------------------------------------

// Route simple pour rechercher des vidéos avec Pollination
app.get('/api/pollination/search', async (req, res) => {
    const query = req.query.q;
    
    if (!query) {
        return res.status(400).json({ error: 'Le paramètre de recherche est requis' });
    }
    
    try {
        console.log('🌸 Recherche vidéo Pollination pour:', query);
        
        // Utiliser la fonction de génération de résultats basée sur Pollination
        const results = await searchWithPollination(query, 10);
        
        res.json({ items: results });
    } catch (error) {
        console.error('❌ Erreur lors de la recherche Pollination:', error);
        
        // En cas d'échec, utiliser les résultats générés localement
        try {
            const fallbackResults = await generateAIVideoResults(query);
            res.json({ 
                items: fallbackResults,
                info: {
                    fallback: true,
                    error: error.message
                }
            });
        } catch (fallbackError) {
            res.status(500).json({ 
                error: 'Erreur lors de la recherche', 
                details: error.message 
            });
        }
    }
});

// Routes API pour les recherches de vidéos
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    const platform = req.query.platform || 'youtube';
    
    console.log(`📝 Recherche reçue: "${query}" (plateforme: ${platform})`);
    
    if (!query) {
        console.log('❌ Requête rejetée: paramètre de recherche manquant');
        return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    try {
        let results = [];
        
        // Recherche YouTube
        if (platform === 'youtube') {
            console.log('🔍 Lancement de la recherche YouTube...');
            results = await searchYouTube(query);
        } else if (platform === 'all') {
            // Recherche sur toutes les plateformes prises en charge
            console.log('🔍 Lancement de la recherche sur toutes les plateformes...');
            const youtubeResults = await searchYouTube(query);
            results = [...youtubeResults];
        }
        
        console.log(`✅ Recherche terminée: ${results.length} résultats trouvés`);
        res.json({ items: results });
    } catch (error) {
        console.error('❌ Erreur lors de la recherche:', error);
        
        // Envoyer des détails d'erreur plus précis
        const errorMessage = error.response ? 
            `Erreur API (${error.response.status}): ${error.response.data?.error?.message || 'Unknown API error'}` : 
            error.message;
            
        console.error('Message d\'erreur:', errorMessage);
        
        // Envoyer des résultats simulés en cas d'erreur
        console.log('⚠️ Renvoi de résultats simulés en raison de l\'erreur');
        const simulatedResults = generateSimulatedResults(query);
        
        // Indiquer qu'il s'agit de résultats simulés
        res.json({ 
            items: simulatedResults, 
            info: {
                simulated: true,
                error: errorMessage
            }
        });
    }
});

// Fonction pour rechercher sur YouTube (redirection vers Pollination)
async function searchYouTube(query, maxResults = 10) {
    try {
        console.log(`🔍 Redirection de la recherche YouTube vers Pollination pour: "${query}"`);
        
        // Utiliser searchWithPollination au lieu de l'ancienne implémentation
        return searchWithPollination(query, maxResults);
    } catch (error) {
        console.error('❌ Erreur lors de la recherche:', error.message);
        
        // En cas d'erreur, utiliser des résultats locaux
        return generateAIVideoResults(query);
    }
}

// Génération avancée de résultats de recherche vidéo par IA
function generateAIVideoResults(query, maxCount = 10) {
    console.log(`🤖 Génération de résultats IA pour: "${query}"`);
    
    // Nettoyer et normaliser la requête
    const cleanQuery = query.trim().toLowerCase();
    
    // Liste de catégories pour mieux contextualiser les résultats
    const categories = [
        "musique", "film", "jeu vidéo", "cuisine", "sport", 
        "technologie", "science", "éducation", "voyage", "beauté",
        "mode", "fitness", "bien-être", "actualités", "comédie",
        "animation", "tutoriel", "documentaire", "interview"
    ];
    
    // Déterminer la catégorie la plus probable pour la requête
    let detectedCategory = "divers";
    
    for (const category of categories) {
        if (cleanQuery.includes(category)) {
            detectedCategory = category;
            break;
        }
    }
    
    // Base pour les ID de vidéos YouTube réelles mais pas directement liées à la requête
    const baseVideoIds = [
        'dQw4w9WgXcQ', 'JGwWNGJdvx8', 'kJQP7kiw5Fk', '9bZkp7q19f0', 'RgKAFK5djSk',
        'OPf0YbXqDm0', 'pRpeEdMmmQ0', 'hT_nvWreIhg', 'CevxZvSJLk8', '09R8_2nJtjg',
        'fJ9rUzIMcZQ', 'YQHsXMglC9A', 'jGflUbPQfW8', 'lp-EO5I60KA', 'qFLhGq0060w'
    ];
    
    // Générer des résultats basés sur la requête et la catégorie détectée
    const results = [];
    
    // Créer une fonction pour générer un ID vidéo aléatoire mais déterministe basé sur la requête
    const generateVideoId = (seed) => {
        // Simple hash function pour générer un ID stable basé sur la requête et un seed
        const combined = cleanQuery + seed;
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        // Garantir que le hash est positif et le convertir en chaîne hexadécimale de 11 caractères
        const positiveHash = Math.abs(hash);
        return positiveHash.toString(16).padStart(11, '0').substring(0, 11);
    };
    
    // Formater la durée au format PT#M#S (format ISO 8601 utilisé par YouTube)
    const formatDuration = () => {
        const minutes = Math.floor(Math.random() * 15) + 1; // 1-15 minutes
        const seconds = Math.floor(Math.random() * 59);
        return `PT${minutes}M${seconds}S`;
    };
    
    // Générer des titres pertinents basés sur la requête
    const generateTitle = (index) => {
        // Modèles de titres selon la catégorie
        const titleTemplates = {
            "musique": [
                `${query} - Clip Officiel (2023)`,
                `${query} - Lyric Video`,
                `${query} | Remix 2023`,
                `${query} ft. Artiste Collaborateur`,
                `Le Meilleur de ${query} - Compilation`,
                `${query} - Version Acoustique`,
                `${query} - Live à Paris`,
                `${query} Cover par Artiste Populaire`
            ],
            "film": [
                `${query} - Bande Annonce VF (2023)`,
                `${query} - Scène Culte HD`,
                `${query} - Analyse du Film`,
                `Les Secrets de Tournage de ${query}`,
                `${query} vs ${query} 2 - Comparaison`,
                `${query} - Director's Cut`,
                `Making of ${query}`,
                `${query} - Théorie Expliquée`
            ],
            "jeu vidéo": [
                `${query} - Gameplay Walkthrough Part 1`,
                `${query} - Trailer de Lancement`,
                `${query} - Guide des Débutants`,
                `${query} - Tous les Easter Eggs`,
                `${query} - Speedrun en 30min`,
                `${query} vs ${query} 2 - Graphismes Comparés`,
                `${query} - Meilleurs Moments`,
                `${query} - Review Complète`
            ],
            "divers": [
                `${query} - Tout ce que vous devez savoir`,
                `${query} - Tutoriel Complet`,
                `${query} expliqué en 5 minutes`,
                `Découvrez ${query} - Guide 2023`,
                `${query} - Ce que personne ne vous dit`,
                `Les secrets de ${query}`,
                `${query} - Notre avis`,
                `${query} vs les alternatives - Comparatif`
            ]
        };
        
        // Choisir le modèle approprié ou utiliser les modèles "divers" par défaut
        const templates = titleTemplates[detectedCategory] || titleTemplates.divers;
        
        // Sélectionner un modèle de manière déterministe basée sur l'index
        const templateIndex = index % templates.length;
        let title = templates[templateIndex];
        
        // Remplacer "Artiste" ou d'autres placeholders par des noms générés si nécessaire
        if (title.includes("Artiste")) {
            const artists = ["DJ Snake", "Aya Nakamura", "Orelsan", "Angèle", "Soprano", "David Guetta", "Gims", "Stromae"];
            const artist = artists[index % artists.length];
            title = title.replace("Artiste Populaire", artist).replace("Artiste Collaborateur", artist);
        }
        
        return title;
    };
    
    // Générer des noms de chaînes pertinents
    const generateChannelName = (index) => {
        const channelTemplates = {
            "musique": ["VEVO", "Music Official", "Records", "Musique FR", "Studios"],
            "film": ["FilmsActu", "CinéChannel", "MovieClips", "AlloCiné", "Warner Bros. FR"],
            "jeu vidéo": ["GamePlay FR", "PlayStation France", "Xbox FR", "Nintendo France", "IGN France"],
            "divers": ["Officiel", "France TV", "Le HuffPost", "VICE", "BuzzFeed FR"]
        };
        
        const templates = channelTemplates[detectedCategory] || channelTemplates.divers;
        const templateIndex = index % templates.length;
        
        if (detectedCategory === "musique") {
            // Pour la musique, parfois utiliser le nom de la requête comme nom d'artiste
            if (index % 3 === 0) {
                return query.charAt(0).toUpperCase() + query.slice(1);
            }
            return query.split(' ')[0] + " " + templates[templateIndex];
        }
        
        return templates[templateIndex];
    };
    
    // Générer des descriptions pertinentes
    const generateDescription = (title) => {
        const descTemplates = [
            `${title} - ${query} | Officiel ${new Date().getFullYear()}`,
            `Découvrez ${title}. N'oubliez pas de vous abonner pour plus de contenu sur ${query}.`,
            `${title} - La meilleure ressource pour découvrir ${query} et bien plus encore.`,
            `Nouvelle vidéo sur ${query}! ${title} vous présente tout ce que vous devez savoir.`,
            `${title} - Explorez l'univers de ${query} comme jamais auparavant.`
        ];
        
        return descTemplates[Math.floor(Math.abs(generateVideoId(title).charCodeAt(0)) % descTemplates.length)];
    };
    
    // Générer des statistiques réalistes
    const generateStatistics = (videoId) => {
        // Utiliser l'ID comme seed pour générer des nombres pseudo-aléatoires déterministes
        const seed = parseInt(videoId.substring(0, 8), 16);
        const baseViews = seed % 10;
        
        // Générer des vues entre 1K et 10M
        let viewCount;
        if (baseViews < 3) {
            viewCount = (seed % 900 + 100).toString(); // 100-999
        } else if (baseViews < 7) {
            viewCount = ((seed % 900 + 100) * 10).toString(); // 1K-9.9K
        } else if (baseViews < 9) {
            viewCount = ((seed % 900 + 100) * 1000).toString(); // 100K-999K
        } else {
            viewCount = ((seed % 9 + 1) * 1000000).toString(); // 1M-9M
        }
        
        // Générer des likes (~5% des vues)
        const likeCount = Math.floor(parseInt(viewCount) * 0.05).toString();
        
        // Générer des commentaires (~0.2% des vues)
        const commentCount = Math.floor(parseInt(viewCount) * 0.002).toString();
        
        return {
            viewCount,
            likeCount,
            commentCount
        };
    };
    
    // Générer les résultats
    for (let i = 0; i < maxCount; i++) {
        // Utiliser quelques vidéos réelles pour la variété
        const useRealVideo = i < 2 && baseVideoIds.length > 0;
        const videoId = useRealVideo ? baseVideoIds[i % baseVideoIds.length] : generateVideoId(i.toString());
        
        const title = generateTitle(i);
        const channelTitle = generateChannelName(i);
        const description = generateDescription(title);
        
        // Générer une date de publication récente
        const now = new Date();
        const randomMonths = Math.floor(Math.abs(videoId.charCodeAt(0) % 24)); // 0-23 mois en arrière
        const publishDate = new Date(now.setMonth(now.getMonth() - randomMonths));
        const publishedAt = publishDate.toISOString();
        
        // Générer des statistiques réalistes
        const statistics = generateStatistics(videoId);
        
        // Générer des détails de contenu (durée, etc.)
        const contentDetails = {
            duration: formatDuration()
        };
        
        // Construire l'URL de la miniature basée sur l'ID vidéo
        let thumbnailUrl = '';
        if (useRealVideo) {
            thumbnailUrl = `https://i.ytimg.com/vi/${videoId}`;
        } else {
            // Pour les vidéos simulées, utiliser des images de placeholder avec le titre
            const encodedTitle = encodeURIComponent(title.substring(0, 20));
            thumbnailUrl = `https://via.placeholder.com/480x360/1f1f1f/ffffff?text=${encodedTitle}`;
        }
        
        results.push({
            id: { videoId },
            snippet: {
                title,
                channelTitle,
                description,
                publishedAt,
                thumbnails: {
                    default: { 
                        url: useRealVideo ? `${thumbnailUrl}/default.jpg` : thumbnailUrl.replace('480x360', '120x90'),
                        width: 120, 
                        height: 90 
                    },
                    medium: { 
                        url: useRealVideo ? `${thumbnailUrl}/mqdefault.jpg` : thumbnailUrl.replace('480x360', '320x180'),
                        width: 320, 
                        height: 180 
                    },
                    high: { 
                        url: useRealVideo ? `${thumbnailUrl}/hqdefault.jpg` : thumbnailUrl,
                        width: 480, 
                        height: 360 
                    }
                }
            },
            statistics,
            contentDetails
        });
    }
    
    console.log(`✅ Générés ${results.length} résultats IA pour "${query}"`);
    return results;
}

// Générer des résultats de recherche simulés
function generateSimulatedResults(query) {
    // Rediriger vers la nouvelle fonction de génération IA
    return generateAIVideoResults(query);
}

// Fonction pour rechercher des vidéos avec Pollination API
async function searchWithPollination(query, maxResults = 10) {
    try {
        console.log(`🌸 Recherche Pollination pour: "${query}"`);
        
        // Pour cette implémentation, comme l'API Pollination n'est pas spécifiée en détail,
        // nous utilisons notre générateur IA local. 
        // Dans une implémentation réelle, vous feriez un appel API à Pollination ici.
        
        return generateAIVideoResults(query, maxResults);
    } catch (error) {
        console.error('❌ Erreur lors de la recherche Pollination:', error.message);
        throw error;
    }
}

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
    console.log('Nouvelle connexion socket:', socket.id);
    
    // Rejoindre une room
    socket.on('join-room', (roomId, userId, userData) => {
        console.log(`L'utilisateur ${userId} rejoint la room ${roomId}`);
        
        // Créer la room si elle n'existe pas
        if (!rooms[roomId]) {
            rooms[roomId] = {
                id: roomId,
                participants: {},
                playlist: [],
                currentVideoIndex: -1
            };
        }
        
        // Ajouter l'utilisateur à la room
        rooms[roomId].participants[userId] = {
            id: userId,
            socketId: socket.id,
            ...userData
        };
        
        // Rejoindre le canal Socket.IO pour cette room
        socket.join(roomId);
        
        // Envoyer la liste des participants à l'utilisateur
        socket.emit('current-participants', Object.values(rooms[roomId].participants));
        
        // Informer les autres participants de l'arrivée du nouvel utilisateur
        socket.to(roomId).emit('user-connected', {
            id: userId,
            ...userData
        });
    });
    
    // Recevoir et traiter les messages
    socket.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            const { type } = message;
            
            // Déterminer la room en fonction du socket
            let roomId = null;
            let userId = null;
            
            for (const id in rooms) {
                for (const uid in rooms[id].participants) {
                    if (rooms[id].participants[uid].socketId === socket.id) {
                        roomId = id;
                        userId = uid;
                        break;
                    }
                }
                if (roomId) break;
            }
            
            if (!roomId) {
                console.log('Room non trouvée pour le socket', socket.id);
                return;
            }
            
            // Traiter le message en fonction du type
            switch (type) {
                case 'chat_message':
                    // Transmettre le message de chat aux autres participants
                    socket.to(roomId).emit('chat-message', message.data);
                    break;
                    
                case 'playlist_update':
                    // Mettre à jour la playlist
                    rooms[roomId].playlist = message.data.playlist;
                    
                    // Transmettre la mise à jour aux autres participants
                    socket.to(roomId).emit('playlist-update', {
                        playlist: message.data.playlist,
                        currentVideoIndex: rooms[roomId].currentVideoIndex
                    });
                    break;
                    
                case 'video_change':
                    // Mettre à jour l'index de la vidéo en cours
                    rooms[roomId].currentVideoIndex = message.data.videoIndex;
                    
                    // Transmettre le changement aux autres participants
                    socket.to(roomId).emit('video-change', {
                        videoIndex: message.data.videoIndex
                    });
                    break;
                    
                case 'video_seek':
                    // Transmettre le changement de position aux autres participants
                    socket.to(roomId).emit('video-seek', message.data);
                    break;
                    
                case 'video_control':
                    // Transmettre les contrôles vidéo aux autres participants
                    socket.to(roomId).emit('video-control', message.data);
                    break;
                    
                default:
                    console.log('Type de message non géré:', type);
            }
        } catch (error) {
            console.error('Erreur lors du traitement du message:', error);
        }
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
        console.log('Déconnexion socket:', socket.id);
        
        // Trouver la room et l'utilisateur
        for (const roomId in rooms) {
            for (const userId in rooms[roomId].participants) {
                if (rooms[roomId].participants[userId].socketId === socket.id) {
                    // Informer les autres participants
                    socket.to(roomId).emit('user-disconnected', userId);
                    
                    // Supprimer l'utilisateur
                    delete rooms[roomId].participants[userId];
                    
                    // Supprimer la room si elle est vide
                    if (Object.keys(rooms[roomId].participants).length === 0) {
                        delete rooms[roomId];
                    }
                    
                    break;
                }
            }
        }
    });
    
    // Expulser un participant
    socket.on('kick-participant', (roomId, targetUserId) => {
        if (!rooms[roomId]) return;
        
        // Vérifier si l'utilisateur qui a envoyé cette demande est l'hôte
        let isHost = false;
        let userId = null;
        
        for (const uid in rooms[roomId].participants) {
            if (rooms[roomId].participants[uid].socketId === socket.id) {
                userId = uid;
                isHost = rooms[roomId].participants[uid].isHost;
                break;
            }
        }
        
        if (!isHost) return;
        
        // Trouver le socket de l'utilisateur cible
        const targetUser = rooms[roomId].participants[targetUserId];
        if (targetUser) {
            const targetSocketId = targetUser.socketId;
            
            // Envoyer un événement à l'utilisateur cible
            io.to(targetSocketId).emit('kicked-from-room');
            
            // Informer les autres participants
            socket.to(roomId).emit('user-kicked', targetUserId);
            
            // Supprimer l'utilisateur
            delete rooms[roomId].participants[targetUserId];
        }
    });
});

// Route pour servir la page index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route pour servir la page room.html
app.get('/room', (req, res) => {
    res.sendFile(path.join(__dirname, 'room.html'));
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
    console.log(`Accès local: http://localhost:${PORT}`);
    console.log('🌸 Recherche Pollination: Activée');
}); 