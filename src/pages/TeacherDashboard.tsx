import { useTeacherDashboard } from "@/hooks/useTeacher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, FileText, MessageSquare, ClipboardCheck, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TeacherDashboard() {
  const { data: dashboard, isLoading } = useTeacherDashboard();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tableau de bord Enseignant</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/app/teacher/assignments/new">
              <FileText className="mr-2 h-4 w-4" />
              Nouveau devoir
            </Link>
          </Button>
        </div>
      </div>

      {/* Workload Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devoirs en cours</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.workload.assignmentsOpen || 0}</div>
            <p className="text-xs text-muted-foreground">Devoirs actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À corriger</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.workload.submissionsToGrade || 0}</div>
            <p className="text-xs text-muted-foreground">Copies en attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages non lus</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.workload.messagesUnread || 0}</div>
            <p className="text-xs text-muted-foreground">Nouveaux messages</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Emploi du temps aujourd'hui
            </CardTitle>
            <CardDescription>Vos prochains cours</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard?.todaySchedule && dashboard.todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {dashboard.todaySchedule.map((session: any) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{session.matiere?.nom}</div>
                      <div className="text-sm text-muted-foreground">{session.classe?.nom}</div>
                      {session.room && (
                        <div className="text-xs text-muted-foreground">Salle: {session.room}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {session.start_time} - {session.end_time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Aucun cours prévu aujourd'hui</p>
            )}
            <Button asChild className="w-full mt-4" variant="outline">
              <Link to="/app/teacher/schedule">Voir l'emploi du temps complet</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Class Averages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Moyennes de classe
            </CardTitle>
            <CardDescription>Performance par matière</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard?.classAverages && dashboard.classAverages.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dashboard.classAverages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject_name" fontSize={12} />
                  <YAxis domain={[0, 20]} />
                  <Tooltip />
                  <Bar dataKey="average" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Aucune donnée disponible</p>
            )}
            <Button asChild className="w-full mt-4" variant="outline">
              <Link to="/app/teacher/grades">Gérer les notes</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Devoirs à venir
            </CardTitle>
            <CardDescription>Prochaines échéances</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard?.upcomingAssignments && dashboard.upcomingAssignments.length > 0 ? (
              <div className="space-y-3">
                {dashboard.upcomingAssignments.map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{assignment.titre}</div>
                      <div className="text-sm text-muted-foreground">
                        Échéance: {format(new Date(assignment.deadline), "PPP", { locale: fr })}
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/app/teacher/assignments/${assignment.id}`}>Voir</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Aucun devoir à venir
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
