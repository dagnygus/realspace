import "zone.js"
import { bootstrapApplication } from "@angular/platform-browser";
import { config } from "./app/app.config.server";
import { AppComponent } from "./app/app.component";
// export { AppServerModule as default } from './app/app.module.server';

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap
