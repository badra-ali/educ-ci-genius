// Configuration pour le service worker avec background sync
const CACHE_NAME = 'educ-ci-genius-v1';
const OFFLINE_URL = '/offline.html';
const CACHE_STRATEGY = {
  // Cache d'abord, puis réseau
  cacheFirst: [
    '/manifest.json',
    '/assets/',
  ],
  // Réseau d'abord, puis cache
  networkFirst: [
    '/api/',
    '/supabase/',
  ],
  // Uniquement réseau
  networkOnly: [
    '/auth/',
  ]
};

// Données à mettre en cache pour l'offline
const CRITICAL_DATA = {
  schedule: 'schedule-cache',
  attendance: 'attendance-cache',
  grades: 'grades-cache',
  messages: 'messages-cache',
};

// Queue pour background sync
const SYNC_QUEUE = 'educ-ci-sync-queue';

// Messages d'erreur
const ERROR_MESSAGES = {
  noConnection: 'Pas de connexion Internet. Vos données seront synchronisées automatiquement.',
  syncSuccess: 'Synchronisation réussie',
  syncError: 'Erreur de synchronisation',
};