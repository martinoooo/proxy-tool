import { Service } from '@martinoooo/dependency-injection';
import HttpsService from './service/https';
import HttpService from './service/http';

@Service()
export default class App {
  constructor(private https: HttpsService, private http: HttpService) {}

  public start() {
    this.http.init();
    this.https.init();
  }
}
