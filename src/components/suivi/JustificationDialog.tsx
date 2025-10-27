import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JustificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId: string;
  onSuccess: () => void;
}

export const JustificationDialog = ({ open, onOpenChange, attendanceId, onSuccess }: JustificationDialogProps) => {
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!reason && !file) {
      toast.error("Veuillez fournir une raison ou un justificatif");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('attendance_id', attendanceId);
      formData.append('reason', reason);
      if (file) {
        formData.append('file', file);
      }

      const { data, error } = await supabase.functions.invoke('attendance-justify', {
        body: formData,
      });

      if (error) throw error;

      toast.success("Justificatif envoyé avec succès");
      onSuccess();
      onOpenChange(false);
      setReason("");
      setFile(null);
    } catch (error) {
      console.error('Error submitting justification:', error);
      toast.error("Erreur lors de l'envoi du justificatif");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Justifier l'absence</DialogTitle>
          <DialogDescription>
            Fournissez une explication et/ou un document justificatif
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Raison de l'absence</Label>
            <Textarea
              id="reason"
              placeholder="Expliquez la raison de votre absence..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reason.length}/200 caractères
            </p>
          </div>

          <div>
            <Label htmlFor="file">Document justificatif (optionnel)</Label>
            <Input
              id="file"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <p className="text-xs text-muted-foreground mt-1">
                {file.name} ({(file.size / 1024).toFixed(0)} Ko)
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Envoyer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};