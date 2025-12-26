import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, UserPlus, Loader2, User } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  classe_nom: string;
  classe_niveau: string;
}

export function LinkChildDialog() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [relation, setRelation] = useState("père");
  const queryClient = useQueryClient();

  // Search students
  const { data: students, isLoading } = useQuery({
    queryKey: ["students-search", search],
    queryFn: async () => {
      if (search.length < 2) return [];
      
      const { data, error } = await supabase
        .from("students_view")
        .select("id, first_name, last_name, classe_nom, classe_niveau")
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
        .limit(10);

      if (error) throw error;
      return data as Student[];
    },
    enabled: search.length >= 2,
  });

  // Link child mutation
  const linkChild = useMutation({
    mutationFn: async () => {
      if (!selectedStudent) throw new Error("Aucun élève sélectionné");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase.from("parent_eleves").insert({
        parent_id: user.id,
        eleve_id: selectedStudent.id,
        lien_parente: relation,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Cet enfant est déjà associé à votre compte");
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Enfant associé avec succès !");
      queryClient.invalidateQueries({ queryKey: ["parent-children"] });
      setOpen(false);
      setSearch("");
      setSelectedStudent(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Associer mon enfant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Associer un enfant</DialogTitle>
          <DialogDescription>
            Recherchez votre enfant par son nom ou prénom pour l'associer à votre compte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search input */}
          <div className="space-y-2">
            <Label htmlFor="search">Rechercher un élève</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nom ou prénom de l'élève..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {search.length > 0 && search.length < 2 && (
              <p className="text-xs text-muted-foreground">
                Entrez au moins 2 caractères pour rechercher
              </p>
            )}
          </div>

          {/* Search results */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {students && students.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <Label>Résultats de recherche</Label>
              {students.map((student) => (
                <Card
                  key={student.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedStudent?.id === student.id
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {student.classe_niveau} - {student.classe_nom}
                      </div>
                    </div>
                    {selectedStudent?.id === student.id && (
                      <div className="text-primary text-sm font-medium">
                        Sélectionné
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {students && students.length === 0 && search.length >= 2 && (
            <p className="text-center text-muted-foreground py-4">
              Aucun élève trouvé pour "{search}"
            </p>
          )}

          {/* Selected student & relation */}
          {selectedStudent && (
            <div className="space-y-4 pt-4 border-t">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium">
                  Élève sélectionné: {selectedStudent.first_name} {selectedStudent.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedStudent.classe_niveau} - {selectedStudent.classe_nom}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relation">Lien de parenté</Label>
                <Select value={relation} onValueChange={setRelation}>
                  <SelectTrigger id="relation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="père">Père</SelectItem>
                    <SelectItem value="mère">Mère</SelectItem>
                    <SelectItem value="tuteur">Tuteur légal</SelectItem>
                    <SelectItem value="tutrice">Tutrice légale</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => linkChild.mutate()}
            disabled={!selectedStudent || linkChild.isPending}
          >
            {linkChild.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Association...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Associer cet enfant
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
