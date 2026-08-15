import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type NotificationSettingsView as SettingsPayload,
  type UpsertNotificationPreferencesRequest,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import {
  draftFromSettings,
  NotificationSettingsView,
  type NotificationDraft,
} from './NotificationSettingsView';

export function NotificationSettingsPage() {
  const { activeWorkspace } = useWorkspace();
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [draft, setDraft] = useState<NotificationDraft | null>(null);
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
      .getNotificationSettings()
      .then((payload) => {
        if (cancelled) return;
        setSettings(payload);
        setDraft(draftFromSettings(payload));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load notification settings.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const body: UpsertNotificationPreferencesRequest = {
      enabled: draft.enabled,
      channels: { telegram: draft.telegramEnabled },
      typeRouting: Object.fromEntries(
        Object.entries(draft.typeEnabled).map(([type, enabled]) => [type, { enabled }]),
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
      .then(() => api.getNotificationSettings())
      .then((payload) => {
        setSettings(payload);
        setDraft(draftFromSettings(payload));
        setSaved(true);
      })
      .catch((err: unknown) => {
        setError(toUserFacingError(err, 'Could not save notification preferences.'));
      })
      .finally(() => setSaving(false));
  }

  return (
    <NotificationSettingsView
      settings={settings}
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
