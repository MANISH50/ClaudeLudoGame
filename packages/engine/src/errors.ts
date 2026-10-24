// Thrown for actions the current state does not allow. The server maps these to `error` messages.
export class IllegalActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IllegalActionError';
  }
}
