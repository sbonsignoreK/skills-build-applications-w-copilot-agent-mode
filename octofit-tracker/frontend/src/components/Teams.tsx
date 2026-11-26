import { useApiResource } from '../hooks/useApiResource.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const { data, error, loading } = useApiResource<TeamsResponse>('/api/teams');

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {loading && <p role="status">Loading teams...</p>}
        {error && <p role="alert">Unable to load teams: {error}</p>}
        {data?.teams.length === 0 && <p>No teams yet.</p>}
        {data && data.teams.length > 0 && (
          <ul>
            {data.teams.map((team, index) => (
              <li key={team._id ?? `${team.name}-${index}`}>{team.name} - {team.mascot}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
