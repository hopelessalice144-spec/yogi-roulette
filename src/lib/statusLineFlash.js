/** Trigger status-line highlight when a new message is shown. */
export function shouldStatusLineFlash(message) {
  return typeof message === 'string' && message.trim().length > 0;
}
