import tls from 'tls';
import fs from 'fs';
import path from 'path';
import pem from 'pem';
import https from 'https';
import { Service } from '@martinoooo/dependency-injection';

@Service()
export default class HttpsService {
  caKey = fs.readFileSync(path.resolve(__dirname, '../../cert/fabrikam.key'), {
    encoding: 'utf-8',
  });
  caCert = fs.readFileSync(path.resolve(__dirname, '../../cert/fabrikam.crt'), {
    encoding: 'utf-8',
  });

  public httpsHandler(req, res) {
    console.log(22223333);
    res.writeHead(200);
    res.end('hello world from https\n');
    //   return res.end("");
  }

  public async init() {
    // const serverCrt = await getCertificationForHost("internal_https_server");
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
      .on('request', this.httpsHandler)
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
