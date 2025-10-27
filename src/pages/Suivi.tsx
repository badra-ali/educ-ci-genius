import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, FileText, MessageSquare, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Suivi = () => {
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
          <h1 className="text-4xl font-bold mb-2">Suivi Scolaire</h1>
          <p className="text-muted-foreground">
            Gérez votre emploi du temps, vos notes et votre assiduité
          </p>
        </div>

        <Tabs defaultValue="agenda" className="space-y-6">
          <TabsList>
            <TabsTrigger value="agenda">Emploi du Temps</TabsTrigger>
            <TabsTrigger value="notes">Notes & Bulletins</TabsTrigger>
            <TabsTrigger value="assiduite">Assiduité</TabsTrigger>
            <TabsTrigger value="messagerie">Messagerie</TabsTrigger>
          </TabsList>

          <TabsContent value="agenda" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Emploi du Temps</CardTitle>
                <CardDescription>
                  Consultez votre planning de la semaine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"].map((jour) => (
                    <div key={jour} className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">{jour}</h3>
                      <p className="text-sm text-muted-foreground">
                        8h-10h: Mathématiques | 10h-12h: Physique | 14h-16h: Français
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Notes Récentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { matiere: "Mathématiques", note: "15/20", coef: "4" },
                      { matiere: "Physique", note: "14/20", coef: "3" },
                      { matiere: "Français", note: "16/20", coef: "3" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.matiere}</p>
                          <p className="text-sm text-muted-foreground">Coef. {item.coef}</p>
                        </div>
                        <p className="text-xl font-bold text-primary">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Moyenne Générale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-6xl font-bold text-secondary mb-2">15.2</p>
                    <p className="text-muted-foreground">Ce trimestre</p>
                    <Button className="mt-6 w-full">
                      Télécharger le bulletin
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assiduite" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <UserCheck className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>Suivi d'Assiduité</CardTitle>
                <CardDescription>
                  Absences et retards enregistrés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">2</p>
                    <p className="text-sm text-muted-foreground">Absences ce mois</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-3xl font-bold text-accent">1</p>
                    <p className="text-sm text-muted-foreground">Retards ce mois</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Soumettre un justificatif
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messagerie" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Messagerie</CardTitle>
                <CardDescription>
                  Communiquez avec vos enseignants et parents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Professeur de Mathématiques</p>
                        <p className="text-xs text-muted-foreground">Il y a 2h</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        N'oubliez pas de rendre le devoir pour vendredi...
                      </p>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4">
                  Nouveau message
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Suivi;
