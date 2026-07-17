import createClient from 'openapi-fetch';
import type { components, paths } from '../generated/openapi';

export const api = createClient<paths>({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080' });
export type Request = components['schemas']['CarFleetRequest'];
export type UpdateResult = { kind: 'success'; item: Request } | { kind: 'conflict' | 'permission' | 'failure'; message: string };

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
      monthlyFee: undefined,
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
