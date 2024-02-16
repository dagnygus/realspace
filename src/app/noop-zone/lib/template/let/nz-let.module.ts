import { NgModule } from "@angular/core";
import { NzLetDirective } from "./nz-let.directive";

const moduleImports = [NzLetDirective]

@NgModule({
  imports: moduleImports,
  exports: moduleImports
})
export class NzLetModule {}
