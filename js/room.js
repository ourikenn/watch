// État global de l'application
const state = {
    room: {
        id: null,
        name: null
    },
    user: {
        id: null,
        name: 'Anonymous',
        color: getRandomColor(),
        isHost: false
    },
    participants: [],
    player: null,
    playlist: [],
    currentVideoIndex: -1,
    socket: null
};

// Éléments DOM
const roomId = document.getElementById('room-id');
const roomName = document.getElementById('room-name');
const videoPlayer = document.getElementById('video-player');
const progressBar = document.querySelector('.progress-bar');
const progressFilled = document.querySelector('.progress-filled');
const currentTimeElement = document.getElementById('current-time');
const totalTimeElement = document.getElementById('total-time');
const playPauseBtn = document.getElementById('play-pause-btn');
const volumeBtn = document.getElementById('volume-btn');
const volumeRange = document.getElementById('volume-range');
const skipBtn = document.getElementById('skip-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const addVideoBtn = document.getElementById('add-video-btn');
const videoSearch = document.getElementById('video-search');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const playlistItems = document.getElementById('playlist-items');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const emojiBtn = document.getElementById('emoji-btn');
const emojiPicker = document.getElementById('emoji-picker');
const participantsList = document.getElementById('participants-list');
const shareBtn = document.getElementById('share-btn');
const shareModal = document.getElementById('share-modal');
const roomLink = document.getElementById('room-link');
const copyLinkBtn = document.getElementById('copy-link-btn');
const addVideoModal = document.getElementById('add-video-modal');
const videoUrl = document.getElementById('video-url');
const addUrlBtn = document.getElementById('add-url-btn');
const tabs = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Initialiser l'application
function init() {
    // Récupérer l'ID de la room depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (id) {
        state.room.id = id;
        state.room.name = `Room #${id}`;
        roomId.textContent = id;
        roomName.textContent = state.room.name;
        document.title = `${state.room.name} - WatchParty`;
        
        // Générer un ID unique pour l'utilisateur s'il n'en a pas déjà un
        state.user.id = localStorage.getItem('watchparty_user_id') || `user_${Date.now()}`;
        localStorage.setItem('watchparty_user_id', state.user.id);
        
        // Vérifier si l'utilisateur est l'hôte
        const roomCreator = localStorage.getItem(`room_creator_${id}`);
        if (roomCreator === state.user.id) {
            state.user.isHost = true;
        }
        
        // Récupérer le nom d'utilisateur s'il existe
        const userName = localStorage.getItem('watchparty_user_name');
        if (userName) {
            state.user.name = userName;
            // Initialiser la connexion et l'interface
            initializeRoom();
        } else {
            // Afficher le modal pour demander le nom d'utilisateur
            showUsernameModal();
        }
    } else {
        // Rediriger vers la page d'accueil si aucun ID de room n'est spécifié
        window.location.href = 'index.html';
    }
}

// Fonction pour initialiser la salle après avoir défini le nom d'utilisateur
function initializeRoom() {
    // Initialiser la connexion en temps réel
    initRealTimeConnection();
    
    // Initialiser la playlist
    initPlaylist();
    
    // Charger des vidéos de démonstration pour tester
    if (state.playlist.length === 0) {
        state.playlist = [
            {
                id: 'dQw4w9WgXcQ',
                title: 'Rick Astley - Never Gonna Give You Up',
                channel: 'Rick Astley',
                thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
            },
            {
                id: '6AXEwt22_8Y',
                title: 'Les Patins à Roulettes - Chanson Française 2023',
                channel: 'Mélody Sucré',
                thumbnail: 'https://i.ytimg.com/vi/6AXEwt22_8Y/hqdefault.jpg'
            },
            {
                id: 'xS0XiOLW_Qs',
                title: 'Le Grand Orchestre - Symphonie n°9',
                channel: 'Orchestre National',
                thumbnail: 'https://i.ytimg.com/vi/xS0XiOLW_Qs/hqdefault.jpg'
            }
        ];
        updatePlaylist();
    }
    
    // Initialiser les événements
    initEvents();
}

// Afficher le modal pour demander le nom d'utilisateur
function showUsernameModal() {
    // Créer le modal s'il n'existe pas déjà
    let modal = document.getElementById('username-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'username-modal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Bienvenue dans la room "${state.room.name}"</h2>
                <p>Veuillez entrer votre nom avant de rejoindre la room :</p>
                <div class="username-form">
                    <input type="text" id="username-input" placeholder="Votre nom" maxlength="20">
                    <button id="username-btn" class="btn btn-primary">Rejoindre</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Ajouter l'événement du bouton
        const usernameBtn = document.getElementById('username-btn');
        const usernameInput = document.getElementById('username-input');
        
        usernameBtn.addEventListener('click', () => {
            saveUsername();
        });
        
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveUsername();
            }
        });
        
        // Focus sur l'input
        usernameInput.focus();
    }
}

// Sauvegarder le nom d'utilisateur et initialiser la salle
function saveUsername() {
    const usernameInput = document.getElementById('username-input');
    const username = usernameInput.value.trim();
    
    if (username) {
        // Sauvegarder le nom d'utilisateur
        state.user.name = username;
        localStorage.setItem('watchparty_user_name', username);
        
        // Fermer le modal
        const modal = document.getElementById('username-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Initialiser la salle
        initializeRoom();
    } else {
        alert('Veuillez entrer un nom valide');
    }
}

// Initialiser la playlist
function initPlaylist() {
    // Récupérer la playlist si elle existe déjà pour cette room
    const savedPlaylist = localStorage.getItem(`room_playlist_${state.room.id}`);
    if (savedPlaylist) {
        state.playlist = JSON.parse(savedPlaylist);
    }
    
    updatePlaylist();
}

// Initialiser les événements
function initEvents() {
    // Onglets de la sidebar
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Retirer la classe active de tous les onglets
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Ajouter la classe active à l'onglet cliqué
            this.classList.add('active');
            
            // Afficher le contenu correspondant
            const tabId = this.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Événements du lecteur vidéo
    if (progressBar) {
        progressBar.addEventListener('click', seekVideo);
    }
    
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlay);
    }
    
    if (volumeBtn) {
        volumeBtn.addEventListener('click', toggleMute);
    }
    
    if (volumeRange) {
        volumeRange.addEventListener('input', handleVolumeChange);
    }
    
    if (skipBtn) {
        skipBtn.addEventListener('click', skipVideo);
    }
    
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    // Événements de la recherche
    if (searchBtn) {
        searchBtn.addEventListener('click', searchVideos);
    }
    
    if (videoSearch) {
        videoSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchVideos();
            }
        });
    }
    
    // Événements du chat
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    if (emojiBtn) {
        emojiBtn.addEventListener('click', toggleEmojiPicker);
    }
    
    // Événements du partage
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            if (shareModal) {
                const roomURL = window.location.href;
                roomLink.value = roomURL;
                shareModal.style.display = 'flex';
                
                // Générer le QR code
                const qrContainer = document.getElementById('qr-code-container');
                if (qrContainer) {
                    qrContainer.innerHTML = '';
                    
                    // Utiliser la bibliothèque QRCode pour générer le code
                    const qr = qrcode(0, 'L');
                    qr.addData(roomURL);
                    qr.make();
                    
                    // Ajouter le QR code au container
                    qrContainer.innerHTML = qr.createImgTag(5);
                }
            }
        });
    }
    
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            roomLink.select();
            document.execCommand('copy');
            
            // Animation de confirmation
            copyLinkBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        });
    }
    
    // Événements du modal d'ajout de vidéo
    if (addVideoBtn) {
        addVideoBtn.addEventListener('click', () => {
            if (addVideoModal) {
                addVideoModal.style.display = 'flex';
            }
        });
    }
    
    if (addUrlBtn) {
        addUrlBtn.addEventListener('click', () => {
            addVideoToPlaylist(videoUrl.value);
            addVideoModal.style.display = 'none';
            videoUrl.value = '';
        });
    }
    
    // Fermer les modals quand on clique sur le X
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Fermer les modals quand on clique en dehors
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Initialiser la connexion en temps réel
function initRealTimeConnection() {
    // Connexion au serveur Socket.IO
    // Utiliser l'URL du serveur définie globalement si elle existe, sinon utiliser l'URL actuelle
    const socketUrl = window.SOCKET_SERVER_URL || 
                      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                      ? `http://${window.location.hostname}:3000` 
                      : window.location.origin);
        
    console.log('Connexion au serveur Socket.IO:', socketUrl);
    state.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    
    // Événements de connexion
    state.socket.on('connect', () => {
        console.log('Connecté au serveur Socket.IO');
        
        // Rejoindre la room
        state.socket.emit('join-room', state.room.id, state.user.id, {
            name: state.user.name,
            color: state.user.color,
            isHost: state.user.isHost
        });
    });
    
    state.socket.on('connect_error', (err) => {
        console.error('Erreur de connexion au serveur Socket.IO:', err);
        
        // Fallback: utiliser la simulation
        if (!state.participants || state.participants.length === 0) {
            console.log('Utilisation de la simulation (mode hors ligne)');
            simulateParticipants();
        }
    });
    
    // Réception des participants
    state.socket.on('current-participants', (participants) => {
        console.log('Participants reçus:', participants);
        state.participants = participants;
        updateParticipantsList();
    });
    
    // Réception d'un nouvel utilisateur
    state.socket.on('user-connected', (user) => {
        console.log('Nouvel utilisateur connecté:', user);
        
        // Ajouter l'utilisateur à la liste
        state.participants.push(user);
        updateParticipantsList();
        
        // Ajouter un message système
        addChatMessage({
            userId: 'system',
            username: 'Système',
            text: `${user.name} a rejoint la room`,
            timestamp: new Date().toISOString(),
            color: '#2c3e50'
        });
    });
    
    // Utilisateur déconnecté
    state.socket.on('user-disconnected', (userId) => {
        console.log('Utilisateur déconnecté:', userId);
        
        // Trouver le nom de l'utilisateur avant de le supprimer
        const user = state.participants.find(p => p.id === userId);
        const username = user ? user.name : 'Un utilisateur';
        
        // Supprimer l'utilisateur de la liste
        state.participants = state.participants.filter(p => p.id !== userId);
        updateParticipantsList();
        
        // Ajouter un message système
        addChatMessage({
            userId: 'system',
            username: 'Système',
            text: `${username} a quitté la room`,
            timestamp: new Date().toISOString(),
            color: '#2c3e50'
        });
    });
    
    // Utilisateur expulsé
    state.socket.on('user-kicked', (userId) => {
        console.log('Utilisateur expulsé:', userId);
        
        // Trouver le nom de l'utilisateur avant de le supprimer
        const user = state.participants.find(p => p.id === userId);
        const username = user ? user.name : 'Un utilisateur';
        
        // Supprimer l'utilisateur de la liste
        state.participants = state.participants.filter(p => p.id !== userId);
        updateParticipantsList();
        
        // Ajouter un message système
        addChatMessage({
            userId: 'system',
            username: 'Système',
            text: `${username} a été expulsé de la room`,
            timestamp: new Date().toISOString(),
            color: '#2c3e50'
        });
    });
    
    // Être expulsé
    state.socket.on('kicked-from-room', () => {
        console.log('Vous avez été expulsé de la room');
        alert('Vous avez été expulsé de la room');
        window.location.href = 'index.html';
    });
    
    // Réception d'un message de chat
    state.socket.on('chat-message', (message) => {
        console.log('Message reçu:', message);
        addChatMessage(message);
    });
    
    // Mise à jour de la playlist
    state.socket.on('playlist-update', (data) => {
        console.log('Playlist mise à jour:', data);
        state.playlist = data.playlist;
        
        if (data.currentVideoIndex !== undefined) {
            state.currentVideoIndex = data.currentVideoIndex;
        }
        
        updatePlaylist();
    });
    
    // Changement de vidéo
    state.socket.on('video-change', (data) => {
        console.log('Changement de vidéo:', data);
        playVideo(data.videoIndex);
    });
    
    // Changement de position
    state.socket.on('video-seek', (data) => {
        console.log('Changement de position:', data);
        if (state.player) {
            state.player.seekTo(data.time, true);
            
            // Ajouter un message système
            addChatMessage({
                userId: 'system',
                username: 'Système',
                text: `Un utilisateur a changé la position de la vidéo`,
                timestamp: new Date().toISOString(),
                color: '#2c3e50'
            });
        }
    });

    // Contrôle de la vidéo (lecture/pause)
    state.socket.on('video-control', (data) => {
        console.log('Contrôle vidéo reçu:', data);
        if (state.player) {
            if (data.action === 'play') {
                state.player.playVideo();
                
                // Mettre à jour l'icône du bouton
                if (playPauseBtn) {
                    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                }
                
                // Ajouter un message système
                addChatMessage({
                    userId: 'system',
                    username: 'Système',
                    text: `${data.userName || 'Un utilisateur'} a lancé la lecture`,
                    timestamp: new Date().toISOString(),
                    color: '#2c3e50'
                });
            } else if (data.action === 'pause') {
                state.player.pauseVideo();
                
                // Mettre à jour l'icône du bouton
                if (playPauseBtn) {
                    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                }
                
                // Ajouter un message système
                addChatMessage({
                    userId: 'system',
                    username: 'Système',
                    text: `${data.userName || 'Un utilisateur'} a mis en pause`,
                    timestamp: new Date().toISOString(),
                    color: '#2c3e50'
                });
            }
        }
    });
}

// Simuler des participants (à remplacer par une vraie implémentation WebRTC)
function simulateParticipants() {
    // Ajouter des participants fictifs
    state.participants = [
        {
            id: state.user.id,
            name: state.user.name,
            isHost: state.user.isHost,
            color: state.user.color,
            status: 'online'
        },
        {
            id: 'user2',
            name: 'Emma',
            isHost: false,
            color: '#3498db',
            status: 'online'
        },
        {
            id: 'user3',
            name: 'Lucas',
            isHost: false,
            color: '#e74c3c',
            status: 'online'
        }
    ];
    
    // Mettre à jour la liste des participants
    updateParticipantsList();
    
    // Simuler des messages de chat
    setTimeout(() => {
        addChatMessage({
            userId: 'user2',
            username: 'Emma',
            text: 'Salut tout le monde ! Prêt pour la vidéo ?',
            timestamp: new Date().toISOString(),
            color: '#3498db'
        });
    }, 2000);
    
    setTimeout(() => {
        addChatMessage({
            userId: 'user3',
            username: 'Lucas',
            text: 'Oui, on peut commencer !',
            timestamp: new Date().toISOString(),
            color: '#e74c3c'
        });
    }, 5000);
}

// Mettre à jour la liste des participants
function updateParticipantsList() {
    if (!participantsList) return;
    
    participantsList.innerHTML = '';
    
    state.participants.forEach(user => {
        const initials = user.name.substring(0, 2).toUpperCase();
        const isCurrentUser = user.id === state.user.id;
        
        const item = document.createElement('li');
        item.classList.add('participant');
        
        item.innerHTML = `
            <div class="participant-avatar" style="background-color: ${user.color}">${initials}</div>
            <div class="participant-info">
                <div class="participant-name">
                    ${user.name} ${isCurrentUser ? '(Vous)' : ''}
                    ${user.isHost ? '<span class="participant-role">Hôte</span>' : ''}
                </div>
                <div class="participant-status">${user.status === 'online' ? 'En ligne' : 'Hors ligne'}</div>
            </div>
            ${!isCurrentUser && state.user.isHost ? `
            <div class="participant-actions">
                <button class="kick-user" data-id="${user.id}">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
            ` : ''}
        `;
        
        participantsList.appendChild(item);
    });
    
    // Ajouter les événements
    document.querySelectorAll('.kick-user').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.target.closest('button').dataset.id;
            kickParticipant(userId);
        });
    });
}

// Exclure un participant
function kickParticipant(userId) {
    if (!state.socket) return;
    
    // Envoyer la demande d'expulsion au serveur
    state.socket.emit('kick-participant', state.room.id, userId);
    
    // Ajouter un message système
    const participant = state.participants.find(p => p.id === userId);
    const username = participant ? participant.name : 'Un participant';
    
    addChatMessage({
        userId: 'system',
        username: 'Système',
        text: `${username} a été expulsé de la room`,
        timestamp: new Date().toISOString(),
        color: '#2c3e50'
    });
}

// Ajouter un message au chat
function addChatMessage(message) {
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    
    if (message.userId === 'system') {
        // Message système
        messageElement.classList.add('system-message');
        messageElement.innerHTML = `
            <div class="message-content">
                <span class="message-text">${message.text}</span>
            </div>
            <div class="message-time">${formatTime(new Date(message.timestamp))}</div>
        `;
    } else {
        // Message utilisateur
        const isCurrentUser = message.userId === state.user.id;
        
        if (isCurrentUser) {
            messageElement.classList.add('my-message');
        }
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-username" style="color: ${message.color}">${message.username}</span>
                <span class="message-time">${formatTime(new Date(message.timestamp))}</span>
            </div>
            <div class="message-content">
                <span class="message-text">${message.text}</span>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageElement);
    
    // Scroll vers le bas
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Envoyer un message
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Ajouter le message au chat
    addChatMessage({
        userId: state.user.id,
        username: state.user.name,
        text: message,
        timestamp: new Date().toISOString(),
        color: state.user.color
    });
    
    // Envoyer le message aux autres participants (via WebSocket)
    if (state.socket) {
        state.socket.send(JSON.stringify({
            type: 'chat_message',
            data: {
                userId: state.user.id,
                username: state.user.name,
                text: message,
                timestamp: new Date().toISOString(),
                color: state.user.color
            }
        }));
    }
    
    // Vider l'input
    messageInput.value = '';
}

// Rechercher des vidéos
function searchVideos() {
    const query = videoSearch.value.trim();
    if (!query) return;
    
    // Simuler une recherche YouTube (à remplacer par l'API YouTube)
    searchResults.innerHTML = '<div class="loading">Recherche en cours...</div>';
    
    // Simuler un délai réseau
    setTimeout(() => {
        const fakeResults = [
            {
                id: 'dQw4w9WgXcQ',
                title: 'Rick Astley - Never Gonna Give You Up',
                channel: 'Rick Astley',
                thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
            },
            {
                id: '6AXEwt22_8Y',
                title: `Résultat pour "${query}" - Vidéo 1`,
                channel: 'Chaîne YouTube',
                thumbnail: 'https://i.ytimg.com/vi/6AXEwt22_8Y/hqdefault.jpg'
            },
            {
                id: 'xS0XiOLW_Qs',
                title: `Résultat pour "${query}" - Vidéo 2`,
                channel: 'Autre Chaîne',
                thumbnail: 'https://i.ytimg.com/vi/xS0XiOLW_Qs/hqdefault.jpg'
            }
        ];
        
        displaySearchResults(fakeResults);
    }, 1000);
}

// Afficher les résultats de recherche
function displaySearchResults(results) {
    if (!searchResults) return;
    
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">Aucun résultat trouvé</div>';
        return;
    }
    
    results.forEach(video => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('search-result');
        
        resultItem.innerHTML = `
            <div class="result-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}">
            </div>
            <div class="result-info">
                <div class="result-title">${video.title}</div>
                <div class="result-channel">${video.channel}</div>
            </div>
            <div class="result-actions">
                <button class="btn btn-sm" data-id="${video.id}">
                    <i class="fas fa-plus"></i> Ajouter
                </button>
            </div>
        `;
        
        // Ajouter l'événement pour ajouter la vidéo
        const addButton = resultItem.querySelector('button');
        addButton.addEventListener('click', () => {
            addVideoToPlaylist(null, video);
            searchResults.innerHTML = '';
            videoSearch.value = '';
        });
        
        searchResults.appendChild(resultItem);
    });
}

// Ajouter une vidéo à la playlist
function addVideoToPlaylist(url, videoData = null) {
    let videoId = null;
    
    if (url) {
        // Extraire l'ID de la vidéo YouTube de l'URL
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            if (url.includes('v=')) {
                videoId = url.split('v=')[1].split('&')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            }
        }
        
        if (!videoId) {
            alert('URL YouTube invalide. Format attendu: https://www.youtube.com/watch?v=ID_VIDEO ou https://youtu.be/ID_VIDEO');
            return;
        }
        
        // Créer un objet vidéo (dans une vraie app, on récupérerait les détails via l'API YouTube)
        videoData = {
            id: videoId,
            title: 'Vidéo YouTube',
            channel: 'YouTube',
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        };
    }
    
    if (!videoData) return;
    
    // Ajouter la vidéo à la playlist
    state.playlist.push(videoData);
    
    // Mettre à jour la playlist
    updatePlaylist();
    
    // Envoyer la mise à jour aux autres participants
    if (state.socket) {
        state.socket.send(JSON.stringify({
            type: 'playlist_update',
            data: {
                playlist: state.playlist
            }
        }));
    }
    
    // Sauvegarder la playlist
    localStorage.setItem(`room_playlist_${state.room.id}`, JSON.stringify(state.playlist));
    
    // Si c'est la première vidéo, la lire automatiquement
    if (state.playlist.length === 1) {
        playVideo(0);
    }
}

// Mettre à jour l'affichage de la playlist
function updatePlaylist() {
    if (!playlistItems) return;
    
    playlistItems.innerHTML = '';
    
    state.playlist.forEach((video, index) => {
        const item = document.createElement('li');
        item.classList.add('playlist-item');
        
        if (index === state.currentVideoIndex) {
            item.classList.add('active');
        }
        
        item.innerHTML = `
            <div class="item-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}">
                ${index === state.currentVideoIndex ? '<div class="now-playing"><i class="fas fa-play"></i></div>' : ''}
            </div>
            <div class="item-info">
                <div class="item-title">${video.title}</div>
                <div class="item-channel">${video.channel}</div>
            </div>
            <div class="item-actions">
                <button class="play-btn" title="Lire">
                    <i class="fas fa-play"></i>
                </button>
                <button class="remove-btn" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Ajouter les événements
        const playBtn = item.querySelector('.play-btn');
        const removeBtn = item.querySelector('.remove-btn');
        
        playBtn.addEventListener('click', () => playVideo(index));
        removeBtn.addEventListener('click', () => removeFromPlaylist(index));
        
        playlistItems.appendChild(item);
    });
}

// Supprimer une vidéo de la playlist
function removeFromPlaylist(index) {
    if (index < 0 || index >= state.playlist.length) return;
    
    // Supprimer la vidéo
    state.playlist.splice(index, 1);
    
    // Ajuster l'index de la vidéo en cours si nécessaire
    if (index === state.currentVideoIndex) {
        // Si c'est la dernière vidéo
        if (index >= state.playlist.length) {
            state.currentVideoIndex = Math.max(0, state.playlist.length - 1);
        }
        
        // Recharger la vidéo si la playlist n'est pas vide
        if (state.playlist.length > 0) {
            playVideo(state.currentVideoIndex);
        } else {
            // Arrêter le lecteur si la playlist est vide
            state.currentVideoIndex = -1;
            if (state.player) {
                state.player.stopVideo();
            }
            resetPlayer();
        }
    } else if (index < state.currentVideoIndex) {
        // Si on supprime une vidéo avant celle en cours, ajuster l'index
        state.currentVideoIndex--;
    }
    
    // Mettre à jour la playlist
    updatePlaylist();
    
    // Envoyer la mise à jour aux autres participants
    if (state.socket) {
        state.socket.send(JSON.stringify({
            type: 'playlist_update',
            data: {
                playlist: state.playlist
            }
        }));
    }
    
    // Sauvegarder la playlist
    localStorage.setItem(`room_playlist_${state.room.id}`, JSON.stringify(state.playlist));
}

// Jouer une vidéo
function playVideo(index) {
    if (index < 0 || index >= state.playlist.length) return;
    
    state.currentVideoIndex = index;
    
    // Mettre à jour l'interface
    updatePlaylist();
    
    // Charger la vidéo dans le lecteur
    const video = state.playlist[index];
    
    // Si on utilise l'API YouTube
    if (state.player) {
        state.player.loadVideoById(video.id);
    } else {
        // Créer le lecteur YouTube
        createYouTubePlayer(video.id);
    }
    
    // Envoyer la mise à jour aux autres participants
    if (state.socket) {
        state.socket.send(JSON.stringify({
            type: 'video_change',
            data: {
                videoIndex: index
            }
        }));
    }
}

// Créer le lecteur YouTube
function createYouTubePlayer(videoId) {
    // Vérifier si l'API YouTube est chargée
    if (typeof YT === 'undefined' || !YT.Player) {
        // Charger l'API YouTube
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // L'API appellera cette fonction lorsqu'elle sera prête
        window.onYouTubeIframeAPIReady = () => {
            createPlayer(videoId);
        };
    } else {
        // L'API est déjà chargée
        createPlayer(videoId);
    }
}

// Créer le lecteur avec l'API YouTube
function createPlayer(videoId) {
    // Supprimer le placeholder
    const placeholder = videoPlayer.querySelector('.placeholder-player');
    if (placeholder) {
        placeholder.remove();
    }
    
    // Créer un élément pour le player
    const playerElement = document.createElement('div');
    playerElement.id = 'yt-player';
    videoPlayer.appendChild(playerElement);
    
    // Créer le player YouTube
    state.player = new YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'playsinline': 1,
            'autoplay': 1,
            'controls': 0,
            'rel': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// Quand le lecteur est prêt
function onPlayerReady(event) {
    // Mettre à jour les contrôles
    updatePlayerControls();
    
    // Configurer la mise à jour de la progression
    setInterval(updateProgressBar, 1000);
}

// Quand l'état du lecteur change
function onPlayerStateChange(event) {
    // Mettre à jour l'interface
    updatePlayerControls();
    
    // Si la vidéo est terminée, passer à la suivante
    if (event.data === YT.PlayerState.ENDED) {
        skipVideo();
    }
}

// Mettre à jour les contrôles du lecteur
function updatePlayerControls() {
    if (!state.player) return;
    
    const isPlaying = state.player.getPlayerState() === YT.PlayerState.PLAYING;
    
    // Mettre à jour le bouton play/pause
    if (playPauseBtn) {
        playPauseBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }
    
    // Mettre à jour le volume
    const volume = state.player.getVolume();
    
    if (volumeBtn) {
        if (volume === 0) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else if (volume < 50) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
        } else {
            volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }
    
    if (volumeRange) {
        volumeRange.value = volume;
    }
}

// Mettre à jour la barre de progression
function updateProgressBar() {
    if (!state.player || !progressFilled || !currentTimeElement || !totalTimeElement) return;
    
    const currentTime = state.player.getCurrentTime() || 0;
    const duration = state.player.getDuration() || 0;
    
    if (duration > 0) {
        // Mettre à jour la barre de progression
        const percent = (currentTime / duration) * 100;
        progressFilled.style.width = `${percent}%`;
        
        // Mettre à jour les indicateurs de temps
        currentTimeElement.textContent = formatDuration(currentTime);
        totalTimeElement.textContent = formatDuration(duration);
    }
}

// Formater la durée en MM:SS
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Formater l'heure pour le chat
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Changer la position de lecture
function seekVideo(e) {
    if (!state.player || !progressBar) return;
    
    const bounds = progressBar.getBoundingClientRect();
    const x = e.pageX - bounds.left;
    const width = bounds.width;
    const percent = x / width;
    
    const duration = state.player.getDuration();
    const seekTime = duration * percent;
    
    state.player.seekTo(seekTime, true);
    
    // Envoyer la mise à jour aux autres participants
    if (state.socket) {
        state.socket.send(JSON.stringify({
            type: 'video_seek',
            data: {
                time: seekTime
            }
        }));
    }
}

// Lecture/Pause
function togglePlay() {
    if (!state.player) return;
    
    const isPlaying = state.player.getPlayerState() === YT.PlayerState.PLAYING;
    
    if (isPlaying) {
        state.player.pauseVideo();
        
        // Envoyer l'événement pause aux autres utilisateurs
        if (state.socket) {
            console.log("Envoi de l'événement pause");
            state.socket.emit('message', JSON.stringify({
                type: 'video_control',
                data: {
                    action: 'pause',
                    roomId: state.room.id,
                    userId: state.user.id,
                    time: state.player.getCurrentTime(),
                    timestamp: Date.now()
                }
            }));
        }
    } else {
        state.player.playVideo();
        
        // Envoyer l'événement play aux autres utilisateurs
        if (state.socket) {
            console.log("Envoi de l'événement play");
            state.socket.emit('message', JSON.stringify({
                type: 'video_control',
                data: {
                    action: 'play',
                    roomId: state.room.id,
                    userId: state.user.id,
                    time: state.player.getCurrentTime(),
                    timestamp: Date.now()
                }
            }));
        }
    }
}

// Activer/Désactiver le son
function toggleMute() {
    if (!state.player) return;
    
    const isMuted = state.player.isMuted();
    
    if (isMuted) {
        state.player.unMute();
        
        // Restaurer le volume précédent
        const previousVolume = parseInt(volumeRange.value);
        state.player.setVolume(previousVolume);
    } else {
        state.player.mute();
    }
    
    updatePlayerControls();
}

// Changer le volume
function handleVolumeChange() {
    if (!state.player) return;
    
    const volume = parseInt(volumeRange.value);
    
    state.player.setVolume(volume);
    
    if (volume === 0) {
        state.player.mute();
    } else if (state.player.isMuted()) {
        state.player.unMute();
    }
    
    updatePlayerControls();
}

// Passer à la vidéo suivante
function skipVideo() {
    if (state.currentVideoIndex < state.playlist.length - 1) {
        playVideo(state.currentVideoIndex + 1);
    } else if (state.playlist.length > 0) {
        // Boucler à la première vidéo
        playVideo(0);
    }
}

// Activer/Désactiver le plein écran
function toggleFullscreen() {
    if (!videoPlayer) return;
    
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        videoPlayer.requestFullscreen();
    }
}

// Activer/Désactiver l'emoji picker
function toggleEmojiPicker() {
    if (!emojiPicker) return;
    
    emojiPicker.classList.toggle('active');
    
    if (emojiPicker.classList.contains('active')) {
        // Simuler des emojis
        emojiPicker.innerHTML = '';
        
        const emojis = ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😡', '😠', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🤠', '🤡', '🥳', '🥴', '🥺', '🤥', '🤫', '🤭', '🧐', '🤓', '😈', '👿', '👹', '👺', '💀', '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];
        
        emojis.forEach(emoji => {
            const span = document.createElement('span');
            span.textContent = emoji;
            span.addEventListener('click', () => {
                if (messageInput) {
                    messageInput.value += emoji;
                    emojiPicker.classList.remove('active');
                }
            });
            emojiPicker.appendChild(span);
        });
    }
}

// Réinitialiser le lecteur
function resetPlayer() {
    if (!videoPlayer) return;
    
    // Supprimer le lecteur existant
    videoPlayer.innerHTML = `
        <div class="placeholder-player">
            <i class="fas fa-play-circle"></i>
            <p>Ajoutez une vidéo pour commencer</p>
        </div>
    `;
    
    state.player = null;
}

// Générer une couleur aléatoire pour les utilisateurs
function getRandomColor() {
    const colors = [
        '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
        '#3498db', '#9b59b6', '#34495e', '#16a085', '#27ae60',
        '#2980b9', '#8e44ad', '#2c3e50', '#f39c12', '#d35400',
        '#c0392b', '#7f8c8d'
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
}

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', init); 