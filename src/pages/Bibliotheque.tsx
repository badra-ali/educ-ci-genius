import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, Heart, Search, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const Bibliotheque = () => {
  const navigate = useNavigate();

  const books = [
    {
      title: "Les Misérables",
      author: "Victor Hugo",
      level: "Lycée",
      subject: "Français",
      hasAudio: true,
    },
    {
      title: "Cours de Mathématiques",
      author: "Dr. Kouassi",
      level: "Terminale",
      subject: "Mathématiques",
      hasAudio: false,
    },
    {
      title: "Histoire de la Côte d'Ivoire",
      author: "Prof. Yao",
      level: "Collège",
      subject: "Histoire",
      hasAudio: true,
    },
    {
      title: "Sciences Physiques",
      author: "Dr. Traoré",
      level: "2nde",
      subject: "Physique",
      hasAudio: true,
    },
  ];

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
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
            Tous
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
            Primaire
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
            Collège
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
            Lycée
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
            Avec audio
          </Badge>
        </div>

        {/* Books Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {books.map((book, index) => (
            <Card key={index} className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="w-full h-48 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                  <BookOpen className="w-16 h-16 text-primary" />
                </div>
                <CardTitle className="text-lg">{book.title}</CardTitle>
                <CardDescription>{book.author}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{book.level}</Badge>
                  <Badge variant="outline">{book.subject}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    Lire
                  </Button>
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                  {book.hasAudio && (
                    <Button variant="outline" size="sm">
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* My Lists */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Mes Listes</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">À lire</CardTitle>
                <CardDescription>5 livres en attente</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Favoris</CardTitle>
                <CardDescription>12 ressources sauvegardées</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Hors-ligne</CardTitle>
                <CardDescription>8 ressources téléchargées</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Bibliotheque;
