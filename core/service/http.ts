import http from 'http';
import net from 'net';
import { Service } from '@martinoooo/dependency-injection';
import RequestHandler from '#handler/request';

const PROXY_HOST = '127.0.0.1';

@Service()
export default class HttpServer {
  private server!: http.Server;

  constructor(private requestHandler: RequestHandler) {}

  public init() {
    this.server = http
      .createServer()
      .on('request', this.requestHandler.handle.bind(this.requestHandler))
      .on('connect', this.connectHandler)
      // .on('upgrade', (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
      //   fillReqUrl(req, 'ws');
      //   upgradeHandler.handle(req, socket, head);
      // });
      .on('error', this.errorHandler)
      .listen(8001, '0.0.0.0');
  }

  public errorHandler(req, res) {
    console.log('errr');
    //   return res.end("");
  }

  public async connectHandler(req, socket) {
    // console.log(req.headers);
    // ws、wss、https协议都会发送connect请求
    const [, targetPort] = req.url.split(':');
    // 非443端口访问则连到 http 服务器上
    const proxyPort = parseInt(targetPort, 10) === 443 ? 8989 : 8001;
    // 和本地对应的服务器建立链接 并告诉客户端连接建立成功
    const conn = net.connect(proxyPort, PROXY_HOST, () => {
      socket.write(`HTTP/${req.httpVersion} 200 OK\r\n\r\n`, 'UTF-8', () => {
        conn.pipe(socket);
        socket.pipe(conn);
      });
    });

    conn.on('error', (e) => {
      console.error(e);
    });
  }
}
