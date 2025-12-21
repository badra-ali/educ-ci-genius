import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Download, Check, Smartphone, Wifi, Battery, Zap, 
  Bell, Shield, RefreshCw, Share2, MoreVertical, Plus
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installProgress, setInstallProgress] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deviceType, setDeviceType] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    // Détecter le type d'appareil
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType("ios");
    } else if (/android/.test(userAgent)) {
      setDeviceType("android");
    } else {
      setDeviceType("desktop");
    }

    // Vérifier si l'app est déjà installée
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Écouter le statut en ligne/hors-ligne
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Écouter l'installation réussie
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstalling(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    setIsInstalling(true);
    
    // Animation de progression
    const progressInterval = setInterval(() => {
      setInstallProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    clearInterval(progressInterval);

    if (outcome === "accepted") {
      setInstallProgress(100);
      setTimeout(() => {
        setIsInstalled(true);
        setIsInstalling(false);
      }, 500);
      setDeferredPrompt(null);
    } else {
      setInstallProgress(0);
      setIsInstalling(false);
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="w-full max-w-lg p-8 text-center shadow-elegant animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Application installée !</h1>
          <p className="text-muted-foreground mb-6">
            ÉDU.CI est maintenant installé sur votre appareil. Vous pouvez le lancer depuis votre écran d'accueil.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate("/dashboard")} className="w-full" size="lg">
              Accéder au tableau de bord
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Retour à l'accueil
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5"
      role="main"
      aria-label="Page d'installation de l'application"
    >
      <div className="max-w-4xl mx-auto py-8">
        {/* En-tête */}
        <Card className="p-8 shadow-elegant mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Badge variant="secondary" className="mb-2">PWA</Badge>
              <h1 className="text-3xl font-bold">Installer ÉDU.CI</h1>
            </div>
            {!isOnline && (
              <div 
                className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full"
                role="status"
                aria-live="polite"
              >
                <Wifi className="w-4 h-4" aria-hidden="true" />
                Mode hors-ligne
              </div>
            )}
          </div>

          <p className="text-lg text-muted-foreground mb-8">
            Installez l'application sur votre appareil pour une expérience optimale, même sans connexion internet.
          </p>

          {/* Bouton d'installation ou instructions */}
          {deferredPrompt ? (
            <div className="space-y-4">
              {isInstalling && (
                <div className="space-y-2" role="progressbar" aria-valuenow={installProgress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="flex justify-between text-sm">
                    <span>Installation en cours...</span>
                    <span>{installProgress}%</span>
                  </div>
                  <Progress value={installProgress} className="h-2" />
                </div>
              )}
              <Button 
                onClick={handleInstallClick} 
                size="lg" 
                className="w-full h-14 text-lg"
                disabled={isInstalling}
                aria-describedby="install-description"
              >
                <Download className="mr-2 h-5 w-5" aria-hidden="true" />
                {isInstalling ? "Installation..." : "Installer l'application"}
              </Button>
              <p id="install-description" className="text-sm text-muted-foreground text-center">
                L'installation prend quelques secondes et ne nécessite aucun téléchargement supplémentaire.
              </p>
            </div>
          ) : (
            <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" aria-hidden="true" />
                Instructions pour {deviceType === "ios" ? "iPhone/iPad" : deviceType === "android" ? "Android" : "ordinateur"}
              </h2>
              
              {deviceType === "ios" && (
                <ol className="space-y-3" aria-label="Instructions pour iOS">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</span>
                    <span>Appuyez sur le bouton <Share2 className="inline w-4 h-4" aria-label="Partager" /> en bas de l'écran</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</span>
                    <span>Faites défiler et appuyez sur <Plus className="inline w-4 h-4" aria-label="Ajouter" /> "Sur l'écran d'accueil"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</span>
                    <span>Appuyez sur "Ajouter" en haut à droite</span>
                  </li>
                </ol>
              )}

              {deviceType === "android" && (
                <ol className="space-y-3" aria-label="Instructions pour Android">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</span>
                    <span>Appuyez sur le menu <MoreVertical className="inline w-4 h-4" aria-label="Menu" /> en haut à droite</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</span>
                    <span>Sélectionnez "Installer l'application" ou "Ajouter à l'écran d'accueil"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</span>
                    <span>Confirmez l'installation</span>
                  </li>
                </ol>
              )}

              {deviceType === "desktop" && (
                <ol className="space-y-3" aria-label="Instructions pour ordinateur">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</span>
                    <span>Cliquez sur l'icône <Download className="inline w-4 h-4" /> dans la barre d'adresse</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</span>
                    <span>Ou utilisez le menu : "Installer ÉDU.CI"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</span>
                    <span>L'application s'ouvrira dans sa propre fenêtre</span>
                  </li>
                </ol>
              )}
            </Card>
          )}

          {/* Avantages */}
          <h2 className="text-xl font-semibold mb-4 mt-8">Pourquoi installer ?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-5 border-none bg-muted/50 hover:bg-muted transition-colors">
              <Smartphone className="w-8 h-8 text-primary mb-3" aria-hidden="true" />
              <h3 className="font-semibold mb-2">Accès instantané</h3>
              <p className="text-sm text-muted-foreground">
                Lancez l'app depuis votre écran d'accueil, comme une application native.
              </p>
            </Card>

            <Card className="p-5 border-none bg-muted/50 hover:bg-muted transition-colors">
              <Wifi className="w-8 h-8 text-primary mb-3" aria-hidden="true" />
              <h3 className="font-semibold mb-2">Mode hors-ligne</h3>
              <p className="text-sm text-muted-foreground">
                Consultez vos cours et devoirs même sans connexion internet.
              </p>
            </Card>

            <Card className="p-5 border-none bg-muted/50 hover:bg-muted transition-colors">
              <Zap className="w-8 h-8 text-primary mb-3" aria-hidden="true" />
              <h3 className="font-semibold mb-2">Ultra-rapide</h3>
              <p className="text-sm text-muted-foreground">
                Chargement instantané grâce au cache intelligent.
              </p>
            </Card>

            <Card className="p-5 border-none bg-muted/50 hover:bg-muted transition-colors">
              <Bell className="w-8 h-8 text-primary mb-3" aria-hidden="true" />
              <h3 className="font-semibold mb-2">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Recevez des alertes pour les devoirs et messages importants.
              </p>
            </Card>

            <Card className="p-5 border-none bg-muted/50 hover:bg-muted transition-colors">
              <RefreshCw className="w-8 h-8 text-primary mb-3" aria-hidden="true" />
              <h3 className="font-semibold mb-2">Mises à jour auto</h3>
              <p className="text-sm text-muted-foreground">
                L'application se met à jour automatiquement en arrière-plan.
              </p>
            </Card>

            <Card className="p-5 border-none bg-muted/50 hover:bg-muted transition-colors">
              <Shield className="w-8 h-8 text-primary mb-3" aria-hidden="true" />
              <h3 className="font-semibold mb-2">Sécurisé</h3>
              <p className="text-sm text-muted-foreground">
                Connexion HTTPS et données protégées localement.
              </p>
            </Card>
          </div>
        </Card>

        {/* Comparatif */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Application installée vs navigateur</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label="Comparaison des fonctionnalités">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 pr-4">Fonctionnalité</th>
                  <th className="text-center py-3 px-4">Navigateur</th>
                  <th className="text-center py-3 px-4 bg-primary/5">App installée</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 pr-4">Mode hors-ligne</td>
                  <td className="text-center py-3 px-4">Limité</td>
                  <td className="text-center py-3 px-4 bg-primary/5 font-medium text-green-600">✓ Complet</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 pr-4">Notifications push</td>
                  <td className="text-center py-3 px-4">Non</td>
                  <td className="text-center py-3 px-4 bg-primary/5 font-medium text-green-600">✓ Oui</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 pr-4">Plein écran</td>
                  <td className="text-center py-3 px-4">Non</td>
                  <td className="text-center py-3 px-4 bg-primary/5 font-medium text-green-600">✓ Oui</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 pr-4">Raccourcis rapides</td>
                  <td className="text-center py-3 px-4">Non</td>
                  <td className="text-center py-3 px-4 bg-primary/5 font-medium text-green-600">✓ Oui</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Espace de stockage</td>
                  <td className="text-center py-3 px-4">~5 Mo</td>
                  <td className="text-center py-3 px-4 bg-primary/5 font-medium">~5 Mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground">
            Continuer sans installer →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
