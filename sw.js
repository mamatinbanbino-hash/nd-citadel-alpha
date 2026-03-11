/**
 * ND-CITADEL SERVICE WORKER
 * Assure la survie du système sans connexion.
 * Créé par N'DIAYE ADAMA
 */

const CACHE_NAME = 'nd-citadel-v1.0';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './script.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// 1. INSTALLATION : Mise en cache des fichiers critiques
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Mise en cache des ressources système...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. ACTIVATION : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Suppression de l\'ancien cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 3. STRATÉGIE DE RÉCUPÉRATION : Priorité au Cache si déconnecté
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Retourne le fichier du cache s'il existe, sinon fait une requête réseau
            return response || fetch(event.request).catch(() => {
                // Si le réseau échoue et que ce n'est pas dans le cache
                console.log('[SW] Ressource indisponible hors-ligne');
            });
        })
    );
});
