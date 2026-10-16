import { legacy_fetch } from '../common/api.mjs';

export const products = () => legacy_fetch({ resource: 'products', params: { region: 'US' } });
export const warehouses = () => legacy_fetch({ resource: 'warehouses', params: { region: 'US' } });
export const shipments = () => legacy_fetch({ resource: 'shipments', params: { region: 'US' } });
