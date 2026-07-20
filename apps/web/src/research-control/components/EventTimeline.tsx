import { memo } from 'react';
import type { ResearchControlEvent } from '../api';

type Props = {
  events: ResearchControlEvent[];
};

function EventTimelineComponent({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-sm text-slate-500">
        No events recorded.
      </div>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Event timeline">
      {events.map((event, index) => (
        <li
          key={`${event.eventType}-${event.occurredAt}-${index}`}
          className="relative border-l border-white/15 pl-4"
        >
          <span className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-sky-400" aria-hidden />
          <p className="text-sm font-medium text-white">{event.eventType}</p>
          <p className="text-xs text-slate-500">{event.occurredAt}</p>
          {event.payload && Object.keys(event.payload).length > 0 ? (
            <pre className="mt-1 overflow-auto text-xs text-slate-400">
              {JSON.stringify(event.payload)}
            </pre>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export const EventTimeline = memo(EventTimelineComponent);
