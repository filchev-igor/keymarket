/**
 * Shared loading indicator: a ring that rotates once per second (linear, infinite).
 * Size, thickness, colours and speed come from the CSS variables --spinner-*.
 * `centered` puts it in the middle of its container with some breathing room (for page-level loading).
 */
export default function Spinner({ label = 'Loading', centered = false }: { label?: string; centered?: boolean }) {
  const ring = <span className="spinner" role="status" aria-label={label} />
  return centered ? <div className="spinner-wrap">{ring}</div> : ring
}
