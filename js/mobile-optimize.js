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
    
    // Configuration de l'interface mobile
    setupMobileInterface();
    
    // Ajouter des gestionnaires d'événements spécifiques au mobile
    setupMobileEventHandlers();
    
    // Fonction qui s'exécute lors du changement d'orientation
    function handleOrientationChange() {
        // Recalculer les dimensions des éléments
        updateDimensions();
        
        // Forcer le rafraîchissement du scroll dans les conteneurs
        refreshScrollContainers();
    }
    
    // Mise à jour des dimensions des éléments
    function updateDimensions() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            // Mode paysage - aucun ajustement supplémentaire nécessaire
            // Le CSS s'occupe des changements principaux
        } else {
            // Mode portrait - aucun ajustement supplémentaire nécessaire
            // Le CSS s'occupe des changements principaux
        }
    }
    
    // Rafraîchir les conteneurs de scroll
    function refreshScrollContainers() {
        const scrollContainers = [
            '.chat-messages',
            '.playlist-items',
            '.participants-list',
            '.search-results'
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
    
    // Configuration de l'interface mobile
    function setupMobileInterface() {
        // Ajouter des icônes aux onglets pour améliorer l'UX mobile
        enhanceTabsWithIcons();
        
        // Améliorer les boutons flottants
        enhanceFloatingButtons();
        
        // Améliorer la visibilité des contrôles vidéo
        enhanceVideoControls();
        
        // Ajouter un bouton home en mode paysage
        addHomeButton();
        
        // Corriger les problèmes des modales sur mobile
        fixModals();
    }
    
    // Ajouter des icônes aux onglets
    function enhanceTabsWithIcons() {
        // Les icônes sont maintenant ajoutées via CSS ::before
        
        // Améliorer l'interaction avec les onglets
        document.querySelectorAll('.tab-btn').forEach(tab => {
            // Supprimer les anciens gestionnaires pour éviter les doublons
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
            
            // Ajouter un ripple effect au clic
            newTab.addEventListener('click', function(e) {
                // Animation subtile au clic
                const ripple = document.createElement('span');
                ripple.classList.add('tab-ripple');
                ripple.style.position = 'absolute';
                ripple.style.borderRadius = '50%';
                ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                ripple.style.width = '100px';
                ripple.style.height = '100px';
                ripple.style.transform = 'translate(-50%, -50%) scale(0)';
                ripple.style.top = e.offsetY + 'px';
                ripple.style.left = e.offsetX + 'px';
                ripple.style.animation = 'ripple 0.6s linear';
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }
    
    // Améliorer les boutons flottants
    function enhanceFloatingButtons() {
        const floatingControls = document.querySelector('.mobile-floating-controls');
        if (!floatingControls) return;
        
        // S'assurer que les contrôles flottants sont visibles
        floatingControls.style.display = 'flex';
        
        // Configurer les comportements du bouton d'ajout de vidéo
        const addVideoBtn = document.getElementById('mobile-add-video');
        if (addVideoBtn) {
            addVideoBtn.addEventListener('click', function() {
                const mainAddVideoBtn = document.getElementById('add-video-btn');
                if (mainAddVideoBtn) {
                    mainAddVideoBtn.click();
                }
            });
        }
        
        // Configurer le bouton de chat
        const toggleChatBtn = document.getElementById('mobile-toggle-chat');
        if (toggleChatBtn) {
            toggleChatBtn.addEventListener('click', function() {
                // Trouver l'onglet de chat et le rendre actif
                const chatTab = document.querySelector('.tab-btn[data-tab="chat"]');
                if (chatTab) {
                    chatTab.click();
                    
                    // Mettre le focus sur le champ de saisie après un court délai
                    setTimeout(() => {
                        const messageInput = document.getElementById('message-input');
                        if (messageInput) {
                            messageInput.focus();
                        }
                    }, 300);
                }
            });
        }
    }
    
    // Améliorer les contrôles vidéo
    function enhanceVideoControls() {
        const videoControls = document.querySelector('.video-controls');
        if (!videoControls) return;
        
        // Rendre les contrôles toujours visibles sur mobile
        videoControls.style.opacity = '1';
        
        // Agrandir les contrôles pour faciliter l'interaction tactile
        const buttons = videoControls.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.style.padding = '8px';
            btn.style.margin = '0 3px';
        });
        
        // Améliorer la barre de progression
        const progressBar = videoControls.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.height = '8px';
            
            // Rendre la barre de progression plus réactive sur mobile
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
                    
                    // Mettre à jour visuellement la barre de progression
                    const filled = progressBar.querySelector('.progress-filled');
                    if (filled) {
                        filled.style.width = (percent * 100) + '%';
                    }
                    
                    // Déclencher un événement personnalisé pour le lecteur vidéo
                    const seekEvent = new CustomEvent('mobile-seek', { 
                        detail: { percent: percent }
                    });
                    progressBar.dispatchEvent(seekEvent);
                };
                
                // Mettre à jour pendant le déplacement
                const touchMove = function(moveEvent) {
                    moveEvent.preventDefault();
                    updateProgressFromTouch(moveEvent);
                };
                
                // Supprimer les écouteurs lorsque le toucher est terminé
                const touchEnd = function() {
                    document.removeEventListener('touchmove', touchMove);
                    document.removeEventListener('touchend', touchEnd);
                };
                
                // Ajouter les écouteurs pour le déplacement et la fin
                document.addEventListener('touchmove', touchMove, { passive: false });
                document.addEventListener('touchend', touchEnd);
                
                // Mettre à jour immédiatement
                updateProgressFromTouch(e);
            }, { passive: false });
        }
    }
    
    // Ajouter un bouton pour retourner à l'accueil
    function addHomeButton() {
        if (document.getElementById('mobile-home-btn')) return;
        
        const homeBtn = document.createElement('button');
        homeBtn.id = 'mobile-home-btn';
        homeBtn.className = 'mobile-floating-btn home-btn';
        homeBtn.innerHTML = '<i class="fas fa-home"></i>';
        
        homeBtn.addEventListener('click', function() {
            if (confirm('Quitter cette room et retourner à l\'accueil?')) {
                window.location.href = 'index.html';
            }
        });
        
        // Ajouter le bouton dans les contrôles flottants existants
        const floatingControls = document.querySelector('.mobile-floating-controls');
        if (floatingControls) {
            floatingControls.appendChild(homeBtn);
        } else {
            // Si les contrôles flottants n'existent pas, créer un conteneur
            const newControls = document.createElement('div');
            newControls.className = 'mobile-floating-controls';
            newControls.appendChild(homeBtn);
            document.body.appendChild(newControls);
        }
    }
    
    // Corriger les problèmes des modales sur mobile
    function fixModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            // Empêcher la propagation du scroll
            modal.addEventListener('touchmove', function(e) {
                e.stopPropagation();
            }, { passive: false });
            
            // Ajuster la taille des modales
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.maxHeight = '85vh';
                modalContent.style.width = '90%';
                modalContent.style.maxWidth = '450px';
                modalContent.style.overflowY = 'auto';
                modalContent.style.WebkitOverflowScrolling = 'touch';
            }
            
            // Fermer la modale au clic sur l'arrière-plan
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    const closeBtn = modal.querySelector('.close');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                }
            });
        });
    }
    
    // Configuration des gestionnaires d'événements pour mobile
    function setupMobileEventHandlers() {
        // Gestion du glissement entre onglets
        setupTabSwiping();
        
        // Écouter les changements d'orientation
        window.addEventListener('resize', handleOrientationChange);
        window.addEventListener('orientationchange', handleOrientationChange);
        
        // Écouter quand le clavier virtuel apparaît/disparaît
        if (/Android/i.test(navigator.userAgent)) {
            window.addEventListener('resize', handleKeyboardVisibility);
        }
        
        // Améliorer les interactions avec la vidéo
        setupVideoTouchControls();
    }
    
    // Gérer l'apparition/disparition du clavier virtuel sur Android
    function handleKeyboardVisibility() {
        const windowHeight = window.innerHeight;
        const isKeyboardOpen = window.innerHeight < window.outerHeight / 2;
        
        if (isKeyboardOpen) {
            // Le clavier est ouvert, ajuster l'UI
            const chatInput = document.querySelector('.chat-input');
            if (chatInput) {
                chatInput.style.position = 'fixed';
                chatInput.style.bottom = '0';
                chatInput.style.left = '0';
                chatInput.style.width = '100%';
                chatInput.style.zIndex = '50';
            }
            
            const chatMessages = document.querySelector('.chat-messages');
            if (chatMessages) {
                chatMessages.style.paddingBottom = '60px';
                
                // Faire défiler jusqu'au dernier message
                setTimeout(() => {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, 200);
            }
        } else {
            // Le clavier est fermé, restaurer l'UI
            const chatInput = document.querySelector('.chat-input');
            if (chatInput) {
                chatInput.style.position = '';
                chatInput.style.bottom = '';
                chatInput.style.left = '';
                chatInput.style.width = '';
                chatInput.style.zIndex = '';
            }
            
            const chatMessages = document.querySelector('.chat-messages');
            if (chatMessages) {
                chatMessages.style.paddingBottom = '';
            }
        }
    }
    
    // Configurer les contrôles tactiles pour la vidéo
    function setupVideoTouchControls() {
        const videoPlayer = document.getElementById('video-player');
        if (!videoPlayer) return;
        
        // Double tap pour play/pause
        let lastTap = 0;
        videoPlayer.addEventListener('touchend', function(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                // Double tap détecté, toggle play/pause
                const playPauseBtn = document.getElementById('play-pause-btn');
                if (playPauseBtn) {
                    playPauseBtn.click();
                }
                e.preventDefault();
            }
            
            lastTap = currentTime;
        });
    }
    
    // Glisser entre les onglets
    function setupTabSwiping() {
        const tabContent = document.querySelector('.tab-content');
        if (!tabContent) return;
        
        let startX, startY;
        
        tabContent.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        tabContent.addEventListener('touchend', function(e) {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Si le mouvement est plus horizontal que vertical et suffisamment long
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                const tabs = document.querySelectorAll('.tab-btn');
                const activeTab = document.querySelector('.tab-btn.active');
                if (!activeTab) return;
                
                const activeIndex = Array.from(tabs).indexOf(activeTab);
                
                if (diffX > 0) {
                    // Balayage vers la gauche - onglet suivant
                    const nextIndex = (activeIndex + 1) % tabs.length;
                    tabs[nextIndex].click();
                } else {
                    // Balayage vers la droite - onglet précédent
                    const prevIndex = (activeIndex - 1 + tabs.length) % tabs.length;
                    tabs[prevIndex].click();
                }
            }
        }, { passive: true });
    }
    
    // Mettre à jour les dimensions lors du chargement initial
    updateDimensions();
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