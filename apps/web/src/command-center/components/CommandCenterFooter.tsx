type Props = {
  lastRefreshedAt?: string | null;
};

/**
 * Optional thin footer (UI Contract A.7) — projection disclaimer only.
 */
export function CommandCenterFooter({ lastRefreshedAt = null }: Props) {
  return (
    <footer
      className="border-t border-white/10 pt-3 text-xs text-slate-600"
      data-testid="cc-footer"
    >
      <p>
        All Command Center values are non-authoritative projections. Session lifecycle and Kill
        Switch truth live in Session / Risk ports — never in UI local state alone.
      </p>
      {lastRefreshedAt ? (
        <p className="mt-1" data-testid="cc-last-refreshed">
          Last refreshed {lastRefreshedAt}
        </p>
      ) : null}
    </footer>
  );
}
