import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Bot, 
  MessageSquare, 
  FileQuestion, 
  Brain,
  ChevronRight,
  User,
  Sparkles,
  Database,
  Clock
} from 'lucide-react';
import { useTuteurIARelations, useSessionDetails, useRAGStats, SessionWithRelations } from '@/hooks/useTuteurIARelations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function TuteurIARelations() {
  const { data, isLoading } = useTuteurIARelations();
  const { data: ragStats } = useRAGStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<SessionWithRelations | null>(null);
  const { data: sessionDetails, isLoading: detailsLoading } = useSessionDetails(selectedSession?.id || null);

  const filteredSessions = data?.sessions?.filter(session =>
    (session.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (session.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    session.mode.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'chat': return 'bg-blue-500/10 text-blue-500';
      case 'revision': return 'bg-green-500/10 text-green-500';
      case 'exercice': return 'bg-purple-500/10 text-purple-500';
      case 'explication': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{data?.stats.totalSessions || 0}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{data?.stats.totalMessages || 0}</p>
                <p className="text-xs text-muted-foreground">Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{data?.stats.totalQcms || 0}</p>
                <p className="text-xs text-muted-foreground">QCM générés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{ragStats?.indexedResources || 0}</p>
                <p className="text-xs text-muted-foreground">Resources RAG</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RAG Info Card */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-500" />
            <div>
              <h3 className="font-semibold">Retrieval-Augmented Generation (RAG)</h3>
              <p className="text-sm text-muted-foreground">
                {ragStats?.totalEmbeddings || 0} embeddings vectoriels indexés à partir de {ragStats?.indexedResources || 0} ressources
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une session..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Sessions et leurs relations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Messages
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <FileQuestion className="h-3 w-3" />
                      QCM
                    </div>
                  </TableHead>
                  <TableHead>Dernière activité</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucune session trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session) => (
                    <TableRow key={session.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">{session.title || 'Session sans titre'}</p>
                            <p className="text-xs text-muted-foreground">{session.language.toUpperCase()}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getModeColor(session.mode)}>
                          {session.mode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {session.subject ? (
                          <Badge variant="secondary">{session.subject}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {session.grade ? (
                          <Badge variant="outline">{session.grade}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={session.messages_count > 0 ? "default" : "secondary"}>
                          {session.messages_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={session.qcms_count > 0 ? "default" : "secondary"}>
                          {session.qcms_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(session.updated_at), 'dd MMM HH:mm', { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSession(session)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Session Details Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {selectedSession?.title || 'Session sans titre'}
              <Badge variant="outline" className={getModeColor(selectedSession?.mode || '')}>
                {selectedSession?.mode}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {detailsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="messages" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="messages" className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Messages ({sessionDetails?.messages?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="qcms" className="flex items-center gap-1">
                  <FileQuestion className="h-3 w-3" />
                  QCM générés ({sessionDetails?.qcms?.length || 0})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[400px] mt-4">
                <TabsContent value="messages" className="space-y-2">
                  {sessionDetails?.messages?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucun message</p>
                  ) : (
                    sessionDetails?.messages?.map((message) => (
                      <Card key={message.id} className={message.role === 'assistant' ? 'bg-primary/5' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {message.role === 'assistant' ? (
                              <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            ) : (
                              <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {message.role === 'assistant' ? 'Tuteur IA' : 'Utilisateur'}
                                </span>
                                {message.mode && (
                                  <Badge variant="outline" className="text-xs">
                                    {message.mode}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content.length > 500 
                                  ? message.content.substring(0, 500) + '...' 
                                  : message.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {format(new Date(message.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="qcms" className="space-y-2">
                  {sessionDetails?.qcms?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucun QCM généré</p>
                  ) : (
                    sessionDetails?.qcms?.map((qcm) => (
                      <Card key={qcm.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <FileQuestion className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">{qcm.subject}</Badge>
                                <Badge variant="outline">{qcm.theme}</Badge>
                                {qcm.grade && (
                                  <Badge variant="outline">{qcm.grade}</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {qcm.items.length} question{qcm.items.length > 1 ? 's' : ''}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Généré le {format(new Date(qcm.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
