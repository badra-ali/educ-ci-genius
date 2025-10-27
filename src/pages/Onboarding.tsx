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
import { GraduationCap, Building2, Users, BookOpen, Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

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
    }
  }, [selectedEtablissement]);

  useEffect(() => {
    if (primaryRole === 'PARENT') {
      fetchEleves();
    }
  }, [primaryRole]);

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
    // Liste fictive d'élèves pour les tests
    const elevesTest = [
      { id: "1", first_name: "Marie", last_name: "Kouassi" },
      { id: "2", first_name: "Jean", last_name: "Koné" },
      { id: "3", first_name: "Fatou", last_name: "Diallo" },
      { id: "4", first_name: "Amadou", last_name: "Traoré" },
      { id: "5", first_name: "Aïcha", last_name: "Bamba" },
      { id: "6", first_name: "Ibrahim", last_name: "Touré" },
      { id: "7", first_name: "Kadiatou", last_name: "Sanogo" },
      { id: "8", first_name: "Moussa", last_name: "Coulibaly" },
    ];
    
    setEleves(elevesTest);
    
    /* Version réelle à activer plus tard:
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        profiles!inner(id, first_name, last_name)
      `)
      .eq("role", "ELEVE");
    
    if (error) {
      console.error("Erreur chargement élèves:", error);
      return;
    }
    
    const uniqueEleves = data?.map((item: any) => ({
      id: item.user_id,
      first_name: item.profiles.first_name,
      last_name: item.profiles.last_name,
    })).sort((a: any, b: any) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    setEleves(uniqueEleves || []);
    */
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
                    <Label>Sélectionnez votre enfant</Label>
                    {eleves.length === 0 ? (
                      <div className="text-center p-8 border rounded-lg bg-muted/50">
                        <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Aucun élève trouvé. Contactez l'administration de l'établissement pour créer le compte de votre enfant.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3">
                        {eleves.map((eleve) => (
                          <div
                            key={eleve.id}
                            onClick={() => setSelectedEleve(eleve.id)}
                            className={`
                              flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all
                              ${selectedEleve === eleve.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                              }
                            `}
                          >
                            <div className="flex-1">
                              <p className="font-medium">
                                {eleve.first_name} {eleve.last_name}
                              </p>
                            </div>
                            {selectedEleve === eleve.id && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
