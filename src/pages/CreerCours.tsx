import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Plus, Trash2, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCours } from "@/hooks/useCours";
import { toast } from "sonner";
import { z } from "zod";

const coursSchema = z.object({
  titre: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(200),
  description: z.string().max(1000).optional(),
  matiere_id: z.string().uuid("Veuillez sélectionner une matière"),
  etablissement_id: z.string().uuid(),
  classes: z.array(z.string()).min(1, "Sélectionnez au moins une classe"),
  visio_url: z.string().url("URL invalide").optional().or(z.literal("")),
});

interface Bloc {
  type: 'chapitre' | 'video' | 'pdf';
  titre: string;
  contenu?: string;
  url?: string;
  ordre: number;
}

const CreerCours = () => {
  const navigate = useNavigate();
  const { createCours } = useCours();
  const [loading, setLoading] = useState(false);
  
  // Formulaire
  const [titre, setTitre] = useState("Les équations du premier degré");
  const [description, setDescription] = useState("Ce cours introduit les concepts fondamentaux des équations du premier degré. Les élèves apprendront à résoudre des équations simples et à les appliquer dans des situations concrètes.");
  const [matiereId, setMatiereId] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [visioUrl, setVisioUrl] = useState("https://meet.google.com/abc-defg-hij");
  const [objectifs, setObjectifs] = useState<string[]>(["Comprendre la notion d'équation", "Résoudre des équations simples"]);
  const [prerequis, setPrerequis] = useState<string[]>(["Opérations de base", "Nombres relatifs"]);
  const [blocs, setBlocs] = useState<Bloc[]>([
    { 
      type: 'chapitre', 
      titre: 'Introduction aux équations', 
      contenu: 'Une équation est une égalité mathématique qui contient une ou plusieurs inconnues. Dans ce chapitre, nous allons découvrir les bases des équations du premier degré et apprendre à les résoudre pas à pas.\n\nExemple : 2x + 3 = 7\n\nPour résoudre cette équation, nous devons isoler x en effectuant les mêmes opérations des deux côtés de l\'égalité.', 
      ordre: 1 
    },
    { 
      type: 'chapitre', 
      titre: 'Méthodes de résolution', 
      contenu: 'Il existe plusieurs méthodes pour résoudre une équation :\n\n1. Méthode par substitution\n2. Méthode par addition/soustraction\n3. Méthode par multiplication/division\n\nNous allons étudier chacune de ces méthodes avec des exemples pratiques.', 
      ordre: 2 
    },
    { 
      type: 'video', 
      titre: 'Tutoriel vidéo : Résolution d\'équations', 
      url: 'https://www.youtube.com/watch?v=exemple', 
      ordre: 3 
    },
    { 
      type: 'chapitre', 
      titre: 'Exercices pratiques', 
      contenu: 'Exercice 1 : Résoudre 3x + 5 = 14\nExercice 2 : Résoudre 2(x - 3) = 8\nExercice 3 : Résoudre 5x - 2 = 3x + 10\n\nN\'oubliez pas de vérifier vos réponses en remplaçant x par la valeur trouvée !', 
      ordre: 4 
    }
  ]);
  
  // Données
  const [etablissementId, setEtablissementId] = useState("");
  const [matieres, setMatieres] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Récupérer l'établissement de l'enseignant
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("etablissement_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (userRoles?.etablissement_id) {
      setEtablissementId(userRoles.etablissement_id);
      fetchMatieres(userRoles.etablissement_id);
      fetchClasses(userRoles.etablissement_id);
    } else {
      // Si pas d'établissement, charger toutes les matières et classes
      fetchMatieres();
      fetchClasses();
    }
  };

  const fetchMatieres = async (etablissementId?: string) => {
    let query = supabase
      .from("matieres")
      .select("*, etablissements(nom)")
      .eq("actif", true);
    
    if (etablissementId) {
      query = query.eq("etablissement_id", etablissementId);
    }
    
    const { data } = await query.order("nom");
    
    setMatieres(data || []);
  };

  const fetchClasses = async (etablissementId?: string) => {
    let query = supabase
      .from("classes")
      .select("*, etablissements(nom)")
      .eq("actif", true);
    
    if (etablissementId) {
      query = query.eq("etablissement_id", etablissementId);
    }
    
    const { data } = await query.order("niveau, nom");
    
    setClasses(data || []);
  };

  const addBloc = () => {
    setBlocs([
      ...blocs,
      {
        type: 'chapitre',
        titre: `Chapitre ${blocs.length + 1}`,
        contenu: '',
        ordre: blocs.length + 1
      }
    ]);
  };

  const removeBloc = (index: number) => {
    setBlocs(blocs.filter((_, i) => i !== index));
  };

  const updateBloc = (index: number, updates: Partial<Bloc>) => {
    const newBlocs = [...blocs];
    newBlocs[index] = { ...newBlocs[index], ...updates };
    setBlocs(newBlocs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier qu'un établissement est sélectionné via la matière
    if (!matiereId) {
      toast.error("Veuillez sélectionner une matière");
      return;
    }

    // Récupérer l'établissement de la matière sélectionnée
    const selectedMatiere = matieres.find(m => m.id === matiereId);
    const etablissement = selectedMatiere?.etablissement_id;

    if (!etablissement) {
      toast.error("Impossible de déterminer l'établissement");
      return;
    }

    // Validation
    const validation = coursSchema.safeParse({
      titre,
      description,
      matiere_id: matiereId,
      etablissement_id: etablissement,
      classes: selectedClasses,
      visio_url: visioUrl,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      // Créer le cours
      const coursData = {
        titre,
        description,
        matiere_id: matiereId,
        etablissement_id: etablissement,
        contenu_json: blocs,
        objectifs: objectifs.filter(o => o.trim()),
        prerequis: prerequis.filter(p => p.trim()),
        visio_url: visioUrl || null,
        statut: 'publie' as const,
      };

      const newCours = await createCours(coursData);

      if (!newCours) {
        throw new Error("Erreur lors de la création du cours");
      }

      // Lier aux classes
      const coursClassesData = selectedClasses.map(classeId => ({
        cours_id: newCours.id,
        classe_id: classeId,
      }));

      const { error: linkError } = await supabase
        .from("cours_classes")
        .insert(coursClassesData);

      if (linkError) throw linkError;

      toast.success("Cours créé avec succès !");
      navigate(`/classe/${newCours.id}`);
    } catch (error: any) {
      console.error("Erreur création cours:", error);
      toast.error("Impossible de créer le cours");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/classe")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Créer un cours</h1>
              <p className="text-sm text-muted-foreground">
                Remplissez les informations ci-dessous
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre du cours *</Label>
                <Input
                  id="titre"
                  placeholder="Ex: Introduction aux équations"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le contenu et les objectifs du cours..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="matiere">Matière *</Label>
                  <Select value={matiereId} onValueChange={setMatiereId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {matieres.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nom} {m.etablissements?.nom && `(${m.etablissements.nom})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visioUrl">URL Visioconférence (optionnel)</Label>
                  <Input
                    id="visioUrl"
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={visioUrl}
                    onChange={(e) => setVisioUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Classes concernées *</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-40 overflow-y-auto">
                  {classes.map((classe: any) => (
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
                        {classe.niveau} - {classe.nom} {classe.etablissements?.nom && `(${classe.etablissements.nom})`}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objectifs et Prérequis */}
          <Card>
            <CardHeader>
              <CardTitle>Objectifs et Prérequis</CardTitle>
              <CardDescription>
                Définissez les objectifs pédagogiques et les prérequis nécessaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="objectifs">
                  <AccordionTrigger>Objectifs pédagogiques</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {objectifs.map((objectif, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Ex: Comprendre la notion d'équation"
                            value={objectif}
                            onChange={(e) => {
                              const newObjectifs = [...objectifs];
                              newObjectifs[index] = e.target.value;
                              setObjectifs(newObjectifs);
                            }}
                          />
                          {objectifs.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setObjectifs(objectifs.filter((_, i) => i !== index));
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setObjectifs([...objectifs, ""])}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter un objectif
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="prerequis">
                  <AccordionTrigger>Prérequis</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {prerequis.map((prereq, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Ex: Opérations de base"
                            value={prereq}
                            onChange={(e) => {
                              const newPrerequis = [...prerequis];
                              newPrerequis[index] = e.target.value;
                              setPrerequis(newPrerequis);
                            }}
                          />
                          {prerequis.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPrerequis(prerequis.filter((_, i) => i !== index));
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPrerequis([...prerequis, ""])}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter un prérequis
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Contenu du cours */}
          <Card>
            <CardHeader>
              <CardTitle>Contenu du cours</CardTitle>
              <CardDescription>
                Organisez votre cours en chapitres et ressources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {blocs.map((bloc, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Select
                        value={bloc.type}
                        onValueChange={(value: any) => updateBloc(index, { type: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chapitre">Chapitre</SelectItem>
                          <SelectItem value="video">Vidéo</SelectItem>
                          <SelectItem value="pdf">Document PDF</SelectItem>
                        </SelectContent>
                      </Select>
                      {blocs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBloc(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Titre"
                      value={bloc.titre}
                      onChange={(e) => updateBloc(index, { titre: e.target.value })}
                    />
                    
                    {bloc.type === 'chapitre' && (
                      <Textarea
                        placeholder="Contenu du chapitre..."
                        value={bloc.contenu || ''}
                        onChange={(e) => updateBloc(index, { contenu: e.target.value })}
                        rows={4}
                      />
                    )}
                    
                    {(bloc.type === 'video' || bloc.type === 'pdf') && (
                      <Input
                        type="url"
                        placeholder="URL de la ressource"
                        value={bloc.url || ''}
                        onChange={(e) => updateBloc(index, { url: e.target.value })}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
              
              <Button type="button" variant="outline" className="w-full" onClick={addBloc}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un bloc
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate("/classe")}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Créer le cours
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreerCours;
