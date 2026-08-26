import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type PaperTradingAccountProjection } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { PaperTradingView } from './PaperTradingView';

export function PaperTradingFoundationPage() {
  const { activeWorkspace } = useWorkspace();
  const [projection, setProjection] = useState<PaperTradingAccountProjection | null>(null);
  const [startingBalance, setStartingBalance] = useState('100000');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const view = await api.getPaperTradingAccount();
    setProjection(view);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    load()
      .catch((reason: unknown) => {
        if (!cancelled) setError(toUserFacingError(reason, 'Could not load Paper Trading.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  async function create() {
    setSaving(true);
    setError(null);
    try {
      const view = await api.createPaperTradingAccount({
        baseCurrency: 'USD',
        startingBalance: startingBalance.trim() || '100000',
      });
      setProjection(view);
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not create the Paper Account.'));
    } finally {
      setSaving(false);
    }
  }

  async function disable() {
    setSaving(true);
    setError(null);
    try {
      const view = await api.disablePaperTradingAccount();
      setProjection(view);
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not disable the Paper Account.'));
    } finally {
      setSaving(false);
    }
  }

  async function activate() {
    setSaving(true);
    setError(null);
    try {
      const view = await api.activatePaperTradingAccount();
      setProjection(view);
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not activate the Paper Account.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PaperTradingView
      projection={projection}
      loading={loading}
      saving={saving}
      error={error}
      startingBalance={startingBalance}
      onStartingBalanceChange={setStartingBalance}
      onCreate={() => {
        void create();
      }}
      onDisable={() => {
        void disable();
      }}
      onActivate={() => {
        void activate();
      }}
    />
  );
}
