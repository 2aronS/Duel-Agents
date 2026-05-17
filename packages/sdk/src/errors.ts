export class DuelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuelError";
  }
}

export class DuelAuthError extends DuelError {
  readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "DuelAuthError";
    this.status = status;
  }
}

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
