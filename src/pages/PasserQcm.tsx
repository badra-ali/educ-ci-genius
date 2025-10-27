import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useQcm } from "@/hooks/useQcm";
import { toast } from "sonner";

const PasserQcm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { qcm, questions, loading, fetchQcm, startTentative, submitTentative } = useQcm(id);
  
  const [tentativeId, setTentativeId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [reponses, setReponses] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchQcm(id);
    }
  }, [id]);

  // Timer
  useEffect(() => {
    if (qcm?.duree_minutes && tentativeId && timeLeft === null) {
      setTimeLeft(qcm.duree_minutes * 60);
    }
  }, [qcm, tentativeId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isSubmitted) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isSubmitted]);

  const handleStart = async () => {
    if (!id) return;
    const tentative = await startTentative(id);
    if (tentative) {
      setTentativeId(tentative.id);
    }
  };

  const handleAnswerChange = (questionId: string, answerIndex: number) => {
    setReponses({
      ...reponses,
      [questionId]: answerIndex,
    });
  };

  const handleSubmit = async () => {
    if (!tentativeId) return;
    
    const reponsesArray = Object.entries(reponses).map(([question_id, index_choisi]) => ({
      question_id,
      index_choisi,
    }));

    const resultData = await submitTentative(tentativeId, reponsesArray);
    if (resultData) {
      setResult(resultData);
      setIsSubmitted(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!qcm || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-2">QCM introuvable</h2>
            <Button onClick={() => navigate(-1)}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Écran de résultat
  if (isSubmitted && result) {
    const isPassed = qcm.note_minimale ? result.score >= qcm.note_minimale : result.score >= 50;
    
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {isPassed ? (
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                ) : (
                  <XCircle className="w-8 h-8 text-destructive" />
                )}
              </div>
              <CardTitle className="text-3xl">
                {isPassed ? 'Félicitations !' : 'Continuez vos efforts'}
              </CardTitle>
              <CardDescription>
                Vous avez obtenu {result.score.toFixed(1)}% de réussite
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Score</span>
                  <span className="font-bold">{result.score.toFixed(1)}%</span>
                </div>
                <Progress value={result.score} className="h-3" />
                {qcm.note_minimale && (
                  <p className="text-xs text-muted-foreground">
                    Note minimale requise : {qcm.note_minimale}%
                  </p>
                )}
              </div>

              {qcm.affichage_feedback !== 'jamais' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Détail des réponses</h3>
                  {result.reponses.map((rep: any, index: number) => {
                    const question = questions.find(q => q.id === rep.question_id);
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          {rep.correct ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive mt-1" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium mb-2">{question?.question}</p>
                            <p className="text-sm text-muted-foreground">
                              Votre réponse : {question?.options[rep.index_choisi]}
                            </p>
                            {!rep.correct && (
                              <p className="text-sm text-green-600 mt-1">
                                Bonne réponse : {question?.options[question.answer_index]}
                              </p>
                            )}
                            {question?.feedback && (
                              <p className="text-sm text-muted-foreground mt-2 italic">
                                💡 {question.feedback}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                  Retour
                </Button>
                {qcm.tentatives_max && (
                  <Button className="flex-1" onClick={() => window.location.reload()}>
                    Réessayer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Écran de démarrage
  if (!tentativeId) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                  <CardTitle>{qcm.titre}</CardTitle>
                  {qcm.description && (
                    <CardDescription>{qcm.description}</CardDescription>
                  )}
                </div>
              </div>
              
              {qcm.tags && qcm.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {qcm.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Durée</p>
                    <p className="text-xs text-muted-foreground">
                      {qcm.duree_minutes ? `${qcm.duree_minutes} minutes` : 'Illimitée'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Questions</p>
                    <p className="text-xs text-muted-foreground">
                      {questions.length} question{questions.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {qcm.tentatives_max && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Tentatives autorisées :</strong> {qcm.tentatives_max}
                  </p>
                </div>
              )}

              {qcm.note_minimale && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Note minimale pour réussir :</strong> {qcm.note_minimale}%
                  </p>
                </div>
              )}

              <Button onClick={handleStart} className="w-full" size="lg">
                Commencer le QCM
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Écran de passage du QCM
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const hasAnsweredCurrent = reponses[currentQuestion.id!] !== undefined;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-3xl">
        {/* Timer & Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Question {currentQuestionIndex + 1} sur {questions.length}
              </span>
              {timeLeft !== null && (
                <Badge variant={timeLeft < 60 ? 'destructive' : 'default'}>
                  <Clock className="w-3 h-3 mr-1" />
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </Badge>
              )}
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestion.question}
            </CardTitle>
            <CardDescription>
              {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={reponses[currentQuestion.id!]?.toString()}
              onValueChange={(value) => 
                handleAnswerChange(currentQuestion.id!, parseInt(value))
              }
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex gap-2">
              {currentQuestionIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                >
                  Précédent
                </Button>
              )}
              
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  className="flex-1"
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  disabled={!hasAnsweredCurrent}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={Object.keys(reponses).length < questions.length}
                >
                  Soumettre le QCM
                </Button>
              )}
            </div>

            {Object.keys(reponses).length < questions.length && (
              <p className="text-sm text-center text-muted-foreground">
                {questions.length - Object.keys(reponses).length} question(s) restante(s)
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasserQcm;
