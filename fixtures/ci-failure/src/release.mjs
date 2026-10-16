export function releaseSlug(name) {
  return name.trim().replace(/\s+/g, '-');
}

export function releasePath(name) {
  return `/releases/${releaseSlug(name)}`;
}
