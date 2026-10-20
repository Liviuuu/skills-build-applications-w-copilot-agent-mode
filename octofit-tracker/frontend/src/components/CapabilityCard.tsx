import { Children, type ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  children?: ReactNode;
};

export function CapabilityCard({ title, description, isLoading = false, error = null, emptyMessage, children }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {error ? (
          <div role="alert">{error}</div>
        ) : isLoading ? (
          <p role="status">Loading {title.toLowerCase()}…</p>
        ) : children && Children.count(children) > 0 ? (
          children
        ) : (
          <p>{emptyMessage ?? 'No data.'}</p>
        )}
      </div>
    </section>
  );
}
