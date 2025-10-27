import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WifiOff, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";

export const OfflineIndicator = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showAlert && isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert variant={isOnline ? "default" : "destructive"}>
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <AlertTitle>
          {isOnline ? "Connexion rétablie" : t("pwa.offlineTitle")}
        </AlertTitle>
        <AlertDescription>
          {isOnline
            ? "Vous êtes de nouveau en ligne."
            : t("pwa.offlineDescription")}
        </AlertDescription>
      </Alert>
    </div>
  );
};
