import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter, RotateCcw } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface RelationsFiltersState {
  etablissementId: string | null;
  anneeScolaire: string | null;
  periode: string | null;
  niveau: string | null;
}

interface RelationsFiltersProps {
  filters: RelationsFiltersState;
  onFiltersChange: (filters: RelationsFiltersState) => void;
  showEtablissement?: boolean;
  showAnnee?: boolean;
  showPeriode?: boolean;
  showNiveau?: boolean;
}

const PERIODES = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Semestre 1', 'Semestre 2'];
const NIVEAUX = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'];
const ANNEES_SCOLAIRES = ['2024-2025', '2023-2024', '2022-2023'];

export function RelationsFilters({
  filters,
  onFiltersChange,
  showEtablissement = true,
  showAnnee = true,
  showPeriode = true,
  showNiveau = true,
}: RelationsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch etablissements
  const { data: etablissements } = useQuery({
    queryKey: ['etablissements-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etablissements')
        .select('id, nom')
        .eq('actif', true)
        .order('nom');
      
      if (error) throw error;
      return data;
    },
  });

  const activeFiltersCount = [
    filters.etablissementId,
    filters.anneeScolaire,
    filters.periode,
    filters.niveau,
  ].filter(Boolean).length;

  const handleReset = () => {
    onFiltersChange({
      etablissementId: null,
      anneeScolaire: null,
      periode: null,
      niveau: null,
    });
  };

  const handleRemoveFilter = (key: keyof RelationsFiltersState) => {
    onFiltersChange({
      ...filters,
      [key]: null,
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtres avancés</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 px-2"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            </div>

            {showEtablissement && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Établissement</label>
                <Select
                  value={filters.etablissementId || 'all'}
                  onValueChange={(value) => 
                    onFiltersChange({ 
                      ...filters, 
                      etablissementId: value === 'all' ? null : value 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les établissements" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les établissements</SelectItem>
                    {etablissements?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showAnnee && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Année scolaire</label>
                <Select
                  value={filters.anneeScolaire || 'all'}
                  onValueChange={(value) => 
                    onFiltersChange({ 
                      ...filters, 
                      anneeScolaire: value === 'all' ? null : value 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les années" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les années</SelectItem>
                    {ANNEES_SCOLAIRES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showPeriode && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Période</label>
                <Select
                  value={filters.periode || 'all'}
                  onValueChange={(value) => 
                    onFiltersChange({ 
                      ...filters, 
                      periode: value === 'all' ? null : value 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les périodes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les périodes</SelectItem>
                    {PERIODES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showNiveau && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Niveau</label>
                <Select
                  value={filters.niveau || 'all'}
                  onValueChange={(value) => 
                    onFiltersChange({ 
                      ...filters, 
                      niveau: value === 'all' ? null : value 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les niveaux" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    {NIVEAUX.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filters badges */}
      {filters.etablissementId && showEtablissement && (
        <Badge variant="secondary" className="gap-1">
          {etablissements?.find(e => e.id === filters.etablissementId)?.nom || 'Établissement'}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => handleRemoveFilter('etablissementId')} 
          />
        </Badge>
      )}
      {filters.anneeScolaire && showAnnee && (
        <Badge variant="secondary" className="gap-1">
          {filters.anneeScolaire}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => handleRemoveFilter('anneeScolaire')} 
          />
        </Badge>
      )}
      {filters.periode && showPeriode && (
        <Badge variant="secondary" className="gap-1">
          {filters.periode}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => handleRemoveFilter('periode')} 
          />
        </Badge>
      )}
      {filters.niveau && showNiveau && (
        <Badge variant="secondary" className="gap-1">
          {filters.niveau}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => handleRemoveFilter('niveau')} 
          />
        </Badge>
      )}
    </div>
  );
}

export const defaultFilters: RelationsFiltersState = {
  etablissementId: null,
  anneeScolaire: null,
  periode: null,
  niveau: null,
};
