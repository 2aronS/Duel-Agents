/** Base class for all errors thrown by the Duel SDK. */
export class DuelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuelError";
  }
}

/** Thrown when the API rejects the key (HTTP 401 or 403). */
export class DuelAuthError extends DuelError {
  readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "DuelAuthError";
    this.status = status;
  }
}

/** Thrown for other non-2xx responses; carries the status and parsed body. */
export class DuelApiError extends DuelError {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "DuelApiError";
    this.status = status;
    this.body = body;
  }
}
