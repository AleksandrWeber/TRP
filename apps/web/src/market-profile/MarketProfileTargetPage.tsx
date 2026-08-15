import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type MarketProfileCompareView,
  type MarketProfileTargetDetailView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { MarketProfileTargetView, type MarketProfileTargetTab } from './MarketProfileTargetView';

export function MarketProfileTargetPage() {
  const { targetId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<MarketProfileTargetDetailView | null>(null);
  const [tab, setTab] = useState<MarketProfileTargetTab>('latest');
  const [fromVersion, setFromVersion] = useState(1);
  const [toVersion, setToVersion] = useState(1);
  const [compared, setCompared] = useState<MarketProfileCompareView | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = decodeURIComponent(targetId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCompared(null);
    api
      .getMarketProfileTarget(id)
      .then((item) => {
        if (cancelled) return;
        setRecord(item);
        const versions = item.versions.map((row) => row.version);
        setFromVersion(versions[0] ?? 1);
        setToVersion(versions.at(-1) ?? versions[0] ?? 1);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setError(toUserFacingError(err, 'Could not load Market Profile.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, id]);

  function compare() {
    setComparing(true);
    setError(null);
    api
      .compareMarketProfileVersions(id, fromVersion, toVersion)
      .then(setCompared)
      .catch((err: unknown) => {
        setCompared(null);
        setError(toUserFacingError(err, 'Could not compare Profile versions.'));
      })
      .finally(() => setComparing(false));
  }

  return (
    <MarketProfileTargetView
      record={record}
      tab={tab}
      fromVersion={fromVersion}
      toVersion={toVersion}
      compared={compared}
      comparing={comparing}
      loading={loading}
      error={error}
      onTab={setTab}
      onFromVersion={setFromVersion}
      onToVersion={setToVersion}
      onCompare={compare}
    />
  );
}
