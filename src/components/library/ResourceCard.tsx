import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Heart, Volume2 } from "lucide-react";
import { Resource } from "@/hooks/useResources";
import { useNavigate } from "react-router-dom";

interface ResourceCardProps {
  resource: Resource;
  onAddToFavorites?: () => void;
  isFavorite?: boolean;
}

export const ResourceCard = ({ resource, onAddToFavorites, isFavorite }: ResourceCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
      <CardHeader>
        <div className="w-full h-48 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
          <BookOpen className="w-16 h-16 text-primary" />
        </div>
        <CardTitle className="text-lg">{resource.title}</CardTitle>
        <CardDescription>{resource.author}</CardDescription>
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
          <Button 
            variant={isFavorite ? "default" : "outline"} 
            size="sm"
            onClick={onAddToFavorites}
          >
            <Heart className="w-4 h-4" />
          </Button>
          {resource.audio_available && (
            <Button variant="outline" size="sm">
              <Volume2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
