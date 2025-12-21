import { useState } from "react";
import { useTeacherClasses } from "@/hooks/useTeacher";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { TrendingUp, TrendingDown, Users, Award, AlertTriangle, CheckCircle } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

export default function TeacherAnalytics() {
  const { data: classes, isLoading: classesLoading } = useTeacherClasses();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedMatiere, setSelectedMatiere] = useState<string>("");

  // Récupérer les données d'analytics pour la classe sélectionnée
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["class-analytics", selectedClass, selectedMatiere],
    queryFn: async () => {
      if (!selectedClass) return null;

      // Récupérer les élèves de la classe
      const { data: eleveClasses } = await supabase
        .from("eleve_classes")
        .select("user_id")
        .eq("classe_id", selectedClass)
        .eq("actif", true);

      if (!eleveClasses || eleveClasses.length === 0) return null;

      const studentIds = eleveClasses.map(ec => ec.user_id);

      // Récupérer les profils
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", studentIds);

      // Récupérer les notes
      const gradesQuery = supabase
        .from("grades")
        .select("*, matiere:matieres(nom)")
        .in("student_id", studentIds);

      if (selectedMatiere) {
        gradesQuery.eq("matiere_id", selectedMatiere);
      }

      const { data: grades } = await gradesQuery;

      // Récupérer l'assiduité (30 derniers jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .in("student_id", studentIds)
        .gte("date", thirtyDaysAgo.toISOString().split('T')[0]);

      // Calculer les statistiques
      const totalStudents = profiles?.length || 0;
      const allScores = grades?.map(g => g.score) || [];
      const avgScore = allScores.length > 0 
        ? allScores.reduce((a, b) => a + b, 0) / allScores.length 
        : 0;

      // Distribution des notes
      const gradeDistribution = [
        { range: "0-5", count: allScores.filter(s => s < 5).length, label: "Insuffisant" },
        { range: "5-8", count: allScores.filter(s => s >= 5 && s < 8).length, label: "Faible" },
        { range: "8-10", count: allScores.filter(s => s >= 8 && s < 10).length, label: "Passable" },
        { range: "10-12", count: allScores.filter(s => s >= 10 && s < 12).length, label: "Moyen" },
        { range: "12-14", count: allScores.filter(s => s >= 12 && s < 14).length, label: "Assez bien" },
        { range: "14-16", count: allScores.filter(s => s >= 14 && s < 16).length, label: "Bien" },
        { range: "16-20", count: allScores.filter(s => s >= 16).length, label: "Très bien" },
      ];

      // Performances par élève
      const studentPerformances = profiles?.map(profile => {
        const studentGrades = grades?.filter(g => g.student_id === profile.id) || [];
        const studentAvg = studentGrades.length > 0
          ? studentGrades.reduce((a, b) => a + b.score, 0) / studentGrades.length
          : 0;
        
        const studentAttendance = attendance?.filter(a => a.student_id === profile.id) || [];
        const presences = studentAttendance.filter(a => a.status === "PRESENT").length;
        const attendanceRate = studentAttendance.length > 0
          ? (presences / studentAttendance.length) * 100
          : 100;

        return {
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`,
          average: Math.round(studentAvg * 100) / 100,
          attendanceRate: Math.round(attendanceRate),
          gradesCount: studentGrades.length,
        };
      }).sort((a, b) => b.average - a.average) || [];

      // Élèves en difficulté (moyenne < 10 ou assiduité < 80%)
      const studentsAtRisk = studentPerformances.filter(
        s => s.average < 10 || s.attendanceRate < 80
      );

      // Évolution des moyennes par période
      const periodAverages = ["T1", "T2", "T3"].map(period => {
        const periodGrades = grades?.filter(g => g.period === period) || [];
        const avg = periodGrades.length > 0
          ? periodGrades.reduce((a, b) => a + b.score, 0) / periodGrades.length
          : 0;
        return { period, average: Math.round(avg * 100) / 100 };
      });

      // Statistiques d'assiduité
      const totalAttendance = attendance?.length || 0;
      const presentCount = attendance?.filter(a => a.status === "PRESENT").length || 0;
      const absentCount = attendance?.filter(a => a.status === "ABSENT").length || 0;
      const lateCount = attendance?.filter(a => a.status === "LATE").length || 0;

      const attendanceStats = [
        { name: "Présents", value: presentCount, color: "hsl(142, 76%, 36%)" },
        { name: "Absents", value: absentCount, color: "hsl(0, 84%, 60%)" },
        { name: "Retards", value: lateCount, color: "hsl(38, 92%, 50%)" },
      ];

      return {
        totalStudents,
        avgScore: Math.round(avgScore * 100) / 100,
        gradeDistribution,
        studentPerformances,
        studentsAtRisk,
        periodAverages,
        attendanceStats,
        attendanceRate: totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100,
      };
    },
    enabled: !!selectedClass,
  });

  // Récupérer les matières pour la classe sélectionnée
  const selectedClassData = classes?.find((c: any) => c.classe_id === selectedClass);
  const matieres = classes?.filter((c: any) => c.classe_id === selectedClass) || [];

  if (classesLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics de classe</h1>
      </div>

      {/* Sélecteurs */}
      <div className="flex gap-4 flex-wrap">
        <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedMatiere(""); }}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Sélectionner une classe" />
          </SelectTrigger>
          <SelectContent>
            {Array.from(new Set(classes?.map((c: any) => c.classe_id))).map((classeId: any) => {
              const cls = classes?.find((c: any) => c.classe_id === classeId);
              return (
                <SelectItem key={classeId} value={classeId}>
                  {cls?.classe_nom}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {selectedClass && (
          <Select value={selectedMatiere} onValueChange={setSelectedMatiere}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Toutes les matières" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les matières</SelectItem>
              {matieres.map((m: any) => (
                <SelectItem key={m.matiere_id} value={m.matiere_id}>
                  {m.matiere_nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!selectedClass ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Sélectionnez une classe pour voir les analytics</p>
          </CardContent>
        </Card>
      ) : analyticsLoading ? (
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : analytics ? (
        <>
          {/* KPIs */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Effectif</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalStudents}</div>
                <p className="text-xs text-muted-foreground">élèves</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moyenne de classe</CardTitle>
                {analytics.avgScore >= 10 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.avgScore}/20</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.avgScore >= 14 ? "Excellent" : 
                   analytics.avgScore >= 12 ? "Bien" : 
                   analytics.avgScore >= 10 ? "Passable" : "À améliorer"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de présence</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">sur 30 jours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Élèves en difficulté</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.studentsAtRisk.length}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.studentsAtRisk.length > 0 ? "Attention requise" : "Aucun"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="grades" className="space-y-4">
            <TabsList>
              <TabsTrigger value="grades">Notes</TabsTrigger>
              <TabsTrigger value="attendance">Assiduité</TabsTrigger>
              <TabsTrigger value="students">Élèves</TabsTrigger>
              <TabsTrigger value="evolution">Évolution</TabsTrigger>
            </TabsList>

            <TabsContent value="grades" className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Distribution des notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribution des notes</CardTitle>
                    <CardDescription>Répartition par tranche</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.gradeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" fontSize={12} />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [value, "Nombre d'élèves"]}
                          labelFormatter={(label) => `Notes: ${label}`}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top 5 élèves */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Meilleurs élèves
                    </CardTitle>
                    <CardDescription>Top 5 par moyenne</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.studentPerformances.slice(0, 5).map((student, index) => (
                        <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              #{index + 1}
                            </Badge>
                            <span className="font-medium">{student.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{student.average}/20</div>
                            <div className="text-xs text-muted-foreground">
                              {student.gradesCount} notes
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Répartition assiduité */}
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition de l'assiduité</CardTitle>
                    <CardDescription>30 derniers jours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics.attendanceStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {analytics.attendanceStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Élèves avec problèmes d'assiduité */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Assiduité à surveiller
                    </CardTitle>
                    <CardDescription>Taux de présence &lt; 80%</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.studentPerformances
                      .filter(s => s.attendanceRate < 80)
                      .length > 0 ? (
                      <div className="space-y-3">
                        {analytics.studentPerformances
                          .filter(s => s.attendanceRate < 80)
                          .sort((a, b) => a.attendanceRate - b.attendanceRate)
                          .map(student => (
                            <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                              <span className="font-medium">{student.name}</span>
                              <Badge variant="destructive">{student.attendanceRate}%</Badge>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun élève avec un problème d'assiduité
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performances individuelles</CardTitle>
                  <CardDescription>Vue d'ensemble de tous les élèves</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Rang</th>
                          <th className="text-left p-2">Élève</th>
                          <th className="text-center p-2">Moyenne</th>
                          <th className="text-center p-2">Nb. notes</th>
                          <th className="text-center p-2">Assiduité</th>
                          <th className="text-center p-2">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.studentPerformances.map((student, index) => (
                          <tr key={student.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2 font-medium">{student.name}</td>
                            <td className="p-2 text-center">
                              <Badge variant={student.average >= 10 ? "default" : "destructive"}>
                                {student.average}/20
                              </Badge>
                            </td>
                            <td className="p-2 text-center">{student.gradesCount}</td>
                            <td className="p-2 text-center">
                              <Badge variant={student.attendanceRate >= 80 ? "secondary" : "destructive"}>
                                {student.attendanceRate}%
                              </Badge>
                            </td>
                            <td className="p-2 text-center">
                              {student.average >= 10 && student.attendanceRate >= 80 ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-orange-500 mx-auto" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evolution" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution de la moyenne par trimestre</CardTitle>
                  <CardDescription>Progression au fil de l'année</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.periodAverages}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis domain={[0, 20]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="average" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Aucune donnée disponible pour cette classe</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
