'use client';

import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, loadCarFleetRequestMasters, updateRequest, type CarFleetRequestMasters } from '../../src/lib/carfleet-requests';
import type { components } from '../../src/generated/openapi';
import styles from './styles.module.css';

type Request = components['schemas']['CarFleetRequest'];
type EditableRequest = Request & Record<string, unknown>;
type Feedback = { kind: 'loading' | 'empty' | 'validation' | 'conflict' | 'permission' | 'success' | 'failure'; message: string } | null;

export const LEGACY_COLUMNS = [
  'RegSelecction', 'RenewableFuel', 'PlanMoves', 'PetitionDate', 'SDN', 'PetitionID', 'DivisionName', 'LicencePlate',
  'Susti', 'DriverName', 'Directores', 'StateID', 'Classification', 'StartTerm', 'EndTerm', 'CancellationDate', 'CostCenter',
  'MonthlyFee', 'Provider', 'Contract', 'FuelType', 'Co2Index', 'EnvironmentalTag', 'UploadFiles', 'Documentation',
  'ViewFiles', 'Copy', 'Delete', 'Country',
] as const;

const LEGACY_COLUMN_LABELS: Record<typeof LEGACY_COLUMNS[number], string> = {
  RegSelecction: 'Inc', RenewableFuel: 'CR', PlanMoves: 'PM', PetitionDate: 'Fecha', SDN: 'SDN', PetitionID: 'Solicitud',
  DivisionName: 'Sociedad', LicencePlate: 'Matrícula', Susti: 'Sustitución', DriverName: 'Conductor Asignado', Directores: 'D',
  StateID: 'Estado', Classification: 'Clasificación', StartTerm: 'Inicio Contrato', EndTerm: 'Fin Contrato',
  CancellationDate: 'Fecha Baja', CostCenter: 'Centro de Coste', MonthlyFee: 'Cuota', Provider: 'Proveedor', Contract: 'Contrato',
  FuelType: 'Motor', Co2Index: 'CO2', EnvironmentalTag: 'Etiqueta Medioambiental', UploadFiles: 'Cargar Ficheros',
  Documentation: 'Documentación', ViewFiles: 'Ver Ficheros', Copy: 'Copiar', Delete: 'Eliminar', Country: 'País',
};

type LegacyColumn = typeof LEGACY_COLUMNS[number];

const SAMPLE_REQUESTS: Request[] = [
  { id: 12041, sdn: 'SDN-24018', registration: '1234-LMN', contractStart: '2026-01-15', state: 2, cancellationDate: null, contractTerm: 36, contractEndDate: '2028-12-31', cardLastFourDigits: '1842', retired: false, version: '"12041-v3"', updatedAt: '2026-07-16', costCenter: 'CC-4102', viaTCard: 'NO', viaTCardRequested: 'B', regSelection: 1, regSelectionUser: 'mlopez' },
  { id: 12042, sdn: 'SDN-24019', registration: '5678-PRS', contractStart: '2026-02-01', state: 1, cancellationDate: null, contractTerm: 24, contractEndDate: '2028-01-31', cardLastFourDigits: '2204', retired: false, version: '"12042-v1"', updatedAt: '2026-07-15', costCenter: 'CC-4108', viaTCard: 'YES', viaTCardRequested: 'A', regSelection: 0, regSelectionUser: 'agarcia' },
  { id: 12043, sdn: 'SDN-24020', registration: '9012-TUV', contractStart: '2025-11-20', state: 3, cancellationDate: '2026-06-02', contractTerm: 12, contractEndDate: '2026-10-31', cardLastFourDigits: null, retired: true, version: '"12043-v7"', updatedAt: '2026-07-10', costCenter: 'CC-4110', viaTCard: null, viaTCardRequested: null, regSelection: 1, regSelectionUser: 'jruiz' },
];

const displayValue = (request: Request, column: LegacyColumn): string | number | boolean => {
  const values: Record<LegacyColumn, string | number | boolean | null | undefined> = {
    RegSelecction: request.regSelection ?? '', RenewableFuel: request.renewableFuel ?? '', PlanMoves: request.planMoves ?? '', PetitionDate: request.updatedAt ?? '', SDN: request.sdn,
    PetitionID: request.petitionId ?? '', DivisionName: request.divisionName ?? '', LicencePlate: request.registration, Susti: request.substitutionVehicle ?? '', DriverName: request.driverName ?? '', Directores: request.director ?? '',
    StateID: request.stateCode ?? request.state ?? '', Classification: request.vehicleClassification ?? '', StartTerm: request.contractStart, EndTerm: request.contractEndDate ?? '', CancellationDate: request.cancellationDate ?? '',
    CostCenter: request.costCenter ?? '', MonthlyFee: request.monthlyFee ?? '', Provider: request.provider ?? '', Contract: request.contract ?? '', FuelType: request.fuelType ?? '',
    Co2Index: request.co2Index ?? '', EnvironmentalTag: request.environmentalTag ?? '', UploadFiles: '', Documentation: request.documentation ?? '', ViewFiles: '', Copy: '', Delete: '', Country: request.country ?? '',
  };
  return values[column] ?? '';
};

const EDITABLE_FIELDS: Partial<Record<LegacyColumn, keyof Request>> = {
  RegSelecction: 'regSelection', PetitionDate: 'updatedAt', SDN: 'sdn', LicencePlate: 'registration',
  StateID: 'state', Classification: 'vehicleClassification', StartTerm: 'contractStart', EndTerm: 'contractEndDate', CancellationDate: 'cancellationDate', CostCenter: 'costCenter',
  MonthlyFee: 'monthlyFee',
};

const editableField = (column: LegacyColumn): keyof Request | undefined => EDITABLE_FIELDS[column];

const isChecked = (value: string | number | boolean) => value === true || value === 1 || value === '1' || value === 'true';

const stateLabel = (request: Request, masters: CarFleetRequestMasters | null) => {
  const state = masters?.states.find(option => option.id === request.state);
  const code = request.stateCode ?? state?.code ?? '';
  const description = request.stateDescription ?? state?.description ?? '';
  return [code, description].filter(Boolean).join(' · ') || request.state?.toString() || '';
};

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return <p className={`${styles.feedback} ${styles[feedback.kind]}`} role={feedback.kind === 'failure' || feedback.kind === 'permission' ? 'alert' : 'status'} aria-live="polite">{feedback.message}</p>;
}

export default function CarFleetRequestsPage() {
  const pageSize = 50;
  const [visibility, setVisibility] = useState<'ACTIVE' | 'ALL'>('ACTIVE');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filter, setFilter] = useState('');
  const [requests, setRequests] = useState<Request[]>(SAMPLE_REQUESTS);
  const [selectedId, setSelectedId] = useState<number | null>(SAMPLE_REQUESTS[0].id);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditableRequest | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'loading', message: 'Cargando solicitudes activas…' });
  const [busy, setBusy] = useState(false);
  const [masters, setMasters] = useState<CarFleetRequestMasters | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const loadRequests = useCallback(async () => {
    setFeedback({ kind: 'loading', message: 'Cargando solicitudes…' });
    const result = await api.GET('/api/v1/car-fleet-requests', { params: { query: { visibility, page, size: pageSize, filter: filter || undefined } } });
    if (result.error) {
      setFeedback({ kind: result.response.status === 403 ? 'permission' : 'failure', message: result.response.status === 403 ? 'No tienes permisos para consultar este espacio.' : 'No se pudieron cargar las solicitudes. Revisa la conexión y reintenta.' });
      return;
    }
    setRequests(result.data.items);
    setTotalElements(result.data.totalElements);
    setSelectedId(current => result.data.items.some(item => item.id === current) ? current : (result.data.items[0]?.id ?? null));
    setFeedback(result.data.items.length ? null : { kind: 'empty', message: 'No hay solicitudes para este filtro. Prueba con “Todos” o limpia la búsqueda.' });
  }, [filter, page, pageSize, visibility]);

  useEffect(() => {
    void loadCarFleetRequestMasters().then(setMasters).catch(() => setFeedback({ kind: 'failure', message: 'No se pudieron cargar los maestros de estado y clasificación.' }));
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void loadRequests(); }, 0); return () => window.clearTimeout(timer); }, [loadRequests]);

  const filteredRequests = useMemo(() => requests.filter(request => {
    const haystack = `${request.id} ${request.sdn ?? ''} ${request.registration ?? ''} ${request.costCenter ?? ''}`.toLowerCase();
    return haystack.includes(filter.toLowerCase());
  }), [filter, requests]);
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const loading = feedback?.kind === 'loading';
  const selected = requests.find(request => request.id === selectedId) ?? null;

  const selectRow = (id: number) => setSelectedId(id);
  const beginEdit = (request: Request) => { setSelectedId(request.id); setEditingId(request.id); setDraft({ ...request }); setFeedback(null); };
  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, request: Request) => {
    if (event.key === 'Enter' || event.key === 'F2') { event.preventDefault(); beginEdit(request); }
  };
  const changeField = (field: keyof Request, value: string | number | boolean | null) => setDraft(current => current ? { ...current, [field]: value } : current);
  const save = async () => {
    if (!draft || editingId === null) { setFeedback({ kind: 'validation', message: 'Selecciona una fila y entra en modo edición antes de guardar.' }); return; }
    const sdn = String(draft.sdn ?? '').trim();
    const registration = String(draft.registration ?? '').trim();
    if (!sdn && !registration) { setFeedback({ kind: 'validation', message: 'No se puede guardar: SDN y matrícula son obligatorios.' }); return; }
    if (!sdn) { setFeedback({ kind: 'validation', message: 'No se puede guardar: el campo SDN es obligatorio.' }); return; }
    if (!registration) { setFeedback({ kind: 'validation', message: 'No se puede guardar: la matrícula es obligatoria.' }); return; }
    setBusy(true);
    setFeedback({ kind: 'loading', message: 'Guardando cambios…' });
    try {
      const result = await updateRequest(draft);
      if (result.kind !== 'success') { setFeedback(result.kind === 'conflict' ? { kind: 'conflict', message: 'La solicitud cambió en otra sesión. Recarga para comparar antes de guardar.' } : result.kind === 'permission' ? { kind: 'permission', message: 'No tienes permiso para editar esta solicitud.' } : { kind: 'failure', message: 'No se pudo guardar. Conservamos tus cambios para reintentar.' }); return; }
      setRequests(current => current.map(request => request.id === draft.id ? result.item : request));
      setDraft(null); setEditingId(null); setFeedback({ kind: 'success', message: 'Solicitud guardada correctamente.' });
    } catch {
      setFeedback({ kind: 'failure', message: 'No se pudo conectar con el backend. Conservamos tus cambios para reintentar.' });
    } finally {
      setBusy(false);
    }
  };
  const cancel = () => { setDraft(null); setEditingId(null); setFeedback({ kind: 'success', message: 'Edición cancelada; no se modificó la solicitud.' }); };
  const action = async (name: 'retire' | 'reinstate' | 'duplicate') => {
    if (!selected) return;
    setBusy(true);
    const result = name === 'duplicate'
      ? await api.POST('/api/v1/car-fleet-requests/{id}/duplicate', { params: { path: { id: selected.id } } })
      : await api.POST(`/api/v1/car-fleet-requests/{id}/${name}`, { params: { path: { id: selected.id }, header: { 'If-Match': selected.version } } });
    setBusy(false);
    if (result.error) { setFeedback({ kind: result.response.status === 403 ? 'permission' : result.response.status === 409 ? 'conflict' : 'failure', message: result.response.status === 409 ? 'La operación entró en conflicto; recarga la solicitud.' : result.response.status === 403 ? 'No tienes permiso para ejecutar esta acción.' : 'La operación no se pudo completar.' }); return; }
    setRequests(current => name === 'duplicate' ? [...current, result.data] : current.map(request => request.id === selected.id ? result.data : request));
    setSelectedId(result.data.id); setFeedback({ kind: 'success', message: name === 'duplicate' ? 'Solicitud duplicada.' : `Solicitud ${name === 'retire' ? 'retirada' : 'reinstaurada'}.` });
  };

  const renderCell = (request: Request, column: LegacyColumn) => {
    const field = editableField(column);
    const value = draft && editingId === request.id && field ? draft[field] : column === 'StateID' ? stateLabel(request, masters) : displayValue(request, column);
    if (editingId !== request.id || !field) {
      return column === 'RegSelecction' || column === 'RenewableFuel' || column === 'PlanMoves' || column === 'Documentation'
        ? <input aria-label={`${LEGACY_COLUMN_LABELS[column]} ${request.id}`} type="checkbox" checked={isChecked(value ?? '')} readOnly />
        : <span>{String(value)}</span>;
    }
    if (column === 'StateID') return <select aria-label={`${LEGACY_COLUMN_LABELS[column]} ${request.id}`} value={String(draft?.state ?? '')} disabled={!masters?.states.length} onChange={event => changeField(field, event.target.value ? Number(event.target.value) : null)}><option value="">—</option>{masters?.states.map(option => <option key={option.id} value={option.id}>{option.code} · {option.description}</option>)}</select>;
    if (column === 'Classification') return <select aria-label={`${LEGACY_COLUMN_LABELS[column]} ${request.id}`} value={String(draft?.vehicleClassification ?? '')} disabled={!masters?.classifications.length} onChange={event => changeField(field, event.target.value || null)}><option value="">—</option>{masters?.classifications.map(option => <option key={option.id} value={option.value}>{option.value}</option>)}</select>;
    const inputType = column.includes('Date') || column.includes('Term') ? 'date' : 'text';
    return <input aria-label={`${LEGACY_COLUMN_LABELS[column]} ${request.id}`} type={inputType} value={String(value ?? '')} onChange={(event: ChangeEvent<HTMLInputElement>) => changeField(field, event.target.value)} />;
  };

  return <main className={styles.page}>
    <header className={styles.header}><div><p className={styles.eyebrow}>ACCIONA · FLOTA VIVA</p><h1>Solicitudes CarFleet</h1><p className={styles.subtitle}>Espacio operativo para revisar y actualizar peticiones de vehículos.</p></div><span className={styles.live}>● Operativo</span></header>
    <section className={styles.toolbar} aria-label="Filtros y acciones maestras"><div className={styles.tabs} role="tablist" aria-label="Visibilidad"><button role="tab" aria-selected={visibility === 'ACTIVE'} className={visibility === 'ACTIVE' ? styles.activeTab : ''} onClick={() => { setVisibility('ACTIVE'); setPage(0); }}>Activas</button><button role="tab" aria-selected={visibility === 'ALL'} className={visibility === 'ALL' ? styles.activeTab : ''} onClick={() => { setVisibility('ALL'); setPage(0); }}>Todas</button></div><label className={styles.search}>Buscar <input value={filter} maxLength={100} onChange={event => { setFilter(event.target.value); setPage(0); }} placeholder="SDN, matrícula o centro de coste" /></label><button className={styles.secondary} onClick={() => void loadRequests()}>Recargar</button></section>
    <FeedbackBanner feedback={feedback} />
    <section className={styles.workspace}>
      <div className={styles.tablePanel}><div className={styles.panelHeading}><div><h2>Listado legacy</h2><p>{totalElements} solicitudes · página {Math.min(page + 1, totalPages)} de {totalPages}</p></div><button type="button" className={styles.primary} onClick={() => selected && beginEdit(selected)} disabled={!selected}>Editar seleccionada</button></div><div className={styles.tableScroller} ref={tableRef} tabIndex={0} aria-label="Tabla legacy de 29 columnas, usa Mayús más rueda para desplazarte horizontalmente"><table><thead><tr>{LEGACY_COLUMNS.map(column => <th key={column} scope="col">{LEGACY_COLUMN_LABELS[column]}</th>)}</tr></thead><tbody>{filteredRequests.map(request => <tr key={request.id} className={selectedId === request.id ? styles.selectedRow : ''} tabIndex={0} aria-selected={selectedId === request.id} onClick={() => selectRow(request.id)} onDoubleClick={() => beginEdit(request)} onKeyDown={event => onRowKeyDown(event, request)}>{LEGACY_COLUMNS.map(column => <td key={column}>{renderCell(request, column)}</td>)}</tr>)}</tbody></table></div><nav className={styles.pagination} aria-label="Paginación de solicitudes"><button type="button" className={styles.secondary} onClick={() => setPage(current => current - 1)} disabled={loading || page === 0}>Anterior</button><span>Página {Math.min(page + 1, totalPages)} de {totalPages}</span><button type="button" className={styles.secondary} onClick={() => setPage(current => current + 1)} disabled={loading || page + 1 >= totalPages}>Siguiente</button></nav>{editingId !== null && <div className={styles.editBar} role="group" aria-label="Controles de edición"><span>Editar fila {editingId} · los cambios siguen sin guardar</span><div><button type="button" className={styles.primary} onClick={() => { setFeedback({ kind: 'loading', message: 'Iniciando guardado…' }); void save(); }} disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button><button type="button" className={styles.secondary} onClick={cancel} disabled={busy}>Cancelar</button></div></div>}</div>
      <aside className={styles.detail} aria-label="Detalle de solicitud"><div className={styles.panelHeading}><div><h2>Detalle</h2><p>{selected ? (selected.petitionId ?? `Petición #${selected.id}`) : 'Selecciona una fila'}</p></div></div>{selected ? <><dl>{[['SDN', selected.sdn], ['Matrícula', selected.registration], ['Estado', selected.stateCode ?? selected.state ?? '—'], ['Inicio', selected.contractStart], ['Fin', selected.contractEndDate ?? '—'], ['Versión', selected.version]].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{String(value)}</dd></div>)}</dl><div className={styles.detailActions}><p>Acciones de solicitud</p><button onClick={() => void action('retire')} disabled={busy || selected.retired}>Retirar</button><button onClick={() => void action('reinstate')} disabled={busy || !selected.retired}>Reinstaurar</button><button onClick={() => void action('duplicate')} disabled={busy}>Duplicar</button></div></> : <p className={styles.muted}>El detalle mantiene el contexto de la fila seleccionada.</p>}</aside>
    </section>
    <p className={styles.srOnly} aria-live="polite">{editingId ? `Editando la fila ${editingId}` : selected ? `Fila ${selected.id} seleccionada` : 'Ninguna fila seleccionada'}</p>
  </main>;
}
