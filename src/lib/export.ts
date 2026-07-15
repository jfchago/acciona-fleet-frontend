export type ExportFormat = 'csv' | 'xlsx';

type ExportOptions = {
  format: ExportFormat;
  country: string;
  filter: string;
};

export async function downloadFlotaVivaExport({ format, country, filter }: ExportOptions): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
  const query = new URLSearchParams({ format, country, filter });
  const response = await fetch(`${baseUrl}/api/v1/flota-viva/export?${query}`, { credentials: 'include' });

  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `flota-viva.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}
