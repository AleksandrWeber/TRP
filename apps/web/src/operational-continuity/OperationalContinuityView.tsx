import type { OperationalContinuityReadinessView } from '../shared/api';

type Props = {
  readiness: OperationalContinuityReadinessView;
};

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function OperationalContinuityView({ readiness }: Props) {
  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-slate-100">Platform state</h2>
        <p className="mt-2 text-2xl font-medium text-slate-50" data-testid="platform-state">
          {readiness.platformState}
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-400">Recovery timestamp</dt>
            <dd className="text-slate-100" data-testid="recovery-timestamp">
              {readiness.recoveryTimestamp ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-400">Recovery duration</dt>
            <dd className="text-slate-100" data-testid="recovery-duration">
              {formatDuration(readiness.recoveryDurationMs)}
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Degraded owners</h2>
        {readiness.degradedOwners.length === 0 ? (
          <p className="mt-2 text-slate-400">None</p>
        ) : (
          <ul className="mt-2 list-disc pl-5 text-slate-200" data-testid="degraded-owners">
            {readiness.degradedOwners.map((owner) => (
              <li key={owner}>{owner}</li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Unavailable owners</h2>
        {readiness.unavailableOwners.length === 0 ? (
          <p className="mt-2 text-slate-400">None</p>
        ) : (
          <ul className="mt-2 list-disc pl-5 text-slate-200" data-testid="unavailable-owners">
            {readiness.unavailableOwners.map((owner) => (
              <li key={owner}>{owner}</li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Notification queue</h2>
        {readiness.notificationQueue ? (
          <dl
            className="mt-4 grid gap-3 sm:grid-cols-2"
            data-testid="notification-queue-continuity"
          >
            <div>
              <dt className="text-sm text-slate-400">Queue operational state</dt>
              <dd className="text-slate-100" data-testid="notification-queue-state">
                {readiness.notificationQueue.operationalState}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Owner readiness</dt>
              <dd className="text-slate-100" data-testid="notification-queue-owner-readiness">
                {readiness.notificationQueue.ownerReadiness}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Recovery timestamp</dt>
              <dd className="text-slate-100" data-testid="notification-queue-recovery-timestamp">
                {readiness.notificationQueue.recoveryTimestamp ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Recovery duration</dt>
              <dd className="text-slate-100" data-testid="notification-queue-recovery-duration">
                {formatDuration(readiness.notificationQueue.recoveryDurationMs)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-slate-400">Not evaluated</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Kill switch</h2>
        {readiness.killSwitch ? (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2" data-testid="kill-switch-continuity">
            <div>
              <dt className="text-sm text-slate-400">Kill switch operational state</dt>
              <dd className="text-slate-100" data-testid="kill-switch-state">
                {readiness.killSwitch.operationalState}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Owner readiness</dt>
              <dd className="text-slate-100" data-testid="kill-switch-owner-readiness">
                {readiness.killSwitch.ownerReadiness}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Recovery timestamp</dt>
              <dd className="text-slate-100" data-testid="kill-switch-recovery-timestamp">
                {readiness.killSwitch.recoveryTimestamp ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Recovery duration</dt>
              <dd className="text-slate-100" data-testid="kill-switch-recovery-duration">
                {formatDuration(readiness.killSwitch.recoveryDurationMs)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Restored workspaces</dt>
              <dd className="text-slate-100" data-testid="kill-switch-restored-count">
                {readiness.killSwitch.restoredCount}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Armed workspaces</dt>
              <dd className="text-slate-100" data-testid="kill-switch-armed-count">
                {readiness.killSwitch.armedCount}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-slate-400">Not evaluated</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Monitoring &amp; security health</h2>
        {readiness.monitoringHealth ? (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2" data-testid="monitoring-health-continuity">
            <div>
              <dt className="text-sm text-slate-400">Monitoring operational state</dt>
              <dd className="text-slate-100" data-testid="monitoring-health-state">
                {readiness.monitoringHealth.operationalState}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Owner readiness</dt>
              <dd className="text-slate-100" data-testid="monitoring-health-owner-readiness">
                {readiness.monitoringHealth.ownerReadiness}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Recovery timestamp</dt>
              <dd className="text-slate-100" data-testid="monitoring-health-recovery-timestamp">
                {readiness.monitoringHealth.recoveryTimestamp ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Recovery duration</dt>
              <dd className="text-slate-100" data-testid="monitoring-health-recovery-duration">
                {formatDuration(readiness.monitoringHealth.recoveryDurationMs)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Restored workspaces</dt>
              <dd className="text-slate-100" data-testid="monitoring-health-restored-count">
                {readiness.monitoringHealth.restoredCount}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Security health anchors</dt>
              <dd className="text-slate-100" data-testid="monitoring-health-security-anchor-count">
                {readiness.monitoringHealth.securityHealthAnchorCount}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-slate-400">Not evaluated</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Exchange connectivity</h2>
        {readiness.exchangeConnectivity ? (
          <dl
            className="mt-4 grid gap-3 sm:grid-cols-2"
            data-testid="exchange-connectivity-continuity"
          >
            <div>
              <dt className="text-sm text-slate-400">Exchange connectivity operational state</dt>
              <dd className="text-slate-100" data-testid="exchange-connectivity-state">
                {readiness.exchangeConnectivity.operationalState}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Owner readiness</dt>
              <dd className="text-slate-100" data-testid="exchange-connectivity-owner-readiness">
                {readiness.exchangeConnectivity.ownerReadiness}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Recovery timestamp</dt>
              <dd className="text-slate-100" data-testid="exchange-connectivity-recovery-timestamp">
                {readiness.exchangeConnectivity.recoveryTimestamp ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Recovery duration</dt>
              <dd className="text-slate-100" data-testid="exchange-connectivity-recovery-duration">
                {formatDuration(readiness.exchangeConnectivity.recoveryDurationMs)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Restored workspaces</dt>
              <dd className="text-slate-100" data-testid="exchange-connectivity-restored-count">
                {readiness.exchangeConnectivity.restoredCount}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-400">Connection anchors</dt>
              <dd
                className="text-slate-100"
                data-testid="exchange-connectivity-connection-anchor-count"
              >
                {readiness.exchangeConnectivity.connectionAnchorCount}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-slate-400">Not evaluated</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Owner operational state</h2>
        <table className="mt-3 w-full text-left text-sm text-slate-200">
          <thead className="text-slate-400">
            <tr>
              <th className="py-2 pr-4 font-medium">Owner</th>
              <th className="py-2 pr-4 font-medium">State</th>
              <th className="py-2 font-medium">Dependencies</th>
            </tr>
          </thead>
          <tbody data-testid="owner-states">
            {readiness.ownerStates.map((owner) => (
              <tr key={owner.owner} className="border-t border-slate-800">
                <td className="py-2 pr-4">{owner.owner}</td>
                <td className="py-2 pr-4">{owner.state}</td>
                <td className="py-2">
                  {owner.dependencyOwners.length === 0 ? '—' : owner.dependencyOwners.join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
