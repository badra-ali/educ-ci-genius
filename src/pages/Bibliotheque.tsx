import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Sparkles, TrendingUp, WifiOff, Trash2, HardDrive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useResources, useUserShelves, useAddToShelf, useRecommendedResources, useUserProfile } from "@/hooks/useResources";
import { ResourceCard } from "@/components/library/ResourceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useOfflineResources } from "@/hooks/useOfflineResources";
import { Progress } from "@/components/ui/progress";

const Bibliotheque = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("Tous");
  const [audioOnly, setAudioOnly] = useState(false);
  const [showOfflineSection, setShowOfflineSection] = useState(false);

  const { data: resources, isLoading } = useResources({
    query: searchQuery,
    level: selectedLevel,
    audioOnly,
  });

  const { data: shelves } = useUserShelves();
  const addToShelf = useAddToShelf();
  const { data: recommendedResources, isLoading: isLoadingRecommended } = useRecommendedResources();
  const { data: userProfile } = useUserProfile();
  const { 
    getOfflineResourcesList, 
    getTotalCacheSize, 
    formatSize, 
    removeOfflineResource 
  } = useOfflineResources();

  const offlineList = getOfflineResourcesList();
  const totalCacheSize = getTotalCacheSize();
  const maxCacheSize = 500 * 1024 * 1024; // 500 Mo max suggéré

  const favoriteIds = new Set(
    shelves?.filter(s => s.shelf === 'FAVORI').map(s => s.resource_id) || []
  );

  const levels = ["Tous", "Primaire", "Collège", "Lycée"];

  // Ne pas afficher les recommandations si une recherche est en cours
  const showRecommendations = !searchQuery && selectedLevel === "Tous" && !audioOnly && !showOfflineSection;

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
        <div className="flex gap-2 mb-8 flex-wrap items-center">
          {levels.map((level) => (
            <Badge
              key={level}
              variant={selectedLevel === level && !showOfflineSection ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => {
                setSelectedLevel(level);
                setShowOfflineSection(false);
              }}
            >
              {level}
            </Badge>
          ))}
          <Badge
            variant={audioOnly && !showOfflineSection ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
            onClick={() => {
              setAudioOnly(!audioOnly);
              setShowOfflineSection(false);
            }}
          >
            Avec audio
          </Badge>
          <div className="h-6 w-px bg-border mx-2" />
          <Badge
            variant={showOfflineSection ? "default" : "outline"}
            className={`cursor-pointer ${showOfflineSection ? "bg-green-600 hover:bg-green-700" : "hover:bg-green-600 hover:text-white"}`}
            onClick={() => setShowOfflineSection(!showOfflineSection)}
          >
            <WifiOff className="w-3 h-3 mr-1" />
            Hors-ligne ({offlineList.length})
          </Badge>
        </div>

        {/* Section Hors-ligne */}
        {showOfflineSection && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-green-600" />
                <h2 className="text-2xl font-bold">Ressources hors-ligne</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HardDrive className="w-4 h-4" />
                  <span>{formatSize(totalCacheSize)} utilisés</span>
                </div>
              </div>
            </div>
            
            {/* Barre de progression du stockage */}
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Espace utilisé</span>
                <span className="font-medium">{formatSize(totalCacheSize)} / {formatSize(maxCacheSize)}</span>
              </div>
              <Progress value={(totalCacheSize / maxCacheSize) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Les ressources téléchargées sont disponibles sans connexion internet.
              </p>
            </div>
            
            {offlineList.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {offlineList.map((item) => (
                  <Card key={item.resource.id} className="relative group">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeOfflineResource(item.resource.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <CardHeader>
                      <div className="w-full h-32 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                        <WifiOff className="w-10 h-10 text-green-600" />
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{item.resource.title}</CardTitle>
                      <CardDescription className="line-clamp-1">{item.resource.author}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap mb-3">
                        <Badge variant="secondary">{item.resource.level}</Badge>
                        <Badge variant="outline">{item.resource.subject}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{formatSize(item.size || 0)}</span>
                        <span>Téléchargé {new Date(item.downloadedAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <Button 
                        className="w-full mt-3" 
                        size="sm"
                        onClick={() => navigate(`/bibliotheque/${item.resource.id}`)}
                      >
                        Lire
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <WifiOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucune ressource hors-ligne</h3>
                <p className="text-muted-foreground mb-4">
                  Téléchargez des ressources pour les consulter sans connexion internet.
                </p>
                <Button variant="outline" onClick={() => setShowOfflineSection(false)}>
                  Parcourir la bibliothèque
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Recommandations personnalisées */}
        {showRecommendations && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-2xl font-bold">Recommandé pour vous</h2>
              {userProfile?.level && (
                <Badge variant="secondary" className="ml-2">
                  {userProfile.level}
                </Badge>
              )}
              {userProfile?.subjects && userProfile.subjects.length > 0 && (
                <Badge variant="outline" className="ml-1">
                  {userProfile.subjects.slice(0, 2).join(", ")}
                  {userProfile.subjects.length > 2 && ` +${userProfile.subjects.length - 2}`}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mb-6">
              {userProfile?.level || userProfile?.subjects?.length 
                ? "Ressources adaptées à votre niveau et vos matières"
                : "Les ressources les plus populaires"}
            </p>
            
            {isLoadingRecommended ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-48 w-full mb-4" />
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : recommendedResources && recommendedResources.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {recommendedResources.map((resource) => (
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
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Explorez la bibliothèque pour découvrir des ressources
                </p>
              </div>
            )}
          </div>
        )}

        {/* Toutes les ressources */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">
            {searchQuery || selectedLevel !== "Tous" || audioOnly 
              ? "Résultats" 
              : "Toutes les ressources"}
          </h2>
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
        {!showOfflineSection && (
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
              <Card 
                className={`cursor-pointer hover:shadow-md transition-shadow ${offlineList.length > 0 ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}`}
                onClick={() => setShowOfflineSection(true)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-green-600" />
                    Hors-ligne
                  </CardTitle>
                  <CardDescription>
                    {offlineList.length} ressource{offlineList.length > 1 ? 's' : ''} • {formatSize(totalCacheSize)}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Bibliotheque;
