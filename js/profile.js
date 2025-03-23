// Gestion du profil utilisateur
document.addEventListener('DOMContentLoaded', () => {
    // Récupérer les éléments DOM
    const userAvatarEl = document.getElementById('user-avatar');
    const userMenuEl = document.getElementById('user-menu');
    const createProfileBtn = document.getElementById('create-profile-btn');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const profileModal = document.getElementById('profile-modal');
    const closeProfileModal = document.getElementById('close-profile-modal');
    const profileForm = document.getElementById('profile-form');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarInput = document.getElementById('avatar-input');
    const usernameInput = document.getElementById('username-input');
    const profileBioInput = document.getElementById('profile-bio-input');
    const avatarPreviewImg = document.getElementById('avatar-preview-img');
    const profileSectionEl = document.getElementById('profile-section');
    
    // Variables pour stocker les données utilisateur
    let currentUser = null;
    
    // Partager le profil avec l'objet window pour l'accès depuis d'autres scripts
    window.userProfile = {
        getData: function() {
            return currentUser;
        },
        isLoggedIn: function() {
            return currentUser !== null;
        }
    };
    
    // Déclencher un événement lorsque le profil est chargé ou modifié
    function triggerProfileChange() {
        document.dispatchEvent(new CustomEvent('profile_updated', { 
            detail: { profile: currentUser }
        }));
    }
    
    // Charger le profil utilisateur depuis localStorage au démarrage
    function loadUserProfile() {
        const userProfile = localStorage.getItem('watchparty_user_profile');
        
        if (userProfile) {
            currentUser = JSON.parse(userProfile);
            updateProfileUI();
            triggerProfileChange();
        }
    }
    
    // Mettre à jour l'interface utilisateur avec les données du profil
    function updateProfileUI() {
        if (!currentUser) return;
        
        // Mettre à jour les éléments d'avatar de l'en-tête
        if (userAvatarEl) {
            const avatarImg = userAvatarEl.querySelector('img');
            if (avatarImg) {
                avatarImg.src = currentUser.avatar || 'img/default-avatar.png';
            } else {
                const newImg = document.createElement('img');
                newImg.src = currentUser.avatar || 'img/default-avatar.png';
                newImg.alt = 'Avatar';
                userAvatarEl.appendChild(newImg);
            }
            userAvatarEl.style.display = 'block';
        }
        
        // Mettre à jour la section de profil sur la page d'accueil
        if (profileSectionEl) {
            profileSectionEl.innerHTML = `
                <div class="profile-container">
                    <div class="profile-info">
                        <div class="profile-avatar">
                            <img src="${currentUser.avatar || 'img/default-avatar.png'}" alt="Avatar">
                        </div>
                        <div class="profile-details">
                            <h3>${currentUser.username}</h3>
                            <p>${currentUser.bio || 'Aucune bio définie'}</p>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button id="edit-profile-btn" class="btn btn-sm btn-primary">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                    </div>
                </div>
            `;
            
            // Réattacher l'événement après avoir mis à jour le DOM
            document.getElementById('edit-profile-btn').addEventListener('click', openProfileModal);
        }
    }
    
    // Ouvrir le modal de profil
    function openProfileModal() {
        if (profileModal) {
            // Pré-remplir le formulaire avec les données actuelles si disponibles
            if (currentUser) {
                usernameInput.value = currentUser.username || '';
                profileBioInput.value = currentUser.bio || '';
                if (currentUser.avatar) {
                    avatarPreviewImg.src = currentUser.avatar;
                }
            } else {
                // Réinitialiser le formulaire si pas d'utilisateur
                profileForm.reset();
                avatarPreviewImg.src = 'img/default-avatar.png';
            }
            
            profileModal.style.display = 'flex';
        }
    }
    
    // Fermer le modal de profil
    function closeProfileModalFn() {
        if (profileModal) {
            profileModal.style.display = 'none';
        }
    }
    
    // Prévisualiser l'image sélectionnée pour l'avatar
    function previewAvatar(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                avatarPreviewImg.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
    
    // Sauvegarder le profil utilisateur
    function saveUserProfile(event) {
        event.preventDefault();
        
        const username = usernameInput.value.trim();
        if (!username) {
            alert('Veuillez entrer un nom d\'utilisateur');
            return;
        }
        
        // Créer ou mettre à jour l'objet utilisateur
        currentUser = currentUser || {};
        currentUser.username = username;
        currentUser.bio = profileBioInput.value.trim();
        currentUser.avatar = avatarPreviewImg.src;
        currentUser.lastUpdated = new Date().toISOString();
        
        // Sauvegarder dans localStorage
        localStorage.setItem('watchparty_user_profile', JSON.stringify(currentUser));
        
        // Mettre à jour l'interface
        updateProfileUI();
        
        // Déclencher l'événement de changement de profil
        triggerProfileChange();
        
        // Fermer le modal
        closeProfileModalFn();
        
        // Afficher une notification
        showNotification('Profil sauvegardé avec succès!', 'success');
    }
    
    // Gérer la déconnexion de l'utilisateur
    function logoutUser() {
        // Supprimer les données de profil
        localStorage.removeItem('watchparty_user_profile');
        currentUser = null;
        
        // Réinitialiser l'interface
        if (userAvatarEl) {
            userAvatarEl.style.display = 'none';
        }
        
        // Mettre à jour la section de profil si présente
        if (profileSectionEl) {
            profileSectionEl.innerHTML = `
                <div class="no-profile">
                    <i class="fas fa-user-circle"></i>
                    <p>Vous n'avez pas encore de profil</p>
                    <button id="create-profile-btn" class="btn btn-primary">
                        <i class="fas fa-plus-circle"></i> Créer un profil
                    </button>
                </div>
            `;
            
            // Réattacher l'événement après avoir mis à jour le DOM
            document.getElementById('create-profile-btn').addEventListener('click', openProfileModal);
        }
        
        // Fermer le menu utilisateur
        if (userMenuEl) {
            userMenuEl.classList.remove('active');
        }
        
        // Déclencher l'événement de changement de profil
        triggerProfileChange();
        
        showNotification('Vous avez été déconnecté', 'info');
    }
    
    // Quitter la room (pour la page room.html)
    function leaveRoom() {
        // Rediriger vers la page d'accueil
        window.location.href = 'index.html';
    }
    
    // Afficher une notification à l'utilisateur
    function showNotification(message, type = 'info') {
        // Créer l'élément de notification s'il n'existe pas déjà
        let notificationEl = document.querySelector('.notification');
        
        if (!notificationEl) {
            notificationEl = document.createElement('div');
            notificationEl.className = 'notification';
            document.body.appendChild(notificationEl);
        }
        
        // Configurer la notification
        notificationEl.className = `notification ${type}`;
        notificationEl.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">×</button>
        `;
        
        // Afficher la notification
        setTimeout(() => {
            notificationEl.classList.add('show');
        }, 100);
        
        // Masquer la notification après 3 secondes
        setTimeout(() => {
            notificationEl.classList.remove('show');
        }, 3000);
        
        // Gérer la fermeture manuelle
        const closeBtn = notificationEl.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notificationEl.classList.remove('show');
            });
        }
    }
    
    // Attacher les événements
    function attachEvents() {
        // Avatar et menu utilisateur en en-tête
        if (userAvatarEl) {
            userAvatarEl.addEventListener('click', () => {
                userMenuEl.classList.toggle('active');
            });
            
            // Cliquer en dehors pour fermer le menu
            document.addEventListener('click', (e) => {
                if (userMenuEl && userMenuEl.classList.contains('active') && 
                    !userAvatarEl.contains(e.target) && 
                    !userMenuEl.contains(e.target)) {
                    userMenuEl.classList.remove('active');
                }
            });
        }
        
        // Boutons de création/édition de profil
        if (createProfileBtn) {
            createProfileBtn.addEventListener('click', openProfileModal);
        }
        
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', openProfileModal);
        }
        
        // Modal de profil
        if (closeProfileModal) {
            closeProfileModal.addEventListener('click', closeProfileModalFn);
        }
        
        // Input d'avatar
        if (avatarInput) {
            avatarInput.addEventListener('change', previewAvatar);
        }
        
        // Formulaire de profil
        if (profileForm) {
            profileForm.addEventListener('submit', saveUserProfile);
        }
        
        // Bouton de déconnexion
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logoutUser);
        }
        
        // Bouton pour quitter la room
        const leaveRoomBtn = document.getElementById('leave-room-btn');
        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', leaveRoom);
        }
        
        // Fermer le modal en cliquant en dehors
        if (profileModal) {
            window.addEventListener('click', (e) => {
                if (e.target === profileModal) {
                    closeProfileModalFn();
                }
            });
        }
    }
    
    // Initialiser
    loadUserProfile();
    attachEvents();
}); 