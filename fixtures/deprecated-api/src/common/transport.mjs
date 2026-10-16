const resources = {
  invoices: [{ id: 'invoice-1', cents: 1200 }],
  credits: [{ id: 'credit-1', cents: 100 }],
  subscriptions: [{ id: 'subscription-1', active: true }],
  products: [{ id: 'product-1', stock: 12 }],
  warehouses: [{ id: 'warehouse-1', region: 'US' }],
  shipments: [{ id: 'shipment-1', state: 'packed' }],
  sales: [{ day: '2026-10-14', cents: 1200 }],
  usage: [{ day: '2026-10-14', requests: 42 }],
  health: [{ service: 'offline-api', ready: true }],
};

function lookup(resource) {
  if (!Object.hasOwn(resources, resource)) throw new Error(`Unknown resource: ${resource}`);
  return structuredClone(resources[resource]);
}

export const transport = {
  legacyRequest({ resource, params }) {
    return { data: lookup(resource), params };
  },
  requestV2(resource, { query = {} } = {}) {
    return { status: 200, body: lookup(resource), query };
  },
};
