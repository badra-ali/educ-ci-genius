import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Bot, Send, Sparkles, Loader2, BookOpen, Target, FileText, Calendar, Brain, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useGenerateQCM, useCreateRevisionPlan, useTutorSessions } from "@/hooks/useTutorIA";
import { MarkdownMessage } from "@/components/MarkdownMessage";

type Message = { role: "user" | "assistant"; content: string };
type Mode = "conversation" | "explain" | "qcm" | "revise" | "summary" | "plan";

const TuteurIA = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bonjour ! 👋 Je suis votre Tuteur IA. Comment puis-je vous aider dans vos études aujourd'hui ? Posez-moi une question, envoyez un PDF, ou choisissez un mode d'assistance.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<Mode>("conversation");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>("maths");
  const [grade, setGrade] = useState<string>("3e");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: sessions } = useTutorSessions();
  const generateQCM = useGenerateQCM();
  const createRevisionPlan = useCreateRevisionPlan();

  const modes = [
    { label: "Conversation", icon: <Bot className="w-4 h-4" />, value: "conversation" as Mode, description: "Discussion naturelle" },
    { label: "Expliquer", icon: <BookOpen className="w-4 h-4" />, value: "explain" as Mode, description: "Explication détaillée" },
    { label: "QCM", icon: <Target className="w-4 h-4" />, value: "qcm" as Mode, description: "Générer des exercices" },
    { label: "Réviser", icon: <Brain className="w-4 h-4" />, value: "revise" as Mode, description: "Flashcards et résumés" },
    { label: "Résumer", icon: <FileText className="w-4 h-4" />, value: "summary" as Mode, description: "Synthèse de documents" },
    { label: "Planifier", icon: <Calendar className="w-4 h-4" />, value: "plan" as Mode, description: "Plan de révision" },
  ];

  const subjects = ["maths", "physique", "svt", "français", "histoire", "géographie", "anglais", "philo", "ses"];
  const grades = ["6e", "5e", "4e", "3e", "2nde", "1ère", "Tle"];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          mode: selectedMode,
          sessionId: sessionId,
          language: 'fr',
          subject,
          grade,
        }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 429) {
          toast.error("Trop de requêtes. Veuillez réessayer dans quelques instants.");
          throw new Error('Rate limit exceeded');
        }
        if (response.status === 402) {
          toast.error("Crédits AI épuisés. Contactez l'administrateur.");
          throw new Error('Payment required');
        }
        throw new Error('Failed to start stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let newSessionId: string | null = null;

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              // Check for session ID
              if (parsed.sessionId) {
                newSessionId = parsed.sessionId;
                continue;
              }

              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantMessage
                  };
                  return updated;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }

      if (newSessionId && !sessionId) {
        setSessionId(newSessionId);
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error("Erreur lors de la communication avec le tuteur IA");
      setMessages((prev) => prev.slice(0, -1)); // Remove empty assistant message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold">Tuteur IA</h1>
          </div>
          <p className="text-muted-foreground">
            Votre assistant intelligent pour l'apprentissage et la révision
          </p>
        </div>

        <Tabs value={selectedMode} onValueChange={(v) => setSelectedMode(v as Mode)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {modes.map((mode) => (
              <TabsTrigger key={mode.value} value={mode.value} className="gap-2">
                {mode.icon}
                <span className="hidden sm:inline">{mode.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="h-[650px] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <CardTitle>{modes.find(m => m.value === selectedMode)?.label}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(s => (
                            <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={grade} onValueChange={setGrade}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {grades.map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-4 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {message.role === "user" ? (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          ) : (
                            <div className="text-sm leading-relaxed">
                              <MarkdownMessage content={message.content} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-4">
                          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Posez votre question (${modes.find(m => m.value === selectedMode)?.description})...`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
                      disabled={isLoading}
                    />
                    <Button onClick={handleSend} disabled={isLoading} size="icon">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Capacités IA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 mt-1 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">RAG & Citations</p>
                      <p className="text-xs text-muted-foreground">Répond avec sources vérifiées</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 mt-1 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">QCM adaptatifs</p>
                      <p className="text-xs text-muted-foreground">Exercices personnalisés</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Brain className="w-4 h-4 mt-1 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Suivi progression</p>
                      <p className="text-xs text-muted-foreground">Track compétences & maîtrise</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Volume2 className="w-4 h-4 mt-1 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">Audio (TTS)</p>
                      <p className="text-xs text-muted-foreground">Écoute les réponses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {sessions && sessions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sessions récentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sessions.slice(0, 5).map((session) => (
                        <Button
                          key={session.id}
                          variant="ghost"
                          className="w-full justify-start text-sm"
                          onClick={() => {
                            setSessionId(session.id);
                            setSelectedMode(session.mode as Mode);
                            toast.info('Session chargée');
                          }}
                        >
                          <span className="truncate">{session.title || `${session.mode} - ${session.subject || 'Général'}`}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg">💡 Conseil</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {selectedMode === 'conversation' && "Posez des questions précises pour obtenir des réponses détaillées."}
                    {selectedMode === 'explain' && "Demandez l'explication d'un concept avec des exemples concrets."}
                    {selectedMode === 'qcm' && "Spécifiez le thème et le nombre de questions souhaité."}
                    {selectedMode === 'revise' && "Je vais créer des flashcards et un résumé structuré."}
                    {selectedMode === 'summary' && "Partagez un texte ou un PDF à résumer."}
                    {selectedMode === 'plan' && "Indiquez votre objectif et le temps disponible par jour."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default TuteurIA;
