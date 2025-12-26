import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  GraduationCap, 
  User, 
  Users, 
  School, 
  BookOpen, 
  FileText,
  HelpCircle,
  Bot,
  Library,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type EntityType = 
  | 'student' 
  | 'parent' 
  | 'teacher' 
  | 'class' 
  | 'course' 
  | 'assignment' 
  | 'qcm' 
  | 'session' 
  | 'resource'
  | 'schedule';

interface EntityLinkProps {
  type: EntityType;
  id: string;
  name: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
  onClick?: () => void;
  className?: string;
}

const entityConfig: Record<EntityType, { 
  icon: React.ElementType; 
  color: string; 
  route?: (id: string) => string;
}> = {
  student: { 
    icon: GraduationCap, 
    color: 'text-blue-500',
  },
  parent: { 
    icon: User, 
    color: 'text-purple-500',
  },
  teacher: { 
    icon: Users, 
    color: 'text-green-500',
  },
  class: { 
    icon: School, 
    color: 'text-orange-500',
  },
  course: { 
    icon: BookOpen, 
    color: 'text-primary',
    route: (id) => `/classe/${id}`,
  },
  assignment: { 
    icon: FileText, 
    color: 'text-red-500',
    route: (id) => `/devoir/${id}`,
  },
  qcm: { 
    icon: HelpCircle, 
    color: 'text-yellow-500',
    route: (id) => `/qcm/${id}/passer`,
  },
  session: { 
    icon: Bot, 
    color: 'text-cyan-500',
    route: () => `/tuteur-ia`,
  },
  resource: { 
    icon: Library, 
    color: 'text-pink-500',
    route: (id) => `/bibliotheque/${id}`,
  },
  schedule: { 
    icon: Calendar, 
    color: 'text-indigo-500',
    route: () => `/suivi`,
  },
};

export function EntityLink({
  type,
  id,
  name,
  subtitle,
  badge,
  badgeVariant = 'outline',
  onClick,
  className,
}: EntityLinkProps) {
  const config = entityConfig[type];
  const Icon = config.icon;
  const route = config.route?.(id);

  const content = (
    <div className={cn(
      "flex items-center gap-2 group cursor-pointer hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors",
      className
    )}>
      <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate group-hover:text-primary transition-colors">
            {name}
          </span>
          {badge && (
            <Badge variant={badgeVariant} className="text-xs shrink-0">
              {badge}
            </Badge>
          )}
          {route && (
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={onClick} 
            className="text-left w-full"
          >
            {content}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Voir les détails</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (route) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={route} className="block w-full">
            {content}
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Ouvrir dans une nouvelle vue</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

// Mini badge version for compact displays
interface EntityBadgeProps {
  type: EntityType;
  name: string;
  onClick?: () => void;
}

export function EntityBadge({ type, name, onClick }: EntityBadgeProps) {
  const config = entityConfig[type];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 cursor-pointer hover:bg-muted transition-colors",
        onClick && "hover:border-primary"
      )}
      onClick={onClick}
    >
      <Icon className={cn("h-3 w-3", config.color)} />
      {name}
    </Badge>
  );
}

// Navigation breadcrumb for entity relationships
interface EntityBreadcrumbProps {
  items: Array<{
    type: EntityType;
    id: string;
    name: string;
    onClick?: () => void;
  }>;
}

export function EntityBreadcrumb({ items }: EntityBreadcrumbProps) {
  return (
    <div className="flex items-center gap-1 text-sm flex-wrap">
      {items.map((item, index) => {
        const config = entityConfig[item.type];
        const Icon = config.icon;

        return (
          <div key={item.id} className="flex items-center gap-1">
            {index > 0 && <span className="text-muted-foreground mx-1">→</span>}
            <button
              onClick={item.onClick}
              className={cn(
                "flex items-center gap-1 hover:text-primary transition-colors",
                !item.onClick && "cursor-default"
              )}
            >
              <Icon className={cn("h-3 w-3", config.color)} />
              <span>{item.name}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
