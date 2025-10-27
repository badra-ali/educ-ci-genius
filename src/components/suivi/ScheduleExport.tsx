import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export const ScheduleExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportICS = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-schedule-ics', {
        method: 'GET',
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'emploi-du-temps.ics';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Emploi du temps exporté", {
        description: "Le fichier ICS a été téléchargé avec succès",
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error("Erreur d'export", {
        description: error.message || "Impossible d'exporter l'emploi du temps",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExportICS} 
      disabled={isExporting}
      variant="outline"
      size="sm"
    >
      <Download className="w-4 h-4 mr-2" />
      {isExporting ? "Export en cours..." : "Exporter (.ics)"}
    </Button>
  );
};
