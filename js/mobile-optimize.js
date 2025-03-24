// Optimisations spécifiques pour tous les appareils mobiles
document.addEventListener('DOMContentLoaded', function() {
    // Détecter si l'appareil est un smartphone
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) return; // Ne rien faire si ce n'est pas un mobile
    
    console.log('📱 Optimisations mobiles activées');
    
    // Charger le fichier CSS spécifique pour mobile
    loadMobileCSS();
    
    // Appliquer la classe mobile à body
    document.body.classList.add('mobile-device');
    
    // Détecter spécifiquement iOS pour appliquer des correctifs supplémentaires
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        document.body.classList.add('ios-device');
    }
    
    // NOUVELLE APPROCHE: au lieu de restructurer complètement, adapter l'interface existante
    // Cette approche conserve le DOM original mais modifie son apparence et comportement
    function adaptInterfaceForMobile() {
        const roomPage = document.querySelector('.room-page');
        if (!roomPage) return; // Ne s'applique qu'à la page de room
        
        console.log('🔄 Adaptation de l\'interface pour mobile en cours...');
        
        // Éléments principaux
        const roomContainer = document.querySelector('.room-container');
        const videoSection = document.querySelector('.video-section');
        const roomSidebar = document.querySelector('.room-sidebar');
        const videoPlayer = document.querySelector('#video-player');
        const tabsContainer = document.querySelector('.tabs');
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        // Vérifier les éléments essentiels
        if (!roomContainer || !videoSection || !roomSidebar || !videoPlayer) {
            console.error('❌ Éléments essentiels non trouvés');
            return;
        }
        
        console.log('✅ Éléments trouvés, début de l\'adaptation');
        
        // 1. S'assurer que la vidéo est visible et au bon format
        videoPlayer.style.display = 'block';
        videoPlayer.style.width = '100%';
        videoPlayer.style.height = '100%';
        videoSection.style.width = '100%';
        
        // S'assurer que les contrôles YouTube sont activés pour mobile
        fixYouTubePlayerForMobile();
        
        // 2. Créer et ajouter la navigation du bas
        const bottomNav = document.createElement('div');
        bottomNav.className = 'mobile-bottom-nav';
        
        // Créer les boutons de navigation
        const navItems = [
            { id: 'video-nav', icon: 'fa-play-circle', text: 'Vidéo', target: 'video' },
            { id: 'playlist-nav', icon: 'fa-list', text: 'Playlist', target: 'playlist' },
            { id: 'chat-nav', icon: 'fa-comment', text: 'Chat', target: 'chat' },
            { id: 'participants-nav', icon: 'fa-users', text: 'Participants', target: 'participants' }
        ];
        
        navItems.forEach(item => {
            const navBtn = document.createElement('button');
            navBtn.className = 'nav-item';
            navBtn.id = item.id;
            navBtn.dataset.tab = item.target;
            navBtn.innerHTML = `<i class="fas ${item.icon}"></i>${item.text}`;
            
            if (item.target === 'video') {
                navBtn.classList.add('active');
            }
            
            bottomNav.appendChild(navBtn);
        });
        
        document.body.appendChild(bottomNav);
        console.log('✅ Navigation du bas ajoutée');
        
        // 3. Créer un conteneur de vidéo pour la vue "Vidéo" séparée
        if (!document.getElementById('mobile-video-container')) {
            const mobileVideoContainer = document.createElement('div');
            mobileVideoContainer.id = 'mobile-video-container';
            mobileVideoContainer.className = 'mobile-video-container';
            
            // Placer le conteneur vidéo juste après le header
            const header = document.querySelector('.room-header');
            if (header) {
                header.after(mobileVideoContainer);
                console.log('✅ Conteneur vidéo mobile créé');
            }
        }
        
        // 4. Configurer les onglets pour le mode mobile
        setupMobileTabNavigation();
        
        // 5. Rendre le chat accessible depuis n'importe quel onglet
        setupFloatingChat();
        
        // 6. Améliorer les contrôles vidéo pour mobile
        enhanceVideoControls();
        
        // 7. Ajuster le layout selon l'orientation
        handleOrientationChange();
        
        // 8. Observer les changements dans le lecteur vidéo
        observeVideoPlayerChanges();
        
        console.log('✅ Adaptation pour mobile terminée avec succès');
    }
    
    // Observer les modifications du lecteur vidéo pour s'assurer qu'il reste visible et fonctionnel
    function observeVideoPlayerChanges() {
        const videoPlayer = document.querySelector('#video-player');
        if (!videoPlayer) return;
        
        console.log('🔄 Configuration de l\'observateur du lecteur vidéo');
        
        // Créer un observateur pour surveiller les modifications du DOM
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    // Vérifier si un iframe YouTube a été ajouté
                    const youtubePlayer = videoPlayer.querySelector('iframe[src*="youtube"]');
                    if (youtubePlayer) {
                        console.log('✅ Lecteur YouTube détecté, application des optimisations');
                        
                        // Corriger l'intégration YouTube pour mobile
                        fixYouTubeIframe(youtubePlayer);
                        
                        // S'assurer que l'iframe est bien dimensionné
                        youtubePlayer.style.width = '100%';
                        youtubePlayer.style.height = '100%';
                        youtubePlayer.setAttribute('playsinline', '1');
                        youtubePlayer.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
                    }
                    
                    // Vérifier si un lecteur vidéo HTML5 a été ajouté
                    const htmlVideoPlayer = videoPlayer.querySelector('video');
                    if (htmlVideoPlayer) {
                        console.log('✅ Lecteur vidéo HTML5 détecté, application des optimisations');
                        
                        // Optimiser le lecteur HTML5 pour mobile
                        htmlVideoPlayer.setAttribute('playsinline', 'true');
                        htmlVideoPlayer.setAttribute('webkit-playsinline', 'true');
                        htmlVideoPlayer.style.width = '100%';
                        htmlVideoPlayer.style.height = '100%';
                    }
                }
            });
        });
        
        // Démarrer l'observation
        observer.observe(videoPlayer, { 
            childList: true,
            subtree: true
        });
    }
    
    // Corriger l'intégration des iframes YouTube pour mobile
    function fixYouTubeIframe(iframe) {
        if (!iframe) return;
        
        // S'assurer que l'URL contient les paramètres nécessaires pour mobile
        let src = iframe.src;
        
        // Ajouter les paramètres nécessaires s'ils ne sont pas déjà présents
        if (!src.includes('playsinline=1')) {
            src = src.includes('?') ? `${src}&playsinline=1` : `${src}?playsinline=1`;
        }
        
        // Mettre à jour la source de l'iframe
        iframe.src = src;
        
        // Attribuer du style pour garantir la visibilité
        iframe.style.position = 'absolute';
        iframe.style.left = '0';
        iframe.style.top = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
    }
    
    // Corriger le lecteur YouTube pour une meilleure compatibilité mobile
    function fixYouTubePlayerForMobile() {
        // S'assurer que l'API YouTube charge avec les bonnes options pour mobile
        if (typeof YT !== 'undefined' && YT.Player) {
            // L'API est déjà chargée, modifier les options par défaut
            console.log('✅ API YouTube déjà chargée, configuration pour mobile');
            
            // Sauvegarder la fonction originale de création du player
            const originalCreatePlayer = window.createPlayer;
            
            // Remplacer par une version optimisée pour mobile
            window.createPlayer = function(videoId) {
                console.log('🔄 Création du lecteur YouTube optimisé pour mobile');
                
                // Supprimer le placeholder
                const videoPlayer = document.querySelector('#video-player');
                const placeholder = videoPlayer?.querySelector('.placeholder-player');
                if (placeholder) {
                    placeholder.remove();
                }
                
                // Créer un élément pour le player
                const playerElement = document.createElement('div');
                playerElement.id = 'yt-player';
                videoPlayer.appendChild(playerElement);
                
                // Créer le player YouTube avec des options optimisées pour mobile
                window.player = new YT.Player('yt-player', {
                    height: '100%',
                    width: '100%',
                    videoId: videoId,
                    playerVars: {
                        'playsinline': 1,
                        'autoplay': 1,
                        'controls': 0,
                        'rel': 0,
                        'modestbranding': 1,
                        'enablejsapi': 1,
                        'fs': 1,
                        'origin': window.location.origin
                    },
                    events: {
                        'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange
                    }
                });
            };
        } else {
            console.log('🔄 API YouTube pas encore chargée, préparation du hook');
            
            // Sauvegarder la fonction originale
            const originalOnYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady;
            
            // Remplacer par notre fonction optimisée
            window.onYouTubeIframeAPIReady = function() {
                console.log('✅ API YouTube chargée, configuration pour mobile');
                
                // Appeler la fonction originale si elle existe
                if (typeof originalOnYouTubeIframeAPIReady === 'function') {
                    originalOnYouTubeIframeAPIReady();
                }
                
                // Configurer l'API pour mobile
                if (typeof YT !== 'undefined' && YT.Player) {
                    // Personnaliser les options pour mobile
                    const originalYTPFunction = YT.Player;
                    YT.Player = function(id, options) {
                        // S'assurer que les options de l'intégration mobile sont correctes
                        if (options && options.playerVars) {
                            options.playerVars.playsinline = 1;
                            options.playerVars.modestbranding = 1;
                            options.playerVars.fs = 1;
                        }
                        return new originalYTPFunction(id, options);
                    };
                }
            };
        }
    }
    
    // Configuration de la navigation par onglets adaptée pour mobile
    function setupMobileTabNavigation() {
        // Obtenir les onglets et leurs boutons
        const tabPanes = document.querySelectorAll('.tab-pane');
        const originalTabBtns = document.querySelectorAll('.tab-btn');
        const mobileNavBtns = document.querySelectorAll('.mobile-bottom-nav .nav-item');
        
        // Repositionner la vidéo pour l'onglet "Vidéo"
        function showVideoTab() {
            const videoSection = document.querySelector('.video-section');
            const mobileVideoContainer = document.getElementById('mobile-video-container');
            
            if (videoSection && mobileVideoContainer) {
                // Déplacer la section vidéo dans le conteneur mobile
                if (!mobileVideoContainer.contains(videoSection)) {
                    mobileVideoContainer.appendChild(videoSection);
                    
                    // Vérifier si un lecteur YouTube est présent et le réparer
                    const youtubeIframe = document.querySelector('iframe[src*="youtube"]');
                    if (youtubeIframe) {
                        fixYouTubeIframe(youtubeIframe);
                    }
                }
                
                // S'assurer que la vidéo est visible
                const videoPlayer = document.querySelector('#video-player');
                if (videoPlayer) {
                    videoPlayer.style.display = 'block';
                }
                
                // Ajuster la disposition
                mobileVideoContainer.style.display = 'block';
                document.querySelector('.room-sidebar').style.display = 'none';
                
                console.log('✅ Onglet Vidéo activé');
            }
        }
        
        // Montrer les autres onglets (playlist, chat, participants)
        function showSidebarTab(tabId) {
            const mobileVideoContainer = document.getElementById('mobile-video-container');
            if (mobileVideoContainer) {
                mobileVideoContainer.style.display = 'none';
            }
            
            // Afficher la sidebar
            const roomSidebar = document.querySelector('.room-sidebar');
            if (roomSidebar) {
                roomSidebar.style.display = 'block';
                
                // Activer l'onglet cliqué dans l'interface originale
                originalTabBtns.forEach(btn => {
                    if (btn.dataset.tab === tabId) {
                        btn.click();
                    }
                });
                
                console.log(`✅ Onglet ${tabId} activé`);
            }
        }
        
        // Ajouter les gestionnaires d'événements pour la navigation mobile
        mobileNavBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Mettre à jour l'état actif
                mobileNavBtns.forEach(navBtn => navBtn.classList.remove('active'));
                this.classList.add('active');
                
                const tabId = this.dataset.tab;
                console.log(`🔄 Navigation vers: ${tabId}`);
                
                // Afficher le contenu approprié
                if (tabId === 'video') {
                    showVideoTab();
                } else {
                    showSidebarTab(tabId);
                }
            });
        });
        
        // Activer l'onglet vidéo par défaut
        showVideoTab();
        console.log('✅ Navigation par onglets configurée');
    }
    
    // Configuration du chat flottant
    function setupFloatingChat() {
        // Créer le bouton de chat flottant s'il n'existe pas
        if (!document.getElementById('chat-float-btn')) {
            const chatFloatBtn = document.createElement('button');
            chatFloatBtn.id = 'chat-float-btn';
            chatFloatBtn.className = 'chat-float-btn';
            chatFloatBtn.innerHTML = '<i class="fas fa-comment-alt"></i>';
            document.body.appendChild(chatFloatBtn);
            
            // Gestionnaire d'événement pour le bouton flottant
            chatFloatBtn.addEventListener('click', function() {
                console.log('🔄 Affichage du chat flottant');
                document.body.classList.toggle('show-floating-chat');
                
                // Activer l'onglet de chat
                const chatTabBtn = document.querySelector('.tab-btn[data-tab="chat"]');
                if (chatTabBtn && !chatTabBtn.classList.contains('active')) {
                    chatTabBtn.click();
                }
                
                // Faire défiler jusqu'au dernier message
                setTimeout(() => {
                    const chatMessages = document.querySelector('.chat-messages');
                    if (chatMessages) {
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }, 300);
            });
            
            console.log('✅ Bouton de chat flottant ajouté');
        }
        
        // Ajouter le bouton de fermeture s'il n'existe pas déjà
        if (!document.getElementById('close-float-chat')) {
            const closeBtn = document.createElement('button');
            closeBtn.id = 'close-float-chat';
            closeBtn.className = 'close-float-chat';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            
            // Ajouter au début de la section de chat
            const chatPane = document.getElementById('chat');
            if (chatPane) {
                chatPane.insertBefore(closeBtn, chatPane.firstChild);
                
                // Gestionnaire d'événement pour fermer
                closeBtn.addEventListener('click', function() {
                    document.body.classList.remove('show-floating-chat');
                });
                
                console.log('✅ Bouton de fermeture du chat ajouté');
            }
        }
    }
    
    // Améliorer les contrôles vidéo pour mobile
    function enhanceVideoControls() {
        const videoPlayer = document.querySelector('#video-player');
        const videoControls = document.querySelector('.video-controls');
        
        if (!videoPlayer || !videoControls) {
            console.error('❌ Éléments vidéo non trouvés');
            return;
        }
        
        console.log('✅ Configuration des contrôles vidéo');
        
        // Les contrôles sont toujours visibles sur mobile
        videoControls.style.opacity = '1';
        
        // Gestion du double-tap pour lecture/pause
        let lastTap = 0;
        videoPlayer.addEventListener('touchend', function(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                // Double tap détecté
                const playPauseBtn = document.getElementById('play-pause-btn');
                if (playPauseBtn) {
                    playPauseBtn.click();
                    console.log('✅ Double-tap détecté - lecture/pause');
                }
                e.preventDefault();
            }
            
            lastTap = currentTime;
        });
        
        // Améliorer la barre de progression
        const progressBar = videoControls.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.addEventListener('touchstart', function(e) {
                e.stopPropagation();
                
                const updateProgressFromTouch = function(touchEvent) {
                    const rect = progressBar.getBoundingClientRect();
                    const offsetX = touchEvent.touches[0].clientX - rect.left;
                    const width = rect.width;
                    
                    // Calculer le pourcentage
                    let percent = offsetX / width;
                    if (percent < 0) percent = 0;
                    if (percent > 1) percent = 1;
                    
                    // Mettre à jour la barre visuellement
                    const filled = progressBar.querySelector('.progress-filled');
                    if (filled) {
                        filled.style.width = (percent * 100) + '%';
                    }
                    
                    // Déclencher un événement personnalisé
                    const seekEvent = new CustomEvent('mobile-seek', { 
                        detail: { percent: percent }
                    });
                    progressBar.dispatchEvent(seekEvent);
                    
                    // Récupérer le lecteur YouTube si disponible
                    const youtubePlayer = document.querySelector('iframe[src*="youtube"]');
                    if (youtubePlayer && window.player) {
                        const duration = window.player.getDuration();
                        window.player.seekTo(duration * percent);
                    }
                };
                
                // Mise à jour pendant le déplacement
                const touchMove = function(moveEvent) {
                    moveEvent.preventDefault();
                    updateProgressFromTouch(moveEvent);
                };
                
                // Nettoyage
                const touchEnd = function() {
                    document.removeEventListener('touchmove', touchMove);
                    document.removeEventListener('touchend', touchEnd);
                };
                
                document.addEventListener('touchmove', touchMove, { passive: false });
                document.addEventListener('touchend', touchEnd);
                
                updateProgressFromTouch(e);
            }, { passive: false });
        }
    }
    
    // Gérer les changements d'orientation
    function handleOrientationChange() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        console.log(`🔄 Changement d'orientation: ${isLandscape ? 'paysage' : 'portrait'}`);
        
        // Ajuster l'interface selon l'orientation
        document.body.classList.toggle('landscape', isLandscape);
        
        // Ajuster la hauteur du conteneur vidéo en mode portrait
        const mobileVideoContainer = document.getElementById('mobile-video-container');
        if (mobileVideoContainer) {
            if (isLandscape) {
                // En paysage, utiliser toute la hauteur disponible
                mobileVideoContainer.style.height = 'calc(100vh - 50px)'; // Soustraire la hauteur du header
            } else {
                // En portrait, limiter la hauteur pour la navigation
                mobileVideoContainer.style.height = '40vh';
            }
        }
        
        // Rafraîchir les conteneurs scrollables
        const scrollContainers = [
            '.chat-messages',
            '.playlist-items',
            '.participants-list'
        ];
        
        scrollContainers.forEach(selector => {
            const container = document.querySelector(selector);
            if (container) {
                // Forcer le recalcul du scroll
                container.style.overflow = 'hidden';
                setTimeout(() => {
                    container.style.overflow = 'auto';
                }, 10);
            }
        });
        
        // Réinitialiser les lecteurs vidéo si nécessaire
        const youtubeIframe = document.querySelector('iframe[src*="youtube"]');
        if (youtubeIframe) {
            fixYouTubeIframe(youtubeIframe);
        }
    }
    
    // Adapter les modales pour le mobile
    function fixMobileModals() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            modal.addEventListener('touchmove', function(e) {
                e.stopPropagation();
            }, { passive: false });
            
            // Fermer au clic à l'extérieur
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    const closeBtn = modal.querySelector('.close');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                }
            });
            
            // Améliorer le formulaire d'ajout de vidéo
            if (modal.id === 'add-video-modal') {
                const inputs = modal.querySelectorAll('input');
                inputs.forEach(input => {
                    input.style.height = '44px';
                    input.style.fontSize = '16px';
                });
            }
        });
        
        console.log('✅ Modales adaptées pour mobile');
    }
    
    // Observer les changements dans le chat pour les synchroniser
    function setupChatObserver() {
        // Trouver le conteneur de messages du chat
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;
        
        // Créer un observateur pour détecter les nouveaux messages
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    console.log('✅ Nouveaux messages détectés dans le chat');
                    
                    // Faire défiler vers le bas
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            });
        });
        
        // Configurer l'observateur
        observer.observe(chatMessages, { 
            childList: true,
            subtree: false
        });
        
        console.log('✅ Observateur de chat configuré');
    }
    
    // Fonction d'initialisation principale
    function initialize() {
        // Adapter l'interface existante au lieu de la reconstruire
        adaptInterfaceForMobile();
        
        // Optimiser les modales
        fixMobileModals();
        
        // Configuration de l'observateur de chat
        setupChatObserver();
        
        // Surveiller les changements d'orientation
        window.addEventListener('resize', handleOrientationChange);
        window.addEventListener('orientationchange', handleOrientationChange);
        
        // Initialiser l'orientation actuelle
        handleOrientationChange();
        
        console.log('🚀 Interface mobile initialisée avec succès');
    }
    
    // Démarrer l'initialisation après un court délai pour s'assurer que tout est chargé
    setTimeout(initialize, 600);
});

// Charger le fichier CSS spécifique pour mobile
function loadMobileCSS() {
    // Vérifier si le fichier est déjà chargé
    if (document.querySelector('link[href="css/mobile.css"]')) return;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'css/mobile.css';
    document.head.appendChild(link);
    
    console.log('✅ CSS mobile chargé');
}