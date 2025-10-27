import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMyGrades, calculateAverage } from "@/hooks/useSuivi";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { GradesChart } from "./GradesChart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PERIODS = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];

export const GradesView = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Trimestre 1");
  const { data: grades, isLoading } = useMyGrades(selectedPeriod);
  const [downloading, setDownloading] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const average = calculateAverage(grades || []);

  // Group grades by subject
  const gradesBySubject = (grades || []).reduce((acc, grade) => {
    const subjectName = grade.matiere?.nom || 'Matière inconnue';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(grade);
    return acc;
  }, {} as Record<string, any[]>);

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Utiliser l'ID utilisateur directement dans grades
      // car student_id est un UUID qui référence le user_id

      const { data, error } = await supabase.functions.invoke('generate-report-card', {
        body: { student_id: user.id, period: selectedPeriod }
      });

      if (error) throw error;

      toast.success("Bulletin généré avec succès");
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error("Erreur lors de la génération du bulletin");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {grades && grades.length > 0 && <GradesChart gradesBySubject={gradesBySubject} />}
      
      <div className="flex items-center justify-between">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((period) => (
              <SelectItem key={period} value={period}>
                {period}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notes Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {!grades || grades.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune note pour ce trimestre
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(gradesBySubject).map(([subject, subjectGrades]) => {
                  const subjectAvg = calculateAverage(subjectGrades);
                  const latestGrade = subjectGrades[0];
                  return (
                    <div
                      key={subject}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: latestGrade.matiere?.couleur || '#3B82F6'
                      }}
                    >
                      <div>
                        <p className="font-medium">{subject}</p>
                        <p className="text-sm text-muted-foreground">
                          Coef. {latestGrade.matiere?.coefficient || latestGrade.coefficient || 1}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {latestGrade.score}/20
                        </p>
                        {subjectGrades.length > 1 && (
                          <p className="text-xs text-muted-foreground">
                            Moy: {subjectAvg}/20
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moyenne Générale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-6xl font-bold text-secondary mb-2">
                {average}
              </p>
              <p className="text-muted-foreground mb-6">{selectedPeriod}</p>
              <Button 
                className="w-full" 
                disabled={!grades || grades.length === 0 || downloading}
                onClick={handleDownloadReport}
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger le bulletin
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
