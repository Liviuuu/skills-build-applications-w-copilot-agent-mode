import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboard() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (isMounted) {
          setEntries(response.leaderboard ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load leaderboard.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." isLoading={isLoading} error={error} emptyMessage="No leaderboard.">
      {entries.length > 0 ? (
        <ol className="mb-0 ps-3">
          {entries.map((entry) => (
            <li key={`${entry.teamName}-${entry.rank}`}>
              #{entry.rank} {entry.teamName} — {entry.totalPoints} pts
            </li>
          ))}
        </ol>
      ) : null}
    </CapabilityCard>
  );
}
