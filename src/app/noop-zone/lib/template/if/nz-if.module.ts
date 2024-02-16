import { NzIfDirecive } from "./nz-if.directive";
import { NgModule } from "@angular/core";

const moduleImports = [
  NzIfDirecive,
]

@NgModule({
  imports: moduleImports,
  exports: moduleImports
})
export class NzIfModule {}
