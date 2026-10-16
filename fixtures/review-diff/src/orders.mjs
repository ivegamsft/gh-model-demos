export async function searchOrders(db, search) {
  // search comes directly from the public GET /orders?search= query parameter.
  const sql = `SELECT id, reference FROM orders WHERE reference = '${search}'`;
  return db.query(sql);
}
