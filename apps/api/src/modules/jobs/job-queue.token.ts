/**
 * DI token for JobQueue (US070).
 * Bind InMemoryJobQueue (or a future durable queue) in JobsModule.
 */
export const JOB_QUEUE = Symbol('JOB_QUEUE');
