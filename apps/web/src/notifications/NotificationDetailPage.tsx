import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type NotificationDeliveryDetailView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { NotificationDetailView } from './NotificationDetailView';

export function NotificationDetailPage() {
  const { deliveryId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<NotificationDeliveryDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getNotificationDelivery(deliveryId)
      .then((item) => {
        if (!cancelled) setRecord(item);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setError(toUserFacingError(err, 'Could not load delivery.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, deliveryId]);

  return <NotificationDetailView record={record} loading={loading} error={error} />;
}
