import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Search, BookOpen, Clock } from "lucide-react";
import { useCours } from "@/hooks/useCours";
import { useUserRole } from "@/hooks/useUserRole";

const ListeCours = () => {
  const navigate = useNavigate();
  const { coursList, loading, fetchCoursList } = useCours();
  const { primaryRole } = useUserRole();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCoursList();
  }, []);

  const filteredCours = coursList.filter(cours =>
    cours.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cours.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Mes Cours</h1>
                <p className="text-sm text-muted-foreground">
                  Accédez à tous vos cours et ressources pédagogiques
                </p>
              </div>
            </div>
            {primaryRole === 'ENSEIGNANT' && (
              <Button onClick={() => navigate("/cours/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau cours
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher un cours..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Liste des cours */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          </div>
        ) : filteredCours.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCours.map((cours) => (
              <Card
                key={cours.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => navigate(`/classe/${cours.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">{cours.matieres?.nom}</Badge>
                    <Badge variant="outline">
                      {cours.statut}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{cours.titre}</CardTitle>
                  {cours.description && (
                    <CardDescription className="line-clamp-2">
                      {cours.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>
                        {cours.profiles?.first_name} {cours.profiles?.last_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(cours.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun cours trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Essayez avec un autre terme de recherche" 
                  : "Aucun cours n'est disponible pour le moment"}
              </p>
              {primaryRole === 'ENSEIGNANT' && (
                <Button onClick={() => navigate("/cours/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un cours
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ListeCours;
