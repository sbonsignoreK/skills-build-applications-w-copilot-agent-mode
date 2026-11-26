import { useApiResource } from '../hooks/useApiResource.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const { data, error, loading } = useApiResource<LeaderboardResponse>('/api/leaderboard');

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {loading && <p role="status">Loading leaderboard...</p>}
        {error && <p role="alert">Unable to load leaderboard: {error}</p>}
        {data?.leaderboard.length === 0 && <p>No leaderboard rankings yet.</p>}
        {data && data.leaderboard.length > 0 && (
          <ol>
            {data.leaderboard.map((entry) => (
              <li key={`${entry.rank}-${entry.teamName}`}>{entry.teamName}: {entry.totalPoints} points</li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
