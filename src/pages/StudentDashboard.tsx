import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, Clock, MessageSquare, TrendingUp, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useStudentDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Tableau de bord étudiant</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue, voici un aperçu de votre journée
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Today's Schedule */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/suivi")}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Aujourd'hui</CardTitle>
              <CardDescription>Prochain cours</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard?.nextCourse ? (
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">{dashboard.nextCourse.matiere?.nom}</p>
                  <p className="text-sm text-muted-foreground">
                    {dashboard.nextCourse.start_time.slice(0, 5)} - {dashboard.nextCourse.end_time.slice(0, 5)}
                  </p>
                  {dashboard.nextCourse.room && (
                    <Badge variant="secondary">Salle {dashboard.nextCourse.room}</Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun cours prévu</p>
              )}
            </CardContent>
          </Card>

          {/* Average Grade */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/suivi")}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-lg">Moyenne générale</CardTitle>
              <CardDescription>Ce trimestre</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {dashboard?.averageGrade?.toFixed(2) || "—"}
                  </span>
                  <span className="text-muted-foreground">/20</span>
                </div>
                {dashboard?.averageTrend && (
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">+{dashboard.averageTrend}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/suivi")}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle className="text-lg">Assiduité</CardTitle>
              <CardDescription>Ce mois-ci</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {dashboard?.attendanceRate?.toFixed(0) || "—"}
                  </span>
                  <span className="text-muted-foreground">%</span>
                </div>
                {dashboard?.absencesCount !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    {dashboard.absencesCount} absence{dashboard.absencesCount > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/suivi")}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Messages</CardTitle>
              <CardDescription>Non lus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {dashboard?.unreadMessages || 0}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {dashboard?.unreadMessages === 0
                    ? "Aucun nouveau message"
                    : `Message${dashboard?.unreadMessages > 1 ? "s" : ""} non lu${dashboard?.unreadMessages > 1 ? "s" : ""}`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accédez rapidement à vos modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/suivi")}>
                <Calendar className="w-6 h-6" />
                <span>Emploi du temps</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/suivi")}>
                <BookOpen className="w-6 h-6" />
                <span>Notes</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/suivi")}>
                <Clock className="w-6 h-6" />
                <span>Assiduité</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/suivi")}>
                <MessageSquare className="w-6 h-6" />
                <span>Messagerie</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;
