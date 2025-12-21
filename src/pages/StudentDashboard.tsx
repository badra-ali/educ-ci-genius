import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, Clock, MessageSquare, TrendingUp, Library, Bot, GraduationCap, ArrowRight, Target, Award, Sparkles, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
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
      description: "Cours interactifs, QCM et devoirs",
      icon: GraduationCap,
      gradient: "from-primary/20 via-primary/10 to-transparent",
      iconBg: "bg-gradient-to-br from-primary to-primary/70",
      route: "/classe",
      badge: "Nouveau",
      stats: [
        { label: "Cours actifs", value: "12" },
        { label: "QCM à faire", value: "3" },
      ]
    },
    {
      title: "Suivi Scolaire",
      description: "Notes, emploi du temps et présence",
      icon: Calendar,
      gradient: "from-secondary/20 via-secondary/10 to-transparent",
      iconBg: "bg-gradient-to-br from-secondary to-secondary/70",
      route: "/suivi",
      stats: [
        { label: "Moyenne", value: dashboard?.averageGrade ? `${dashboard.averageGrade.toFixed(1)}/20` : "—" },
        { label: "Présence", value: dashboard?.attendanceRate ? `${dashboard.attendanceRate.toFixed(0)}%` : "—" },
      ]
    },
    {
      title: "Bibliothèque",
      description: "Milliers de ressources avec audio",
      icon: Library,
      gradient: "from-accent/20 via-accent/10 to-transparent",
      iconBg: "bg-gradient-to-br from-accent to-accent/70",
      route: "/bibliotheque",
      stats: [
        { label: "Ressources", value: "1000+" },
        { label: "Audio", value: "✓" },
      ]
    },
    {
      title: "Tuteur IA",
      description: "Assistant intelligent 24/7",
      icon: Bot,
      gradient: "from-purple-500/20 via-purple-400/10 to-transparent",
      iconBg: "bg-gradient-to-br from-purple-600 to-purple-500",
      route: "/tuteur-ia",
      badge: "IA",
      stats: [
        { label: "Disponible", value: "24/7" },
        { label: "Langues", value: "FR/EN" },
      ]
    },
  ];

  const getPerformanceMessage = () => {
    if (!dashboard?.averageGrade) return "Commencez votre parcours d'excellence";
    if (dashboard.averageGrade >= 16) return "Performance exceptionnelle ! 🏆";
    if (dashboard.averageGrade >= 14) return "Très bon travail ! Continuez ainsi 💪";
    if (dashboard.averageGrade >= 12) return "Bon travail ! Vous progressez 📈";
    if (dashboard.averageGrade >= 10) return "Continuez vos efforts 🎯";
    return "Restez motivé, vous pouvez réussir ! 💡";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Header */}
      <header className="relative border-b bg-gradient-to-r from-card via-card to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Votre Espace Étudiant
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <span>{getPerformanceMessage()}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {dashboard?.averageGrade && (
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Moyenne générale</p>
                    <p className="text-3xl font-bold text-primary">{dashboard.averageGrade.toFixed(1)}<span className="text-lg text-muted-foreground">/20</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Assiduité</p>
                    <p className="text-3xl font-bold text-secondary">{dashboard.attendanceRate?.toFixed(0) || 0}<span className="text-lg text-muted-foreground">%</span></p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 border-l pl-4 ml-2">
                <NotificationBell />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    supabase.auth.signOut();
                    navigate('/');
                  }}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Main Modules Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Vos Modules</h2>
            <Badge variant="secondary" className="text-xs">4 modules disponibles</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <Card
                  key={index}
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 overflow-hidden relative"
                  onClick={() => navigate(module.route)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-xl ${module.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      {module.badge && (
                        <Badge variant="secondary" className="text-xs">{module.badge}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{module.title}</CardTitle>
                    <CardDescription className="text-sm">{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="space-y-3 mb-4">
                      {module.stats.map((stat, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{stat.label}</span>
                          <span className="font-semibold text-foreground">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center text-xs text-primary font-medium group-hover:gap-2 transition-all">
                      <span>Accéder</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Stats with Visual Indicators */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Statistiques en Direct</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Next Course */}
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 overflow-hidden relative" onClick={() => navigate("/suivi")}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3 relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-base font-semibold">Prochain Cours</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                {dashboard?.nextCourse ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-foreground">{dashboard.nextCourse.matiere?.nom}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {dashboard.nextCourse.start_time.slice(0, 5)} - {dashboard.nextCourse.end_time.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    {dashboard.nextCourse.room && (
                      <Badge variant="secondary" className="text-xs">📍 Salle {dashboard.nextCourse.room}</Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun cours prévu aujourd'hui</p>
                )}
              </CardContent>
            </Card>

            {/* Average Grade with Progress */}
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-accent/30 overflow-hidden relative" onClick={() => navigate("/suivi")}>
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3 relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-base font-semibold">Moyenne Générale</CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">
                    {dashboard?.averageGrade?.toFixed(1) || "—"}
                  </span>
                  <span className="text-muted-foreground text-sm">/20</span>
                </div>
                {dashboard?.averageGrade && (
                  <div className="space-y-2">
                    <Progress value={(dashboard.averageGrade / 20) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {dashboard.averageGrade >= 16 ? "🏆 Excellent" :
                       dashboard.averageGrade >= 14 ? "⭐ Très bien" :
                       dashboard.averageGrade >= 12 ? "✨ Bien" :
                       dashboard.averageGrade >= 10 ? "👍 Satisfaisant" : "💪 En progression"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance with Visual Indicator */}
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary/30 overflow-hidden relative" onClick={() => navigate("/suivi")}>
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3 relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-base font-semibold">Assiduité</CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">
                    {dashboard?.attendanceRate?.toFixed(0) || "—"}
                  </span>
                  <span className="text-muted-foreground text-sm">%</span>
                </div>
                {dashboard?.attendanceRate !== undefined && (
                  <div className="space-y-2">
                    <Progress value={dashboard.attendanceRate} className="h-2" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {dashboard.absencesCount || 0} absence{(dashboard.absencesCount || 0) > 1 ? "s" : ""}
                      </span>
                      <span className={dashboard.attendanceRate >= 90 ? "text-green-600 font-medium" : "text-orange-600"}>
                        {dashboard.attendanceRate >= 90 ? "Excellent ✓" : "À améliorer"}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages with Badge */}
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 overflow-hidden relative" onClick={() => navigate("/suivi")}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3 relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform relative">
                  <MessageSquare className="w-6 h-6 text-white" />
                  {dashboard?.unreadMessages > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                      {dashboard.unreadMessages}
                    </div>
                  )}
                </div>
                <CardTitle className="text-base font-semibold">Messages</CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">
                    {dashboard?.unreadMessages || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboard?.unreadMessages === 0
                    ? "✓ Aucun nouveau message"
                    : `📬 Message${dashboard?.unreadMessages > 1 ? "s" : ""} non lu${dashboard?.unreadMessages > 1 ? "s" : ""}`}
                </p>
                {dashboard?.unreadMessages > 0 && (
                  <Badge variant="destructive" className="text-xs w-full justify-center">
                    Voir maintenant
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
