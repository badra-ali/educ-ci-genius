import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMyGrades, calculateAverage } from "@/hooks/useSuivi";
import { useState } from "react";
import { Download } from "lucide-react";

const PERIODS = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];

export const GradesView = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Trimestre 1");
  const { data: grades, isLoading } = useMyGrades(selectedPeriod);

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

  return (
    <div className="space-y-6">
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
              <Button className="w-full" disabled={!grades || grades.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Télécharger le bulletin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
