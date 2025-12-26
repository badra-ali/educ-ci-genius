import { useCallback } from 'react';
import { toast } from 'sonner';

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export function useExportData() {
  // Export to CSV
  const exportToCSV = useCallback((
    data: Record<string, any>[],
    columns: ExportColumn[],
    filename: string
  ) => {
    if (!data || data.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      // Create header row
      const headers = columns.map(col => col.label);
      
      // Create data rows
      const rows = data.map(item => 
        columns.map(col => {
          const value = item[col.key];
          if (col.format) return col.format(value);
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value);
        })
      );

      // Combine header and rows
      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(';'))
      ].join('\n');

      // Add BOM for Excel UTF-8 compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Download file
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Export réussi: ${filename}.csv`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  }, []);

  // Export to JSON
  const exportToJSON = useCallback((
    data: Record<string, any>[],
    filename: string
  ) => {
    if (!data || data.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Export réussi: ${filename}.json`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  }, []);

  // Generate printable HTML for PDF-like export
  const exportToPrint = useCallback((
    data: Record<string, any>[],
    columns: ExportColumn[],
    title: string
  ) => {
    if (!data || data.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Impossible d\'ouvrir la fenêtre d\'impression');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; font-size: 24px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  ${columns.map(col => {
                    const value = item[col.key];
                    let displayValue = '';
                    if (col.format) displayValue = col.format(value);
                    else if (value === null || value === undefined) displayValue = '-';
                    else if (typeof value === 'object') displayValue = JSON.stringify(value);
                    else displayValue = String(value);
                    return `<td>${displayValue}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Total: ${data.length} enregistrement(s)</p>
          </div>
          <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
            Imprimer / Enregistrer en PDF
          </button>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

      toast.success('Document prêt pour l\'impression');
    } catch (error) {
      console.error('Print export error:', error);
      toast.error('Erreur lors de la préparation de l\'impression');
    }
  }, []);

  return {
    exportToCSV,
    exportToJSON,
    exportToPrint,
  };
}
