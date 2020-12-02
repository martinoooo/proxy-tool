import App from './app';
import { Container } from '@martinoooo/dependency-injection';

const app = Container.get<App>(App);
app.start();
