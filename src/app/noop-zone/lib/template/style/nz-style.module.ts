import { NgModule } from "@angular/core";
import { NzStyleDirective } from "./nz-style.directive";

const moduleImports = [ NzStyleDirective ]

@NgModule({
  imports: moduleImports,
  exports: moduleImports
})
export class NzStyleModule {}
