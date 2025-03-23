/**
 * Script d'intégration pour connecter la nouvelle interface mobile avec les fonctionnalités existantes
 * Ce script fait le pont entre la structure DOM originale et la nouvelle structure mobile
 */

document.addEventListener('DOMContentLoaded', function() {
    // Ne s'exécute que sur mobile
    if (!document.body.classList.contains('mobile-device')) return;
    
    console.log("🔄 Initialisation de l'intégration mobile");
    
    // Attendre que la restructuration mobile soit terminée
    setTimeout(connectMobileInterface, 500);
    
    function connectMobileInterface() {
        connectVideoControls();
        connectPlaylistFunctions();
        connectChatIntegration();
        connectEventListeners();
        monitorSocketEvents();
    }
    
    // Synchroniser les contrôles vidéo entre la version originale et mobile
    function connectVideoControls() {
        // Éléments vidéo originaux
        const originalVideo = document.querySelector('.video-section #video-player');
        const originalPlayPauseBtn = document.querySelector('#play-pause-btn');
        const originalProgressBar = document.querySelector('.progress-bar');
        const originalVolumeBtn = document.querySelector('#volume-btn');
        const originalFullscreenBtn = document.querySelector('#fullscreen-btn');
        
        // Éléments vidéo mobiles
        const mobileVideo = document.querySelector('.video-page #video-player');
        const mobilePlayPauseBtn = document.querySelector('.video-page #play-pause-btn');
        const mobileProgressBar = document.querySelector('.video-page .progress-bar');
        
        // Vérifier l'existence des éléments avant de continuer
        if (!originalVideo || !mobileVideo) return;
        
        // Événement de recherche mobile
        if (mobileProgressBar) {
            mobileProgressBar.addEventListener('mobile-seek', function(e) {
                // Propager l'événement de recherche à la barre de progression originale
                if (originalVideo && originalVideo.duration) {
                    const seekTime = originalVideo.duration * e.detail.percent;
                    
                    // Simuler un événement de clic sur la barre de progression originale
                    // ou accéder directement à l'API du lecteur selon l'implémentation
                    if (typeof seekVideo === 'function') {
                        seekVideo(seekTime);
                    } else if (originalVideo.currentTime !== undefined) {
                        originalVideo.currentTime = seekTime;
                    }
                }
            });
        }
        
        // Mettre à jour l'état de lecture/pause
        const updatePlayPauseState = function() {
            if (!originalVideo || !mobilePlayPauseBtn) return;
            
            // Vérifier si la vidéo est en pause
            const isPaused = originalVideo.paused;
            
            // Mettre à jour l'icône du bouton mobile
            if (mobilePlayPauseBtn) {
                mobilePlayPauseBtn.innerHTML = isPaused ? 
                    '<i class="fas fa-play"></i>' : 
                    '<i class="fas fa-pause"></i>';
            }
        };
        
        // Mettre à jour la progression de la vidéo
        const updateVideoProgress = function() {
            if (!originalVideo || !mobileProgressBar) return;
            
            // Calculer le pourcentage de progression
            const percent = originalVideo.currentTime / originalVideo.duration * 100 || 0;
            
            // Mettre à jour la barre de progression mobile
            const progressFilled = mobileProgressBar.querySelector('.progress-filled');
            if (progressFilled) {
                progressFilled.style.width = percent + '%';
            }
            
            // Mettre à jour les affichages de temps
            const currentTimeEl = document.querySelector('.video-page .current-time');
            const durationEl = document.querySelector('.video-page .duration');
            
            if (currentTimeEl) {
                currentTimeEl.textContent = formatTime(originalVideo.currentTime);
            }
            
            if (durationEl) {
                durationEl.textContent = formatTime(originalVideo.duration);
            }
        };
        
        // Formater le temps en minutes:secondes
        function formatTime(seconds) {
            if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
            
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' + secs : secs}`;
        }
        
        // Ajouter des écouteurs d'événements
        if (originalVideo) {
            originalVideo.addEventListener('play', updatePlayPauseState);
            originalVideo.addEventListener('pause', updatePlayPauseState);
            originalVideo.addEventListener('timeupdate', updateVideoProgress);
        }
        
        // Initialiser l'état
        updatePlayPauseState();
        updateVideoProgress();
    }
    
    // Connecter les fonctionnalités de playlist
    function connectPlaylistFunctions() {
        // Observer les changements dans la playlist originale
        const originalPlaylist = document.querySelector('#playlist .playlist-items');
        const mobilePlaylist = document.querySelector('#playlist-page .playlist-items');
        
        if (!originalPlaylist || !mobilePlaylist) return;
        
        // Options pour l'observer
        const observerConfig = { childList: true, subtree: true };
        
        // Créer un observateur de mutations pour la playlist
        const playlistObserver = new MutationObserver(function(mutations) {
            // Mettre à jour la playlist mobile avec les nouveaux éléments
            syncPlaylist();
        });
        
        // Démarrer l'observation
        playlistObserver.observe(originalPlaylist, observerConfig);
        
        // Synchroniser la playlist
        function syncPlaylist() {
            // Vider la playlist mobile
            while (mobilePlaylist.firstChild) {
                mobilePlaylist.removeChild(mobilePlaylist.firstChild);
            }
            
            // Copier les éléments de la playlist originale vers la mobile
            Array.from(originalPlaylist.children).forEach(item => {
                const clone = item.cloneNode(true);
                
                // Ajouter des écouteurs d'événements aux boutons clonés
                const playBtn = clone.querySelector('.fa-play').closest('button');
                const deleteBtn = clone.querySelector('.fa-trash').closest('button');
                
                if (playBtn) {
                    playBtn.addEventListener('click', function(e) {
                        // Trouver et cliquer sur le bouton correspondant dans la playlist originale
                        const index = Array.from(mobilePlaylist.children).indexOf(clone);
                        const originalPlayBtn = originalPlaylist.children[index].querySelector('.fa-play').closest('button');
                        if (originalPlayBtn) {
                            originalPlayBtn.click();
                        }
                    });
                }
                
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function(e) {
                        // Trouver et cliquer sur le bouton correspondant dans la playlist originale
                        const index = Array.from(mobilePlaylist.children).indexOf(clone);
                        const originalDeleteBtn = originalPlaylist.children[index].querySelector('.fa-trash').closest('button');
                        if (originalDeleteBtn) {
                            originalDeleteBtn.click();
                        }
                    });
                }
                
                mobilePlaylist.appendChild(clone);
            });
        }
        
        // Initialiser la synchronisation
        syncPlaylist();
    }
    
    // Connecter le système de chat
    function connectChatIntegration() {
        // Observer les nouveaux messages dans le chat original
        const originalChatMessages = document.querySelector('#chat .chat-messages');
        const mobileChatMessages = document.querySelector('.chat-container .chat-messages');
        
        if (!originalChatMessages || !mobileChatMessages) return;
        
        // Options pour l'observer
        const observerConfig = { childList: true, subtree: false };
        
        // Créer un observateur de mutations pour le chat
        const chatObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Pour chaque nouveau message, l'ajouter au chat mobile
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.classList.contains('message')) {
                            const clone = node.cloneNode(true);
                            mobileChatMessages.appendChild(clone);
                            
                            // Faire défiler vers le bas
                            mobileChatMessages.scrollTop = mobileChatMessages.scrollHeight;
                        }
                    });
                }
            });
        });
        
        // Démarrer l'observation
        chatObserver.observe(originalChatMessages, observerConfig);
        
        // Synchroniser les messages existants
        function syncChatMessages() {
            // Vider le chat mobile
            while (mobileChatMessages.firstChild) {
                mobileChatMessages.removeChild(mobileChatMessages.firstChild);
            }
            
            // Copier les messages existants
            Array.from(originalChatMessages.children).forEach(message => {
                const clone = message.cloneNode(true);
                mobileChatMessages.appendChild(clone);
            });
            
            // Faire défiler vers le bas
            mobileChatMessages.scrollTop = mobileChatMessages.scrollHeight;
        }
        
        // Initialiser la synchronisation
        syncChatMessages();
    }
    
    // Connecter les autres écouteurs d'événements
    function connectEventListeners() {
        // Gérer les changements de visibilité des pages
        const mobileNavItems = document.querySelectorAll('.nav-item');
        
        mobileNavItems.forEach(item => {
            item.addEventListener('click', function() {
                // Si on passe à la vidéo, s'assurer que celle-ci est visible
                if (this.dataset.target === 'video-page') {
                    // Mettre à jour la visibilité de la vidéo si nécessaire
                    const videoPlayer = document.querySelector('#video-player');
                    if (videoPlayer && typeof updateVideoVisibility === 'function') {
                        updateVideoVisibility(true);
                    }
                }
            });
        });
        
        // Synchroniser l'ajout de vidéos
        const addVideoModal = document.getElementById('add-video-modal');
        const searchVideoBtn = document.getElementById('search-video-btn');
        const addUrlBtn = document.getElementById('add-url-btn');
        
        if (addUrlBtn) {
            addUrlBtn.addEventListener('click', function() {
                const urlInput = document.getElementById('video-url-input');
                if (urlInput && urlInput.value.trim()) {
                    // Trouver et remplir l'entrée URL originale
                    const originalUrlInput = document.querySelector('#add-video-modal #video-url-input');
                    const originalAddUrlBtn = document.querySelector('#add-video-modal #add-url-btn');
                    
                    if (originalUrlInput && originalAddUrlBtn) {
                        originalUrlInput.value = urlInput.value;
                        originalAddUrlBtn.click();
                        
                        // Réinitialiser l'entrée mobile
                        urlInput.value = '';
                        
                        // Fermer la modale
                        if (addVideoModal) {
                            addVideoModal.classList.remove('show');
                        }
                    }
                }
            });
        }
    }
    
    // Surveiller les événements socket pour la synchronisation
    function monitorSocketEvents() {
        // Si un système de socket est utilisé, ajouter des écouteurs
        if (window.socket) {
            // Exemple d'écouteur pour un nouveau message de chat reçu via socket
            window.socket.on('new_message', function(message) {
                // Mettre à jour l'interface mobile si nécessaire
                updateMobileChatWithSocketMessage(message);
            });
            
            // Exemple d'écouteur pour un changement d'état de la vidéo
            window.socket.on('video_state_change', function(state) {
                // Mettre à jour l'interface mobile
                updateMobileVideoState(state);
            });
        }
        
        // Fonctions pour gérer les mises à jour socket
        function updateMobileChatWithSocketMessage(message) {
            // Cette fonction serait implémentée selon la structure du message
        }
        
        function updateMobileVideoState(state) {
            // Cette fonction serait implémentée selon la structure de l'état
        }
    }
});

// Ajouter cette fonction à la fenêtre pour qu'elle soit accessible depuis d'autres scripts
window.initMobileIntegration = function() {
    // Déclencher un événement DOMContentLoaded pour initialiser l'intégration
    document.dispatchEvent(new Event('DOMContentLoaded'));
}; 