import { NgModule } from "@angular/core";
import { NzClassDirective } from "./nz-class.directive";

const moduleImports = [ NzClassDirective ];

@NgModule({
  imports: moduleImports,
  exports: moduleImports
})
export class NzClassModule {}
