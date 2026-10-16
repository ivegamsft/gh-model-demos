export function page(items, pageNumber, pageSize) {
  if (!Number.isInteger(pageNumber) || pageNumber < 1) throw new RangeError('invalid page');
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new RangeError('invalid size');
  const start = (pageNumber - 1) * pageSize;
  return items.slice(start, start + pageSize - 1);
}
