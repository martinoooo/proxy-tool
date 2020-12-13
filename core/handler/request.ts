import http from 'http';
import net from 'net';
import { Service } from '@martinoooo/dependency-injection';
import { IContext } from '#definition/proxy';
import https, { RequestOptions } from 'https';
import URL from 'url';
import Stream from 'stream';

const PROXY_HOST = '127.0.0.1';

@Service()
export default class RequestHandler {
  public handle(req: http.IncomingMessage, res: http.ServerResponse) {
    const context: IContext = { req, res };
    this.realRequest(context).then(() => this.responseWriteHandler(context));
  }

  private responseWriteHandler(ctx: IContext) {
    const { res } = ctx;
    if (!res.writable || res.writableEnded) {
      return false;
    }
    const { body } = res;
    if (!body) {
      return res.end('');
    }
    if (body instanceof Stream) {
      return body.pipe(res);
    }
  }

  private getRequestOptions(req: http.IncomingMessage): RequestOptions {
    const url = URL.parse(req.url as string);
    const isHttps = url.protocol && url.protocol.startsWith('https');
    const port = url.port || (isHttps ? 443 : 80);
    return {
      auth: url.auth,
      headers: req.headers,
      host: url.host,
      hostname: url.hostname,
      method: req.method,
      path: url.path,
      port,
      protocol: url.protocol,
      rejectUnauthorized: false,
    };
  }

  public realRequest(ctx: IContext) {
    return new Promise<void>((resolve, reject) => {
      const { req, res } = ctx;
      if (!res.writable || res.writableEnded || !!res.body) {
        return resolve();
      }

      const options = this.getRequestOptions(req);
      const client =
        options.protocol && options.protocol.startsWith('https') ? https : http;

      // create real request
      const proxyReq = client.request(options, (proxyRes) => {
        res.statusCode = proxyRes.statusCode as number;
        Object.keys(proxyRes.headers).forEach((headerName) => {
          res.setHeader(headerName, proxyRes.headers[headerName]);
        });
        ctx.res.body = proxyRes;
        return resolve();
      });

      // send client request body
      req.pipe(proxyReq);
      proxyReq.on('error', (e) => {
        reject(e);
        console.log(e);
      });
    });
  }
}
