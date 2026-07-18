# ADR-014 — Runtime Lifecycle

Status: Accepted

Date: 2026-07-18

Scope: RC-16 Paper Trading Platform

---

## Context

The Stage-1 production prototype stores active deployments but evaluates them
only through an operator-triggered tick. It does not persist the last evaluated
market event, own an always-on runtime lease, resume automatically, or
reconcile state after interruption.

RC-16 requires a durable runtime model that distinguishes immutable deployment
configuration from each operational Trading Session.

---

## Decision

### Deployment versus Trading Session

A Strategy Deployment is immutable approved configuration:

- workspace;
- source Experiment and strategy version;
- parameters;
- instrument and timeframe;
- market-data source;
- paper execution configuration;
- Risk Policy version;
- code/config provenance.

A Trading Session is one runtime lifecycle for that deployment. A deployment
may have many historical sessions but no more than the configured number of
active sessions.

### Session state machine

Frozen states:

```text
CREATED
  ↓ start
STARTING
  ↓ initialized
RUNNING ⇄ PAUSED
  ↓ stop
STOPPING
  ↓ drained
STOPPED

STARTING / RUNNING / PAUSED
  ↓ ownership lost or restart
RECOVERING
  ↓ reconciled
RUNNING or PAUSED

Any active state
  ↓ unrecoverable failure
FAILED
```

Rules:

- `STOPPED` and `FAILED` are terminal for that Session.
- Restart creates no implicit replacement Session.
- A recovered Session retains its identity and generation history.
- Invalid transitions are rejected and audited.
- New execution is forbidden in `PAUSED`, `RECOVERING`, `STOPPING`, `STOPPED`,
  and `FAILED`.

### Runtime ownership and lease

Exactly one runtime owner may evaluate a Trading Session at a time.

The durable lease contains:

- session ID;
- owner/worker ID;
- lease generation/fencing token;
- acquired and expiry timestamps;
- heartbeat timestamp.

Lease acquisition uses compare-and-swap/transactional semantics. Every
state-changing runtime command includes the current fencing token. Work from a
stale owner is rejected even if it resumes after network delay.

Wall-clock time may determine operational lease expiry, but never strategy,
order, fill, PnL, or performance semantics.

### Checkpoints

Durable Session checkpoints include:

- last accepted market stream sequence/event ID;
- last evaluated closed candle/event;
- strategy-state version and payload when stateful;
- last produced Signal Intent identity;
- last completed execution/accounting correlation;
- runtime generation/fencing token;
- checkpoint schema version.

Checkpoint update and resulting domain event use ADR-013 transactional
semantics.

### Start

Starting a Session requires:

- approved and immutable deployment;
- valid workspace/operator authorization;
- available runtime lease;
- healthy market-data subscription;
- loaded strategy and compatible parameters;
- current Risk Policy;
- reconciled paper account/Orders/Positions/Portfolio;
- inactive Kill Switch.

Failure leaves the Session `FAILED` or `RECOVERING` with a durable reason; it
must not partially enter `RUNNING`.

### Pause, resume, and stop

Pause:

- stops new strategy evaluations/order intents;
- does not discard open Orders or Position state;
- persists a checkpoint.

Resume:

- reacquires/verifies ownership;
- refreshes market state;
- reconciles open Orders and accounting;
- resumes only from the next unprocessed market event.

Stop:

- blocks new intents;
- drains or explicitly cancels pending work according to policy;
- checkpoints and releases the lease;
- records terminal state.

### Restart recovery

On startup, the runtime discovers non-terminal Sessions.

For each Session:

1. mark/confirm `RECOVERING`;
2. acquire a new fenced lease;
3. load deployment, checkpoints, open Orders, Fills, Position, Ledger,
   Portfolio, Risk state, and Kill Switch state;
4. reconcile durable facts and projections;
5. restore market subscription and recover stream gaps;
6. resume from the next unprocessed semantic event only;
7. transition to the prior safe intent (`RUNNING` or `PAUSED`).

Any ambiguity blocks execution and creates an Incident.

### Graceful shutdown

Runtime shutdown:

- rejects new starts;
- pauses intake of new strategy evaluations;
- drains in-flight transactions;
- persists checkpoints;
- shortens/releases leases;
- leaves recoverable state.

### Session ownership boundaries

Trading Session owns runtime lifecycle and checkpoints.

It does not own:

- strategy decision rules;
- Risk Policy;
- Order state transitions;
- execution adapter behavior;
- financial accounting;
- dashboard projections.

---

## Consequences

### Advantages

- Deployment history and runtime history are no longer conflated.
- Duplicate concurrent runners are prevented by fenced leases.
- Restart recovery has an explicit state and algorithm.
- Strategy evaluation can resume without replaying completed business effects.

### Constraints

- All runtime workers must honor lease fencing.
- In-memory timers are never authoritative.
- Session state and checkpoints must be durable.
- Recovery must complete before execution resumes.
- Scheduler/worker implementation cannot create a second lifecycle model.

### Follow-up

User Stories must define scheduler cadence, worker topology, checkpoint schema,
graceful shutdown, and recovery tests without changing this state model.
