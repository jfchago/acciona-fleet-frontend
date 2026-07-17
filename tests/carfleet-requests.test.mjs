import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../app/carfleet-requests/page.tsx', import.meta.url), 'utf8');
const contract = await readFile(new URL('../../../.metacontext/deliverables/contracts/OpenApi.yaml', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/carfleet-requests/styles.module.css', import.meta.url), 'utf8');
const columns = ['RegSelecction', 'RenewableFuel', 'PlanMoves', 'PetitionDate', 'SDN', 'PetitionID', 'DivisionName', 'LicencePlate', 'Susti', 'DriverName', 'Directores', 'StateID', 'Classification', 'StartTerm', 'EndTerm', 'CancellationDate', 'CostCenter', 'MonthlyFee', 'Provider', 'Contract', 'FuelType', 'Co2Index', 'EnvironmentalTag', 'UploadFiles', 'Documentation', 'ViewFiles', 'Copy', 'Delete', 'Country'];

test('renders the exact legacy column order and control types', () => {
  const actual = page.match(/export const LEGACY_COLUMNS = \[([\s\S]*?)\] as const/)?.[1] ?? '';
  assert.deepEqual(actual.match(/'([^']+)'/g)?.map(value => value.slice(1, -1)), columns);
  for (const label of ['Inc', 'Fecha', 'Solicitud', 'Matrícula', 'Conductor Asignado', 'Clasificación', 'Motor', 'Cargar Ficheros', 'Ver Ficheros', 'Copiar', 'Eliminar', 'País']) assert.match(page, new RegExp(label));
  assert.match(page, /type="checkbox"/);
  assert.match(page, /<select aria-label=/);
});

test('keeps selection, row editing and master/detail action contracts', () => {
  assert.match(page, /onDoubleClick=\{\(\) => beginEdit\(request\)\}/);
  assert.match(page, /event\.key === 'Enter' \|\| event\.key === 'F2'/);
  assert.match(page, /Guardar cambios/);
  assert.match(page, /Edición cancelada/);
  assert.match(page, /Acciones de solicitud/);
  assert.match(page, /visibility === 'ACTIVE'/);
});

test('uses the OpenAPI lifecycle paths and optimistic concurrency header', () => {
  for (const path of ['/api/v1/car-fleet-requests', '/api/v1/car-fleet-requests/{id}/duplicate', '/api/v1/car-fleet-requests/{id}/retire', '/api/v1/car-fleet-requests/{id}/reinstate']) assert.match(contract, new RegExp(path.replaceAll('/', '\\/')));
  assert.match(page, /'If-Match': selected.version/);
  assert.match(page, /result\.response\.status === 409/);
});

test('loads legacy State and Spanish VehicleClasification catalogs for inline combos', () => {
  for (const path of ['/api/v1/car-fleet-requests/states', '/api/v1/car-fleet-requests/vehicle-classifications']) assert.match(contract, new RegExp(path.replaceAll('/', '\\/')));
  assert.match(page, /loadCarFleetRequestMasters/);
  assert.match(page, /option\.code/);
  assert.match(page, /option\.description/);
  assert.match(page, /option\.value/);
  assert.match(page, /draft\?\.state/);
  assert.match(page, /draft\?\.vehicleClassification/);
});

test('exposes recovery feedback and responsive/accessibility contracts', () => {
  for (const text of ['Cargando solicitudes', 'No hay solicitudes', 'No se pudo guardar', 'conflicto', 'No tienes permiso', 'guardada correctamente']) assert.match(page, new RegExp(text));
  assert.match(page, /aria-live="polite"/);
  assert.match(css, /@media/);
});

test('requests and navigates server-side pages instead of fixing the table to page zero', () => {
  assert.match(page, /page, size: pageSize/);
  assert.match(page, /setPage\(current => current - 1\)/);
  assert.match(page, /setPage\(current => current \+ 1\)/);
  assert.match(page, /totalElements/);
  assert.match(page, /Paginación de solicitudes/);
});
