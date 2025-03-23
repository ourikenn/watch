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
            '.tabs',
            '.chat-messages',
            '.playlist-items',
            '.participants-list',
            '.chat-input',
            '.playlist-header',
            '.playlist-search'
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
            container.style.height = '100vh';
            container.style.width = '100vw';
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.zIndex = '100';
            container.style.backgroundColor = '#1f1f1f';
        }
        
        // Masquer l'en-tête en mode paysage pour gagner de l'espace
        const header = document.querySelector('.room-header');
        if (header) {
            header.style.display = 'none';
        }
        
        // Ajuster la vidéo - RÉDUIT À 45%
        const videoSection = document.querySelector('.video-section');
        if (videoSection) {
            videoSection.style.width = '45%';
            videoSection.style.height = '100%';
        }
        
        // Ajuster la sidebar - AUGMENTÉ À 55%
        const sidebar = document.querySelector('.room-sidebar');
        if (sidebar) {
            sidebar.style.width = '55%';
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
            tabContent.style.display = 'flex';
            tabContent.style.flexDirection = 'column';
        }
        
        // Agrandir les onglets
        const tabs = document.querySelector('.tabs');
        if (tabs) {
            tabs.style.display = 'flex';
            tabs.style.justifyContent = 'space-around';
            tabs.style.padding = '10px 0';
            tabs.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        }
        
        // Ajouter un bouton de retour à l'accueil
        addHomeButton();
        
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
            container.style.height = 'calc(100vh - 60px)'; // Hauteur totale moins la hauteur de l'en-tête
        }
        
        // Ajuster la vidéo - RÉDUIT À 30%
        const videoSection = document.querySelector('.video-section');
        if (videoSection) {
            videoSection.style.width = '100%';
            videoSection.style.height = '30vh';
        }
        
        // Ajuster la sidebar - AUGMENTÉ À 70%
        const sidebar = document.querySelector('.room-sidebar');
        if (sidebar) {
            sidebar.style.width = '100%';
            sidebar.style.height = '70vh';
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
            tabContent.style.display = 'flex';
            tabContent.style.flexDirection = 'column';
        }
        
        // Agrandir les onglets
        const tabs = document.querySelector('.tabs');
        if (tabs) {
            tabs.style.display = 'flex';
            tabs.style.justifyContent = 'space-around';
            tabs.style.padding = '10px 0';
            tabs.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        }
        
        // Ajuster les zones scrollables
        adjustScrollableAreas();
    }
    
    // Ajouter un bouton pour retourner à l'accueil en mode paysage
    function addHomeButton() {
        // Vérifier si le bouton existe déjà
        if (document.getElementById('mobile-home-btn')) return;
        
        const homeBtn = document.createElement('button');
        homeBtn.id = 'mobile-home-btn';
        homeBtn.className = 'mobile-floating-btn home-btn';
        homeBtn.innerHTML = '<i class="fas fa-home"></i>';
        homeBtn.style.position = 'fixed';
        homeBtn.style.top = '10px';
        homeBtn.style.left = '10px';
        homeBtn.style.zIndex = '2000';
        homeBtn.style.width = '40px';
        homeBtn.style.height = '40px';
        homeBtn.style.borderRadius = '50%';
        homeBtn.style.backgroundColor = 'var(--primary-color)';
        homeBtn.style.color = 'white';
        homeBtn.style.border = 'none';
        homeBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        
        homeBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
        
        document.body.appendChild(homeBtn);
    }
    
    // Ajuster les zones scrollables
    function adjustScrollableAreas() {
        // Chat
        const chatPane = document.getElementById('chat');
        if (chatPane) {
            chatPane.style.display = 'flex';
            chatPane.style.flexDirection = 'column';
            chatPane.style.height = '100%';
        }
        
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.style.flex = '1';
            chatMessages.style.overflow = 'auto';
            chatMessages.style.WebkitOverflowScrolling = 'touch';
            chatMessages.style.padding = '10px';
        }
        
        const chatInput = document.querySelector('.chat-input');
        if (chatInput) {
            chatInput.style.display = 'flex';
            chatInput.style.padding = '10px';
            chatInput.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
        }
        
        // Playlist
        const playlistPane = document.getElementById('playlist');
        if (playlistPane) {
            playlistPane.style.display = 'flex';
            playlistPane.style.flexDirection = 'column';
            playlistPane.style.height = '100%';
        }
        
        const playlistHeader = document.querySelector('.playlist-header');
        if (playlistHeader) {
            playlistHeader.style.padding = '10px';
        }
        
        const playlistSearch = document.querySelector('.playlist-search');
        if (playlistSearch) {
            playlistSearch.style.padding = '0 10px 10px 10px';
        }
        
        const playlistItems = document.querySelector('.playlist-items');
        if (playlistItems) {
            playlistItems.style.flex = '1';
            playlistItems.style.overflow = 'auto';
            playlistItems.style.WebkitOverflowScrolling = 'touch';
            playlistItems.style.padding = '0 10px';
        }
        
        // Participants
        const participantsPane = document.getElementById('participants');
        if (participantsPane) {
            participantsPane.style.display = 'flex';
            participantsPane.style.flexDirection = 'column';
            participantsPane.style.height = '100%';
            participantsPane.style.padding = '10px';
        }
        
        const participantsList = document.querySelector('.participants-list');
        if (participantsList) {
            participantsList.style.flex = '1';
            participantsList.style.overflow = 'auto';
            participantsList.style.WebkitOverflowScrolling = 'touch';
            participantsList.style.marginTop = '10px';
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
            tab.style.padding = '12px 15px';
            tab.style.fontSize = '16px';
            tab.style.fontWeight = 'bold';
            tab.style.flex = '1';
            tab.style.textAlign = 'center';
        });
        
        // Améliorer la visibilité de l'onglet actif
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            activeTab.style.borderBottom = '3px solid var(--primary-color)';
            activeTab.style.backgroundColor = 'rgba(108, 92, 231, 0.1)';
        }
    }
    
    // Corriger le problème des modales sur mobile
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
                modalContent.style.width = '90%';
                modalContent.style.maxWidth = '450px';
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
    
    // Optimiser spécifiquement certains appareils
    function applyDeviceSpecificFixes() {
        const ua = navigator.userAgent;
        
        // iPhone et iPad
        if (/iPhone|iPad|iPod/i.test(ua)) {
            // Corriger le problème de l'élastique du scroll
            document.body.style.overscrollBehavior = 'none';
            
            // Ajustements pour Safari iOS
            document.documentElement.style.height = '100%';
            document.body.style.height = '100%';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.overflowY = 'scroll';
            document.body.style.webkitOverflowScrolling = 'touch';
        }
        
        // Samsung Galaxy et autres téléphones Android à haute résolution
        if (/Samsung|SM-|Galaxy|Pixel|LG-|Sony/i.test(ua)) {
            document.querySelectorAll('button, .btn, input, select').forEach(elem => {
                elem.style.fontSize = '16px'; // Police plus grande pour les écrans à haute résolution
            });
        }
    }
    
    // Ajuster la taille des contrôles vidéo
    function enhanceVideoControls() {
        const controlButtons = document.querySelector('.control-buttons');
        if (controlButtons) {
            controlButtons.style.padding = '10px 0';
            
            const buttons = controlButtons.querySelectorAll('button');
            buttons.forEach(btn => {
                btn.style.fontSize = '24px';
                btn.style.margin = '0 10px';
                btn.style.padding = '10px';
            });
        }
        
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.height = '8px';
            progressBar.style.marginBottom = '10px';
        }
    }
    
    // Appliquer toutes les optimisations
    function applyAllOptimizations() {
        handleOrientationChange();
        fixModals();
        setupTabSwiping();
        enhanceVideoControls();
        applyDeviceSpecificFixes();
        
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
                this.style.backgroundColor = 'rgba(108, 92, 231,.1)';
            });
        });
    }
    
    // Écouter les changements d'orientation
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Optimiser pour mobile
    applyAllOptimizations();
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