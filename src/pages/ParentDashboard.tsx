import { useState } from "react";
import { useChildren, useParentDashboard } from "@/hooks/useParent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, CheckCircle, MessageSquare, Mail, Loader2, Bell, AlertTriangle, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ParentDashboard() {
  const { data: children, isLoading: childrenLoading } = useChildren();
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [sendingReport, setSendingReport] = useState(false);
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [checkingAlerts, setCheckingAlerts] = useState(false);
  
  const { data: dashboard, isLoading: dashboardLoading } = useParentDashboard(selectedChild);

  // Request weekly report manually
  const handleRequestReport = async () => {
    setSendingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('parent-weekly-report');
      if (error) throw error;
      toast.success("Rapport envoyé ! Vérifiez votre boîte email.");
    } catch (error: any) {
      console.error("Error requesting report:", error);
      toast.error("Erreur lors de l'envoi du rapport. Veuillez réessayer.");
    } finally {
      setSendingReport(false);
    }
  };

  // Check proactive alerts
  const handleCheckAlerts = async () => {
    setCheckingAlerts(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('parent-proactive-alerts', {
        body: { parent_id: user?.id }
      });
      if (error) throw error;
      const alertCount = data?.results?.[0]?.alerts?.length || 0;
      if (alertCount > 0) {
        toast.warning(`${alertCount} alerte(s) détectée(s). Email envoyé !`);
      } else {
        toast.success("Aucune alerte détectée. Tout va bien !");
      }
    } catch (error: any) {
      console.error("Error checking alerts:", error);
      toast.error("Erreur lors de la vérification des alertes.");
    } finally {
      setCheckingAlerts(false);
    }
  };

  // Auto-select first child
  if (children && children.length > 0 && !selectedChild) {
    setSelectedChild(children[0].eleve_id);
  }

  const currentChild = children?.find((c: any) => c.eleve_id === selectedChild);

  if (childrenLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Aucun enfant associé</CardTitle>
            <CardDescription>
              Vous n'avez pas d'enfant associé à votre compte. Contactez l'administration.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tableau de bord Parent</h1>
        
        {children.length > 1 && (
          <div className="w-64">
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un enfant" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child: any) => (
                  <SelectItem key={child.eleve_id} value={child.eleve_id}>
                    {child.first_name} {child.last_name} - {child.classe_nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {currentChild && (
        <Card>
          <CardHeader>
            <CardTitle>
              {currentChild.first_name} {currentChild.last_name}
            </CardTitle>
            <CardDescription>
              Classe {currentChild.classe_nom} • {currentChild.relation}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {dashboardLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moyenne générale</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard?.averages?.general ? `${dashboard.averages.general}/20` : "-"}
                </div>
                <p className="text-xs text-muted-foreground">Trimestre en cours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assiduité</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard?.attendancePct ? `${dashboard.attendancePct}%` : "-"}
                </div>
                <p className="text-xs text-muted-foreground">30 derniers jours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cours aujourd'hui</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboard?.todaySchedule?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Séances restantes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.unreadMessages || 0}</div>
                <p className="text-xs text-muted-foreground">Non lus</p>
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
                <CardDescription>Prochains cours</CardDescription>
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
                          {session.room && (
                            <div className="text-sm text-muted-foreground">Salle: {session.room}</div>
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
                  <p className="text-muted-foreground text-center py-8">
                    Aucun cours prévu aujourd'hui
                  </p>
                )}
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link to={`/app/parent/schedule?child=${selectedChild}`}>
                    Voir l'emploi du temps complet
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Subject Averages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Moyennes par matière
                </CardTitle>
                <CardDescription>Performance académique</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.averages?.bySubject && dashboard.averages.bySubject.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.averages.bySubject.map((avg: any) => (
                      <div
                        key={avg.matiere_id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="font-medium">{avg.matiere_nom}</div>
                        <Badge variant={avg.average >= 10 ? "default" : "destructive"}>
                          {avg.average.toFixed(2)}/20
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune note disponible
                  </p>
                )}
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link to={`/app/parent/grades?child=${selectedChild}`}>
                    Voir toutes les notes
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button asChild variant="outline" className="h-20">
                  <Link to={`/app/parent/schedule?child=${selectedChild}`}>
                    <Calendar className="mr-2 h-5 w-5" />
                    Emploi du temps
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20">
                  <Link to={`/app/parent/grades?child=${selectedChild}`}>
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Notes & Bulletins
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20">
                  <Link to={`/app/parent/attendance?child=${selectedChild}`}>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Assiduité
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20">
                  <Link to="/app/parent/messages">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Messagerie
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Proactive Alerts Section */}
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle>Alertes proactives</CardTitle>
                  <CardDescription>
                    Soyez informé en cas de baisse de notes ou d'absences répétées
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="alerts-enabled" className="font-medium">
                      Alertes automatiques
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recevez des alertes par email et notification
                    </p>
                  </div>
                </div>
                <Switch
                  id="alerts-enabled"
                  checked={alertsEnabled}
                  onCheckedChange={setAlertsEnabled}
                />
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Vous serez alerté pour :</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-amber-500" />
                    Baisse significative de moyenne (&gt; 3 points)
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Notes très basses (&lt; 8/20)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-500" />
                    Absences non justifiées répétées
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    Retards fréquents
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handleCheckAlerts}
                disabled={checkingAlerts}
                variant="outline"
                className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
              >
                {checkingAlerts ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Vérifier les alertes maintenant
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Weekly Report Section */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Rapports hebdomadaires</CardTitle>
                  <CardDescription>
                    Recevez un résumé de la semaine par email chaque dimanche
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="weekly-report" className="font-medium">
                      Rapports automatiques
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recevez automatiquement un rapport chaque semaine
                    </p>
                  </div>
                </div>
                <Switch
                  id="weekly-report"
                  checked={weeklyReportEnabled}
                  onCheckedChange={setWeeklyReportEnabled}
                />
              </div>

              <Button 
                onClick={handleRequestReport}
                disabled={sendingReport}
                className="w-full"
              >
                {sendingReport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Recevoir le rapport maintenant
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
