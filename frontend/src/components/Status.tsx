/** Small helper so every page shows loading and error states the same way. */
export default function Status({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <p className="muted">Loading...</p>
  if (error) return <p className="error">{error}</p>
  return null
}
