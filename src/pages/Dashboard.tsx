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
  User
} from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { primaryRole, loading: roleLoading } = useUserRole();

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
        <div className="grid gap-6 md:grid-cols-3 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prochains Cours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">3</p>
              <p className="text-sm text-muted-foreground">Cette semaine</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Devoirs en Attente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-accent">2</p>
              <p className="text-sm text-muted-foreground">À rendre</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">85%</p>
              <p className="text-sm text-muted-foreground">Ce trimestre</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
