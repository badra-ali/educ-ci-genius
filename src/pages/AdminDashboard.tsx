import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminDashboard } from "@/hooks/useAdmin";
import { useUserRole } from "@/hooks/useUserRole";
import { Users, GraduationCap, School, TrendingUp, FileText, MessageSquare, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useAdminDashboard();
  const { primaryRole, isAdmin } = useUserRole();

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Accès refusé</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Élèves",
      value: dashboard?.studentsCount || 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Classes",
      value: dashboard?.classesCount || 0,
      icon: School,
      color: "text-purple-600",
    },
    {
      title: "Enseignants",
      value: dashboard?.teachersCount || 0,
      icon: GraduationCap,
      color: "text-green-600",
    },
    {
      title: "Assiduité",
      value: `${dashboard?.attendanceRate || 0}%`,
      icon: TrendingUp,
      color: "text-orange-600",
    },
    {
      title: "Notes saisies",
      value: dashboard?.gradesCount || 0,
      icon: FileText,
      color: "text-pink-600",
    },
    {
      title: "Bulletins publiés",
      value: dashboard?.publishedReports || 0,
      icon: FileText,
      color: "text-indigo-600",
    },
    {
      title: "Messages (7j)",
      value: dashboard?.messagesCount || 0,
      icon: MessageSquare,
      color: "text-cyan-600",
    },
    {
      title: "Justificatifs en attente",
      value: dashboard?.pendingJustifications || 0,
      icon: AlertCircle,
      color: "text-red-600",
    },
  ];

  const quickActions = [
    { label: "Gérer les utilisateurs", to: "/app/admin/utilisateurs", variant: "default" as const },
    { label: "Gérer les classes", to: "/app/admin/classes", variant: "secondary" as const },
    { label: "Emploi du temps", to: "/app/admin/emploi-du-temps", variant: "secondary" as const },
    { label: "Notes & Bulletins", to: "/app/admin/notes-bulletins", variant: "secondary" as const },
    { label: "Décider justificatifs", to: "/app/admin/assiduite", variant: "outline" as const },
    { label: "Paramètres", to: "/app/admin/parametres", variant: "outline" as const },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord Administration</h1>
        <p className="text-muted-foreground">
          {primaryRole === 'ADMIN_SYSTEME' ? 'Administration système' : 'Administration établissement'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Accédez rapidement aux fonctions principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map((action, idx) => (
              <Button key={idx} asChild variant={action.variant} className="w-full">
                <Link to={action.to}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertes */}
      {dashboard && dashboard.pendingJustifications > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>{dashboard.pendingJustifications}</strong> justificatif(s) d'absence en attente de décision
            </p>
            <Button asChild size="sm">
              <Link to="/app/admin/assiduite">Traiter les justificatifs</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
