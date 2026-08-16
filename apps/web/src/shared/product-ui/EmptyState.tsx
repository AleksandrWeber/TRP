import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  actionTo?: string;
  actionLabel?: string;
  testId?: string;
};

export function EmptyState({ title, description, action, actionTo, actionLabel, testId }: Props) {
  return (
    <div
      className="rounded-lg border border-dashed border-white/15 px-6 py-10 text-center"
      data-testid={testId}
    >
      <h3 className="text-base font-medium text-slate-200">{title}</h3>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      {!action && actionTo && actionLabel ? (
        <div className="mt-4 flex justify-center">
          <Link
            to={actionTo}
            className="text-sm text-sky-400 hover:text-sky-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
