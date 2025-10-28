import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUsersList, useEtablissements } from "@/hooks/useAdmin";
import { useUserRole } from "@/hooks/useUserRole";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Search, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminUtilisateurs() {
  const { primaryRole } = useUserRole();
  const isAdminSysteme = primaryRole === 'ADMIN_SYSTEME';
  
  const [selectedRole, setSelectedRole] = useState<string>('ELEVE');
  const [selectedEtab, setSelectedEtab] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: etablissements } = useEtablissements();
  const { data: users, isLoading } = useUsersList(selectedRole, selectedEtab);

  const filteredUsers = users?.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roles = [
    { value: 'ELEVE', label: 'Élèves' },
    { value: 'ENSEIGNANT', label: 'Enseignants' },
    { value: 'PARENT', label: 'Parents' },
    { value: 'ADMIN_ECOLE', label: 'Admins école' },
  ];

  if (isAdminSysteme) {
    roles.push({ value: 'ADMIN_SYSTEME', label: 'Admins système' });
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">Gérez les élèves, enseignants, parents et admins</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Rôle</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAdminSysteme && (
              <div>
                <label className="text-sm font-medium">Établissement</label>
                <Select value={selectedEtab} onValueChange={setSelectedEtab}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous</SelectItem>
                    {etablissements?.map(etab => (
                      <SelectItem key={etab.id} value={etab.id}>
                        {etab.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom, prénom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {roles.find(r => r.value === selectedRole)?.label} ({filteredUsers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Établissement</TableHead>
                  {selectedRole === 'ELEVE' && <TableHead>Classe</TableHead>}
                  {selectedRole === 'ENSEIGNANT' && <TableHead>Matières</TableHead>}
                  {selectedRole === 'PARENT' && <TableHead>Enfants</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{user.phone || '—'}</div>
                    </TableCell>
                    <TableCell>{user.etablissement || '—'}</TableCell>
                    {selectedRole === 'ELEVE' && (
                      <TableCell>{user.classe?.nom || '—'}</TableCell>
                    )}
                    {selectedRole === 'ENSEIGNANT' && (
                      <TableCell>
                        {user.matieres?.join(', ') || '—'}
                      </TableCell>
                    )}
                    {selectedRole === 'PARENT' && (
                      <TableCell>{user.enfants_count || 0}</TableCell>
                    )}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Modifier</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucun utilisateur trouvé</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
