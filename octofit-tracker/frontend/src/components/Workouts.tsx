import { useApiResource } from '../hooks/useApiResource.js';

type WorkoutSuggestion = { _id?: string; title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutsResponse = { suggestions: WorkoutSuggestion[] };
const userEmail = 'mona@example.com';

export default function Workouts() {
  const path = `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`;
  const { data, error, loading } = useApiResource<WorkoutsResponse>(path);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {loading && <p role="status">Loading workout suggestions...</p>}
        {error && <p role="alert">Unable to load workout suggestions: {error}</p>}
        {data?.suggestions.length === 0 && <p>No workout suggestions yet.</p>}
        {data && data.suggestions.length > 0 && (
          <ul>
            {data.suggestions.map((suggestion, index) => (
              <li key={suggestion._id ?? `${suggestion.title}-${index}`}>
                <strong>{suggestion.title}</strong> - {suggestion.focus}, {suggestion.minutes} minutes ({suggestion.difficulty}).
                <p>{suggestion.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
