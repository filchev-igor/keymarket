import Spinner from './Spinner'

/** Small helper so every page shows loading and error states the same way. */
const Status = ({ loading, error }: { loading: boolean; error: string | null }) => {
  if (loading) return <Spinner centered />
  if (error) return <p className="error">{error}</p>
  return null
}

export default Status
