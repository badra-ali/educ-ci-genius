import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { useQcm } from "@/hooks/useQcm";
import { toast } from "sonner";

interface Question {
  question: string;
  options: string[];
  answer_index: number;
  feedback?: string;
  points: number;
  ordre: number;
}

const CreerQcm = () => {
  const navigate = useNavigate();
  const { createQcm } = useQcm();
  
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [dureeMinutes, setDureeMinutes] = useState<number>(30);
  const [coursId, setCoursId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", options: ["", ""], answer_index: 0, feedback: "", points: 1, ordre: 0 }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { 
      question: "", 
      options: ["", ""], 
      answer_index: 0, 
      feedback: "", 
      points: 1,
      ordre: questions.length
    }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push("");
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (questions[questionIndex].options.length > 2) {
      const updated = [...questions];
      updated[questionIndex].options.splice(optionIndex, 1);
      if (updated[questionIndex].answer_index >= optionIndex) {
        updated[questionIndex].answer_index = Math.max(0, updated[questionIndex].answer_index - 1);
      }
      setQuestions(updated);
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    const hasEmptyQuestions = questions.some(q => !q.question.trim());
    if (hasEmptyQuestions) {
      toast.error("Toutes les questions doivent avoir un énoncé");
      return;
    }

    const hasEmptyOptions = questions.some(q => q.options.some(o => !o.trim()));
    if (hasEmptyOptions) {
      toast.error("Toutes les options doivent être remplies");
      return;
    }

    const qcmData = {
      titre,
      description,
      duree_minutes: dureeMinutes,
      cours_id: coursId || null,
      statut: 'publie' as const,
    };

    const createdQcm = await createQcm(qcmData, questions);
    if (createdQcm) {
      navigate(`/qcm/${createdQcm.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold">Créer un QCM</h1>
            </div>
            <Button onClick={handleSubmit}>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titre">Titre du QCM *</Label>
                <Input
                  id="titre"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: QCM Chapitre 1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description optionnelle du QCM"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="duree">Durée (minutes)</Label>
                <Input
                  id="duree"
                  type="number"
                  min="1"
                  value={dureeMinutes}
                  onChange={(e) => setDureeMinutes(parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {questions.map((question, qIndex) => (
            <Card key={qIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Question {qIndex + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(qIndex)}
                    disabled={questions.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Énoncé de la question *</Label>
                  <Textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                    placeholder="Posez votre question..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label>Points</Label>
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={question.points}
                    onChange={(e) => updateQuestion(qIndex, "points", parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Options de réponse</Label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex gap-2 items-center">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        required
                      />
                      <Select
                        value={question.answer_index === oIndex ? "correct" : "incorrect"}
                        onValueChange={(val) => {
                          if (val === "correct") {
                            updateQuestion(qIndex, "answer_index", oIndex);
                          }
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="correct">✓ Correct</SelectItem>
                          <SelectItem value="incorrect">Incorrect</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(qIndex, oIndex)}
                        disabled={question.options.length <= 2}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(qIndex)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une option
                  </Button>
                </div>

                <div>
                  <Label>Feedback (optionnel)</Label>
                  <Textarea
                    value={question.feedback || ""}
                    onChange={(e) => updateQuestion(qIndex, "feedback", e.target.value)}
                    placeholder="Explication de la réponse correcte..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une question
          </Button>
        </form>
      </main>
    </div>
  );
};

export default CreerQcm;
