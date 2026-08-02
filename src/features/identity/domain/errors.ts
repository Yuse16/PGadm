export class IdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityError';
  }
}

export class UnauthorizedError extends IdentityError {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends IdentityError {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/** Typed error payload for session/authorization UI states. */
export interface SessionError {
  readonly code: string;
  readonly message: string;
}
