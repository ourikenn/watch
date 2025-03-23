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
    
    // NOUVELLE STRUCTURE POUR INTERFACE MOBILE COMPLÈTEMENT REPENSÉE
    // Cette fonction restructure complètement le DOM de la page
    function restructureForMobile() {
        const roomPage = document.querySelector('.room-page');
        if (!roomPage) return; // Ne s'applique qu'à la page de room
        
        // 1. Récupérer tous les éléments importants originaux
        const header = document.querySelector('.room-header');
        const videoSection = document.querySelector('.video-section');
        const roomSidebar = document.querySelector('.room-sidebar');
        const tabsContainer = document.querySelector('.tabs');
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        // Cloner les éléments pour éviter les références déplacées
        const videoSectionClone = videoSection.cloneNode(true);
        
        // 2. Créer la nouvelle structure
        
        // Créer le conteneur principal des pages
        const mobileContent = document.createElement('div');
        mobileContent.className = 'mobile-content';
        
        // Créer les pages individuelles
        const videoPage = document.createElement('div');
        videoPage.className = 'mobile-page video-page active';
        videoPage.id = 'video-page';
        
        const playlistPage = document.createElement('div');
        playlistPage.className = 'mobile-page playlist-page';
        playlistPage.id = 'playlist-page';
        
        const participantsPage = document.createElement('div');
        participantsPage.className = 'mobile-page participants-page';
        participantsPage.id = 'participants-page';
        
        // Créer la navigation du bas
        const bottomNav = document.createElement('div');
        bottomNav.className = 'mobile-bottom-nav';
        
        // Créer le conteneur de chat flottant
        const chatContainer = document.createElement('div');
        chatContainer.className = 'chat-container';
        chatContainer.innerHTML = `
            <div class="chat-header">
                <h3>Chat</h3>
                <button id="close-chat-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <input type="text" id="message-input" placeholder="Écrivez votre message...">
                <button id="send-message-btn"><i class="fas fa-paper-plane"></i></button>
            </div>
        `;
        
        // Créer le bouton flottant pour ouvrir le chat
        const chatToggleBtn = document.createElement('button');
        chatToggleBtn.className = 'chat-toggle-btn';
        chatToggleBtn.innerHTML = '<i class="fas fa-comment-alt"></i>';
        chatToggleBtn.id = 'chat-toggle-btn';
        
        // 3. Construire la structure des pages
        
        // Page vidéo
        videoPage.appendChild(videoSectionClone);
        
        // Page playlist
        const playlistTab = document.querySelector('#playlist');
        if (playlistTab) {
            const playlistContent = playlistTab.cloneNode(true);
            playlistPage.appendChild(playlistContent);
        }
        
        // Page participants
        const participantsTab = document.querySelector('#participants');
        if (participantsTab) {
            const participantsContent = participantsTab.cloneNode(true);
            participantsPage.appendChild(participantsContent);
        }
        
        // Chat - déplacer le contenu du chat dans le conteneur flottant
        const chatTab = document.querySelector('#chat');
        if (chatTab) {
            const chatMessages = chatTab.querySelector('.chat-messages');
            const newChatMessages = chatContainer.querySelector('.chat-messages');
            
            if (chatMessages && newChatMessages) {
                // Copier tous les messages
                Array.from(chatMessages.children).forEach(child => {
                    newChatMessages.appendChild(child.cloneNode(true));
                });
            }
            
            // Configurer le champ d'entrée
            const originalInput = chatTab.querySelector('#message-input');
            const originalSendBtn = chatTab.querySelector('#send-message-btn');
            const newInput = chatContainer.querySelector('#message-input');
            const newSendBtn = chatContainer.querySelector('#send-message-btn');
            
            if (originalInput && newInput) {
                // Copier les attributs et événements importants
                newInput.placeholder = originalInput.placeholder;
                
                newInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        sendChatMessage();
                    }
                });
                
                newSendBtn.addEventListener('click', sendChatMessage);
            }
        }
        
        // 4. Créer la navigation
        const navItems = [
            { id: 'video-nav', icon: 'fa-play-circle', text: 'Vidéo', target: 'video-page' },
            { id: 'playlist-nav', icon: 'fa-list', text: 'Playlist', target: 'playlist-page' },
            { id: 'participants-nav', icon: 'fa-users', text: 'Participants', target: 'participants-page' }
        ];
        
        navItems.forEach(item => {
            const navBtn = document.createElement('button');
            navBtn.className = 'nav-item';
            navBtn.id = item.id;
            navBtn.dataset.target = item.target;
            navBtn.innerHTML = `<i class="fas ${item.icon}"></i>${item.text}`;
            
            // Activer le premier élément par défaut
            if (item.target === 'video-page') {
                navBtn.classList.add('active');
            }
            
            bottomNav.appendChild(navBtn);
        });
        
        // 5. Ajouter les boutons flottants
        const floatingControls = document.createElement('div');
        floatingControls.className = 'mobile-floating-controls';
        
        // Bouton pour ajouter une vidéo
        const addVideoBtn = document.createElement('button');
        addVideoBtn.className = 'mobile-floating-btn';
        addVideoBtn.id = 'mobile-add-video';
        addVideoBtn.innerHTML = '<i class="fas fa-plus"></i>';
        
        // Bouton pour revenir à l'accueil
        const homeBtn = document.createElement('button');
        homeBtn.className = 'mobile-floating-btn';
        homeBtn.id = 'mobile-home-btn';
        homeBtn.innerHTML = '<i class="fas fa-home"></i>';
        
        floatingControls.appendChild(addVideoBtn);
        floatingControls.appendChild(homeBtn);
        
        // 6. Vider et reconstruire la page
        const roomContainer = document.querySelector('.room-container');
        if (roomContainer) {
            // Cacher la structure originale
            roomContainer.style.display = 'none';
            
            // Ajouter les nouveaux éléments
            mobileContent.appendChild(videoPage);
            mobileContent.appendChild(playlistPage);
            mobileContent.appendChild(participantsPage);
            
            const parentElement = roomContainer.parentElement;
            parentElement.appendChild(mobileContent);
            parentElement.appendChild(bottomNav);
            parentElement.appendChild(chatContainer);
            parentElement.appendChild(chatToggleBtn);
            parentElement.appendChild(floatingControls);
            
            // Conserver l'en-tête original si nécessaire
            if (header) {
                // L'en-tête est déjà positionné en fixed dans le CSS mobile
            }
        }
        
        // 7. Ajouter les gestionnaires d'événements pour la nouvelle structure
        setupMobileNavigation();
        setupChatToggle();
        setupFloatingButtons();
        setupVideoControls();
    }
    
    // Configuration de la navigation mobile
    function setupMobileNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                // Désactiver tous les onglets
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Activer l'onglet cliqué
                this.classList.add('active');
                
                // Cacher toutes les pages
                const pages = document.querySelectorAll('.mobile-page');
                pages.forEach(page => page.classList.remove('active'));
                
                // Afficher la page correspondante
                const targetId = this.dataset.target;
                const targetPage = document.getElementById(targetId);
                if (targetPage) {
                    targetPage.classList.add('active');
                }
                
                // En mode paysage, fermer le chat si on va sur une autre page
                if (window.innerWidth > window.innerHeight && targetId !== 'video-page') {
                    document.body.classList.remove('show-chat-landscape');
                    const chatContainer = document.querySelector('.chat-container');
                    if (chatContainer) {
                        chatContainer.classList.remove('open');
                    }
                }
            });
        });
    }
    
    // Configuration du chat flottant
    function setupChatToggle() {
        const chatToggleBtn = document.getElementById('chat-toggle-btn');
        const closeChatBtn = document.getElementById('close-chat-btn');
        const chatContainer = document.querySelector('.chat-container');
        
        if (chatToggleBtn && chatContainer) {
            chatToggleBtn.addEventListener('click', function() {
                chatContainer.classList.toggle('open');
                
                // En mode paysage, appliquer une mise en page spéciale
                if (window.innerWidth > window.innerHeight) {
                    document.body.classList.toggle('show-chat-landscape');
                }
                
                // Faire défiler jusqu'au dernier message
                if (chatContainer.classList.contains('open')) {
                    const chatMessages = chatContainer.querySelector('.chat-messages');
                    if (chatMessages) {
                        setTimeout(() => {
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }, 300);
                    }
                }
            });
        }
        
        if (closeChatBtn && chatContainer) {
            closeChatBtn.addEventListener('click', function() {
                chatContainer.classList.remove('open');
                document.body.classList.remove('show-chat-landscape');
            });
        }
    }
    
    // Configuration des boutons flottants
    function setupFloatingButtons() {
        // Bouton d'ajout de vidéo
        const addVideoBtn = document.getElementById('mobile-add-video');
        if (addVideoBtn) {
            addVideoBtn.addEventListener('click', function() {
                // Trouver et cliquer sur le bouton original
                const originalAddBtn = document.getElementById('add-video-btn');
                if (originalAddBtn) {
                    originalAddBtn.click();
                }
            });
        }
        
        // Bouton de retour à l'accueil
        const homeBtn = document.getElementById('mobile-home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', function() {
                if (confirm('Quitter cette room et retourner à l\'accueil?')) {
                    window.location.href = 'index.html';
                }
            });
        }
    }
    
    // Améliorer les contrôles vidéo
    function setupVideoControls() {
        const videoPlayer = document.querySelector('#video-player');
        const videoControls = document.querySelector('.video-controls');
        
        if (!videoPlayer || !videoControls) return;
        
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
    
    // Fonction pour envoyer un message du chat
    function sendChatMessage() {
        const messageInput = document.querySelector('.chat-container #message-input');
        if (!messageInput || !messageInput.value.trim()) return;
        
        // Trouver le bouton d'envoi d'origine et le simuler
        const originalSendBtn = document.querySelector('#chat #send-message-btn');
        const originalInput = document.querySelector('#chat #message-input');
        
        if (originalInput && originalSendBtn) {
            // Copier la valeur dans le champ d'origine
            originalInput.value = messageInput.value;
            
            // Simuler le clic
            originalSendBtn.click();
            
            // Vider le champ mobile
            messageInput.value = '';
            
            // Mettre à jour l'affichage (copier le dernier message)
            setTimeout(() => {
                const lastMessage = document.querySelector('#chat .chat-messages .message:last-child');
                const mobileMessages = document.querySelector('.chat-container .chat-messages');
                
                if (lastMessage && mobileMessages) {
                    const clone = lastMessage.cloneNode(true);
                    mobileMessages.appendChild(clone);
                    mobileMessages.scrollTop = mobileMessages.scrollHeight;
                }
            }, 100);
        }
    }
    
    // Gérer les changements d'orientation
    function handleOrientationChange() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // Adapter la disposition selon l'orientation
        if (isLandscape) {
            // Ajustements spécifiques au mode paysage
            const chatContainer = document.querySelector('.chat-container');
            if (chatContainer && chatContainer.classList.contains('open')) {
                document.body.classList.add('show-chat-landscape');
            }
        } else {
            // Ajustements spécifiques au mode portrait
            document.body.classList.remove('show-chat-landscape');
        }
        
        // Rafraîchir les conteneurs scrollables
        refreshScrollContainers();
    }
    
    // Rafraîchir les conteneurs avec défilement
    function refreshScrollContainers() {
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
    }
    
    // Écouter les changements d'orientation
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
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
    }
    
    // Initialisation principale
    function initialize() {
        // Restructurer l'interface pour mobile
        restructureForMobile();
        
        // Adapter les modales
        fixMobileModals();
        
        // Initialiser l'orientation
        handleOrientationChange();
        
        console.log('🔄 Interface mobile restructurée avec succès');
    }
    
    // Démarrer l'initialisation après un court délai pour s'assurer que tout est chargé
    setTimeout(initialize, 300);
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
}