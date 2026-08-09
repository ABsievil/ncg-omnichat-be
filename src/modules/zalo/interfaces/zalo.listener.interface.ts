export interface IZaloListenerHandlers {
  messageHandler: (message: unknown) => void | Promise<void>;
  closedHandler: () => void;
  errorHandler: (error: unknown) => void;
}
