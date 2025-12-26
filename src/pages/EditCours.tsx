import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Plus, Trash2, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCours } from "@/hooks/useCours";
import { toast } from "sonner";

interface Bloc {
  type: 'chapitre' | 'video' | 'pdf';
  titre: string;
  contenu?: string;
  url?: string;
  ordre: number;
}

const EditCours = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cours, loading: coursLoading, fetchCours, updateCours } = useCours(id);
  const [loading, setLoading] = useState(false);
  
  // Formulaire
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [visioUrl, setVisioUrl] = useState("");
  const [objectifs, setObjectifs] = useState<string[]>([""]);
  const [prerequis, setPrerequis] = useState<string[]>([""]);
  const [blocs, setBlocs] = useState<Bloc[]>([]);
  const [statut, setStatut] = useState<string>("brouillon");

  useEffect(() => {
    if (id) {
      fetchCours(id);
    }
  }, [id]);

  useEffect(() => {
    if (cours) {
      setTitre(cours.titre);
      setDescription(cours.description || "");
      setVisioUrl(cours.visio_url || "");
      setObjectifs(cours.objectifs?.length ? cours.objectifs : [""]);
      setPrerequis(cours.prerequis?.length ? cours.prerequis : [""]);
      setBlocs(Array.isArray(cours.contenu_json) ? cours.contenu_json : []);
      setStatut(cours.statut);
    }
  }, [cours]);

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
    
    if (!titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    if (!id) return;

    setLoading(true);

    try {
      await updateCours(id, {
        titre,
        description,
        contenu_json: blocs,
        objectifs: objectifs.filter(o => o.trim()),
        prerequis: prerequis.filter(p => p.trim()),
        visio_url: visioUrl || null,
        statut: statut as 'brouillon' | 'publie' | 'archive',
      });

      toast.success("Cours mis à jour avec succès !");
      navigate(`/classe/${id}`);
    } catch (error: any) {
      console.error("Erreur mise à jour cours:", error);
      toast.error("Impossible de mettre à jour le cours");
    } finally {
      setLoading(false);
    }
  };

  if (coursLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!cours) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Cours introuvable</h2>
          <Button onClick={() => navigate("/classe")}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/classe/${id}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Modifier le cours</h1>
              <p className="text-sm text-muted-foreground">
                {cours.matieres?.nom}
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
                  <Label htmlFor="statut">Statut</Label>
                  <Select value={statut} onValueChange={setStatut}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brouillon">Brouillon</SelectItem>
                      <SelectItem value="publie">Publié</SelectItem>
                      <SelectItem value="archive">Archivé</SelectItem>
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
                      {blocs.length > 0 && (
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
            <Button type="button" variant="outline" onClick={() => navigate(`/classe/${id}`)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditCours;
