import { NgModule } from "@angular/core";
import { NzQueryViewDirective } from "./query-view.directive";

const moduleImports = [ NzQueryViewDirective ]

@NgModule({
  imports: moduleImports,
  exports: moduleImports
})
export class NzQueryViewModule {}
