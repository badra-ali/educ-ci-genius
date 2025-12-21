import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentRelations } from "@/components/relations/StudentRelations";
import { ParentRelations } from "@/components/relations/ParentRelations";
import { TeacherRelations } from "@/components/relations/TeacherRelations";
import { ClassRelations } from "@/components/relations/ClassRelations";
import { ClasseVirtuelleRelations } from "@/components/relations/ClasseVirtuelleRelations";
import { SuiviScolaireRelations } from "@/components/relations/SuiviScolaireRelations";
import { BibliothequeRelations } from "@/components/relations/BibliothequeRelations";
import { Users, GraduationCap, School, UserCircle, BookOpen, ClipboardCheck, Library } from "lucide-react";

export default function Relations() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Relations</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les liens entre élèves, parents, enseignants et classes
        </p>
      </div>

      <Tabs defaultValue="classe-virtuelle" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="classe-virtuelle" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden lg:inline">Classe Virtuelle</span>
            <span className="lg:hidden">Cours</span>
          </TabsTrigger>
          <TabsTrigger value="suivi-scolaire" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden lg:inline">Suivi Scolaire</span>
            <span className="lg:hidden">Suivi</span>
          </TabsTrigger>
          <TabsTrigger value="bibliotheque" className="gap-2">
            <Library className="h-4 w-4" />
            <span className="hidden lg:inline">Bibliothèque</span>
            <span className="lg:hidden">Biblio</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden lg:inline">Élèves</span>
          </TabsTrigger>
          <TabsTrigger value="parents" className="gap-2">
            <UserCircle className="h-4 w-4" />
            <span className="hidden lg:inline">Parents</span>
          </TabsTrigger>
          <TabsTrigger value="teachers" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden lg:inline">Enseignants</span>
            <span className="lg:hidden">Prof</span>
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-2">
            <School className="h-4 w-4" />
            <span className="hidden lg:inline">Classes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classe-virtuelle">
          <Card>
            <CardHeader>
              <CardTitle>Relations Classe Virtuelle</CardTitle>
              <CardDescription>
                Cours → Devoirs, QCM, Threads | Devoirs → Rendus | QCM → Tentatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClasseVirtuelleRelations />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suivi-scolaire">
          <Card>
            <CardHeader>
              <CardTitle>Relations Suivi Scolaire</CardTitle>
              <CardDescription>
                Élève → Classes, Notes, Présences | Enseignant → Notes | Classe → EDT | Notes → Bulletins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SuiviScolaireRelations />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bibliotheque">
          <Card>
            <CardHeader>
              <CardTitle>Relations Bibliothèque</CardTitle>
              <CardDescription>
                Resource → Sections | Utilisateur → Lecture, Annotations | Resource → Embeddings IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BibliothequeRelations />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Élèves</CardTitle>
              <CardDescription>
                Consultez et gérez les élèves, leurs classes et leurs parents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentRelations />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parents">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Parents</CardTitle>
              <CardDescription>
                Consultez et gérez les parents et leurs enfants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParentRelations />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Enseignants</CardTitle>
              <CardDescription>
                Consultez et gérez les enseignants et leurs affectations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeacherRelations />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Classes</CardTitle>
              <CardDescription>
                Consultez et gérez les classes, leurs élèves et enseignants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClassRelations />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
