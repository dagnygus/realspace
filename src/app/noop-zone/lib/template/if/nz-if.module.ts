import { NzIfDirective } from "./nz-if.directive";
import { NgModule } from "@angular/core";
import { SigIfDirective } from "./sig-if.directive";

const moduleImports = [
  NzIfDirective,
  SigIfDirective
]

@NgModule({
  imports: moduleImports,
  exports: moduleImports
})
export class NzIfModule {}
