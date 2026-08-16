import { Link } from 'react-router-dom';
import { productChrome } from './catalog';

export type PageAction = {
  to: string;
  label: string;
  testId?: string;
};

const linkClass =
  'text-sky-400 hover:text-sky-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400';

export function PageActions({
  productId,
  extra = [],
}: {
  productId: string;
  extra?: PageAction[];
}) {
  const product = productChrome(productId);
  const actions: PageAction[] = [...extra];
  if (product?.historyTo && !actions.some((item) => item.to === product.historyTo)) {
    actions.push({ to: product.historyTo, label: 'History' });
  }
  if (product?.next && !actions.some((item) => item.to === product.next?.to)) {
    actions.push({ to: product.next.to, label: `Next: ${product.next.label}` });
  }

  if (actions.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-3 text-sm" data-testid="page-actions">
      {actions.map((action) => (
        <Link
          key={`${action.to}:${action.label}`}
          to={action.to}
          data-testid={action.testId}
          className={linkClass}
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}
