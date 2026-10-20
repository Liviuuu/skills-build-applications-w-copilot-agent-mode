import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name: string;
  mascot: string;
  members?: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTeams() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        if (isMounted) {
          setTeams(response.teams ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load teams.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTeams();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members." isLoading={isLoading} error={error} emptyMessage="No teams.">
      {teams.length > 0 ? (
        <ul className="list-group list-group-flush">
          {teams.map((team) => (
            <li key={team.name} className="list-group-item">
              <strong>{team.name}</strong> ({team.mascot}) · {team.members?.length ?? 0} members
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
