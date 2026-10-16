import { legacy_fetch } from '../common/api.mjs';

export const invoices = () => legacy_fetch({ resource: 'invoices', params: { active: true } });
export const credits = () => legacy_fetch({ resource: 'credits', params: { active: true } });
export const subscriptions = () => legacy_fetch({ resource: 'subscriptions', params: { active: true } });
