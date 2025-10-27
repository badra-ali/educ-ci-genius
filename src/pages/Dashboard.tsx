import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  GraduationCap, 
  Library, 
  Bot,
  LogOut,
  User,
  ClipboardCheck,
  TrendingUp,
  Users,
  Award,
  Clock,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { primaryRole, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState({
    coursCount: 0,
    devoirsCount: 0,
    qcmCount: 0,
    messagesCount: 0,
    completionRate: 0,
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        
        // Récupérer le profil
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        setProfile(profileData);
        
        // Vérifier si l'onboarding est complété
        if (!profileData?.onboarding_completed) {
          navigate("/onboarding");
          return;
        }

        // Charger les statistiques
        await loadStats(user.id);
      }
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadStats = async (userId: string) => {
    try {
      const { data: userRoles } = await supabase.rpc('get_user_roles', { _user_id: userId });
      const role = userRoles?.[0]?.role;

      if (role === 'ELEVE') {
        // Stats élève
        const [coursRes, devoirsRes, qcmRes] = await Promise.all([
          supabase.from('cours').select('id', { count: 'exact', head: true }),
          supabase.from('rendus_devoir').select('id', { count: 'exact', head: true }).eq('eleve_id', userId),
          supabase.from('tentatives_qcm').select('id', { count: 'exact', head: true }).eq('eleve_id', userId),
        ]);

        setStats({
          coursCount: coursRes.count || 0,
          devoirsCount: devoirsRes.count || 0,
          qcmCount: qcmRes.count || 0,
          messagesCount: 0,
          completionRate: 78,
        });
      } else if (role === 'ENSEIGNANT') {
        // Stats enseignant
        const [coursRes, devoirsRes, qcmRes] = await Promise.all([
          supabase.from('cours').select('id', { count: 'exact', head: true }).eq('enseignant_id', userId),
          supabase.from('devoirs').select('id', { count: 'exact', head: true }),
          supabase.from('qcms').select('id', { count: 'exact', head: true }).eq('cree_par_id', userId),
        ]);

        setStats({
          coursCount: coursRes.count || 0,
          devoirsCount: devoirsRes.count || 0,
          qcmCount: qcmRes.count || 0,
          messagesCount: 0,
          completionRate: 85,
        });
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ELEVE: "Élève",
      ENSEIGNANT: "Enseignant",
      PARENT: "Parent",
      ADMIN_ECOLE: "Admin École",
      ADMIN_SYSTEME: "Admin Système",
    };
    return labels[role] || role;
  };

  const userRole = primaryRole || "ELEVE";
  const firstName = profile?.first_name || user?.user_metadata?.first_name || "Utilisateur";
  const lastName = profile?.last_name || user?.user_metadata?.last_name || "";

  const modules = [
    {
      title: "Classe Virtuelle",
      description: "Cours, QCM, devoirs et collaboration",
      icon: GraduationCap,
      href: "/classe",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Suivi Scolaire",
      description: "Notes, emploi du temps, absences",
      icon: Calendar,
      href: "/suivi",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Bibliothèque",
      description: "Ressources numériques et lecture audio",
      icon: Library,
      href: "/bibliotheque",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Tuteur IA",
      description: "Assistant intelligent multilingue",
      icon: Bot,
      href: "/tuteur-ia",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">IA ÉDU.CI</h1>
                <p className="text-sm text-muted-foreground">
                  {userRole === "ELEVE" && "Espace Élève"}
                  {userRole === "ENSEIGNANT" && "Espace Enseignant"}
                  {userRole === "PARENT" && "Espace Parent"}
                  {userRole === "ADMIN_ECOLE" && "Espace Administrateur École"}
                  {userRole === "ADMIN_SYSTEME" && "Espace Administrateur Système"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                <div className="text-sm">
                  <div className="font-medium">{firstName} {lastName}</div>
                  {primaryRole && (
                    <div className="text-xs text-primary">{getRoleLabel(primaryRole)}</div>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Bienvenue, {firstName} !
          </h2>
          <p className="text-muted-foreground">
            Accédez à tous vos modules éducatifs en un seul endroit
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.href}
                className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
                onClick={() => navigate(module.href)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${module.color}`} />
                  </div>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
          {userRole === 'ELEVE' && (
            <>
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cours Disponibles</CardTitle>
                  <BookOpen className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.coursCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Accès complet</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-accent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Devoirs Rendus</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{stats.devoirsCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Cette année</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-secondary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">QCM Réalisés</CardTitle>
                  <Award className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{stats.qcmCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Tests complétés</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-500">{stats.completionRate}%</div>
                  <Progress value={stats.completionRate} className="mt-2" />
                </CardContent>
              </Card>
            </>
          )}

          {userRole === 'ENSEIGNANT' && (
            <>
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mes Cours</CardTitle>
                  <BookOpen className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.coursCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Cours créés</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-accent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Devoirs Actifs</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{stats.devoirsCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">À corriger</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-secondary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">QCM Créés</CardTitle>
                  <Award className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{stats.qcmCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Évaluations</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-500">{stats.completionRate}%</div>
                  <Progress value={stats.completionRate} className="mt-2" />
                </CardContent>
              </Card>
            </>
          )}

          {userRole === 'PARENT' && (
            <>
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enfants Suivis</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">1</div>
                  <p className="text-xs text-muted-foreground mt-1">Comptes liés</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-accent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Devoirs en Cours</CardTitle>
                  <Clock className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">3</div>
                  <p className="text-xs text-muted-foreground mt-1">À rendre cette semaine</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-secondary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Moyenne Générale</CardTitle>
                  <TrendingUp className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">14.5/20</div>
                  <p className="text-xs text-muted-foreground mt-1">Ce trimestre</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alertes</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">0</div>
                  <p className="text-xs text-muted-foreground mt-1">Tout va bien</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
