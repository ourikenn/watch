const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Initialisation du serveur
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Accepter les connexions de n'importe quelle origine
        methods: ['GET', 'POST']
    }
});

// Servir les fichiers statiques depuis le répertoire actuel
app.use(express.static('./'));

// Stockage des données des rooms
const rooms = {};

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
    console.log('Nouvel utilisateur connecté:', socket.id);
    
    let currentRoom = null;
    let currentUser = null;
    
    // Rejoindre une room
    socket.on('join-room', (roomId, userId, userData) => {
        console.log(`L'utilisateur ${userId} rejoint la room ${roomId}`);
        
        // Enregistrer les données courantes
        currentRoom = roomId;
        currentUser = {
            id: userId,
            socketId: socket.id,
            ...userData
        };
        
        // Rejoindre la room Socket.IO
        socket.join(roomId);
        
        // Initialiser la room si elle n'existe pas
        if (!rooms[roomId]) {
            rooms[roomId] = {
                participants: [],
                playlist: [],
                currentVideoIndex: -1
            };
        }
        
        // Ajouter l'utilisateur à la liste des participants
        rooms[roomId].participants.push(currentUser);
        
        // Envoyer la liste des participants actuels à l'utilisateur
        socket.emit('current-participants', rooms[roomId].participants);
        
        // Notifier les autres utilisateurs
        socket.to(roomId).emit('user-connected', {
            id: userId,
            name: userData.name,
            color: userData.color,
            isHost: userData.isHost
        });
        
        // Envoyer la playlist actuelle si elle existe
        if (rooms[roomId].playlist.length > 0) {
            socket.emit('playlist-update', {
                playlist: rooms[roomId].playlist,
                currentVideoIndex: rooms[roomId].currentVideoIndex
            });
        }
    });
    
    // Message de chat
    socket.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'chat_message' && currentRoom) {
                console.log(`Message de ${data.data.username} dans la room ${currentRoom}`);
                socket.to(currentRoom).emit('chat-message', data.data);
            } else if (data.type === 'playlist_update' && currentRoom) {
                console.log(`Mise à jour de la playlist dans la room ${currentRoom}`);
                
                // Mettre à jour la playlist dans la room
                rooms[currentRoom].playlist = data.data.playlist;
                
                // Transmettre aux autres utilisateurs
                socket.to(currentRoom).emit('playlist-update', {
                    playlist: data.data.playlist
                });
            } else if (data.type === 'video_change' && currentRoom) {
                console.log(`Changement de vidéo dans la room ${currentRoom}`);
                
                // Mettre à jour l'index de la vidéo
                rooms[currentRoom].currentVideoIndex = data.data.videoIndex;
                
                // Transmettre aux autres utilisateurs
                socket.to(currentRoom).emit('video-change', data.data);
            } else if (data.type === 'video_seek' && currentRoom) {
                console.log(`Changement de position dans la room ${currentRoom}`);
                
                // Transmettre aux autres utilisateurs
                socket.to(currentRoom).emit('video-seek', data.data);
            }
        } catch (error) {
            console.error('Erreur de traitement du message:', error);
        }
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté:', socket.id);
        
        // Si l'utilisateur était dans une room
        if (currentRoom && currentUser) {
            // Retirer l'utilisateur de la liste des participants
            if (rooms[currentRoom]) {
                rooms[currentRoom].participants = rooms[currentRoom].participants.filter(
                    p => p.id !== currentUser.id
                );
                
                // Supprimer la room si elle est vide
                if (rooms[currentRoom].participants.length === 0) {
                    delete rooms[currentRoom];
                    console.log(`Room ${currentRoom} supprimée (vide)`);
                } else {
                    // Notifier les autres utilisateurs
                    socket.to(currentRoom).emit('user-disconnected', currentUser.id);
                }
            }
        }
    });
    
    // Expulsion d'un participant
    socket.on('kick-participant', (roomId, userId) => {
        if (rooms[roomId]) {
            const participant = rooms[roomId].participants.find(p => p.id === userId);
            
            if (participant) {
                // Notifier l'utilisateur expulsé
                io.to(participant.socketId).emit('kicked-from-room');
                
                // Retirer l'utilisateur de la liste des participants
                rooms[roomId].participants = rooms[roomId].participants.filter(
                    p => p.id !== userId
                );
                
                // Notifier les autres participants
                io.to(roomId).emit('user-kicked', userId);
            }
        }
    });
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
    console.log(`Accès local: http://localhost:${PORT}`);
}); 