import { legacy_fetch } from '../common/api.mjs';

export const sales = () => legacy_fetch({ resource: 'sales', params: { day: '2026-10-14' } });
export const usage = () => legacy_fetch({ resource: 'usage', params: { day: '2026-10-14' } });
export const health = () => legacy_fetch({ resource: 'health', params: { day: '2026-10-14' } });
