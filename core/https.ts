import tls from "tls";
import fs from "fs";
import path from "path";
import pem from "pem";
import https from "https";

const httpsHandler = (req, res) => {
  console.log(22223333);
  res.writeHead(200);
  res.end("hello world from https\n");
  //   return res.end("");
};

async function init() {
  // const serverCrt = await getCertificationForHost("internal_https_server");
  const server = https
    .createServer({
      SNICallback: (servername, cb) => {
        getCertificationForHost(servername).then((crt) => {
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
    .on("request", httpsHandler)
    .listen(8989, "0.0.0.0");
  return server;
}

const caKey = fs.readFileSync(path.resolve(__dirname, "../cert/fabrikam.key"), {
  encoding: "utf-8",
});
const caCert = fs.readFileSync(
  path.resolve(__dirname, "../cert/fabrikam.crt"),
  {
    encoding: "utf-8",
  }
);

const pemCreateCertificate = (option) =>
  new Promise((resolve, reject) =>
    pem.createCertificate(option, (err, response) => {
      if (err) {
        return reject(err);
      }
      return resolve(response);
    })
  );

async function getCertificationForHost(host) {
  const res: any = await pemCreateCertificate({
    altNames: [host],
    commonName: host,
    days: 825,
    serviceCertificate: caCert,
    serviceKey: caKey,
  });
  return {
    cert: res.certificate,
    key: res.clientKey,
  };
}

export default init;
