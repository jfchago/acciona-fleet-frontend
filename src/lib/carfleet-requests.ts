import createClient from 'openapi-fetch';
import type { components, paths } from '../generated/openapi';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
export const api = createClient<paths>({ baseUrl });
export type Request = components['schemas']['CarFleetRequest'];
export type UpdateResult = { kind: 'success'; item: Request } | { kind: 'conflict' | 'permission' | 'failure'; message: string };

export type StateMaster = { id: number; code: string; description: string };
export type VehicleClassificationMaster = { id: number; value: string };
export type CarFleetRequestMasters = { states: StateMaster[]; classifications: VehicleClassificationMaster[] };

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
  const result = await api.PATCH('/api/v1/car-fleet-requests/{id}', {
    params: { path: { id: request.id }, header: { 'If-Match': request.version } },
    body: {
      sdn: request.sdn,
      registration: request.registration,
      contractStart: request.contractStart,
      state: request.state ?? undefined,
      cancellationDate: request.cancellationDate ?? undefined,
      contractTerm: request.contractTerm ?? undefined,
      monthlyFee: request.monthlyFee ?? undefined,
      vehicleClassification: request.vehicleClassification ?? undefined,
      regSelection: request.regSelection ?? undefined,
      regSelectionUser: request.regSelectionUser ?? undefined,
      costCenter: request.costCenter ?? undefined,
      viaTCard: request.viaTCard ?? undefined,
      viaTCardRequested: request.viaTCardRequested === 'A' || request.viaTCardRequested === 'B' ? request.viaTCardRequested : undefined,
    },
  });
  if (!result.error) return { kind: 'success', item: result.data.item };
  if (result.response.status === 409) return { kind: 'conflict', message: 'conflict' };
  if (result.response.status === 403) return { kind: 'permission', message: 'permission' };
  return { kind: 'failure', message: 'failure' };
}
