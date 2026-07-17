/**
 * DI token for JobQueue (US070, US110).
 * Bind InMemoryQueue or BullMQQueue via QUEUE_DRIVER in JobsModule.
 */
export const JOB_QUEUE = Symbol('JOB_QUEUE');
