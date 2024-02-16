import { NgModule } from "@angular/core";
import { NzDetachedViewDirective } from "./detached-view.directive";

const moduleImports = [ NzDetachedViewDirective ];

@NgModule({
  imports: moduleImports,
  exports: moduleImports
})
export class NzDetachedViewModule {}
