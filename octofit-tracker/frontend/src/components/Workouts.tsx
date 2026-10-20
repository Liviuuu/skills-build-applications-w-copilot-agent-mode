import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  minutes?: number;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSuggestions() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        if (isMounted) {
          setSuggestions(response.suggestions ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load workout suggestions.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSuggestions();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." isLoading={isLoading} error={error} emptyMessage="No workout suggestions.">
      {suggestions.length > 0 ? (
        <ul className="list-group list-group-flush">
          {suggestions.map((suggestion) => (
            <li key={suggestion.title} className="list-group-item">
              <strong>{suggestion.title}</strong>
              {suggestion.focus ? <> · {suggestion.focus}</> : null}
              {suggestion.minutes ? <> · {suggestion.minutes} min</> : null}
              {suggestion.reason ? <div className="small text-muted">{suggestion.reason}</div> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
