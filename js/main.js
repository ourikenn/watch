// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    // Éléments DOM
    const createRoomBtn = document.getElementById('create-room-btn');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const joinRoomInput = document.getElementById('join-room-id');
    const serverConfigModal = document.getElementById('server-config-modal');
    const serverUrlInput = document.getElementById('server-url');
    const saveServerBtn = document.getElementById('save-server-btn');
    
    // Vérifier les paramètres URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('server')) {
        localStorage.setItem('watchparty_server_url', urlParams.get('server'));
    }
    
    // Récupérer l'URL du serveur si elle existe
    const serverUrl = localStorage.getItem('watchparty_server_url');
    if (serverUrl) {
        serverUrlInput.value = serverUrl;
        // Définir une variable globale pour l'URL du serveur
        window.SOCKET_SERVER_URL = serverUrl;
        console.log('URL du serveur chargée:', serverUrl);
    }

    // Ajouter un bouton de configuration dans la barre de navigation
    const navUl = document.querySelector('.main-nav ul');
    if (navUl) {
        const configLi = document.createElement('li');
        const configLink = document.createElement('a');
        configLink.href = '#';
        configLink.id = 'server-config-btn';
        configLink.innerHTML = '<i class="fas fa-cog"></i> Serveur';
        configLi.appendChild(configLink);
        navUl.appendChild(configLi);
        
        // Événement pour ouvrir le modal de configuration
        configLink.addEventListener('click', (e) => {
            e.preventDefault();
            serverConfigModal.style.display = 'flex';
        });
    }
    
    // Événement pour sauvegarder l'URL du serveur
    if (saveServerBtn) {
        saveServerBtn.addEventListener('click', () => {
            const url = serverUrlInput.value.trim();
            if (url) {
                localStorage.setItem('watchparty_server_url', url);
                window.SOCKET_SERVER_URL = url;
                console.log('URL du serveur sauvegardée:', url);
                alert('Configuration sauvegardée. La nouvelle URL sera utilisée pour les prochaines connexions.');
            } else {
                localStorage.removeItem('watchparty_server_url');
                window.SOCKET_SERVER_URL = null;
                console.log('URL du serveur supprimée.');
                alert('Configuration supprimée. Le serveur local sera utilisé.');
            }
            serverConfigModal.style.display = 'none';
        });
    }
    
    // Fermer le modal en cliquant en dehors
    window.addEventListener('click', (e) => {
        if (e.target === serverConfigModal) {
            serverConfigModal.style.display = 'none';
        }
    });

    // Générer un ID de room unique
    function generateRoomId() {
        // Générer un ID alphanumérique de 6 caractères
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Créer une nouvelle room et rediriger l'utilisateur
    function createRoom() {
        // Générer un ID de room
        const roomId = generateRoomId();
        
        // Stocker les infos de la room dans localStorage
        const room = {
            id: roomId,
            name: `Room #${roomId}`,
            createdAt: new Date().toISOString(),
            createdBy: 'Anonymous' // Sera remplacé par le nom de l'utilisateur si disponible
        };
        
        localStorage.setItem(`watchparty_room_${roomId}`, JSON.stringify(room));
        
        // Rediriger vers la page de la room
        window.location.href = `room.html?id=${roomId}`;
    }

    // Événement du bouton "Créer une room"
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', createRoom);
    }
    
    // Fonction pour rejoindre une room existante
    function joinRoom() {
        const roomId = joinRoomInput.value.trim();
        
        if (!roomId) {
            alert('Veuillez entrer un ID de room valide');
            return;
        }
        
        // Rediriger vers la page de la room
        window.location.href = `room.html?id=${roomId}`;
    }
    
    // Événement du bouton "Rejoindre"
    if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', joinRoom);
    }
    
    // Permettre de rejoindre en appuyant sur Entrée
    if (joinRoomInput) {
        joinRoomInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinRoom();
            }
        });
    }

    // Animation pour le bouton principal
    const animateMainButton = () => {
        if (createRoomBtn) {
            createRoomBtn.classList.add('pulse');
            setTimeout(() => {
                createRoomBtn.classList.remove('pulse');
            }, 1000);
        }
    };

    // Animer le bouton toutes les 5 secondes
    animateMainButton();
    setInterval(animateMainButton, 5000);

    // Gestion des animations au scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.feature-card');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight - 100) {
                element.classList.add('animate');
            }
        });
    };

    // Ajouter l'événement au scroll
    window.addEventListener('scroll', animateOnScroll);
    // Déclencher une fois au chargement
    animateOnScroll();
}); 