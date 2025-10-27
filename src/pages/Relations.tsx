import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentRelations } from "@/components/relations/StudentRelations";
import { ParentRelations } from "@/components/relations/ParentRelations";
import { TeacherRelations } from "@/components/relations/TeacherRelations";
import { ClassRelations } from "@/components/relations/ClassRelations";
import { Users, GraduationCap, School, UserCircle } from "lucide-react";

export default function Relations() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Relations</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les liens entre élèves, parents, enseignants et classes
        </p>
      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="students" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Élèves
          </TabsTrigger>
          <TabsTrigger value="parents" className="gap-2">
            <UserCircle className="h-4 w-4" />
            Parents
          </TabsTrigger>
          <TabsTrigger value="teachers" className="gap-2">
            <Users className="h-4 w-4" />
            Enseignants
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-2">
            <School className="h-4 w-4" />
            Classes
          </TabsTrigger>
        </TabsList>

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
