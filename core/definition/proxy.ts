import http from 'http';

declare module 'http' {
  interface ServerResponse {
    body: any;
  }
}

export interface IContext {
  req: http.IncomingMessage;
  res: http.ServerResponse;
}
