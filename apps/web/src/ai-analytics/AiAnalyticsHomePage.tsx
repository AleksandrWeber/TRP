import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type AiAnalyticsKind, type AiAnalyticsListItemView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { AiAnalyticsHomeView } from './AiAnalyticsHomeView';
import { buildAiAnalyticsListQuery } from './ai-analytics';

export function AiAnalyticsHomePage() {
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [items, setItems] = useState<AiAnalyticsListItemView[]>([]);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<'all' | AiAnalyticsKind>('all');
  const [reportRunId, setReportRunId] = useState('');
  const [libraryEntryId, setLibraryEntryId] = useState('');
  const [generateKind, setGenerateKind] = useState<AiAnalyticsKind>('narrative');
  const [generateReportRunId, setGenerateReportRunId] = useState('');
  const [generateFocus, setGenerateFocus] = useState('');
  const [compareReportRunId, setCompareReportRunId] = useState('');
  const [compareLibraryEntryId, setCompareLibraryEntryId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listAiAnalytics(
        buildAiAnalyticsListQuery({
          search,
          kind,
          reportRunId,
          libraryEntryId,
        }),
      )
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load AI Analytics.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, search, kind, reportRunId, libraryEntryId]);

  function onGenerate() {
    setGenerating(true);
    setError(null);
    api
      .generateAiAnalytics({
        kind: generateKind,
        ...(generateReportRunId.trim() ? { reportRunId: generateReportRunId.trim() } : {}),
        ...(compareReportRunId.trim() ? { compareReportRunId: compareReportRunId.trim() } : {}),
        ...(libraryEntryId.trim() ? { libraryEntryId: libraryEntryId.trim() } : {}),
        ...(compareLibraryEntryId.trim()
          ? { compareLibraryEntryId: compareLibraryEntryId.trim() }
          : {}),
        ...(generateFocus.trim() ? { focus: generateFocus.trim() } : {}),
      })
      .then((detail) => {
        navigate(`/ai-analytics/${detail.analysisId}`);
      })
      .catch((err: unknown) => {
        setError(toUserFacingError(err, 'Could not generate analysis from existing data.'));
      })
      .finally(() => {
        setGenerating(false);
      });
  }

  return (
    <AiAnalyticsHomeView
      items={items}
      search={search}
      kind={kind}
      reportRunId={reportRunId}
      libraryEntryId={libraryEntryId}
      generateKind={generateKind}
      generateReportRunId={generateReportRunId}
      generateFocus={generateFocus}
      compareReportRunId={compareReportRunId}
      compareLibraryEntryId={compareLibraryEntryId}
      generating={generating}
      loading={loading}
      error={error}
      onSearch={setSearch}
      onKind={setKind}
      onReportRunId={setReportRunId}
      onLibraryEntryId={setLibraryEntryId}
      onGenerateKind={setGenerateKind}
      onGenerateReportRunId={setGenerateReportRunId}
      onGenerateFocus={setGenerateFocus}
      onCompareReportRunId={setCompareReportRunId}
      onCompareLibraryEntryId={setCompareLibraryEntryId}
      onGenerate={onGenerate}
    />
  );
}
