import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScheduleView } from "@/components/suivi/ScheduleView";
import { GradesView } from "@/components/suivi/GradesView";
import { AttendanceView } from "@/components/suivi/AttendanceView";
import { MessagingView } from "@/components/suivi/MessagingView";

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
            <ScheduleView />
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <GradesView />
          </TabsContent>

          <TabsContent value="assiduite" className="space-y-4">
            <AttendanceView />
          </TabsContent>

          <TabsContent value="messagerie" className="space-y-4">
            <MessagingView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Suivi;
