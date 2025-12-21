import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  BookOpen, 
  Layers, 
  Users, 
  Highlighter, 
  Brain, 
  Eye,
  Volume2,
  Globe,
  Lock,
  FileText,
  ChevronRight
} from 'lucide-react';
import { useBibliothequeRelations, useResourceDetails, ResourceWithRelations } from '@/hooks/useBibliothequeRelations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function BibliothequeRelations() {
  const { data: resources, isLoading } = useBibliothequeRelations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState<ResourceWithRelations | null>(null);
  const { data: resourceDetails, isLoading: detailsLoading } = useResourceDetails(selectedResource?.id || null);

  const filteredResources = resources?.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.subject.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'book': return 'bg-blue-500/10 text-blue-500';
      case 'article': return 'bg-green-500/10 text-green-500';
      case 'video': return 'bg-purple-500/10 text-purple-500';
      case 'audio': return 'bg-orange-500/10 text-orange-500';
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

  // Stats summary
  const totalResources = resources?.length || 0;
  const totalSections = resources?.reduce((sum, r) => sum + r.sections_count, 0) || 0;
  const totalReaders = resources?.reduce((sum, r) => sum + r.readers_count, 0) || 0;
  const totalHighlights = resources?.reduce((sum, r) => sum + r.highlights_count, 0) || 0;
  const totalEmbeddings = resources?.reduce((sum, r) => sum + r.embeddings_count, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalResources}</p>
                <p className="text-xs text-muted-foreground">Ressources</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalSections}</p>
                <p className="text-xs text-muted-foreground">Sections</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalReaders}</p>
                <p className="text-xs text-muted-foreground">Lectures</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Highlighter className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{totalHighlights}</p>
                <p className="text-xs text-muted-foreground">Annotations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalEmbeddings}</p>
                <p className="text-xs text-muted-foreground">Embeddings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une ressource..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Ressources et leurs relations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ressource</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Layers className="h-3 w-3" />
                      Sections
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" />
                      Lecteurs
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Highlighter className="h-3 w-3" />
                      Annotations
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Brain className="h-3 w-3" />
                      Embeddings
                    </div>
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucune ressource trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResources.map((resource) => (
                    <TableRow key={resource.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {resource.is_public ? (
                            <Globe className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">{resource.title}</p>
                            <p className="text-xs text-muted-foreground">{resource.author}</p>
                          </div>
                          {resource.audio_available && (
                            <Volume2 className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeColor(resource.type)}>
                          {resource.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{resource.level}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={resource.sections_count > 0 ? "default" : "secondary"}>
                          {resource.sections_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={resource.readers_count > 0 ? "default" : "secondary"}>
                          {resource.readers_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={resource.highlights_count > 0 ? "default" : "secondary"}>
                          {resource.highlights_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={resource.embeddings_count > 0 ? "default" : "secondary"}>
                          {resource.embeddings_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedResource(resource)}
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

      {/* Resource Details Dialog */}
      <Dialog open={!!selectedResource} onOpenChange={() => setSelectedResource(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {selectedResource?.title}
            </DialogTitle>
          </DialogHeader>
          
          {detailsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="sections" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="sections" className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Sections ({resourceDetails?.sections?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="readers" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Lecteurs ({resourceDetails?.readings?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="highlights" className="flex items-center gap-1">
                  <Highlighter className="h-3 w-3" />
                  Annotations ({resourceDetails?.highlights?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="embeddings" className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Embeddings ({resourceDetails?.embeddings?.length || 0})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[400px] mt-4">
                <TabsContent value="sections" className="space-y-2">
                  {resourceDetails?.sections?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucune section</p>
                  ) : (
                    resourceDetails?.sections?.map((section) => (
                      <Card key={section.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{section.index + 1}</Badge>
                            <div className="flex-1">
                              <p className="font-medium">{section.title}</p>
                              {section.text_content && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {section.text_content.substring(0, 200)}...
                                </p>
                              )}
                            </div>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="readers" className="space-y-2">
                  {resourceDetails?.readings?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucun lecteur</p>
                  ) : (
                    resourceDetails?.readings?.map((reading) => (
                      <Card key={reading.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">Progression</p>
                                <span className="text-sm text-muted-foreground">
                                  {Math.round(reading.progress_percent || 0)}%
                                </span>
                              </div>
                              <Progress value={reading.progress_percent || 0} className="h-2" />
                              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                <span>{Math.round((reading.seconds_read || 0) / 60)} min lues</span>
                                <span>
                                  Dernière lecture: {reading.updated_at ? 
                                    format(new Date(reading.updated_at), 'dd MMM yyyy', { locale: fr }) : 
                                    'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="highlights" className="space-y-2">
                  {resourceDetails?.highlights?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucune annotation</p>
                  ) : (
                    resourceDetails?.highlights?.map((highlight) => (
                      <Card key={highlight.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div 
                              className="w-4 h-4 rounded-full shrink-0 mt-1" 
                              style={{ backgroundColor: highlight.color }}
                            />
                            <div className="flex-1">
                              {highlight.text && (
                                <p className="text-sm italic border-l-2 pl-2 mb-2" style={{ borderColor: highlight.color }}>
                                  "{highlight.text}"
                                </p>
                              )}
                              {highlight.note && (
                                <p className="text-sm text-muted-foreground">
                                  Note: {highlight.note}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {format(new Date(highlight.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="embeddings" className="space-y-2">
                  {resourceDetails?.embeddings?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucun embedding</p>
                  ) : (
                    resourceDetails?.embeddings?.map((embedding) => (
                      <Card key={embedding.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Brain className="h-4 w-4 text-purple-500 shrink-0 mt-1" />
                            <div className="flex-1">
                              {embedding.text_excerpt && (
                                <p className="text-sm line-clamp-3">
                                  {embedding.text_excerpt}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {embedding.section_id && (
                                  <Badge variant="outline" className="text-xs">
                                    Lié à une section
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(embedding.created_at), 'dd MMM yyyy', { locale: fr })}
                                </span>
                              </div>
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
