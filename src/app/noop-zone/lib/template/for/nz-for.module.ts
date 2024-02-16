import { NgModule } from "@angular/core";
import { NzForDirective } from "./nz-for.directive";

const moduleInports = [ NzForDirective ];

@NgModule({
  imports: moduleInports,
  exports: moduleInports
})
export class NzForModule {}
