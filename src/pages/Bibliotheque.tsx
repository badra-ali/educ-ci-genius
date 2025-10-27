import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useResources, useUserShelves, useAddToShelf } from "@/hooks/useResources";
import { ResourceCard } from "@/components/library/ResourceCard";
import { Skeleton } from "@/components/ui/skeleton";

const Bibliotheque = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("Tous");
  const [audioOnly, setAudioOnly] = useState(false);

  const { data: resources, isLoading } = useResources({
    query: searchQuery,
    level: selectedLevel,
    audioOnly,
  });

  const { data: shelves } = useUserShelves();
  const addToShelf = useAddToShelf();

  const favoriteIds = new Set(
    shelves?.filter(s => s.shelf === 'FAVORI').map(s => s.resource_id) || []
  );

  const levels = ["Tous", "Primaire", "Collège", "Lycée"];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Bibliothèque Numérique</h1>
          <p className="text-muted-foreground">
            Accédez à des milliers de ressources éducatives avec lecture audio
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Rechercher un livre, un auteur, une matière..."
              className="pl-10 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {levels.map((level) => (
            <Badge
              key={level}
              variant={selectedLevel === level ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => setSelectedLevel(level)}
            >
              {level}
            </Badge>
          ))}
          <Badge
            variant={audioOnly ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
            onClick={() => setAudioOnly(!audioOnly)}
          >
            Avec audio
          </Badge>
        </div>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : resources && resources.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isFavorite={favoriteIds.has(resource.id)}
                onAddToFavorites={() => 
                  addToShelf.mutate({ 
                    resourceId: resource.id, 
                    shelf: 'FAVORI' 
                  })
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucune ressource trouvée</p>
          </div>
        )}

        {/* My Lists */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Mes Listes</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">À lire</CardTitle>
                <CardDescription>
                  {shelves?.filter(s => s.shelf === 'A_LIRE').length || 0} ressources
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Favoris</CardTitle>
                <CardDescription>
                  {shelves?.filter(s => s.shelf === 'FAVORI').length || 0} ressources
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Hors-ligne</CardTitle>
                <CardDescription>
                  {shelves?.filter(s => s.shelf === 'HORS_LIGNE').length || 0} ressources
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Bibliotheque;
