import { useState, useEffect } from "react";
import { useChildren, useChildGrades, useChildReportCards } from "@/hooks/useParent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileDown, TrendingUp } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ParentGrades() {
  const [searchParams] = useSearchParams();
  const initialChild = searchParams.get("child") || "";
  
  const [selectedChild, setSelectedChild] = useState(initialChild);
  const [period, setPeriod] = useState("T1");

  const { data: children } = useChildren();
  const { data: grades, isLoading: gradesLoading } = useChildGrades(selectedChild, period);
  const { data: reportCards, isLoading: reportsLoading } = useChildReportCards(selectedChild);

  // Auto-select first child
  useEffect(() => {
    if (children && children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].eleve_id);
    }
  }, [children, selectedChild]);

  // Calculate average
  const calculateAverage = () => {
    if (!grades || grades.length === 0) return null;
    const totalScore = grades.reduce((sum: number, g: any) => sum + g.score * g.coefficient, 0);
    const totalCoeff = grades.reduce((sum: number, g: any) => sum + g.coefficient, 0);
    return totalCoeff > 0 ? (totalScore / totalCoeff).toFixed(2) : null;
  };

  // Prepare chart data
  const chartData = grades?.map((g: any) => ({
    matiere: g.matiere?.nom || "Matière",
    note: g.score,
  })) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Notes & Bulletins</h1>

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner l'enfant et la période</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Enfant</label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un enfant" />
                </SelectTrigger>
                <SelectContent>
                  {children?.map((child: any) => (
                    <SelectItem key={child.eleve_id} value={child.eleve_id}>
                      {child.first_name} {child.last_name} - {child.classe_nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Période</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T1">Trimestre 1</SelectItem>
                  <SelectItem value="T2">Trimestre 2</SelectItem>
                  <SelectItem value="T3">Trimestre 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Card */}
      {selectedChild && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Moyenne générale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center">
              {calculateAverage() || "-"}/20
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grades Table */}
      {selectedChild && (
        <Card>
          <CardHeader>
            <CardTitle>Notes par matière</CardTitle>
            <CardDescription>Trimestre {period.replace("T", "")}</CardDescription>
          </CardHeader>
          <CardContent>
            {gradesLoading ? (
              <Skeleton className="h-96" />
            ) : grades && grades.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matière</TableHead>
                    <TableHead className="text-right">Note</TableHead>
                    <TableHead className="text-right">Coefficient</TableHead>
                    <TableHead className="text-right">Pondérée</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade: any) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.matiere?.nom}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={grade.score >= 10 ? "default" : "destructive"}>
                          {grade.score}/20
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{grade.coefficient}</TableCell>
                      <TableCell className="text-right font-medium">
                        {(grade.score * grade.coefficient).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Aucune note disponible pour cette période
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      {selectedChild && grades && grades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Graphique des notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="matiere" fontSize={12} />
                <YAxis domain={[0, 20]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="note" fill="hsl(var(--primary))" name="Note" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Report Cards */}
      {selectedChild && (
        <Card>
          <CardHeader>
            <CardTitle>Bulletins scolaires</CardTitle>
            <CardDescription>Téléchargez les bulletins disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <Skeleton className="h-48" />
            ) : reportCards && reportCards.length > 0 ? (
              <div className="space-y-3">
                {reportCards.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">Bulletin {report.period}</div>
                      <div className="text-sm text-muted-foreground">
                        Moyenne: {report.average}/20
                        {report.rank && ` • Rang: ${report.rank}/${report.total_students}`}
                      </div>
                      {report.remarks && (
                        <div className="text-sm text-muted-foreground mt-1">{report.remarks}</div>
                      )}
                    </div>
                    {report.pdf_url && (
                      <Button size="sm" asChild>
                        <a href={report.pdf_url} target="_blank" rel="noopener noreferrer">
                          <FileDown className="h-4 w-4 mr-2" />
                          Télécharger
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Aucun bulletin disponible pour le moment
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
