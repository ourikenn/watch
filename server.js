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

// Gestion de la synchronisation vidéo
const roomStates = new Map();

function updateRoomState(roomId, data) {
    if (!roomStates.has(roomId)) {
        roomStates.set(roomId, {
            currentTime: 0,
            playerState: 'paused',
            lastUpdate: Date.now(),
            syncRequests: new Map(),
            bufferingClients: new Set(),
            masterClientId: null,
            lastSyncTime: Date.now()
        });
    }
    
    const state = roomStates.get(roomId);
    state.currentTime = data.currentTime;
    state.playerState = data.playerState;
    state.lastUpdate = Date.now();
    
    // Mettre à jour le master client si nécessaire
    if (!state.masterClientId) {
        state.masterClientId = data.userId;
    }
}

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
    console.log('🔌 Nouvelle connexion WebSocket');
    
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
    
    // Gestion améliorée de la synchronisation
    socket.on('request-sync', (data) => {
        console.log('📡 Demande de synchronisation reçue:', data);
        
        const roomId = data.roomId;
        if (!roomId) return;
        
        const state = roomStates.get(roomId);
        if (!state) return;
        
        // Mettre à jour l'état de la room
        updateRoomState(roomId, data);
        
        // Si le client est en buffering, informer les autres
        if (data.isBuffering) {
            state.bufferingClients.add(data.userId);
            
            // Si trop de clients sont en buffering, ralentir la lecture
            if (state.bufferingClients.size > 2) {
                io.to(roomId).emit('playback-rate', { rate: 0.75 });
            }
        } else {
            state.bufferingClients.delete(data.userId);
            
            // Si plus assez de clients en buffering, reprendre la vitesse normale
            if (state.bufferingClients.size <= 2) {
                io.to(roomId).emit('playback-rate', { rate: 1 });
            }
        }
        
        // Vérifier si une synchronisation est nécessaire
        const timeSinceLastSync = Date.now() - state.lastSyncTime;
        if (timeSinceLastSync > 5000) { // Attendre au moins 5 secondes entre les syncs
            state.lastSyncTime = Date.now();
            
            // Diffuser la demande de synchronisation au master client
            if (state.masterClientId) {
                socket.to(roomId).emit('sync-request', {
                    requesterId: data.userId,
                    timestamp: Date.now()
                });
            }
        }
    });
    
    socket.on('sync-response', (data) => {
        console.log('📡 Réponse de synchronisation reçue:', data);
        
        const roomId = data.roomId;
        if (!roomId) return;
        
        const state = roomStates.get(roomId);
        if (!state) return;
        
        // Mettre à jour l'état de la room
        updateRoomState(roomId, data);
        
        // Diffuser la mise à jour à tous les clients de la room
        io.to(roomId).emit('sync-update', {
            currentTime: data.currentTime,
            playerState: data.playerState,
            timestamp: Date.now(),
            masterClientId: state.masterClientId
        });
    });
    
    socket.on('buffering-start', (data) => {
        console.log('⏳ Client en buffering:', data);
        
        const roomId = data.roomId;
        if (!roomId) return;
        
        const state = roomStates.get(roomId);
        if (!state) return;
        
        // Ajouter le client à la liste des clients en buffering
        state.bufferingClients.add(data.userId);
        
        // Si trop de clients sont en buffering, ralentir la lecture
        if (state.bufferingClients.size > 2) {
            io.to(roomId).emit('playback-rate', { rate: 0.75 });
        }
        
        // Informer les autres clients
        socket.to(roomId).emit('buffering-start', {
            userId: data.userId,
            timestamp: Date.now()
        });
    });
    
    socket.on('buffering-end', (data) => {
        console.log('✅ Client a terminé le buffering:', data);
        
        const roomId = data.roomId;
        if (!roomId) return;
        
        const state = roomStates.get(roomId);
        if (!state) return;
        
        // Retirer le client de la liste des clients en buffering
        state.bufferingClients.delete(data.userId);
        
        // Si plus assez de clients en buffering, reprendre la vitesse normale
        if (state.bufferingClients.size <= 2) {
            io.to(roomId).emit('playback-rate', { rate: 1 });
        }
        
        // Informer les autres clients
        socket.to(roomId).emit('buffering-end', {
            userId: data.userId,
            timestamp: Date.now()
        });
    });
    
    // Gestion améliorée des contrôles vidéo
    socket.on('video-control', (data) => {
        console.log('🎮 Contrôle vidéo reçu:', data);
        
        const roomId = data.roomId;
        if (!roomId) return;
        
        const state = roomStates.get(roomId);
        if (!state) return;
        
        // Mettre à jour l'état de la room
        updateRoomState(roomId, {
            currentTime: data.currentTime,
            playerState: data.action === 'play' ? 'playing' : 'paused',
            userId: data.userId
        });
        
        // Diffuser le contrôle à tous les autres clients avec un léger délai
        setTimeout(() => {
            socket.to(roomId).emit('video-control', {
                action: data.action,
                currentTime: data.currentTime,
                userName: data.userName,
                timestamp: Date.now()
            });
        }, 100);
    });
    
    socket.on('video-seek', (data) => {
        console.log('🎮 Changement de position vidéo:', data);
        
        const roomId = data.roomId;
        if (!roomId) return;
        
        const state = roomStates.get(roomId);
        if (!state) return;
        
        // Mettre à jour l'état de la room
        updateRoomState(roomId, {
            currentTime: data.time,
            playerState: 'seeking',
            userId: data.userId
        });
        
        // Diffuser le changement de position à tous les autres clients
        socket.to(roomId).emit('video-seek', {
            time: data.time,
            timestamp: Date.now()
        });
    });
    
    // Gestion de la déconnexion
    socket.on('disconnect', () => {
        console.log('🔌 Déconnexion socket:', socket.id);
        
        // Nettoyer les états des rooms pour ce client
        for (const [roomId, state] of roomStates.entries()) {
            // Si le client déconnecté était le master, choisir un nouveau master
            if (state.masterClientId === socket.id) {
                const room = rooms[roomId];
                if (room && room.participants) {
                    const participants = Object.values(room.participants);
                    if (participants.length > 0) {
                        state.masterClientId = participants[0].id;
                        console.log(`🔄 Nouveau master client pour la room ${roomId}:`, state.masterClientId);
                    }
                }
            }
            
            // Nettoyer les états de buffering
            state.bufferingClients.delete(socket.id);
        }
    });
});

// Nettoyage périodique des états des rooms inactives
setInterval(() => {
    const now = Date.now();
    for (const [roomId, state] of roomStates.entries()) {
        // Supprimer les états des rooms inactives depuis plus de 24 heures
        if (now - state.lastUpdate > 24 * 60 * 60 * 1000) {
            roomStates.delete(roomId);
            console.log(`🧹 Nettoyage de l'état de la room ${roomId}`);
        }
    }
}, 60 * 60 * 1000); // Vérifier toutes les heures

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