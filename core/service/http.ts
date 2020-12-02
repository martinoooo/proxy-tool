import http from 'http';
import net from 'net';
import { Service } from '@martinoooo/dependency-injection';

const PROXY_HOST = '127.0.0.1';

@Service()
export default class HttpServer {
  public httpHandler(req, res) {
    console.log(2222);
    res.writeHead(200);
    res.end('hello world from http\n');
    //   return res.end("");
  }

  public async connectHandler(req, socket) {
    console.log(req.headers);
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

  public init() {
    const s = http
      .createServer()
      .on('request', this.httpHandler)
      .on('connect', this.connectHandler)
      // .on("error", errorHandler.handle.bind(errorHandler))
      .listen(8001, '0.0.0.0');
    return s;
  }
}
