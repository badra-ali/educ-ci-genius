import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, Clock, MessageSquare, TrendingUp, Library, Bot, GraduationCap } from "lucide-react";
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

  const modules = [
    {
      title: "Classe Virtuelle",
      description: "Cours, QCM et devoirs en ligne",
      icon: GraduationCap,
      color: "text-primary",
      bgColor: "bg-primary/10",
      route: "/liste-cours",
      stats: [
        { label: "Cours", value: "Disponibles" },
        { label: "QCM", value: "Interactifs" },
      ]
    },
    {
      title: "Suivi Scolaire",
      description: "Notes, emploi du temps et assiduité",
      icon: Calendar,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      route: "/suivi",
      stats: [
        { label: "Moyenne", value: dashboard?.averageGrade ? `${dashboard.averageGrade.toFixed(1)}/20` : "—" },
        { label: "Présence", value: dashboard?.attendanceRate ? `${dashboard.attendanceRate.toFixed(0)}%` : "—" },
      ]
    },
    {
      title: "Bibliothèque Numérique",
      description: "Ressources pédagogiques avec audio",
      icon: Library,
      color: "text-accent",
      bgColor: "bg-accent/10",
      route: "/bibliotheque",
      stats: [
        { label: "Ressources", value: "1000+" },
        { label: "Lecture audio", value: "Disponible" },
      ]
    },
    {
      title: "Tuteur IA",
      description: "Assistant intelligent personnalisé",
      icon: Bot,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-950",
      route: "/tuteur-ia",
      stats: [
        { label: "Disponible", value: "24/7" },
        { label: "Multilingue", value: "Oui" },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Tableau de bord étudiant</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue, accédez à vos 4 modules éducatifs
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Main Modules Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Vos modules</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-2"
                  onClick={() => navigate(module.route)}
                >
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl ${module.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`w-7 h-7 ${module.color}`} />
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="text-sm">{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {module.stats.map((stat, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{stat.label}</span>
                          <span className="font-semibold">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Overview Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Aperçu rapide</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Today's Schedule */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/suivi")}>
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base">Prochain cours</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.nextCourse ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">{dashboard.nextCourse.matiere?.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.nextCourse.start_time.slice(0, 5)} - {dashboard.nextCourse.end_time.slice(0, 5)}
                    </p>
                    {dashboard.nextCourse.room && (
                      <Badge variant="secondary" className="text-xs">Salle {dashboard.nextCourse.room}</Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun cours prévu</p>
                )}
              </CardContent>
            </Card>

            {/* Average Grade */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/suivi")}>
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <CardTitle className="text-base">Moyenne générale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {dashboard?.averageGrade?.toFixed(2) || "—"}
                    </span>
                    <span className="text-muted-foreground text-sm">/20</span>
                  </div>
                  {dashboard?.averageTrend && (
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-green-500">+{dashboard.averageTrend}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attendance */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/suivi")}>
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-secondary" />
                </div>
                <CardTitle className="text-base">Assiduité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {dashboard?.attendanceRate?.toFixed(0) || "—"}
                    </span>
                    <span className="text-muted-foreground text-sm">%</span>
                  </div>
                  {dashboard?.absencesCount !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {dashboard.absencesCount} absence{dashboard.absencesCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/suivi")}>
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base">Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {dashboard?.unreadMessages || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboard?.unreadMessages === 0
                      ? "Aucun nouveau message"
                      : `Non lu${dashboard?.unreadMessages > 1 ? "s" : ""}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
