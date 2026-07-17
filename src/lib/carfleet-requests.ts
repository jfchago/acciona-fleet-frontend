import createClient from 'openapi-fetch';
import type { components, paths } from '../generated/openapi';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
export const api = createClient<paths>({ baseUrl });
export type Request = components['schemas']['CarFleetRequest'];
export type UpdateResult = { kind: 'success'; item: Request } | { kind: 'conflict' | 'permission' | 'failure'; message: string };

export type StateMaster = { id: number; code: string; description: string };
export type VehicleClassificationMaster = { id: number; value: string };
export type CarFleetRequestMasters = { states: StateMaster[]; classifications: VehicleClassificationMaster[] };

const optionalText = (value: unknown) => {
  if (typeof value !== 'string') return value ?? undefined;
  const normalized = value.trim();
  return normalized || undefined;
};

const optionalNumber = (value: unknown) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const normalized = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
};

export const asIfMatch = (version: string) => {
  const normalized = version.trim();
  return normalized.startsWith('"') && normalized.endsWith('"') ? normalized : `"${normalized}"`;
};

export async function loadCarFleetRequestMasters(): Promise<CarFleetRequestMasters> {
  const [statesResult, classificationsResult] = await Promise.all([
    api.GET('/api/v1/car-fleet-requests/states'),
    api.GET('/api/v1/car-fleet-requests/vehicle-classifications'),
  ]);
  if (statesResult.error) throw new Error('States request failed');
  if (classificationsResult.error) throw new Error('Classifications request failed');
  return {
    states: statesResult.data,
    classifications: classificationsResult.data.map(({ id, name }) => ({ id, value: name })),
  };
}

export async function updateRequest(request: Request): Promise<UpdateResult> {
  let result;
  try {
    result = await api.PATCH('/api/v1/car-fleet-requests/{id}', {
      params: { path: { id: request.id }, header: { 'If-Match': asIfMatch(request.version) } },
      body: {
        sdn: optionalText(request.sdn) as string | undefined,
        registration: optionalText(request.registration) as string | undefined,
        contractStart: optionalText(request.contractStart) as string | undefined,
        state: optionalNumber(request.state),
        cancellationDate: optionalText(request.cancellationDate) as string | undefined,
        contractTerm: optionalNumber(request.contractTerm),
        monthlyFee: optionalNumber(request.monthlyFee),
        vehicleClassification: optionalText(request.vehicleClassification) as string | undefined,
        regSelection: optionalNumber(request.regSelection),
        costCenter: optionalText(request.costCenter) as string | undefined,
        viaTCard: optionalText(request.viaTCard) as string | undefined,
        viaTCardRequested: request.viaTCardRequested === 'A' || request.viaTCardRequested === 'B' ? request.viaTCardRequested : undefined,
      },
    });
  } catch {
    return { kind: 'failure', message: 'No se pudo conectar con el backend.' };
  }
  if (!result.error) return { kind: 'success', item: result.data.item };
  if (result.response.status === 409) return { kind: 'conflict', message: 'conflict' };
  if (result.response.status === 403) return { kind: 'permission', message: 'permission' };
  const problem = result.error as { detail?: string; title?: string };
  return { kind: 'failure', message: problem.detail ?? problem.title ?? `El backend rechazó la solicitud (${result.response.status}).` };
}
