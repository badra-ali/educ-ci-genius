import { useState } from "react";
import { useProfilesByRole, useParent } from "@/hooks/useRelations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

export function ParentRelations() {
  const [search, setSearch] = useState("");
  const [selectedParent, setSelectedParent] = useState<string | null>(null);

  const { data: parents, isLoading } = useProfilesByRole("PARENT");
  const { data: parentDetails } = useParent(selectedParent || undefined);

  const filteredParents = parents?.filter((p: any) =>
    p.profile?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.profile?.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Rechercher un parent..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Enfants</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Chargement...</TableCell>
            </TableRow>
          ) : (
            filteredParents?.map((parent: any) => (
              <TableRow key={parent.user_id}>
                <TableCell className="font-medium">{parent.profile?.last_name}</TableCell>
                <TableCell>{parent.profile?.first_name}</TableCell>
                <TableCell>{parent.profile?.phone || "-"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">-</Badge>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedParent(parent.user_id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {parent.profile?.first_name} {parent.profile?.last_name}
                        </DialogTitle>
                        <DialogDescription>Enfants et informations</DialogDescription>
                      </DialogHeader>
                      
                      {parentDetails && (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2">Enfants</h3>
                            <div className="space-y-2">
                              {parentDetails.enfants.map((e: any) => (
                                <div key={e.id} className="p-3 border rounded space-y-1">
                                  <p className="font-medium">
                                    {e.eleve?.first_name} {e.eleve?.last_name}
                                  </p>
                                  <div className="flex gap-2 text-sm">
                                    <Badge variant="outline">{e.lien_parente}</Badge>
                                    {e.classe && (
                                      <Badge variant="secondary">
                                        {e.classe[0]?.classe?.nom}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {parentDetails.enfants.length === 0 && (
                                <p className="text-sm text-muted-foreground">Aucun enfant lié</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
