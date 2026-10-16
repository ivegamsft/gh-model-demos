import { transport } from './transport.mjs';

/** @deprecated Use fetch_v2(resource, {query}) and preserve the returned row array. */
export async function legacy_fetch({ resource, params = {} }) {
  const response = await transport.legacyRequest({ resource, params });
  return response.data;
}
