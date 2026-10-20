import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type: string;
  minutes: number;
  points: number;
  occurredAt?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        if (isMounted) {
          setActivities(response.activities ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load activities.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadActivities();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points." isLoading={isLoading} error={error} emptyMessage="No activities.">
      {activities.length > 0 ? (
        <ul className="list-group list-group-flush">
          {activities.map((activity, index) => (
            <li key={`${activity.type}-${activity.occurredAt ?? index}`} className="list-group-item">
              <strong>{activity.type}</strong> · {activity.minutes} min · {activity.points} pts
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
