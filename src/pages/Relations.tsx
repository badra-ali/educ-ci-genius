import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentRelations } from "@/components/relations/StudentRelations";
import { ParentRelations } from "@/components/relations/ParentRelations";
import { TeacherRelations } from "@/components/relations/TeacherRelations";
import { ClassRelations } from "@/components/relations/ClassRelations";
import { ClasseVirtuelleRelations } from "@/components/relations/ClasseVirtuelleRelations";
import { SuiviScolaireRelations } from "@/components/relations/SuiviScolaireRelations";
import { BibliothequeRelations } from "@/components/relations/BibliothequeRelations";
import { TuteurIARelations } from "@/components/relations/TuteurIARelations";
import { RelationsDiagram } from "@/components/relations/RelationsDiagram";
import { RelationsFilters, RelationsFiltersState, defaultFilters } from "@/components/relations/RelationsFilters";
import { ExportMenu } from "@/components/relations/ExportMenu";
import { Users, GraduationCap, School, UserCircle, BookOpen, ClipboardCheck, Library, Bot, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCoursWithRelations, useClasseVirtuelleStats } from "@/hooks/useClasseVirtuelleRelations";
import { useSuiviScolaireStats, useElevesWithRelations } from "@/hooks/useSuiviScolaireRelations";
import { useBibliothequeRelations } from "@/hooks/useBibliothequeRelations";
import { useTuteurIARelations } from "@/hooks/useTuteurIARelations";

export default function Relations() {
  const [activeTab, setActiveTab] = useState("classe-virtuelle");
  const [filters, setFilters] = useState<RelationsFiltersState>(defaultFilters);
  const [showDiagram, setShowDiagram] = useState(false);

  // Fetch data for exports
  const { data: coursData } = useCoursWithRelations();
  const { data: classeVirtuelleStats } = useClasseVirtuelleStats();
  const { data: suiviStats } = useSuiviScolaireStats();
  const { data: elevesData } = useElevesWithRelations();
  const { data: resourcesData } = useBibliothequeRelations();
  const { data: tuteurData } = useTuteurIARelations();

  // Export columns definitions
  const coursExportColumns = [
    { key: 'titre', label: 'Titre' },
    { key: 'matiere', label: 'Matière', format: (v: any) => v?.nom || '-' },
    { key: 'enseignant', label: 'Enseignant', format: (v: any) => v ? `${v.first_name} ${v.last_name}` : '-' },
    { key: 'classes', label: 'Classes', format: (v: any[]) => v?.length || 0 },
    { key: 'devoirs', label: 'Devoirs', format: (v: any[]) => v?.length || 0 },
    { key: 'qcms', label: 'QCMs', format: (v: any[]) => v?.length || 0 },
  ];

  const elevesExportColumns = [
    { key: 'first_name', label: 'Prénom' },
    { key: 'last_name', label: 'Nom' },
    { key: 'classe', label: 'Classe', format: (v: any) => v?.nom || '-' },
    { key: 'notes_count', label: 'Nb Notes' },
    { key: 'moyenne', label: 'Moyenne', format: (v: number | null) => v !== null ? `${v}/20` : '-' },
    { key: 'taux_presence', label: 'Présence', format: (v: number) => `${v}%` },
  ];

  const resourcesExportColumns = [
    { key: 'title', label: 'Titre' },
    { key: 'author', label: 'Auteur' },
    { key: 'type', label: 'Type' },
    { key: 'level', label: 'Niveau' },
    { key: 'subject', label: 'Matière' },
    { key: 'sections_count', label: 'Sections' },
    { key: 'readers_count', label: 'Lecteurs' },
    { key: 'highlights_count', label: 'Annotations' },
  ];

  const sessionsExportColumns = [
    { key: 'title', label: 'Titre', format: (v: string | null) => v || 'Session sans titre' },
    { key: 'mode', label: 'Mode' },
    { key: 'subject', label: 'Matière', format: (v: string | null) => v || '-' },
    { key: 'grade', label: 'Niveau', format: (v: string | null) => v || '-' },
    { key: 'messages_count', label: 'Messages' },
    { key: 'qcms_count', label: 'QCMs générés' },
  ];

  const getExportData = () => {
    switch (activeTab) {
      case 'classe-virtuelle':
        return { data: coursData || [], columns: coursExportColumns, filename: 'cours-relations', title: 'Relations Classe Virtuelle' };
      case 'suivi-scolaire':
        return { data: elevesData || [], columns: elevesExportColumns, filename: 'eleves-suivi', title: 'Suivi Scolaire' };
      case 'bibliotheque':
        return { data: resourcesData || [], columns: resourcesExportColumns, filename: 'ressources-relations', title: 'Relations Bibliothèque' };
      case 'tuteur-ia':
        return { data: tuteurData?.sessions || [], columns: sessionsExportColumns, filename: 'sessions-tuteur-ia', title: 'Sessions Tuteur IA' };
      default:
        return null;
    }
  };

  const getDiagramStats = () => {
    switch (activeTab) {
      case 'classe-virtuelle':
        return classeVirtuelleStats ? {
          cours: classeVirtuelleStats.coursCount,
          devoirs: classeVirtuelleStats.devoirsCount,
          qcms: classeVirtuelleStats.qcmsCount,
          rendus: classeVirtuelleStats.rendusCount,
          tentatives: classeVirtuelleStats.tentativesCount,
        } : undefined;
      case 'suivi-scolaire':
        return suiviStats ? {
          eleves: suiviStats.elevesCount,
          notes: suiviStats.notesCount,
          presences: suiviStats.presencesCount,
          edt: suiviStats.schedulesCount,
          bulletins: suiviStats.bulletinsCount,
        } : undefined;
      case 'bibliotheque':
        const resources = resourcesData || [];
        return {
          resources: resources.length,
          sections: resources.reduce((sum, r) => sum + r.sections_count, 0),
          lectures: resources.reduce((sum, r) => sum + r.readers_count, 0),
          annotations: resources.reduce((sum, r) => sum + r.highlights_count, 0),
          embeddings: resources.reduce((sum, r) => sum + r.embeddings_count, 0),
        };
      case 'tuteur-ia':
        return tuteurData?.stats ? {
          sessions: tuteurData.stats.totalSessions,
          messages: tuteurData.stats.totalMessages,
          qcms: tuteurData.stats.totalQcms,
        } : undefined;
      default:
        return undefined;
    }
  };

  const exportData = getExportData();
  const diagramModule = ['classe-virtuelle', 'suivi-scolaire', 'bibliotheque', 'tuteur-ia'].includes(activeTab) 
    ? activeTab as 'classe-virtuelle' | 'suivi-scolaire' | 'bibliotheque' | 'tuteur-ia'
    : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Relations</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les liens entre élèves, parents, enseignants et classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {diagramModule && (
            <Button
              variant={showDiagram ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDiagram(!showDiagram)}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              {showDiagram ? "Masquer diagramme" : "Voir diagramme"}
            </Button>
          )}
          {exportData && (
            <ExportMenu
              data={exportData.data}
              columns={exportData.columns}
              filename={exportData.filename}
              title={exportData.title}
            />
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <RelationsFilters
          filters={filters}
          onFiltersChange={setFilters}
          showEtablissement={true}
          showAnnee={true}
          showPeriode={['suivi-scolaire'].includes(activeTab)}
          showNiveau={['suivi-scolaire', 'bibliotheque'].includes(activeTab)}
        />
      </div>

      {/* Diagram */}
      {showDiagram && diagramModule && (
        <RelationsDiagram 
          module={diagramModule} 
          stats={getDiagramStats()}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="classe-virtuelle" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden xl:inline">Classe Virtuelle</span>
            <span className="xl:hidden">Cours</span>
          </TabsTrigger>
          <TabsTrigger value="suivi-scolaire" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden xl:inline">Suivi Scolaire</span>
            <span className="xl:hidden">Suivi</span>
          </TabsTrigger>
          <TabsTrigger value="bibliotheque" className="gap-2">
            <Library className="h-4 w-4" />
            <span className="hidden xl:inline">Bibliothèque</span>
            <span className="xl:hidden">Biblio</span>
          </TabsTrigger>
          <TabsTrigger value="tuteur-ia" className="gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden xl:inline">Tuteur IA</span>
            <span className="xl:hidden">IA</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden xl:inline">Élèves</span>
          </TabsTrigger>
          <TabsTrigger value="parents" className="gap-2">
            <UserCircle className="h-4 w-4" />
            <span className="hidden xl:inline">Parents</span>
          </TabsTrigger>
          <TabsTrigger value="teachers" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden xl:inline">Enseignants</span>
            <span className="xl:hidden">Prof</span>
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-2">
            <School className="h-4 w-4" />
            <span className="hidden xl:inline">Classes</span>
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

        <TabsContent value="tuteur-ia">
          <Card>
            <CardHeader>
              <CardTitle>Relations Tuteur IA</CardTitle>
              <CardDescription>
                Session → Messages, QCM générés | Session → Resources RAG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TuteurIARelations />
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
