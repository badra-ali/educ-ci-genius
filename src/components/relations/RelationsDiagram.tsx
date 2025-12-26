import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  FileText, 
  HelpCircle,
  Bot,
  Library,
  Calendar,
  ArrowRight,
  School,
  ClipboardCheck,
  MessageSquare,
  Brain,
  Database,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RelationNode {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  count?: number;
}

interface RelationEdge {
  from: string;
  to: string;
  label: string;
  description?: string;
}

interface RelationsDiagramProps {
  module: 'classe-virtuelle' | 'suivi-scolaire' | 'bibliotheque' | 'tuteur-ia';
  stats?: Record<string, number>;
}

const moduleConfigs: Record<string, { nodes: RelationNode[]; edges: RelationEdge[] }> = {
  'classe-virtuelle': {
    nodes: [
      { id: 'cours', label: 'Cours', icon: BookOpen, color: 'bg-primary' },
      { id: 'devoirs', label: 'Devoirs', icon: FileText, color: 'bg-red-500' },
      { id: 'qcms', label: 'QCMs', icon: HelpCircle, color: 'bg-yellow-500' },
      { id: 'threads', label: 'Forums', icon: MessageSquare, color: 'bg-purple-500' },
      { id: 'classes', label: 'Classes', icon: School, color: 'bg-orange-500' },
      { id: 'rendus', label: 'Rendus', icon: ClipboardCheck, color: 'bg-green-500' },
      { id: 'tentatives', label: 'Tentatives', icon: Users, color: 'bg-cyan-500' },
    ],
    edges: [
      { from: 'cours', to: 'devoirs', label: 'crée', description: 'Un cours peut avoir plusieurs devoirs' },
      { from: 'cours', to: 'qcms', label: 'crée', description: 'Un cours peut avoir plusieurs QCMs' },
      { from: 'cours', to: 'threads', label: 'a', description: 'Un cours a un forum de discussion' },
      { from: 'cours', to: 'classes', label: 'assigné à', description: 'Un cours est assigné à des classes' },
      { from: 'devoirs', to: 'rendus', label: 'reçoit', description: 'Les élèves soumettent des rendus' },
      { from: 'qcms', to: 'tentatives', label: 'génère', description: 'Les élèves font des tentatives' },
    ],
  },
  'suivi-scolaire': {
    nodes: [
      { id: 'eleves', label: 'Élèves', icon: GraduationCap, color: 'bg-blue-500' },
      { id: 'classes', label: 'Classes', icon: School, color: 'bg-orange-500' },
      { id: 'notes', label: 'Notes', icon: ClipboardCheck, color: 'bg-green-500' },
      { id: 'presences', label: 'Présences', icon: Calendar, color: 'bg-purple-500' },
      { id: 'enseignants', label: 'Enseignants', icon: Users, color: 'bg-cyan-500' },
      { id: 'edt', label: 'Emploi du temps', icon: Calendar, color: 'bg-indigo-500' },
      { id: 'bulletins', label: 'Bulletins', icon: FileText, color: 'bg-red-500' },
    ],
    edges: [
      { from: 'eleves', to: 'classes', label: 'inscrit', description: 'Un élève est inscrit dans une classe' },
      { from: 'eleves', to: 'notes', label: 'a', description: 'Un élève a des notes' },
      { from: 'eleves', to: 'presences', label: 'a', description: 'Un élève a des présences/absences' },
      { from: 'enseignants', to: 'notes', label: 'saisit', description: 'Les enseignants saisissent les notes' },
      { from: 'classes', to: 'edt', label: 'a', description: 'Une classe a un emploi du temps' },
      { from: 'notes', to: 'bulletins', label: 'génère', description: 'Les notes génèrent les bulletins' },
    ],
  },
  'bibliotheque': {
    nodes: [
      { id: 'resources', label: 'Ressources', icon: Library, color: 'bg-pink-500' },
      { id: 'sections', label: 'Sections', icon: BookOpen, color: 'bg-blue-500' },
      { id: 'lectures', label: 'Lectures', icon: Users, color: 'bg-green-500' },
      { id: 'annotations', label: 'Annotations', icon: MessageSquare, color: 'bg-yellow-500' },
      { id: 'embeddings', label: 'Embeddings IA', icon: Brain, color: 'bg-purple-500' },
    ],
    edges: [
      { from: 'resources', to: 'sections', label: 'divisée en', description: 'Une ressource est divisée en sections/chapitres' },
      { from: 'resources', to: 'lectures', label: 'lue par', description: 'Les utilisateurs lisent les ressources' },
      { from: 'resources', to: 'annotations', label: 'annotée', description: 'Les utilisateurs annotent les ressources' },
      { from: 'resources', to: 'embeddings', label: 'indexée', description: 'Les ressources sont indexées pour la recherche IA' },
    ],
  },
  'tuteur-ia': {
    nodes: [
      { id: 'sessions', label: 'Sessions', icon: Bot, color: 'bg-cyan-500' },
      { id: 'messages', label: 'Messages', icon: MessageSquare, color: 'bg-blue-500' },
      { id: 'qcms', label: 'QCM générés', icon: HelpCircle, color: 'bg-green-500' },
      { id: 'rag', label: 'Resources RAG', icon: Database, color: 'bg-purple-500' },
    ],
    edges: [
      { from: 'sessions', to: 'messages', label: 'contient', description: 'Une session contient des messages' },
      { from: 'sessions', to: 'qcms', label: 'génère', description: 'Une session peut générer des QCMs personnalisés' },
      { from: 'sessions', to: 'rag', label: 'utilise', description: 'Le tuteur utilise les ressources via RAG' },
    ],
  },
};

function DiagramNode({ 
  node, 
  count,
  isSelected,
  onClick 
}: { 
  node: RelationNode; 
  count?: number;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const Icon = node.icon;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer",
        "hover:scale-105 hover:shadow-lg",
        isSelected 
          ? "border-primary bg-primary/10 shadow-md" 
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      <div className={cn("p-3 rounded-full text-white", node.color)}>
        <Icon className="h-6 w-6" />
      </div>
      <span className="font-medium text-sm">{node.label}</span>
      {count !== undefined && (
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      )}
    </div>
  );
}

function DiagramEdge({ edge, isHighlighted }: { edge: RelationEdge; isHighlighted?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg transition-colors",
        isHighlighted ? "bg-primary/10" : "hover:bg-muted"
      )}
    >
      <Badge variant="outline" className="shrink-0">{edge.from}</Badge>
      <div className="flex items-center gap-1 text-muted-foreground">
        <ArrowRight className="h-4 w-4" />
        <span className="text-xs font-medium">{edge.label}</span>
        <ArrowRight className="h-4 w-4" />
      </div>
      <Badge variant="outline" className="shrink-0">{edge.to}</Badge>
      {edge.description && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-6 w-6 p-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      )}
      {isExpanded && edge.description && (
        <p className="text-xs text-muted-foreground ml-2">{edge.description}</p>
      )}
    </div>
  );
}

export function RelationsDiagram({ module, stats }: RelationsDiagramProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const config = moduleConfigs[module];

  const highlightedEdges = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return new Set(
      config.edges
        .filter(e => e.from === selectedNode || e.to === selectedNode)
        .map(e => `${e.from}-${e.to}`)
    );
  }, [selectedNode, config.edges]);

  const getNodeCount = (nodeId: string): number | undefined => {
    if (!stats) return undefined;
    const key = `${nodeId}Count`;
    return stats[key] || stats[nodeId];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="h-5 w-5" />
          Diagramme des relations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="visual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visual">Vue graphique</TabsTrigger>
            <TabsTrigger value="list">Liste des relations</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="mt-4">
            {/* Nodes grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {config.nodes.map((node) => (
                <DiagramNode
                  key={node.id}
                  node={node}
                  count={getNodeCount(node.id)}
                  isSelected={selectedNode === node.id}
                  onClick={() => setSelectedNode(
                    selectedNode === node.id ? null : node.id
                  )}
                />
              ))}
            </div>

            {/* Selected node info */}
            {selectedNode && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">
                  Relations de "{config.nodes.find(n => n.id === selectedNode)?.label}"
                </p>
                <div className="space-y-1">
                  {config.edges
                    .filter(e => e.from === selectedNode || e.to === selectedNode)
                    .map((edge, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        {edge.from === selectedNode 
                          ? `→ ${edge.label} ${edge.to}`
                          : `← ${edge.from} ${edge.label}`
                        }
                        {edge.description && `: ${edge.description}`}
                      </p>
                    ))
                  }
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <div className="space-y-2">
              {config.edges.map((edge, i) => (
                <DiagramEdge
                  key={i}
                  edge={edge}
                  isHighlighted={highlightedEdges.has(`${edge.from}-${edge.to}`)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
