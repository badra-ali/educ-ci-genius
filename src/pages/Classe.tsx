import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, CheckCircle2, FileText, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Classe = () => {
  const navigate = useNavigate();

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
          <h1 className="text-4xl font-bold mb-2">Classe Virtuelle</h1>
          <p className="text-muted-foreground">
            Accédez à vos cours, QCM, devoirs et sessions de collaboration
          </p>
        </div>

        <Tabs defaultValue="cours" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cours">Mes Cours</TabsTrigger>
            <TabsTrigger value="qcm">QCM</TabsTrigger>
            <TabsTrigger value="devoirs">Devoirs</TabsTrigger>
            <TabsTrigger value="visio">Visioconférence</TabsTrigger>
          </TabsList>

          <TabsContent value="cours" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Mathématiques - Chapitre {i}</CardTitle>
                    <CardDescription>
                      Introduction aux fonctions polynomiales
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Accéder au cours</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="qcm" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-6 h-6 text-secondary" />
                    </div>
                    <CardTitle>QCM - Physique Chapitre {i}</CardTitle>
                    <CardDescription>20 questions - 30 minutes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="secondary" className="w-full">
                      Commencer le QCM
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="devoirs" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6 text-accent" />
                    </div>
                    <CardTitle>Devoir {i} - Français</CardTitle>
                    <CardDescription>À rendre avant le 15/01/2025</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Voir les consignes
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="visio" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Sessions de visioconférence</CardTitle>
                <CardDescription>
                  Rejoignez vos cours en direct et collaborez avec vos camarades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Aucune session programmée pour le moment
                </p>
                <Button disabled className="w-full">
                  Rejoindre une session
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Classe;
