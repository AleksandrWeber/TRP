import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type NotificationChannelsWorkspaceView,
  type UpsertNotificationPreferencesRequest,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import {
  draftFromWorkspace,
  NotificationChannelsView,
  type ChannelsDraft,
} from './NotificationChannelsView';

export function NotificationChannelsPage() {
  const { activeWorkspace } = useWorkspace();
  const [workspace, setWorkspace] = useState<NotificationChannelsWorkspaceView | null>(null);
  const [draft, setDraft] = useState<ChannelsDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSaved(false);
    api
      .getNotificationChannelsWorkspace()
      .then((payload) => {
        if (cancelled) return;
        setWorkspace(payload);
        setDraft(draftFromWorkspace(payload));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load notification channels.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  function save() {
    if (!draft || !workspace) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const body: UpsertNotificationPreferencesRequest = {
      enabled: draft.enabled,
      channels: { telegram: draft.telegramEnabled },
      typeRouting: Object.fromEntries(
        workspace.routingMatrix.rows.map((row) => {
          const reserved = workspace.routingMatrix.channelIds.filter(
            (channelId) => channelId !== 'telegram' && row.channels[channelId] === true,
          );
          return [
            row.type,
            {
              enabled: draft.typeEnabled[row.type] === true,
              critical: draft.typeCritical[row.type] === true,
              channels: [
                ...(draft.typeTelegram[row.type] === true ? ['telegram'] : []),
                ...reserved,
              ],
            },
          ];
        }),
      ),
      schedule: {
        timezone: draft.timezone,
        dailyDeliveryTime: draft.dailyDeliveryTime,
        quietHours: draft.quietHoursEnabled
          ? { start: draft.quietHoursStart, end: draft.quietHoursEnd }
          : null,
        criticalBypassQuietHours: draft.criticalBypassQuietHours,
      },
    };
    api
      .upsertNotificationPreferences(body)
      .then(() => api.getNotificationChannelsWorkspace())
      .then((payload) => {
        setWorkspace(payload);
        setDraft(draftFromWorkspace(payload));
        setSaved(true);
      })
      .catch((err: unknown) => {
        setError(toUserFacingError(err, 'Could not save channel preferences.'));
      })
      .finally(() => setSaving(false));
  }

  return (
    <NotificationChannelsView
      workspace={workspace}
      draft={draft}
      loading={loading}
      saving={saving}
      error={error}
      saved={saved}
      onDraft={setDraft}
      onSave={save}
    />
  );
}
