import tls from 'tls';
import fs from 'fs';
import path from 'path';
import pem from 'pem';
import https from 'https';
import http from 'http';
import { Service } from '@martinoooo/dependency-injection';
import RequestHandler from '#handler/request';
import URL from 'url';

type ISupportProtocal = 'http' | 'https' | 'ws' | 'wss';

function fillReqUrl(
  req: http.IncomingMessage,
  protocal: ISupportProtocal = 'http',
) {
  const reqUrlObj = URL.parse(req.url as string);
  const host = req.headers.host;
  reqUrlObj.host = host;
  reqUrlObj.protocol = protocal;
  let urlStr = URL.format(reqUrlObj);
  // 兼容 ws、wss，因为 URL.format 不会给除 http 和 https 以外的协议添加双斜杠
  if (protocal.includes('ws')) {
    urlStr = urlStr.replace(/(wss?:)/, '$1//');
  }
  // req._proxyOriginUrl = urlStr;
  req.url = urlStr;
}

@Service()
export default class HttpsService {
  caKey = fs.readFileSync(path.resolve(__dirname, '../../cert/fabrikam.key'), {
    encoding: 'utf-8',
  });
  caCert = fs.readFileSync(path.resolve(__dirname, '../../cert/fabrikam.crt'), {
    encoding: 'utf-8',
  });

  constructor(private requestHandler: RequestHandler) {}

  public async init() {
    // const serverCrt = await this.getCertificationForHost(
    //   'internal_https_server',
    // );
    const server = https
      .createServer({
        SNICallback: (servername, cb) => {
          this.getCertificationForHost(servername).then((crt) => {
            const ctx = tls.createSecureContext({
              cert: crt && crt.cert,
              key: crt && crt.key,
            });
            cb(null, ctx);
          });
        },
        // cert: serverCrt && serverCrt.cert,
        // key: serverCrt && serverCrt.key,
      })
      .on('request', (req: http.IncomingMessage, res: http.ServerResponse) => {
        console.log(req.headers.host);
        fillReqUrl(req, 'https');
        this.requestHandler.handle.bind(this.requestHandler)(req, res);
      })
      .listen(8989, '0.0.0.0');
    return server;
  }

  public pemCreateCertificate(option) {
    return new Promise((resolve, reject) =>
      pem.createCertificate(option, (err, response) => {
        if (err) {
          return reject(err);
        }
        return resolve(response);
      }),
    );
  }

  public async getCertificationForHost(host) {
    const res: any = await this.pemCreateCertificate({
      altNames: [host],
      commonName: host,
      days: 825,
      serviceCertificate: this.caCert,
      serviceKey: this.caKey,
    });
    return {
      cert: res.certificate,
      key: res.clientKey,
    };
  }
}
