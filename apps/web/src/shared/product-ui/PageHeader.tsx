import type { ReactNode } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { PageActions, type PageAction } from './PageActions';
import { productChrome } from './catalog';

export function PageHeader({
  productId,
  title,
  description,
  current,
  extraActions,
  children,
}: {
  productId: string;
  title: string;
  description: string;
  current?: string;
  extraActions?: PageAction[];
  children?: ReactNode;
}) {
  const product = productChrome(productId);

  return (
    <div>
      <Breadcrumbs productId={productId} current={current} />
      <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
        {product?.label ?? title}
      </p>
      <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-slate-400">{description}</p>
      <PageActions productId={productId} extra={extraActions} />
      {children}
    </div>
  );
}
