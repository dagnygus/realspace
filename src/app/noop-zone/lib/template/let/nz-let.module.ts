import { NgModule } from "@angular/core";
import { NzLetDirective } from "./nz-let.directive";
import { WatchDirective } from "./watch.directive";

const moduleImports = [NzLetDirective, WatchDirective]

@NgModule({
  imports: moduleImports,
  exports: moduleImports
})
export class NzLetModule {}
