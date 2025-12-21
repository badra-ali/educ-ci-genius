import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accessibility, Eye, Type, Pause, Volume2 } from "lucide-react";
import { useAccessibility } from "./AccessibilityProvider";

export function AccessibilityMenu() {
  const { settings, updateSetting, announce } = useAccessibility();
  const [open, setOpen] = useState(false);

  const handleSettingChange = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K],
    announcement: string
  ) => {
    updateSetting(key, value);
    announce(announcement);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Ouvrir le menu d'accessibilité"
          title="Accessibilité"
        >
          <Accessibility className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibilité
          </SheetTitle>
          <SheetDescription>
            Personnalisez l'interface pour une meilleure expérience
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contraste élevé */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <div>
                <Label htmlFor="high-contrast" className="font-medium">
                  Contraste élevé
                </Label>
                <p className="text-sm text-muted-foreground">
                  Améliore la lisibilité avec des couleurs plus contrastées
                </p>
              </div>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={(checked) =>
                handleSettingChange(
                  "highContrast",
                  checked,
                  checked ? "Contraste élevé activé" : "Contraste élevé désactivé"
                )
              }
              aria-describedby="high-contrast-desc"
            />
          </div>

          {/* Réduction des animations */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pause className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <div>
                <Label htmlFor="reduced-motion" className="font-medium">
                  Réduire les animations
                </Label>
                <p className="text-sm text-muted-foreground">
                  Désactive les animations et transitions
                </p>
              </div>
            </div>
            <Switch
              id="reduced-motion"
              checked={settings.reducedMotion}
              onCheckedChange={(checked) =>
                handleSettingChange(
                  "reducedMotion",
                  checked,
                  checked ? "Animations réduites" : "Animations activées"
                )
              }
            />
          </div>

          {/* Annonces lecteur d'écran */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <div>
                <Label htmlFor="sr-announcements" className="font-medium">
                  Annonces vocales
                </Label>
                <p className="text-sm text-muted-foreground">
                  Annonces pour les lecteurs d'écran
                </p>
              </div>
            </div>
            <Switch
              id="sr-announcements"
              checked={settings.screenReaderAnnouncements}
              onCheckedChange={(checked) =>
                updateSetting("screenReaderAnnouncements", checked)
              }
            />
          </div>

          {/* Taille de police */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Type className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <Label className="font-medium">Taille du texte</Label>
            </div>
            <RadioGroup
              value={settings.fontSize}
              onValueChange={(value) =>
                handleSettingChange(
                  "fontSize",
                  value as "normal" | "large" | "xlarge",
                  `Taille du texte: ${
                    value === "normal" ? "normale" : value === "large" ? "grande" : "très grande"
                  }`
                )
              }
              className="grid grid-cols-3 gap-3"
            >
              <div>
                <RadioGroupItem value="normal" id="font-normal" className="peer sr-only" />
                <Label
                  htmlFor="font-normal"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-sm">Aa</span>
                  <span className="text-xs text-muted-foreground">Normal</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="large" id="font-large" className="peer sr-only" />
                <Label
                  htmlFor="font-large"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-base">Aa</span>
                  <span className="text-xs text-muted-foreground">Grand</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="xlarge" id="font-xlarge" className="peer sr-only" />
                <Label
                  htmlFor="font-xlarge"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-lg">Aa</span>
                  <span className="text-xs text-muted-foreground">Très grand</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Aide */}
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Raccourcis clavier</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <kbd className="px-1 py-0.5 bg-background rounded text-xs">Tab</kbd> - Navigation entre éléments
              </li>
              <li>
                <kbd className="px-1 py-0.5 bg-background rounded text-xs">Entrée</kbd> - Activer un élément
              </li>
              <li>
                <kbd className="px-1 py-0.5 bg-background rounded text-xs">Échap</kbd> - Fermer les dialogues
              </li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
