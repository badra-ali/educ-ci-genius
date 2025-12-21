import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Heart, Volume2, Download, Check, Loader2, WifiOff } from "lucide-react";
import { Resource } from "@/hooks/useResources";
import { useNavigate } from "react-router-dom";
import { useOfflineResources } from "@/hooks/useOfflineResources";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ResourceCardProps {
  resource: Resource;
  onAddToFavorites?: () => void;
  isFavorite?: boolean;
  showOfflineControls?: boolean;
}

export const ResourceCard = ({ 
  resource, 
  onAddToFavorites, 
  isFavorite,
  showOfflineControls = true 
}: ResourceCardProps) => {
  const navigate = useNavigate();
  const { isOffline, isDownloading, downloadResource, removeOfflineResource } = useOfflineResources();
  
  const resourceIsOffline = isOffline(resource.id);
  const resourceIsDownloading = isDownloading(resource.id);

  const handleOfflineToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (resourceIsOffline) {
      await removeOfflineResource(resource.id);
    } else {
      await downloadResource(resource);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all hover:-translate-y-1 relative">
      {resourceIsOffline && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <WifiOff className="w-3 h-3 mr-1" />
            Hors-ligne
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="w-full h-48 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 relative overflow-hidden">
          {resource.cover_url ? (
            <img 
              src={resource.cover_url} 
              alt={resource.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen className="w-16 h-16 text-primary" />
          )}
        </div>
        <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
        <CardDescription className="line-clamp-1">{resource.author}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{resource.level}</Badge>
          <Badge variant="outline">{resource.subject}</Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            size="sm"
            onClick={() => navigate(`/bibliotheque/${resource.id}`)}
          >
            Lire
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isFavorite ? "default" : "outline"} 
                  size="sm"
                  onClick={onAddToFavorites}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {showOfflineControls && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={resourceIsOffline ? "default" : "outline"} 
                    size="sm"
                    onClick={handleOfflineToggle}
                    disabled={resourceIsDownloading}
                    className={resourceIsOffline ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {resourceIsDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : resourceIsOffline ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {resourceIsDownloading 
                    ? "Téléchargement en cours..." 
                    : resourceIsOffline 
                      ? "Supprimer du mode hors-ligne" 
                      : "Télécharger pour lire hors-ligne"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {resource.audio_available && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Écouter en audio</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
