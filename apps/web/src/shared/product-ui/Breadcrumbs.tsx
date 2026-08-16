import { Link } from 'react-router-dom';
import { bandLabel, productChrome, type ProductChrome } from './catalog';

export function Breadcrumbs({ productId, current }: { productId: string; current?: string }) {
  const product = productChrome(productId);
  if (!product) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link
            to="/"
            className="hover:text-slate-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            Overview
          </Link>
        </li>
        <Separator />
        <li>{bandLabel(product.band)}</li>
        <Separator />
        <li>
          {current ? (
            <Link
              to={product.path}
              className="hover:text-slate-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
            >
              {product.label}
            </Link>
          ) : (
            <span className="text-slate-400" aria-current="page">
              {product.label}
            </span>
          )}
        </li>
        {current ? (
          <>
            <Separator />
            <li className="text-slate-400" aria-current="page">
              {current}
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}

export function breadcrumbsFor(product: ProductChrome, current?: string) {
  return { product, current };
}

function Separator() {
  return (
    <li aria-hidden="true" className="text-slate-600">
      /
    </li>
  );
}
