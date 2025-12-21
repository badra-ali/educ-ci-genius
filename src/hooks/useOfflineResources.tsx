import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Resource } from "./useResources";

const OFFLINE_CACHE_NAME = 'library-offline-v1';
const OFFLINE_RESOURCES_KEY = 'offline-resources-metadata';

export interface OfflineResource {
  resource: Resource;
  downloadedAt: string;
  size?: number;
}

// Récupérer les métadonnées des ressources téléchargées depuis localStorage
const getOfflineMetadata = (): Record<string, OfflineResource> => {
  try {
    const data = localStorage.getItem(OFFLINE_RESOURCES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

// Sauvegarder les métadonnées
const saveOfflineMetadata = (metadata: Record<string, OfflineResource>) => {
  localStorage.setItem(OFFLINE_RESOURCES_KEY, JSON.stringify(metadata));
};

export const useOfflineResources = () => {
  const [offlineResources, setOfflineResources] = useState<Record<string, OfflineResource>>({});
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Charger les métadonnées au montage
  useEffect(() => {
    setOfflineResources(getOfflineMetadata());
  }, []);

  // Vérifier si une ressource est téléchargée
  const isOffline = useCallback((resourceId: string): boolean => {
    return resourceId in offlineResources;
  }, [offlineResources]);

  // Vérifier si une ressource est en cours de téléchargement
  const isDownloading = useCallback((resourceId: string): boolean => {
    return downloadingIds.has(resourceId);
  }, [downloadingIds]);

  // Télécharger une ressource pour le mode hors-ligne
  const downloadResource = useCallback(async (resource: Resource) => {
    if (!('caches' in window)) {
      toast.error("Le mode hors-ligne n'est pas supporté par votre navigateur");
      return false;
    }

    const resourceId = resource.id;
    
    if (isOffline(resourceId)) {
      toast.info("Cette ressource est déjà téléchargée");
      return true;
    }

    setDownloadingIds(prev => new Set(prev).add(resourceId));
    
    try {
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      const urlsToCache: string[] = [];

      // Ajouter l'URL du fichier si disponible
      if (resource.file_url) {
        urlsToCache.push(resource.file_url);
      }

      // Ajouter l'URL de la couverture si disponible
      if (resource.cover_url) {
        urlsToCache.push(resource.cover_url);
      }

      // Créer une version JSON de la ressource pour le cache
      const resourceDataUrl = `/api/offline-resource/${resourceId}`;
      const resourceResponse = new Response(JSON.stringify(resource), {
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put(resourceDataUrl, resourceResponse);

      // Télécharger les fichiers
      let totalSize = 0;
      for (const url of urlsToCache) {
        try {
          const response = await fetch(url, { mode: 'cors' });
          if (response.ok) {
            const blob = await response.blob();
            totalSize += blob.size;
            await cache.put(url, new Response(blob, {
              headers: response.headers
            }));
          }
        } catch (error) {
          console.warn(`Erreur lors du téléchargement de ${url}:`, error);
        }
      }

      // Sauvegarder les métadonnées
      const newMetadata = {
        ...offlineResources,
        [resourceId]: {
          resource,
          downloadedAt: new Date().toISOString(),
          size: totalSize
        }
      };
      saveOfflineMetadata(newMetadata);
      setOfflineResources(newMetadata);

      // Invalider le cache React Query pour les shelves
      queryClient.invalidateQueries({ queryKey: ["user-shelves"] });

      toast.success(`"${resource.title}" téléchargé pour le mode hors-ligne`);
      return true;
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement de la ressource");
      return false;
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
    }
  }, [offlineResources, isOffline, queryClient]);

  // Supprimer une ressource du cache hors-ligne
  const removeOfflineResource = useCallback(async (resourceId: string) => {
    if (!('caches' in window)) return false;

    try {
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      const resource = offlineResources[resourceId]?.resource;

      if (resource) {
        // Supprimer les fichiers du cache
        if (resource.file_url) {
          await cache.delete(resource.file_url);
        }
        if (resource.cover_url) {
          await cache.delete(resource.cover_url);
        }
        await cache.delete(`/api/offline-resource/${resourceId}`);
      }

      // Mettre à jour les métadonnées
      const newMetadata = { ...offlineResources };
      delete newMetadata[resourceId];
      saveOfflineMetadata(newMetadata);
      setOfflineResources(newMetadata);

      toast.success("Ressource supprimée du mode hors-ligne");
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression");
      return false;
    }
  }, [offlineResources]);

  // Obtenir la liste des ressources hors-ligne
  const getOfflineResourcesList = useCallback((): OfflineResource[] => {
    return Object.values(offlineResources);
  }, [offlineResources]);

  // Calculer la taille totale du cache
  const getTotalCacheSize = useCallback((): number => {
    return Object.values(offlineResources).reduce((total, item) => total + (item.size || 0), 0);
  }, [offlineResources]);

  // Formater la taille en Mo/Ko
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return {
    offlineResources,
    isOffline,
    isDownloading,
    downloadResource,
    removeOfflineResource,
    getOfflineResourcesList,
    getTotalCacheSize,
    formatSize
  };
};