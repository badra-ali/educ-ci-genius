import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileJson, Printer } from 'lucide-react';
import { useExportData, ExportColumn } from '@/hooks/useExportData';

interface ExportMenuProps {
  data: Record<string, any>[];
  columns: ExportColumn[];
  filename: string;
  title?: string;
}

export function ExportMenu({ data, columns, filename, title }: ExportMenuProps) {
  const { exportToCSV, exportToJSON, exportToPrint } = useExportData();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportToCSV(data, columns, filename)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export CSV (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToJSON(data, filename)}>
          <FileJson className="h-4 w-4 mr-2" />
          Export JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToPrint(data, columns, title || filename)}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimer / PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
