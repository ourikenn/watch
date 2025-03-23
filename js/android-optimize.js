// Optimisations spécifiques pour Android
document.addEventListener('DOMContentLoaded', function() {
    // Détecter si l'appareil est Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (!isAndroid) return; // Ne rien faire si ce n'est pas Android
    
    console.log('📱 Optimisations Android activées');
    
    // Appliquer la classe Android à body
    document.body.classList.add('android-device');
    
    // Fonction qui s'exécute lors du changement d'orientation
    function handleOrientationChange() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // Réinitialiser les styles personnalisés
        resetCustomStyles();
        
        if (isLandscape) {
            // Mode paysage
            applyLandscapeOptimizations();
        } else {
            // Mode portrait
            applyPortraitOptimizations();
        }
        
        // Rendre les boutons flottants plus visibles
        enhanceFloatingButtons();
        
        // Améliorer la visibilité des onglets
        enhanceTabs();
    }
    
    // Réinitialiser les styles personnalisés
    function resetCustomStyles() {
        const elements = [
            '.room-container',
            '.video-section',
            '.room-sidebar',
            '.tab-content',
            '.chat-messages',
            '.playlist-items',
            '.participants-list'
        ];
        
        elements.forEach(selector => {
            const elem = document.querySelector(selector);
            if (elem) {
                elem.style.cssText = '';
            }
        });
    }
    
    // Optimisations pour le mode paysage
    function applyLandscapeOptimizations() {
        // Structure en colonnes côte à côte
        const container = document.querySelector('.room-container');
        if (container) {
            container.style.display = 'flex';
            container.style.flexDirection = 'row';
        }
        
        // Ajuster la vidéo - RÉDUIT À 50% au lieu de 60%
        const videoSection = document.querySelector('.video-section');
        if (videoSection) {
            videoSection.style.width = '50%';
            videoSection.style.height = '100%';
        }
        
        // Ajuster la sidebar - AUGMENTÉ À 50% au lieu de 40%
        const sidebar = document.querySelector('.room-sidebar');
        if (sidebar) {
            sidebar.style.width = '50%';
            sidebar.style.height = '100%';
            sidebar.style.position = 'relative';
            sidebar.style.overflow = 'hidden';
            sidebar.style.display = 'flex';
            sidebar.style.flexDirection = 'column';
        }
        
        // Ajuster la zone de contenu des onglets
        const tabContent = document.querySelector('.tab-content');
        if (tabContent) {
            tabContent.style.flexGrow = '1';
            tabContent.style.overflow = 'hidden';
        }
        
        // Ajuster les zones scrollables
        adjustScrollableAreas();
    }
    
    // Optimisations pour le mode portrait
    function applyPortraitOptimizations() {
        // Structure en lignes superposées
        const container = document.querySelector('.room-container');
        if (container) {
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
        }
        
        // Ajuster la vidéo - RÉDUIT À 35% au lieu de 40%
        const videoSection = document.querySelector('.video-section');
        if (videoSection) {
            videoSection.style.width = '100%';
            videoSection.style.height = '35vh';
        }
        
        // Ajuster la sidebar - AUGMENTÉ À 65% au lieu de 60%
        const sidebar = document.querySelector('.room-sidebar');
        if (sidebar) {
            sidebar.style.width = '100%';
            sidebar.style.height = '65vh';
            sidebar.style.position = 'relative';
            sidebar.style.overflow = 'hidden';
            sidebar.style.display = 'flex';
            sidebar.style.flexDirection = 'column';
        }
        
        // Ajuster la zone de contenu des onglets
        const tabContent = document.querySelector('.tab-content');
        if (tabContent) {
            tabContent.style.flexGrow = '1';
            tabContent.style.overflow = 'hidden';
        }
        
        // Ajuster les zones scrollables
        adjustScrollableAreas();
    }
    
    // Ajuster les zones scrollables
    function adjustScrollableAreas() {
        // Chat
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.style.height = 'calc(100% - 50px)';
            chatMessages.style.overflow = 'auto';
            chatMessages.style.WebkitOverflowScrolling = 'touch';
        }
        
        // Playlist
        const playlistItems = document.querySelector('.playlist-items');
        if (playlistItems) {
            playlistItems.style.height = 'calc(100% - 110px)';
            playlistItems.style.overflow = 'auto';
            playlistItems.style.WebkitOverflowScrolling = 'touch';
        }
        
        // Participants
        const participantsList = document.querySelector('.participants-list');
        if (participantsList) {
            participantsList.style.height = 'calc(100% - 50px)';
            participantsList.style.overflow = 'auto';
            participantsList.style.WebkitOverflowScrolling = 'touch';
        }
    }
    
    // Améliorer les boutons flottants
    function enhanceFloatingButtons() {
        const floatingControls = document.querySelector('.mobile-floating-controls');
        if (floatingControls) {
            floatingControls.style.display = 'flex';
            floatingControls.style.bottom = '20px';
            floatingControls.style.right = '20px';
            floatingControls.style.zIndex = '1000';
            
            // Agrandir les boutons
            const buttons = floatingControls.querySelectorAll('.mobile-floating-btn');
            buttons.forEach(btn => {
                btn.style.width = '50px';
                btn.style.height = '50px';
                btn.style.fontSize = '22px';
                btn.style.margin = '0 5px';
                btn.style.opacity = '0.9';
                btn.style.backgroundColor = 'var(--primary-color)';
                btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            });
        }
    }
    
    // Améliorer la visibilité des onglets
    function enhanceTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.style.padding = '12px 15px';  // Augmenté de 10px à 12px
            tab.style.fontSize = '16px';
            tab.style.fontWeight = 'bold';
        });
        
        // Améliorer la visibilité de l'onglet actif
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            activeTab.style.borderBottom = '3px solid var(--primary-color)';
            activeTab.style.backgroundColor = 'rgba(108, 92, 231, 0.1)';
        }
    }
    
    // Corriger le problème des modales sur Android
    function fixModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('touchmove', function(e) {
                e.stopPropagation();
            }, { passive: false });
            
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.maxHeight = '90vh';
                modalContent.style.overflow = 'auto';
            }
        });
    }
    
    // Fonctions pour le balayage entre onglets
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
    
    // Appliquer toutes les optimisations
    function applyAllOptimizations() {
        handleOrientationChange();
        fixModals();
        setupTabSwiping();
        
        // Agrandir les zones interactives pour les doigts
        document.querySelectorAll('button, .btn, input, select').forEach(elem => {
            elem.style.minHeight = '44px';
            elem.style.minWidth = '44px';
        });
        
        // Gérer les clics sur les onglets pour améliorer le design
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', function() {
                // Nettoyer les styles personnalisés sur tous les onglets
                document.querySelectorAll('.tab-btn').forEach(t => {
                    t.style.borderBottom = '';
                    t.style.backgroundColor = '';
                });
                
                // Appliquer le style à l'onglet actif
                this.style.borderBottom = '3px solid var(--primary-color)';
                this.style.backgroundColor = 'rgba(108, 92, 231, 0.1)';
            });
        });
    }
    
    // Écouter les changements d'orientation
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Optimiser pour Android
    applyAllOptimizations();
}); 