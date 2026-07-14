'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../src/lib/api';
import styles from './styles.module.css';

type Row = Record<string, unknown>;
type Page = {
  items: Row[]; page: number; size: number; totalElements: number; totalPages: number;
  hasNext: boolean; freshness: { checkedAt: string; status: string };
};

const fields = [
  'id', 'petitionDate', 'divisionFiscalNumber', 'sociedad', 'nombreSociedad', 'matricula',
  'fleetSegmentation', 'marca', 'modelo', 'descripcionVehiculo', 'motorizacion', 'etiqueta',
  'co2', 'cuota', 'estadoVehiculo', 'fechaInicio', 'fechaFin', 'fechaExtension',
  'proveedor', 'clasificacion', 'renewableFuel', 'costCenter', 'codeElement', 'driverName',
  'driverMail', 'driverAdditionalMail', 'responsableVehicle', 'emailResponsableVehicle', 'country',
];

export default function FlotaVivaPage() {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState<Page>();
  const [selected, setSelected] = useState<Row>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const response = await api.GET('/api/v1/flota-viva', {
      params: { query: { page: page?.page ?? 0, size: 50, sort: 'matricula', country: 'ES', filter } },
    });
    if (response.error || !response.data) { setError(true); setPage(undefined); }
    else setPage(response.data as Page);
    setLoading(false);
  }, [filter, page?.page]);

  // The effect is the API synchronization boundary: it intentionally updates loading/data state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function download(format: 'csv' | 'xlsx') {
    setExporting(true); setExportError(false);
    try {
      const query = new URLSearchParams({ format, country: 'ES', filter });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/api/v1/flota-viva/export?${query}`,
        { credentials: 'include' },
      );
      if (!response.ok) { setExportError(true); return; }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = `flota-viva.${format}`; link.click(); URL.revokeObjectURL(url);
    } catch { setExportError(true); } finally { setExporting(false); }
  }

  return <main className={styles.container}>
    <header><h1>Flota Viva</h1><p>Consulta operativa de vehículos activos</p></header>
    <section className={styles.toolbar}>
      <label htmlFor="filter">Filtrar</label>
      <input id="filter" value={filter} maxLength={100} onChange={event => { setFilter(event.target.value); setPage(undefined); }} placeholder="Buscar matrícula, sociedad, marca..." />
      <button onClick={() => { setFilter(''); setPage(undefined); }}>Limpiar</button>
      <button disabled={exporting} onClick={() => void download('csv')}>CSV</button>
      <button disabled={exporting} onClick={() => void download('xlsx')}>XLSX</button>
    </section>
    {exportError && <section role="alert"><p>No se pudo preparar la exportación.</p><button onClick={() => void download('csv')}>Reintentar exportación</button></section>}
    {loading && <p role="status">Cargando información…</p>}
    {error && <section role="alert"><p>La información no está disponible ahora.</p><button onClick={() => void load()}>Reintentar</button></section>}
    {!loading && !error && page && <>
      <p className={styles.freshness}>Datos {page.freshness.status.toLowerCase()} · comprobados {new Date(page.freshness.checkedAt).toLocaleString()}</p>
      {page.items.length === 0 ? <p role="status">No hay vehículos que coincidan con el filtro.</p> : <div className={styles.tableWrap}><table><thead><tr>{['Matrícula', 'Marca', 'Modelo', 'Sociedad', 'Estado vehículo'].map(field => <th key={field}>{field}</th>)}</tr></thead><tbody>{page.items.map((row, index) => <tr key={String(row.id ?? row.matricula ?? index)} onClick={() => setSelected(row)}><td>{String(row.matricula ?? '')}</td><td>{String(row.marca ?? '')}</td><td>{String(row.modelo ?? '')}</td><td>{String(row.sociedad ?? '')}</td><td>{String(row.estadoVehiculo ?? '')}</td></tr>)}</tbody></table></div>}
      <nav className={styles.pagination}><button disabled={page.page === 0} onClick={() => setPage({ ...page, page: page.page - 1 })}>Anterior</button><span>Página {page.page + 1} de {Math.max(page.totalPages, 1)} · {page.totalElements} vehículos</span><button disabled={!page.hasNext} onClick={() => setPage({ ...page, page: page.page + 1 })}>Siguiente</button></nav>
    </>}
    {selected && <aside className={styles.panel}><button onClick={() => setSelected(undefined)} aria-label="Cerrar detalle">×</button><h2>{String(selected.matricula ?? 'Vehículo')}</h2>{fields.map(field => <p key={field}><strong>{field}:</strong> {String(selected[field] ?? '')}</p>)}</aside>}
  </main>;
}
