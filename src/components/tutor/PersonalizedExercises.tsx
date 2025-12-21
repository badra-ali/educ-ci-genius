import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  Brain, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  ChevronRight
} from "lucide-react";
import { useSkillProgress, useGenerateQCM, useUpdateSkillProgress } from "@/hooks/useTutorIA";
import { toast } from "sonner";

interface SkillGap {
  skill_code: string;
  subject: string;
  mastery_level: number;
  attempts: number;
  last_practiced_at: string | null;
}

interface Exercise {
  q: string;
  choices: string[];
  answer: string;
  why: string;
  level: 'easy' | 'medium' | 'hard';
  skill: string;
}

interface PersonalizedExercisesProps {
  subject: string;
  grade: string;
  onExerciseComplete?: (skillCode: string, correct: boolean) => void;
}

export const PersonalizedExercises = ({ subject, grade, onExerciseComplete }: PersonalizedExercisesProps) => {
  const { data: skillProgress, isLoading: loadingProgress, refetch } = useSkillProgress(subject);
  const generateQCM = useGenerateQCM();
  const updateSkillProgress = useUpdateSkillProgress();
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isGenerating, setIsGenerating] = useState(false);

  // Identifier les lacunes (mastery_level < 70%)
  const gaps: SkillGap[] = skillProgress?.filter((s: SkillGap) => s.mastery_level < 70) || [];
  const weakestSkills = gaps.slice(0, 5);

  const getMasteryColor = (level: number) => {
    if (level >= 80) return "text-green-600 bg-green-100 dark:bg-green-900";
    if (level >= 60) return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900";
    if (level >= 40) return "text-orange-600 bg-orange-100 dark:bg-orange-900";
    return "text-red-600 bg-red-100 dark:bg-red-900";
  };

  const getMasteryLabel = (level: number) => {
    if (level >= 80) return "Maîtrisé";
    if (level >= 60) return "En progrès";
    if (level >= 40) return "À travailler";
    return "À renforcer";
  };

  const handleGenerateExercises = async () => {
    if (weakestSkills.length === 0) {
      toast.info("Aucune lacune détectée ! Continuez à pratiquer pour maintenir vos compétences.");
      return;
    }

    setIsGenerating(true);
    try {
      // Générer des exercices ciblant les compétences faibles
      const targetSkills = weakestSkills.map(s => s.skill_code).join(", ");
      
      const result = await generateQCM.mutateAsync({
        subject,
        grade,
        theme: `Exercices ciblés sur les lacunes: ${targetSkills}`,
        count: 5,
        mix: { easy: 1, medium: 2, hard: 2 }
      });

      if (result?.items) {
        setExercises(result.items);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore({ correct: 0, total: 0 });
        toast.success("Exercices personnalisés générés !");
      }
    } catch (error) {
      console.error("Error generating exercises:", error);
      toast.error("Erreur lors de la génération des exercices");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return;

    const currentExercise = exercises[currentIndex];
    const isCorrect = currentExercise.choices[selectedAnswer] === currentExercise.answer;
    
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    // Mettre à jour la progression de la compétence
    try {
      const currentSkill = skillProgress?.find((s: SkillGap) => s.skill_code === currentExercise.skill);
      const currentLevel = currentSkill?.mastery_level || 50;
      const newLevel = Math.min(100, Math.max(0, currentLevel + (isCorrect ? 10 : -5)));
      
      await updateSkillProgress.mutateAsync({
        subject,
        skillCode: currentExercise.skill,
        masteryLevel: newLevel
      });

      onExerciseComplete?.(currentExercise.skill, isCorrect);
    } catch (error) {
      console.error("Error updating skill progress:", error);
    }
  };

  const handleNextExercise = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Fin des exercices
      toast.success(`Session terminée ! Score: ${score.correct}/${score.total}`);
      refetch(); // Rafraîchir la progression
    }
  };

  const handleRestart = () => {
    setExercises([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore({ correct: 0, total: 0 });
  };

  const currentExercise = exercises[currentIndex];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Exercices personnalisés</CardTitle>
          </div>
          {exercises.length > 0 && (
            <Badge variant="outline">
              {currentIndex + 1} / {exercises.length}
            </Badge>
          )}
        </div>
        <CardDescription>
          Basés sur vos lacunes détectées
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="exercises" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="exercises" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Exercices
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Progression
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="space-y-4">
            {exercises.length === 0 ? (
              <div className="space-y-4">
                {/* Résumé des lacunes */}
                {loadingProgress ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : weakestSkills.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      {weakestSkills.length} compétence(s) à renforcer
                    </p>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {weakestSkills.map((skill, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{skill.skill_code}</p>
                              <p className="text-xs text-muted-foreground">
                                {skill.attempts || 0} tentative(s)
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={skill.mastery_level} 
                                className="w-20 h-2"
                              />
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getMasteryColor(skill.mastery_level)}`}
                              >
                                {skill.mastery_level}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Aucune lacune majeure détectée !<br />
                      Continuez à pratiquer pour maintenir vos acquis.
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleGenerateExercises} 
                  disabled={isGenerating || weakestSkills.length === 0}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Générer des exercices ciblés
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score actuel */}
                {score.total > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Score actuel</span>
                    <span className="font-bold text-lg">
                      {score.correct}/{score.total}
                    </span>
                  </div>
                )}

                {/* Question */}
                {currentExercise && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {currentExercise.skill}
                      </Badge>
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${
                          currentExercise.level === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          currentExercise.level === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}
                      >
                        {currentExercise.level === 'easy' ? 'Facile' : 
                         currentExercise.level === 'medium' ? 'Moyen' : 'Difficile'}
                      </Badge>
                    </div>

                    <p className="font-medium">{currentExercise.q}</p>

                    {/* Choix */}
                    <div className="space-y-2">
                      {currentExercise.choices.map((choice, idx) => {
                        const isCorrectAnswer = choice === currentExercise.answer;
                        const isSelected = selectedAnswer === idx;
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => handleAnswerSelect(idx)}
                            disabled={showResult}
                            className={`w-full p-3 rounded-lg text-left transition-all ${
                              showResult
                                ? isCorrectAnswer
                                  ? 'bg-green-100 border-green-500 dark:bg-green-900/50'
                                  : isSelected && !isCorrectAnswer
                                  ? 'bg-red-100 border-red-500 dark:bg-red-900/50'
                                  : 'bg-muted/50'
                                : isSelected
                                ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
                                : 'bg-muted/50 hover:bg-muted'
                            } border`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-sm font-medium border">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="flex-1">{choice}</span>
                              {showResult && isCorrectAnswer && (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                              {showResult && isSelected && !isCorrectAnswer && (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explication */}
                    {showResult && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Explication
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {currentExercise.why}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!showResult ? (
                        <Button 
                          onClick={handleSubmitAnswer} 
                          disabled={selectedAnswer === null}
                          className="flex-1"
                        >
                          Valider
                        </Button>
                      ) : currentIndex < exercises.length - 1 ? (
                        <Button onClick={handleNextExercise} className="flex-1">
                          Suivant
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button onClick={handleRestart} variant="outline" className="flex-1">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Nouvelle session
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress">
            <ScrollArea className="h-[350px]">
              {loadingProgress ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : skillProgress && skillProgress.length > 0 ? (
                <div className="space-y-3">
                  {skillProgress.map((skill: SkillGap, idx: number) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-lg bg-muted/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{skill.skill_code}</p>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getMasteryColor(skill.mastery_level)}`}
                        >
                          {getMasteryLabel(skill.mastery_level)}
                        </Badge>
                      </div>
                      <Progress value={skill.mastery_level} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{skill.attempts || 0} tentatives</span>
                        <span>{skill.mastery_level}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aucune donnée de progression.<br />
                    Commencez à pratiquer pour voir votre évolution !
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
