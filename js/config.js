// Configuration des API et services externes
const CONFIG = {
    // Configuration de l'API YouTube
    youtube: {
        // Remplacez cette valeur par votre client ID OAuth obtenu depuis 
        // la console Google Cloud Platform: https://console.cloud.google.com/
        clientId: '1024216438969-hbqmiv5b9prt9hng478j376jtsbnnjqj.apps.googleusercontent.com',
        
        // API Key utilisée pour les recherches YouTube (à ne pas confondre avec le client secret)
        apiKey: 'AIzaSyD8HwiGQwt2Y5W10WLmKD3KF6awfYC5ous'
    }
};

// Ne pas modifier cette ligne - elle permet d'exporter la configuration
// pour qu'elle soit accessible dans d'autres fichiers JavaScript
if (typeof module !== 'undefined') {
    module.exports = CONFIG;
} 