import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Check, Smartphone, Wifi, Battery, Zap } from "lucide-react";
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

  useEffect(() => {
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

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
        <Card className="w-full max-w-lg p-8 text-center shadow-elegant">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Application installée !</h1>
          <p className="text-muted-foreground mb-6">
            educ-ci-genius est maintenant installé sur votre appareil. Vous pouvez le lancer depuis
            votre écran d'accueil.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            Accéder au tableau de bord
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 gradient-hero">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="p-8 shadow-elegant mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Installer l'application</h1>
            {!isOnline && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                <Wifi className="w-4 h-4" />
                Hors-ligne
              </div>
            )}
          </div>

          <p className="text-lg text-muted-foreground mb-8">
            Installez educ-ci-genius sur votre appareil pour bénéficier d'une expérience optimale
            avec accès hors-ligne.
          </p>

          {deferredPrompt ? (
            <Button onClick={handleInstallClick} size="lg" className="w-full mb-8">
              <Download className="mr-2 h-5 w-5" />
              {t("pwa.installButton")}
            </Button>
          ) : (
            <Card className="p-4 mb-8 bg-muted border-none">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Sur mobile :</strong> Utilisez le menu de votre navigateur (⋮ ou
                Partager) puis sélectionnez "Ajouter à l'écran d'accueil" ou "Installer
                l'application".
              </p>
            </Card>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6 border-none bg-muted">
              <Smartphone className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Accès rapide</h3>
              <p className="text-sm text-muted-foreground">
                Lancez l'app depuis votre écran d'accueil comme une application native.
              </p>
            </Card>

            <Card className="p-6 border-none bg-muted">
              <Wifi className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Mode hors-ligne</h3>
              <p className="text-sm text-muted-foreground">
                Consultez vos cours et devoirs même sans connexion internet.
              </p>
            </Card>

            <Card className="p-6 border-none bg-muted">
              <Zap className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Ultra-rapide</h3>
              <p className="text-sm text-muted-foreground">
                Chargement instantané grâce au cache intelligent.
              </p>
            </Card>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions d'installation</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Sur Android (Chrome)
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-7">
                <li>Appuyez sur le menu (⋮) en haut à droite</li>
                <li>Sélectionnez "Installer l'application" ou "Ajouter à l'écran d'accueil"</li>
                <li>Confirmez l'installation</li>
                <li>L'icône apparaîtra sur votre écran d'accueil</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Sur iPhone/iPad (Safari)
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-7">
                <li>Appuyez sur le bouton Partager (carré avec flèche)</li>
                <li>Faites défiler et sélectionnez "Sur l'écran d'accueil"</li>
                <li>Personnalisez le nom si souhaité</li>
                <li>Appuyez sur "Ajouter"</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Battery className="w-5 h-5 text-primary" />
                Sur ordinateur
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-7">
                <li>Cliquez sur l'icône d'installation dans la barre d'adresse (Chrome/Edge)</li>
                <li>Ou utilisez le menu : Plus d'outils → Créer un raccourci</li>
                <li>Cochez "Ouvrir dans une fenêtre" pour une expérience app</li>
              </ol>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => navigate("/")}>
            Continuer sans installer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
