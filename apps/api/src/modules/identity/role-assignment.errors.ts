/**
 * Identity role-assignment failures (V3-S02-c).
 * HTTP maps these to honest 4xx copy. Not an audit product.
 */
export class LastAdminProtectedError extends Error {
  constructor() {
    super('Cannot change the last active Administrator.');
    this.name = 'LastAdminProtectedError';
  }
}

export class UnknownRoleError extends Error {
  constructor() {
    super('Role is not recognized.');
    this.name = 'UnknownRoleError';
  }
}

export class SelfRoleChangeError extends Error {
  constructor() {
    super('You cannot change your own role.');
    this.name = 'SelfRoleChangeError';
  }
}
