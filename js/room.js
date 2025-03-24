// Importer le gestionnaire de synchronisation
import SyncManager from './sync-manager.js';

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
        isHost: false,
        avatar: null
    },
    participants: [],
    player: null,
    syncManager: null,
    playlist: [],
    currentVideoIndex: -1,
    socket: null,
    sync: {
        lastUpdate: Date.now(),
        syncInterval: 2000, // Vérification toutes les 2 secondes
        syncThreshold: 2, // Seuil de désynchronisation en secondes
        isBuffering: false,
        isSeeking: false,
        masterClient: false,
        lastKnownTime: 0,
        lastKnownState: 'paused',
        bufferingTimeout: null,
        syncLock: false
    }
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

// Clé API YouTube
const YOUTUBE_API_KEY = 'AIzaSyB5hrbUf0i_KkPjzAVefz8-fzRzlgFPLro';

// Fonction pour détecter si l'utilisateur est sur mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Adapter l'interface pour les appareils mobiles
function setupMobileInterface() {
    if (!isMobileDevice()) return; // Ne rien faire si on n'est pas sur mobile
    
    console.log('📱 Interface mobile activée');
    
    // Ajouter une classe pour le CSS mobile
    document.body.classList.add('mobile-device');
    
    // Ajuster la taille de la vidéo et des contrôles pour les appareils mobiles
    const videoSection = document.querySelector('.video-section');
    if (videoSection) {
        videoSection.classList.add('mobile-optimized');
    }
    
    // Adapter la sidebar pour le mobile (navigation par onglets simplifiée)
    const sidebar = document.querySelector('.room-sidebar');
    if (sidebar) {
        sidebar.classList.add('mobile-sidebar');
    }
    
    // Améliorer la taille des boutons pour les contrôles tactiles
    document.querySelectorAll('.btn, button').forEach(btn => {
        btn.classList.add('mobile-button');
    });
    
    // Gérer le zoom tactile et les gestes
    setupMobileTouchEvents();
}

// Configurer les événements tactiles pour mobile
function setupMobileTouchEvents() {
    // Éviter le zoom sur double-tap pour les contrôles vidéo
    const videoControls = document.querySelector('.video-controls');
    if (videoControls) {
        videoControls.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault(); // Empêcher le pinch-zoom
            }
        }, { passive: false });
    }
    
    // Ajouter le swipe entre les onglets
    const tabContent = document.querySelector('.tab-content');
    if (tabContent) {
        let startX, startY, endX, endY;
        
        tabContent.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        tabContent.addEventListener('touchend', function(e) {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            // Calculer la distance du swipe
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Si le swipe est plus horizontal que vertical
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Swipe minimum de 50px
                if (Math.abs(diffX) > 50) {
                    const tabs = document.querySelectorAll('.tab-btn');
                    const activeTabIndex = Array.from(tabs).findIndex(tab => tab.classList.contains('active'));
                    
                    if (diffX > 0) {
                        // Swipe gauche, aller à l'onglet suivant
                        const nextIndex = (activeTabIndex + 1) % tabs.length;
                        tabs[nextIndex].click();
                    } else {
                        // Swipe droit, aller à l'onglet précédent
                        const prevIndex = (activeTabIndex - 1 + tabs.length) % tabs.length;
                        tabs[prevIndex].click();
                    }
                }
            }
        }, { passive: true });
    }
    
    // Simplifier l'interface des modals sur mobile
    document.querySelectorAll('.modal-content').forEach(modal => {
        modal.classList.add('mobile-modal');
    });
    
    // Configurer les boutons flottants mobile
    setupMobileFloatingButtons();
    
    // Activer les gestes de double tap pour lire/mettre en pause sur mobile
    const videoPlayer = document.getElementById('video-player');
    if (videoPlayer) {
        let lastTap = 0;
        videoPlayer.addEventListener('touchend', function(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                // Double tap détecté - lire/mettre en pause
                togglePlay();
                e.preventDefault();
            }
            lastTap = currentTime;
        });
    }
    
    // Gestes de balayage pour le volume (swipe vertical)
    if (videoPlayer) {
        let startY, endY;
        let currentVolume;
        
        videoPlayer.addEventListener('touchstart', function(e) {
            startY = e.touches[0].clientY;
            if (state.player) {
                currentVolume = state.player.getVolume ? state.player.getVolume() : 100;
            }
        }, { passive: true });
        
        videoPlayer.addEventListener('touchmove', function(e) {
            if (!state.player || e.touches.length > 1) return;
            
            endY = e.touches[0].clientY;
            const diffY = startY - endY;
            
            // Si le swipe est significatif (plus de 10px)
            if (Math.abs(diffY) > 10) {
                // Calculer le changement de volume (1 = 1%)
                const volumeChange = Math.round(diffY / 5);
                const newVolume = Math.min(100, Math.max(0, currentVolume + volumeChange));
                
                // Définir le nouveau volume
                if (state.player.setVolume) {
                    state.player.setVolume(newVolume);
                    if (volumeRange) {
                        volumeRange.value = newVolume;
                    }
                    
                    // Mettre à jour l'icône selon le volume
                    updateVolumeIcon(newVolume);
                    
                    // Afficher brièvement une indication de volume
                    showVolumeIndicator(newVolume);
                }
                
                // Mettre à jour la référence pour le prochain mouvement
                startY = endY;
                currentVolume = newVolume;
            }
        }, { passive: true });
    }
}

// Configurer les boutons flottants pour mobile
function setupMobileFloatingButtons() {
    const addVideoBtn = document.getElementById('mobile-add-video');
    const toggleChatBtn = document.getElementById('mobile-toggle-chat');
    const sidebar = document.querySelector('.room-sidebar');
    
    if (addVideoBtn) {
        addVideoBtn.addEventListener('click', function() {
            const addVideoModal = document.getElementById('add-video-modal');
            if (addVideoModal) {
                addVideoModal.style.display = 'flex';
                // Focus sur l'input pour une saisie immédiate
                setTimeout(() => {
                    const videoUrlInput = document.getElementById('video-url');
                    if (videoUrlInput) videoUrlInput.focus();
                }, 300);
            }
        });
    }
    
    if (toggleChatBtn && sidebar) {
        // État initial : afficher la sidebar
        let sidebarVisible = true;
        
        toggleChatBtn.addEventListener('click', function() {
            sidebarVisible = !sidebarVisible;
            
            if (sidebarVisible) {
                sidebar.classList.remove('sidebar-hidden');
                sidebar.classList.add('sidebar-visible');
                toggleChatBtn.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                sidebar.classList.remove('sidebar-visible');
                sidebar.classList.add('sidebar-hidden');
                toggleChatBtn.innerHTML = '<i class="fas fa-comment"></i>';
            }
        });
    }
}

// Afficher une indication de volume (pour les gestes sur mobile)
function showVolumeIndicator(volume) {
    // Créer ou obtenir l'indicateur de volume
    let volumeIndicator = document.getElementById('volume-indicator');
    
    if (!volumeIndicator) {
        volumeIndicator = document.createElement('div');
        volumeIndicator.id = 'volume-indicator';
        volumeIndicator.className = 'volume-indicator';
        document.body.appendChild(volumeIndicator);
        
        // Ajouter des styles en ligne pour l'indicateur
        volumeIndicator.style.position = 'fixed';
        volumeIndicator.style.top = '50%';
        volumeIndicator.style.left = '50%';
        volumeIndicator.style.transform = 'translate(-50%, -50%)';
        volumeIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        volumeIndicator.style.color = 'white';
        volumeIndicator.style.padding = '1rem';
        volumeIndicator.style.borderRadius = '5px';
        volumeIndicator.style.fontSize = '1.5rem';
        volumeIndicator.style.zIndex = '9999';
        volumeIndicator.style.opacity = '0';
        volumeIndicator.style.transition = 'opacity 0.3s ease';
    }
    
    // Mettre à jour le contenu et afficher
    let icon = 'fa-volume-high';
    if (volume === 0) {
        icon = 'fa-volume-xmark';
    } else if (volume < 50) {
        icon = 'fa-volume-low';
    }
    
    volumeIndicator.innerHTML = `<i class="fas ${icon}"></i> ${volume}%`;
    volumeIndicator.style.opacity = '1';
    
    // Masquer après un délai
    clearTimeout(window.volumeIndicatorTimeout);
    window.volumeIndicatorTimeout = setTimeout(() => {
        volumeIndicator.style.opacity = '0';
    }, 1500);
}

// Mettre à jour l'icône du volume en fonction du niveau
function updateVolumeIcon(volume) {
    const volumeBtn = document.getElementById('volume-btn');
    if (!volumeBtn) return;
    
    if (volume === 0) {
        volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (volume < 50) {
        volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
    } else {
        volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
}

// Initialiser l'application
function init() {
    // Récupérer l'ID de la room depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');
    
    if (!roomId) {
        // Rediriger vers la page d'accueil si pas d'ID de room
        window.location.href = 'index.html';
        return;
    }
    
    // Définir l'ID de la room
    state.room.id = roomId;
    state.room.name = `Room #${roomId}`;
    
    // Mettre à jour les éléments d'interface
    if (window.roomId) {
        window.roomId.textContent = roomId;
    }
    
    // Générer un ID pour l'utilisateur
    state.user.id = localStorage.getItem('watchparty_user_id') || Date.now().toString();
    localStorage.setItem('watchparty_user_id', state.user.id);
    
    // Récupérer le nom de l'utilisateur s'il existe
    state.user.name = localStorage.getItem('watchparty_user_name') || 'Anonymous';
    
    // Vérifier s'il y a un profil utilisateur
    syncUserWithProfile();
    
    // Écouter les événements de mise à jour de profil
    document.addEventListener('profile_updated', function(e) {
        syncUserWithProfile();
        updateParticipantsList();
    });
    
    // Demander le nom d'utilisateur s'il n'est pas défini et pas de profil
    if (state.user.name === 'Anonymous' && !window.userProfile?.isLoggedIn()) {
        showUsernameModal();
    } else {
        // Sinon, initialiser directement la salle
        initializeRoom();
    }
    
    // Configurer l'interface pour les appareils mobiles
    setupMobileInterface();
}

// Synchroniser les informations utilisateur avec le profil
function syncUserWithProfile() {
    if (window.userProfile && window.userProfile.isLoggedIn()) {
        const profile = window.userProfile.getData();
        if (profile) {
            // Utiliser le nom du profil
            state.user.name = profile.username;
            
            // Utiliser l'avatar du profil
            state.user.avatar = profile.avatar || null;
            
            // Sauvegarder le nom d'utilisateur localement
            localStorage.setItem('watchparty_user_name', profile.username);
            
            console.log('✅ Profil utilisateur synchronisé:', state.user.name);
        }
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

    // Afficher la notification de bienvenue
    showNotification(`Bienvenue dans ${state.room.name}!`, 'success');
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
    
    // Configuration de la recherche vidéo YouTube
    console.log('Configuration des événements de recherche vidéo YouTube...');
    
    if (videoSearch) {
        videoSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log('Touche Enter sur le champ de recherche');
                const query = this.value.trim();
                if (query) {
                    performSearch(query);
                }
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            console.log('Clic sur le bouton de recherche vidéo');
            if (videoSearch && videoSearch.value.trim()) {
                performSearch(videoSearch.value.trim());
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
        addVideoBtn.addEventListener('click', function() {
            // Vider le champ
            if (videoUrl) {
                videoUrl.value = '';
            }
            // Afficher le modal
            if (addVideoModal) {
                addVideoModal.style.display = 'flex';
                // Focus sur le champ d'URL
                if (videoUrl) {
                    setTimeout(() => videoUrl.focus(), 100);
                }
            }
        });
    }
    
    if (addUrlBtn) {
        addUrlBtn.addEventListener('click', function() {
            const url = videoUrl.value.trim();
            if (url) {
                // Extraire l'ID de la vidéo et ajouter à la playlist
                const videoId = extractVideoId(url);
                if (videoId) {
                    // Ajouter à la playlist
                    state.playlist.push({
                        id: videoId.id,
                        type: videoId.type,
                        title: `Vidéo ajoutée manuellement`,
                        thumbnail: `https://img.youtube.com/vi/${videoId.id}/mqdefault.jpg`,
                        author: 'Ajout manuel',
                        url: url // Stocker l'URL complète également
                    });
                    
                    // Mettre à jour la playlist et notifier les autres
                    updatePlaylistAndNotify();
                    
                    // Fermer le modal
                    addVideoModal.style.display = 'none';
                    
                    // Vider le champ
                    videoUrl.value = '';
                    
                    // Si c'est la première vidéo, la lire
                    if (state.playlist.length === 1) {
                        playVideo(0);
                    }
                } else {
                    alert('URL de vidéo non reconnue. Veuillez utiliser une URL de YouTube, Vimeo, Dailymotion, ou une URL directe vers un fichier vidéo.');
                }
            } else {
                alert('Veuillez entrer une URL valide');
            }
        });
    }
    
    // Gérer les boutons de fermeture dans les modals
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            // Trouver le modal parent
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Fermer les modals en cliquant en dehors du contenu
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Écouteur pour le bouton de recherche
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const searchInput = document.getElementById('video-search');
            if (searchInput) {
                const query = searchInput.value.trim();
                if (query) {
                    performSearch(query);
                }
            }
        });
    }

    // Écouteur pour la recherche par touche Entrée
    if (videoSearch) {
        videoSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log('Touche Enter détectée sur le champ de recherche');
                const query = this.value.trim();
                if (query) {
                    performSearch(query);
                }
            }
        });
    }

    // Gérer l'ajout d'URL via le champ "Enter"
    if (videoUrl) {
        videoUrl.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && addUrlBtn) {
                // Simuler un clic sur le bouton d'ajout
                addUrlBtn.click();
            }
        });
    }
}

// Initialiser la connexion en temps réel
function initRealTimeConnection() {
    // Initialiser la connexion socket.io
    socket = io(SOCKET_SERVER_URL);
    
    // Événements de connexion
    socket.on('connect', () => {
        console.log('🔌 Connecté au serveur');
        
        // Rejoindre la room
        socket.emit('join-room', {
            roomId: state.room.id,
            userId: state.user.id,
            userName: state.user.name,
            userAvatar: state.user.avatar
        });
    });
    
    // Événements de contrôle vidéo
    socket.on('video-control', (data) => {
        if (data.userId !== state.user.id) {
            if (data.action === 'play') {
                state.player.playVideo();
                updateSystemMessage(`${data.userName} a lancé la lecture`);
            } else {
                state.player.pauseVideo();
                updateSystemMessage(`${data.userName} a mis la vidéo en pause`);
            }
        }
    });
    
    socket.on('video-seek', (data) => {
        if (data.userId !== state.user.id && state.syncManager) {
            state.syncManager.isSeeking = true;
            state.player.seekTo(data.time, true);
            setTimeout(() => {
                state.syncManager.isSeeking = false;
            }, 500);
        }
    });
    
    socket.on('playback-rate', (data) => {
        if (state.player) {
            state.player.setPlaybackRate(data.rate);
        }
    });
    
    socket.on('buffering-start', (data) => {
        console.log(`⏳ ${data.userId} est en buffering`);
        updateSystemMessage(`Un participant est en train de charger la vidéo...`);
    });
    
    socket.on('buffering-end', (data) => {
        console.log(`✅ ${data.userId} a terminé le buffering`);
        updateSystemMessage(`La lecture continue normalement`);
    });
    
    // ... rest of the existing socket event handlers ...
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
        const isCurrentUser = user.id === state.user.id;
        
        // Si c'est l'utilisateur actuel, utiliser ses données de profil à jour
        if (isCurrentUser) {
            user.name = state.user.name;
            user.avatar = state.user.avatar;
        }
        
        const item = document.createElement('li');
        item.classList.add('participant');
        
        let avatarContent = '';
        if (user.avatar) {
            // Afficher l'image d'avatar si disponible
            avatarContent = `<img src="${user.avatar}" alt="${user.name}" />`;
        } else {
            // Sinon afficher les initiales
            const initials = user.name.substring(0, 2).toUpperCase();
            avatarContent = initials;
        }
        
        item.innerHTML = `
            <div class="participant-avatar ${user.avatar ? 'with-image' : ''}" style="${!user.avatar ? 'background-color: ' + user.color : ''}">${avatarContent}</div>
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
        
        // Si c'est l'utilisateur actuel, utiliser les données de profil à jour
        if (isCurrentUser) {
            message.username = state.user.name;
            message.avatar = state.user.avatar;
        }
        
        if (isCurrentUser) {
            messageElement.classList.add('my-message');
        }
        
        // Ajouter l'avatar au message s'il est disponible
        let avatarHTML = '';
        if (message.avatar) {
            avatarHTML = `<img src="${message.avatar}" alt="${message.username}" class="message-avatar" />`;
        } else {
            // Créer un avatar avec les initiales et la couleur
            const initials = message.username.substring(0, 2).toUpperCase();
            avatarHTML = `<div class="message-avatar-text" style="background-color: ${message.color}">${initials}</div>`;
        }
        
        messageElement.innerHTML = `
            <div class="message-header">
                ${avatarHTML}
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
        color: state.user.color,
        avatar: state.user.avatar // Inclure l'avatar dans le message
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
                color: state.user.color,
                avatar: state.user.avatar // Inclure l'avatar dans le message envoyé
            }
        }));
    }
    
    // Vider l'input
    messageInput.value = '';
}

// Appeler cette fonction au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé');
});

// Afficher les résultats locaux en cas d'échec de l'API
function showLocalResults(query, container) {
    console.log(`Affichage de résultats locaux pour: "${query}"`);
    
    // Base de données locale de vidéos populaires
    const videosDatabase = [
        {
            id: 'dQw4w9WgXcQ',
            title: 'Rick Astley - Never Gonna Give You Up',
            thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
            author: 'Rick Astley',
            viewCount: '1.2B',
            lengthSeconds: 212
        },
        {
            id: 'kXYiU_JCYtU',
            title: 'Linkin Park - Numb',
            thumbnail: 'https://i.ytimg.com/vi/kXYiU_JCYtU/mqdefault.jpg',
            author: 'Linkin Park',
            viewCount: '1.9B',
            lengthSeconds: 185
        },
        {
            id: 'hTWKbfoikeg',
            title: 'Nirvana - Smells Like Teen Spirit',
            thumbnail: 'https://i.ytimg.com/vi/hTWKbfoikeg/mqdefault.jpg',
            author: 'Nirvana',
            viewCount: '1.5B',
            lengthSeconds: 302
        },
        {
            id: 'YR5ApYxkU-U',
            title: 'Pink Floyd - Another Brick In The Wall',
            thumbnail: 'https://i.ytimg.com/vi/YR5ApYxkU-U/mqdefault.jpg',
            author: 'Pink Floyd',
            viewCount: '830M',
            lengthSeconds: 385
        },
        {
            id: 'fJ9rUzIMcZQ',
            title: 'Queen - Bohemian Rhapsody',
            thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/mqdefault.jpg',
            author: 'Queen Official',
            viewCount: '1.6B',
            lengthSeconds: 355
        },
        {
            id: 'fPO76Jlnz6c',
            title: 'Avicii - Waiting For Love',
            thumbnail: 'https://i.ytimg.com/vi/fPO76Jlnz6c/mqdefault.jpg',
            author: 'Avicii',
            viewCount: '940M',
            lengthSeconds: 230
        },
        {
            id: 'JGwWNGJdvx8',
            title: 'Ed Sheeran - Shape of You',
            thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg',
            author: 'Ed Sheeran',
            viewCount: '5.8B',
            lengthSeconds: 263
        },
        {
            id: 'qrO4YZeyl0I',
            title: 'Lady Gaga - Bad Romance',
            thumbnail: 'https://i.ytimg.com/vi/qrO4YZeyl0I/mqdefault.jpg',
            author: 'Lady Gaga',
            viewCount: '1.4B',
            lengthSeconds: 322
        },
        {
            id: 'pRpeEdMmmQ0',
            title: 'Coldplay - Viva La Vida',
            thumbnail: 'https://i.ytimg.com/vi/pRpeEdMmmQ0/mqdefault.jpg',
            author: 'Coldplay',
            viewCount: '820M',
            lengthSeconds: 242
        },
        {
            id: 'v2AC41dglnM',
            title: 'AC/DC - Thunderstruck',
            thumbnail: 'https://i.ytimg.com/vi/v2AC41dglnM/mqdefault.jpg',
            author: 'AC/DC',
            viewCount: '1B',
            lengthSeconds: 292
        },
        {
            id: 'Zi_XLOBDo_Y',
            title: 'Michael Jackson - Billie Jean',
            thumbnail: 'https://i.ytimg.com/vi/Zi_XLOBDo_Y/mqdefault.jpg',
            author: 'Michael Jackson',
            viewCount: '1.1B',
            lengthSeconds: 294
        },
        {
            id: 'XbGs_qK2PQA',
            title: 'Eminem - Rap God',
            thumbnail: 'https://i.ytimg.com/vi/XbGs_qK2PQA/mqdefault.jpg',
            author: 'Eminem',
            viewCount: '1.5B',
            lengthSeconds: 363
        },
        {
            id: 'YQHsXMglC9A',
            title: 'Adele - Hello',
            thumbnail: 'https://i.ytimg.com/vi/YQHsXMglC9A/mqdefault.jpg',
            author: 'Adele',
            viewCount: '3B',
            lengthSeconds: 367
        },
        {
            id: 'KQ6zr6kCPj8',
            title: 'LMFAO - Party Rock Anthem',
            thumbnail: 'https://i.ytimg.com/vi/KQ6zr6kCPj8/mqdefault.jpg',
            author: 'LMFAO',
            viewCount: '2.2B',
            lengthSeconds: 262
        },
        {
            id: 'iywaBOMvYLI',
            title: 'Bruno Mars - 24K Magic',
            thumbnail: 'https://i.ytimg.com/vi/iywaBOMvYLI/mqdefault.jpg',
            author: 'Bruno Mars',
            viewCount: '1.4B',
            lengthSeconds: 217
        }
    ];
    
    // Filtrer les vidéos qui correspondent à la recherche
    const lowercaseQuery = query.toLowerCase();
    let filteredVideos = videosDatabase.filter(video => 
        video.title.toLowerCase().includes(lowercaseQuery) || 
        video.author.toLowerCase().includes(lowercaseQuery)
    );
    
    // Si aucun résultat filtré, montrer des vidéos aléatoires
    if (filteredVideos.length === 0) {
        console.log('Aucun résultat direct trouvé, affichage de vidéos aléatoires');
        filteredVideos = videosDatabase.sort(() => 0.5 - Math.random()).slice(0, 5);
    } else {
        console.log(`${filteredVideos.length} résultats trouvés pour "${query}"`);
    }
    
    // Afficher les résultats
    displaySearchResults(filteredVideos, container);
}

// Mettre à jour la playlist et notifier les autres utilisateurs
function updatePlaylistAndNotify() {
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
    console.log('Mise à jour de l\'affichage de la playlist');
    
    const playlistContainer = document.getElementById('playlist-items');
    if (!playlistContainer) {
        console.error('Conteneur de playlist introuvable');
        return;
    }
    
    // Vider le conteneur
    playlistContainer.innerHTML = '';
    
    // S'assurer que la playlist existe
    if (!state.playlist || !Array.isArray(state.playlist)) {
        console.log('Playlist vide ou invalide');
        playlistContainer.innerHTML = '<li class="playlist-empty">La playlist est vide</li>';
        return;
    }
    
    // Afficher chaque élément de la playlist
    if (state.playlist.length === 0) {
        playlistContainer.innerHTML = '<li class="playlist-empty">La playlist est vide</li>';
    } else {
        state.playlist.forEach((video, index) => {
            console.log(`Ajout de la vidéo ${index} à l'affichage:`, video);
            
            const itemElement = document.createElement('li');
            itemElement.className = 'playlist-item';
            if (index === state.currentVideoIndex) {
                itemElement.classList.add('active');
            }
            
            const thumbnail = video.thumbnail || `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
            const title = video.title || 'Vidéo sans titre';
            
            itemElement.innerHTML = `
                <div class="playlist-item-thumbnail">
                    <img src="${thumbnail}" alt="${title}">
                </div>
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${title}</div>
                </div>
                <div class="playlist-item-actions">
                    <button class="play-video" title="Lire"><i class="fas fa-play"></i></button>
                    <button class="remove-video" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Ajouter les écouteurs d'événements
            const playButton = itemElement.querySelector('.play-video');
            playButton.addEventListener('click', () => {
                console.log(`Lecture de la vidéo ${index}`);
                playVideo(index);
            });
            
            const removeButton = itemElement.querySelector('.remove-video');
            removeButton.addEventListener('click', () => {
                console.log(`Suppression de la vidéo ${index}`);
                removeFromPlaylist(index);
            });
            
            // Ajouter l'élément à la liste
            playlistContainer.appendChild(itemElement);
        });
    }
    
    console.log('Affichage de la playlist mis à jour');
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
    
    // Nettoyer le lecteur existant
    clearVideoPlayer();
    
    // Créer le lecteur en fonction du type de vidéo
    if (video.type === 'youtube' || !video.type) {
        createYouTubePlayer(video.id);
    } else if (video.type === 'vimeo') {
        createVimeoPlayer(video.id);
    } else if (video.type === 'dailymotion') {
        createDailymotionPlayer(video.id);
    } else if (video.type === 'direct') {
        createDirectPlayer(video.url || video.id);
    } else if (video.type === 'iframe') {
        createIframePlayer(video.url || video.id);
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

// Nettoyer le lecteur vidéo existant
function clearVideoPlayer() {
    if (!videoPlayer) return;
    
    // Supprimer l'ancien player s'il existe
    if (state.player) {
        try {
            if (typeof state.player.destroy === 'function') {
                state.player.destroy();
            } else if (typeof state.player.remove === 'function') {
                state.player.remove();
            } else if (typeof state.player.pause === 'function') {
                state.player.pause();
            }
        } catch (error) {
            console.error('Erreur lors du nettoyage du lecteur:', error);
        }
        
        state.player = null;
    }
    
    // Vider complètement le conteneur
    videoPlayer.innerHTML = '';
}

// Créer un lecteur pour les vidéos directes (MP4, WebM, OGG)
function createDirectPlayer(url) {
    if (!videoPlayer) return;
    
    const videoElement = document.createElement('video');
    videoElement.id = 'direct-player';
    videoElement.className = 'video-element';
    videoElement.controls = false;
    videoElement.autoplay = true;
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    
    const sourceElement = document.createElement('source');
    sourceElement.src = url;
    
    // Déterminer le type MIME
    if (url.endsWith('.mp4')) {
        sourceElement.type = 'video/mp4';
    } else if (url.endsWith('.webm')) {
        sourceElement.type = 'video/webm';
    } else if (url.endsWith('.ogg')) {
        sourceElement.type = 'video/ogg';
    }
    
    videoElement.appendChild(sourceElement);
    videoPlayer.appendChild(videoElement);
    
    // Stocker la référence au lecteur
    state.player = videoElement;
    
    // Configurer les événements
    videoElement.addEventListener('timeupdate', updateProgressBar);
    videoElement.addEventListener('play', () => {
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    });
    videoElement.addEventListener('pause', () => {
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });
    videoElement.addEventListener('ended', skipVideo);
}

// Créer un lecteur pour les vidéos Vimeo
function createVimeoPlayer(videoId) {
    if (!videoPlayer) return;
    
    // Créer un iframe pour Vimeo
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; fullscreen';
    iframe.allowFullscreen = true;
    
    // Ajouter une surcouche pour les contrôles
    const overlayDiv = document.createElement('div');
    overlayDiv.className = 'iframe-control-overlay';
    overlayDiv.innerHTML = `
        <div class="iframe-controls">
            <button class="iframe-refresh-btn" title="Recharger"><i class="fas fa-sync-alt"></i></button>
        </div>
    `;
    
    // Ajouter les éléments au DOM
    videoPlayer.appendChild(iframe);
    videoPlayer.appendChild(overlayDiv);
    
    // Configurer le bouton de rechargement
    const refreshBtn = overlayDiv.querySelector('.iframe-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            iframe.src = iframe.src;
        });
    }
    
    // Stocker la référence au lecteur
    state.player = iframe;
}

// Créer un lecteur pour les vidéos Dailymotion
function createDailymotionPlayer(videoId) {
    if (!videoPlayer) return;
    
    // Créer un iframe pour Dailymotion
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; fullscreen';
    iframe.allowFullscreen = true;
    
    // Ajouter une surcouche pour les contrôles
    const overlayDiv = document.createElement('div');
    overlayDiv.className = 'iframe-control-overlay';
    overlayDiv.innerHTML = `
        <div class="iframe-controls">
            <button class="iframe-refresh-btn" title="Recharger"><i class="fas fa-sync-alt"></i></button>
        </div>
    `;
    
    // Ajouter les éléments au DOM
    videoPlayer.appendChild(iframe);
    videoPlayer.appendChild(overlayDiv);
    
    // Configurer le bouton de rechargement
    const refreshBtn = overlayDiv.querySelector('.iframe-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            iframe.src = iframe.src;
        });
    }
    
    // Stocker la référence au lecteur
    state.player = iframe;
}

// Créer un lecteur iframe générique pour les autres types de vidéos
function createIframePlayer(url) {
    if (!videoPlayer) return;
    
    // Tenter de créer un iframe
    try {
        // Créer l'iframe
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.frameBorder = '0';
        iframe.allow = 'autoplay; fullscreen';
        iframe.allowFullscreen = true;
        
        // Ajouter une surcouche pour les contrôles
        const overlayDiv = document.createElement('div');
        overlayDiv.className = 'iframe-control-overlay';
        overlayDiv.innerHTML = `
            <div class="iframe-controls">
                <button class="iframe-refresh-btn" title="Recharger"><i class="fas fa-sync-alt"></i></button>
            </div>
        `;
        
        // Ajouter les éléments au DOM
        videoPlayer.appendChild(iframe);
        videoPlayer.appendChild(overlayDiv);
        
        // Configurer le bouton de rechargement
        const refreshBtn = overlayDiv.querySelector('.iframe-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                iframe.src = iframe.src;
            });
        }
        
        // Stocker la référence au lecteur
        state.player = iframe;
    } catch (error) {
        console.error('Erreur lors de la création du lecteur iframe:', error);
        
        // Fallback: afficher un message d'erreur
        videoPlayer.innerHTML = `
            <div class="error-player">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Impossible de lire cette vidéo. L'URL n'est peut-être pas supportée.</p>
                <p class="error-url">${url}</p>
            </div>
        `;
    }
}

// Créer le lecteur YouTube
function createYouTubePlayer(videoId) {
    if (!videoId) return;
    
    // Détruire le lecteur existant s'il y en a un
    if (state.player) {
        state.player.destroy();
        state.player = null;
    }
    
    // Créer le nouveau lecteur
    state.player = new YT.Player('video-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            autoplay: 1,
            controls: 1,
            disablekb: 0,
            enablejsapi: 1,
            fs: 1,
            modestbranding: 1,
            playsinline: 1,
            rel: 0
        },
        events: {
            onReady: (event) => {
                console.log('🎥 Lecteur YouTube prêt');
                
                // Initialiser les contrôles vidéo
                setupVideoControls();
                
                // Initialiser le gestionnaire de synchronisation
                state.syncManager = new SyncManager(socket, state.player, state);
                
                // Émettre l'état initial
                socket.emit('player-state-change', {
                    roomId: state.room.id,
                    userId: state.user.id,
                    currentTime: 0,
                    playerState: 'paused'
                });
            },
            onStateChange: (event) => {
                // La gestion des états est maintenant déléguée au SyncManager
                updateControlsUI(event.data);
            },
            onError: (event) => {
                console.error('❌ Erreur du lecteur YouTube:', event.data);
                showNotification('Erreur lors de la lecture de la vidéo', 'error');
            }
        }
    });
}

// Configurer les contrôles vidéo
function setupVideoControls() {
    if (!state.player) return;
    
    // Gestion de la barre de progression
    progressBar.addEventListener('mousedown', () => {
        if (state.syncManager) {
            state.syncManager.isSeeking = true;
        }
    });
    
    progressBar.addEventListener('mouseup', () => {
        const newTime = (progressBar.value / 100) * state.player.getDuration();
        socket.emit('video-seek', {
            roomId: state.room.id,
            userId: state.user.id,
            time: newTime
        });
        
        if (state.syncManager) {
            setTimeout(() => {
                state.syncManager.isSeeking = false;
            }, 500);
        }
    });
    
    // Gestion du bouton play/pause
    playPauseBtn.addEventListener('click', () => {
        const isPlaying = state.player.getPlayerState() === YT.PlayerState.PLAYING;
        const action = isPlaying ? 'pause' : 'play';
        
        socket.emit('video-control', {
            roomId: state.room.id,
            userId: state.user.id,
            userName: state.user.name,
            action: action,
            currentTime: state.player.getCurrentTime()
        });
        
        if (action === 'play') {
            state.player.playVideo();
            updateSystemMessage(`${state.user.name} a lancé la lecture`);
        } else {
            state.player.pauseVideo();
            updateSystemMessage(`${state.user.name} a mis la vidéo en pause`);
        }
    });
    
    // Gestion du volume
    volumeBtn.addEventListener('click', () => {
        const isMuted = state.player.isMuted();
        if (isMuted) {
            state.player.unMute();
            const volume = state.player.getVolume();
            volumeRange.value = volume;
            updateVolumeIcon(volume);
        } else {
            state.player.mute();
            volumeRange.value = 0;
            updateVolumeIcon(0);
        }
    });
    
    volumeRange.addEventListener('input', (e) => {
        const volume = e.target.value;
        state.player.setVolume(volume);
        updateVolumeIcon(volume);
        
        if (volume > 0) {
            state.player.unMute();
        } else {
            state.player.mute();
        }
    });
    
    // Gestion du plein écran
    fullscreenBtn.addEventListener('click', () => {
        const videoContainer = document.querySelector('.video-container');
        if (!document.fullscreenElement) {
            if (videoContainer.requestFullscreen) {
                videoContainer.requestFullscreen();
            } else if (videoContainer.webkitRequestFullscreen) {
                videoContainer.webkitRequestFullscreen();
            } else if (videoContainer.msRequestFullscreen) {
                videoContainer.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    });
    
    // Mettre à jour la barre de progression
    setInterval(() => {
        if (state.player && state.player.getCurrentTime && state.player.getDuration) {
            const currentTime = state.player.getCurrentTime();
            const duration = state.player.getDuration();
            const progress = (currentTime / duration) * 100;
            
            progressBar.value = progress;
            progressFilled.style.width = `${progress}%`;
            
            // Mettre à jour les affichages de temps
            currentTimeElement.textContent = formatTime(currentTime);
            totalTimeElement.textContent = formatTime(duration);
        }
    }, 1000);
}

// ... rest of the existing code ... 