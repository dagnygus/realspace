import { NgModule } from "@angular/core";
import { NzForDirective } from "./nz-for.directive";
import { SigForDirective } from "./sig-for.directive";

const moduleInports = [ NzForDirective, SigForDirective ];

@NgModule({
  imports: moduleInports,
  exports: moduleInports
})
export class NzForModule {}
