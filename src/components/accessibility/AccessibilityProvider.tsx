import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: "normal" | "large" | "xlarge";
  screenReaderAnnouncements: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  announce: (message: string, priority?: "polite" | "assertive") => void;
}

const defaultSettings: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  fontSize: "normal",
  screenReaderAnnouncements: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const stored = localStorage.getItem("accessibility-settings");
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Détecter les préférences système
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersContrast = window.matchMedia("(prefers-contrast: more)");

    if (prefersReducedMotion.matches && !localStorage.getItem("accessibility-settings")) {
      setSettings((prev) => ({ ...prev, reducedMotion: true }));
    }

    if (prefersContrast.matches && !localStorage.getItem("accessibility-settings")) {
      setSettings((prev) => ({ ...prev, highContrast: true }));
    }

    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("accessibility-settings")) {
        setSettings((prev) => ({ ...prev, reducedMotion: e.matches }));
      }
    };

    prefersReducedMotion.addEventListener("change", handleMotionChange);
    return () => prefersReducedMotion.removeEventListener("change", handleMotionChange);
  }, []);

  // Appliquer les classes CSS
  useEffect(() => {
    const root = document.documentElement;

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // High contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Font size
    root.classList.remove("font-size-normal", "font-size-large", "font-size-xlarge");
    root.classList.add(`font-size-${settings.fontSize}`);

    // Sauvegarder
    localStorage.setItem("accessibility-settings", JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const announce = (message: string, priority: "polite" | "assertive" = "polite") => {
    if (!settings.screenReaderAnnouncements) return;

    const announcer = document.getElementById(`sr-announcer-${priority}`);
    if (announcer) {
      announcer.textContent = "";
      // Force reflow
      void announcer.offsetHeight;
      announcer.textContent = message;
    }
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, announce }}>
      {/* Régions ARIA pour les annonces */}
      <div
        id="sr-announcer-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        id="sr-announcer-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
