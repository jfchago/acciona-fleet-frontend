'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { components } from '../../src/generated/openapi';
import { api } from '../../src/lib/api';
import { downloadFlotaVivaExport, type ExportFormat } from '../../src/lib/export';
import styles from './styles.module.css';

type Row = components['schemas']['FlotaVivaRow'];
type Page = components['schemas']['FlotaVivaPage'];

const fields = [
  'id', 'petitionDate', 'divisionFiscalNumber', 'sociedad', 'nombreSociedad', 'matricula',
  'fleetSegmentation', 'marca', 'modelo', 'descripcionVehiculo', 'motorizacion', 'etiqueta',
  'co2', 'cuota', 'estadoVehiculo', 'fechaInicio', 'fechaFin', 'fechaExtension',
  'proveedor', 'clasificacion', 'renewableFuel', 'costCenter', 'codeElement', 'driverName',
  'driverMail', 'driverAdditionalMail', 'responsableVehicle', 'emailResponsableVehicle', 'country',
] as const satisfies readonly (keyof Row)[];

export default function FlotaVivaPage() {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState<Page>();
  const [selected, setSelected] = useState<Row>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const panelRef = useRef<HTMLElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  // The request depends on the current page number, not the page response object.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.GET('/api/v1/flota-viva', {
        params: { query: { page: page?.page ?? 0, size: 50, sort: 'matricula', country: 'ES', filter } },
      });
      if (response.error || !response.data) {
        setError(true);
        setPage(undefined);
      } else {
        setPage(response.data);
      }
    } catch {
      setError(true);
      setPage(undefined);
    } finally {
      setLoading(false);
    }
  }, [filter, page?.page]);

  // The effect is the API synchronization boundary: it intentionally updates loading/data state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function download(format: ExportFormat) {
    setExportFormat(format);
    setExporting(true);
    setExportError(false);
    try {
      await downloadFlotaVivaExport({ format, country: 'ES', filter });
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    if (!selected) return;

    lastFocusedElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();

    return () => {
      lastFocusedElement.current?.focus();
      lastFocusedElement.current = null;
    };
  }, [selected]);

  function handlePanelKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setSelected(undefined);
      return;
    }

    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return <section className={styles.container} aria-labelledby="flota-viva-title">
    <header className={styles.intro}>
      <h1 id="flota-viva-title">Flota Viva</h1>
      <p>Consulta operativa de vehículos activos</p>
    </header>
    <section className={styles.toolbar} aria-label="Filtros y exportación">
      <div className={styles.filterField}>
        <label htmlFor="filter">Filtrar</label>
        <input id="filter" value={filter} maxLength={100} onChange={event => { setFilter(event.target.value); setPage(undefined); }} placeholder="Buscar matrícula, sociedad, marca..." />
      </div>
      <button className={styles.button} type="button" onClick={() => { setFilter(''); setPage(undefined); }}>Limpiar</button>
      <button className={styles.primaryButton} type="button" disabled={exporting} onClick={() => void download('csv')}>CSV</button>
      <button className={styles.primaryButton} type="button" disabled={exporting} onClick={() => void download('xlsx')}>XLSX</button>
    </section>
    {exportError && <section className={`${styles.state} ${styles.errorState}`} role="alert"><p>No se pudo preparar la exportación.</p><button className={styles.button} type="button" onClick={() => void download(exportFormat)}>Reintentar exportación</button></section>}
    {loading && <p className={styles.state} role="status" aria-live="polite">Cargando información…</p>}
    {error && <section className={`${styles.state} ${styles.errorState}`} role="alert"><p>La información no está disponible ahora.</p><button className={styles.button} type="button" onClick={() => void load()}>Reintentar</button></section>}
    {!loading && !error && page && <>
      <p className={styles.successMeta}>Datos {page.freshness.status.toLowerCase()} · comprobados {new Date(page.freshness.checkedAt).toLocaleString()}</p>
      {page.items.length === 0 ? <p className={styles.state} role="status">No hay vehículos que coincidan con el filtro.</p> : <div className={styles.tableWrap}><table className={styles.table}><caption className="srOnly">Vehículos activos</caption><thead><tr>{['Matrícula', 'Marca', 'Modelo', 'Sociedad', 'Estado vehículo'].map(field => <th key={field} scope="col">{field}</th>)}</tr></thead><tbody>{page.items.map((row, index) => <tr key={String(row.id ?? row.matricula ?? index)} role="button" tabIndex={0} aria-pressed={selected === row} onClick={() => setSelected(row)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(row); } }}><td>{String(row.matricula ?? '')}</td><td>{String(row.marca ?? '')}</td><td>{String(row.modelo ?? '')}</td><td>{String(row.sociedad ?? '')}</td><td>{String(row.estadoVehiculo ?? '')}</td></tr>)}</tbody></table></div>}
      <nav className={styles.pagination} aria-label="Paginación de Flota Viva"><button className={styles.button} type="button" disabled={page.page === 0} onClick={() => setPage({ ...page, page: page.page - 1 })}>Anterior</button><span>Página {page.page + 1} de {Math.max(page.totalPages, 1)} · {page.totalElements} vehículos</span><button className={styles.button} type="button" disabled={!page.hasNext} onClick={() => setPage({ ...page, page: page.page + 1 })}>Siguiente</button></nav>
    </>}
    {selected && <aside ref={panelRef} className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="vehicle-detail-title" tabIndex={-1} onKeyDown={handlePanelKeyDown}><div className={styles.panelHeader}><h2 id="vehicle-detail-title">{String(selected.matricula ?? 'Vehículo')}</h2><button className={styles.closeButton} type="button" onClick={() => setSelected(undefined)} aria-label="Cerrar detalle">×</button></div><dl className={styles.detail}>{fields.map(field => <div className={styles.detailRow} key={field}><dt>{field}</dt><dd>{String(selected[field] ?? '')}</dd></div>)}</dl></aside>}
  </section>;
}
