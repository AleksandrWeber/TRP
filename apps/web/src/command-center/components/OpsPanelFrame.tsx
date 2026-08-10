import type { ReactNode } from 'react';
import type { CommandCenterPanelId, PanelPresentation } from '../types';
import { PanelEmptyState } from './PanelEmptyState';
import { PanelPlaceholder } from './PanelPlaceholder';
import { PanelSkeleton } from './PanelSkeleton';

type Props = {
  panelId: CommandCenterPanelId;
  title: string;
  presentation: PanelPresentation;
  placeholderMessage: string;
  emptyTitle: string;
  emptyDescription: string;
  errorMessage?: string | null;
  skeletonRows?: number;
  children?: ReactNode;
};

/**
 * Shared ops panel chrome for Command Center.
 */
export function OpsPanelFrame({
  panelId,
  title,
  presentation,
  placeholderMessage,
  emptyTitle,
  emptyDescription,
  errorMessage,
  skeletonRows = 3,
  children,
}: Props) {
  return (
    <section
      className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
      data-testid={`cc-panel-${panelId.toLowerCase()}`}
      data-panel-id={panelId}
      data-presentation={presentation}
      aria-labelledby={`cc-panel-title-${panelId.toLowerCase()}`}
    >
      <h3
        id={`cc-panel-title-${panelId.toLowerCase()}`}
        className="text-sm font-medium uppercase tracking-wide text-slate-400"
      >
        {title}
      </h3>
      <div className="mt-3">
        {presentation === 'loading' ? (
          <PanelSkeleton rows={skeletonRows} label={`Loading ${title}`} />
        ) : null}
        {presentation === 'placeholder' ? <PanelPlaceholder message={placeholderMessage} /> : null}
        {presentation === 'empty' ? (
          <PanelEmptyState title={emptyTitle} description={emptyDescription} />
        ) : null}
        {presentation === 'error' ? (
          <div
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            data-testid="panel-error-state"
            role="alert"
          >
            <p className="font-medium">{title} unavailable</p>
            <p className="mt-1 text-xs text-red-300/90">
              {errorMessage ?? 'Projection failed. Use Manual Refresh to retry.'}
            </p>
          </div>
        ) : null}
        {presentation === 'ready' ? children : null}
      </div>
    </section>
  );
}
