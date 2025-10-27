import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { GraduationCap, Building2, Users, BookOpen, Loader2, Search, Plus } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Onboarding = () => {
  const navigate = useNavigate();
  const { primaryRole, loading: roleLoading } = useUserRole();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Données des formulaires
  const [phone, setPhone] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [selectedEtablissement, setSelectedEtablissement] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedMatieres, setSelectedMatieres] = useState<string[]>([]);
  const [selectedEleve, setSelectedEleve] = useState("");
  const [lienParente, setLienParente] = useState("");
  const [openEleveCombobox, setOpenEleveCombobox] = useState(false);
  const [openAddEleveDialog, setOpenAddEleveDialog] = useState(false);
  const [newEleveData, setNewEleveData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dateNaissance: "",
  });
  
  // Listes de données
  const [etablissements, setEtablissements] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [eleves, setEleves] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
    fetchEtablissements();
  }, []);

  useEffect(() => {
    if (selectedEtablissement) {
      fetchClasses();
      fetchMatieres();
      if (primaryRole === 'PARENT') {
        fetchEleves();
      }
    }
  }, [selectedEtablissement, primaryRole]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    
    // Vérifier si l'onboarding est déjà complété
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();
      
    if (profile?.onboarding_completed) {
      navigate("/dashboard");
    }
  };

  const fetchEtablissements = async () => {
    const { data, error } = await supabase
      .from("etablissements")
      .select("*")
      .eq("actif", true)
      .order("nom");
    
    if (error) {
      console.error("Erreur chargement établissements:", error);
      toast.error("Erreur de chargement des établissements");
      return;
    }
    setEtablissements(data || []);
  };

  const fetchClasses = async () => {
    if (!selectedEtablissement) return;
    
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("etablissement_id", selectedEtablissement)
      .eq("actif", true)
      .order("niveau, nom");
    
    if (error) {
      console.error("Erreur chargement classes:", error);
      return;
    }
    setClasses(data || []);
  };

  const fetchMatieres = async () => {
    if (!selectedEtablissement) return;
    
    const { data, error } = await supabase
      .from("matieres")
      .select("*")
      .eq("etablissement_id", selectedEtablissement)
      .eq("actif", true)
      .order("nom");
    
    if (error) {
      console.error("Erreur chargement matières:", error);
      return;
    }
    setMatieres(data || []);
  };

  const fetchEleves = async () => {
    if (!selectedEtablissement) return;
    
    const { data, error } = await supabase
      .from("eleve_classes")
      .select(`
        user_id,
        profiles!inner(id, first_name, last_name)
      `)
      .eq("actif", true);
    
    if (error) {
      console.error("Erreur chargement élèves:", error);
      return;
    }
    
    // Extraire les élèves uniques
    const uniqueEleves = data?.reduce((acc: any[], curr: any) => {
      if (!acc.find(e => e.id === curr.user_id)) {
        acc.push({
          id: curr.user_id,
          first_name: curr.profiles.first_name,
          last_name: curr.profiles.last_name,
        });
      }
      return acc;
    }, []);
    
    setEleves(uniqueEleves || []);
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !dateNaissance) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        phone,
        date_naissance: dateNaissance,
      })
      .eq("id", user.id);
    
    setLoading(false);
    
    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }
    
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEtablissement) {
      toast.error("Veuillez sélectionner un établissement");
      return;
    }
    
    setLoading(true);
    
    try {
      // Mettre à jour l'établissement dans user_roles via la fonction RPC
      const { error } = await supabase.rpc('update_user_etablissement', {
        _user_id: user.id,
        _etablissement_id: selectedEtablissement
      });
      
      if (error) throw error;
      
      setStep(3);
    } catch (error: any) {
      console.error("Erreur mise à jour établissement:", error);
      toast.error("Erreur lors de la mise à jour de l'établissement");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEleve = async () => {
    if (!newEleveData.firstName || !newEleveData.lastName || !newEleveData.email || !newEleveData.password) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      // Créer le compte de l'élève
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: newEleveData.email,
        password: newEleveData.password,
        options: {
          data: {
            first_name: newEleveData.firstName,
            last_name: newEleveData.lastName,
            role: 'ELEVE'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error("Erreur lors de la création du compte");
      }

      // Mettre à jour le profil avec la date de naissance si fournie
      if (newEleveData.dateNaissance) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ date_naissance: newEleveData.dateNaissance })
          .eq("id", authData.user.id);
        
        if (profileError) console.error("Erreur mise à jour date naissance:", profileError);
      }

      // Ajouter l'élève à la liste
      const newEleve = {
        id: authData.user.id,
        first_name: newEleveData.firstName,
        last_name: newEleveData.lastName,
      };
      setEleves([...eleves, newEleve]);
      setSelectedEleve(authData.user.id);
      
      toast.success("Élève ajouté avec succès");
      setOpenAddEleveDialog(false);
      setNewEleveData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        dateNaissance: "",
      });
    } catch (error: any) {
      console.error("Erreur création élève:", error);
      toast.error(error.message || "Erreur lors de la création de l'élève");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Logique différente selon le rôle
      if (primaryRole === 'ELEVE') {
        if (selectedClasses.length === 0) {
          toast.error("Veuillez sélectionner au moins une classe");
          setLoading(false);
          return;
        }
        
        // Inscrire l'élève aux classes
        const inscriptions = selectedClasses.map(classeId => ({
          user_id: user.id,
          classe_id: classeId,
        }));
        
        const { error } = await supabase
          .from("eleve_classes")
          .insert(inscriptions);
        
        if (error) throw error;
        
      } else if (primaryRole === 'ENSEIGNANT') {
        if (selectedMatieres.length === 0) {
          toast.error("Veuillez sélectionner au moins une matière");
          setLoading(false);
          return;
        }
        
        // Affecter l'enseignant aux matières
        const affectations = selectedMatieres.map(matiereId => ({
          user_id: user.id,
          matiere_id: matiereId,
        }));
        
        const { error } = await supabase
          .from("enseignant_matieres")
          .insert(affectations);
        
        if (error) throw error;
        
      } else if (primaryRole === 'PARENT') {
        if (!selectedEleve || !lienParente) {
          toast.error("Veuillez sélectionner un élève et préciser le lien de parenté");
          setLoading(false);
          return;
        }
        
        // Lier le parent à l'élève
        const { error } = await supabase
          .from("parent_eleves")
          .insert({
            parent_id: user.id,
            eleve_id: selectedEleve,
            lien_parente: lienParente,
          });
        
        if (error) throw error;
      }
      
      // Marquer l'onboarding comme complété
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
      
      if (profileError) throw profileError;
      
      toast.success("Configuration terminée !");
      navigate("/dashboard");
      
    } catch (error: any) {
      console.error("Erreur onboarding:", error);
      toast.error("Erreur lors de la configuration");
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Configuration du compte</CardTitle>
              <CardDescription>Étape {step} sur 3</CardDescription>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+225 XX XX XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateNaissance">Date de naissance</Label>
                <Input
                  id="dateNaissance"
                  type="date"
                  value={dateNaissance}
                  onChange={(e) => setDateNaissance(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continuer"}
              </Button>
            </form>
          )}
          
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="etablissement">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Sélectionnez votre établissement
                </Label>
                <Select value={selectedEtablissement} onValueChange={setSelectedEtablissement}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    {etablissements.map((etab) => (
                      <SelectItem key={etab.id} value={etab.id}>
                        {etab.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Retour
                </Button>
                <Button type="submit" className="flex-1">
                  Continuer
                </Button>
              </div>
            </form>
          )}
          
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              {primaryRole === 'ELEVE' && (
                <div className="space-y-2">
                  <Label>
                    <Users className="w-4 h-4 inline mr-2" />
                    Sélectionnez votre/vos classe(s)
                  </Label>
                  <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                    {classes.map((classe) => (
                      <div key={classe.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={classe.id}
                          checked={selectedClasses.includes(classe.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedClasses([...selectedClasses, classe.id]);
                            } else {
                              setSelectedClasses(selectedClasses.filter(id => id !== classe.id));
                            }
                          }}
                        />
                        <label htmlFor={classe.id} className="text-sm cursor-pointer">
                          {classe.niveau} - {classe.nom}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {primaryRole === 'ENSEIGNANT' && (
                <div className="space-y-2">
                  <Label>
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Sélectionnez vos matières
                  </Label>
                  <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                    {matieres.map((matiere) => (
                      <div key={matiere.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={matiere.id}
                          checked={selectedMatieres.includes(matiere.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMatieres([...selectedMatieres, matiere.id]);
                            } else {
                              setSelectedMatieres(selectedMatieres.filter(id => id !== matiere.id));
                            }
                          }}
                        />
                        <label htmlFor={matiere.id} className="text-sm cursor-pointer">
                          {matiere.nom} ({matiere.niveau})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {primaryRole === 'PARENT' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="eleve">Sélectionnez votre enfant</Label>
                      <Dialog open={openAddEleveDialog} onOpenChange={setOpenAddEleveDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" type="button">
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter un élève
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Créer un compte élève</DialogTitle>
                            <DialogDescription>
                              Si votre enfant n'a pas encore de compte, créez-le ici.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="newFirstName">Prénom *</Label>
                              <Input
                                id="newFirstName"
                                value={newEleveData.firstName}
                                onChange={(e) => setNewEleveData({...newEleveData, firstName: e.target.value})}
                                placeholder="Prénom de l'élève"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newLastName">Nom *</Label>
                              <Input
                                id="newLastName"
                                value={newEleveData.lastName}
                                onChange={(e) => setNewEleveData({...newEleveData, lastName: e.target.value})}
                                placeholder="Nom de l'élève"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newEmail">Email *</Label>
                              <Input
                                id="newEmail"
                                type="email"
                                value={newEleveData.email}
                                onChange={(e) => setNewEleveData({...newEleveData, email: e.target.value})}
                                placeholder="email@exemple.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newPassword">Mot de passe *</Label>
                              <Input
                                id="newPassword"
                                type="password"
                                value={newEleveData.password}
                                onChange={(e) => setNewEleveData({...newEleveData, password: e.target.value})}
                                placeholder="Minimum 6 caractères"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newDateNaissance">Date de naissance</Label>
                              <Input
                                id="newDateNaissance"
                                type="date"
                                value={newEleveData.dateNaissance}
                                onChange={(e) => setNewEleveData({...newEleveData, dateNaissance: e.target.value})}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenAddEleveDialog(false)} type="button">
                              Annuler
                            </Button>
                            <Button onClick={handleAddEleve} disabled={loading} type="button">
                              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer l'élève"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Popover open={openEleveCombobox} onOpenChange={setOpenEleveCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openEleveCombobox}
                          className="w-full justify-between"
                        >
                          {selectedEleve
                            ? eleves.find((eleve) => eleve.id === selectedEleve)
                                ? `${eleves.find((eleve) => eleve.id === selectedEleve)?.first_name} ${eleves.find((eleve) => eleve.id === selectedEleve)?.last_name}`
                                : "Choisir un élève"
                            : "Choisir un élève"}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Rechercher un élève..." />
                          <CommandList>
                            <CommandEmpty>Aucun élève trouvé.</CommandEmpty>
                            <CommandGroup>
                              {eleves.map((eleve) => (
                                <CommandItem
                                  key={eleve.id}
                                  value={`${eleve.first_name} ${eleve.last_name}`}
                                  onSelect={() => {
                                    setSelectedEleve(eleve.id);
                                    setOpenEleveCombobox(false);
                                  }}
                                >
                                  {eleve.first_name} {eleve.last_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lienParente">Lien de parenté</Label>
                    <Select value={lienParente} onValueChange={setLienParente}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Père">Père</SelectItem>
                        <SelectItem value="Mère">Mère</SelectItem>
                        <SelectItem value="Tuteur légal">Tuteur légal</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {primaryRole === 'ADMIN_ECOLE' && (
                <div className="text-center p-8 bg-muted/50 rounded-lg">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <p className="text-lg font-medium mb-2">Configuration administrateur</p>
                  <p className="text-sm text-muted-foreground">
                    Votre compte administrateur est prêt. Vous pouvez maintenant accéder au tableau de bord.
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Retour
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Terminer"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
