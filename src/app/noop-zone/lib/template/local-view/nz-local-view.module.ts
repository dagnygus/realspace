import { NgModule } from "@angular/core";
import { NzLocalViewDirective } from "./nz-local-view.directive";

const moduleImports = [ NzLocalViewDirective ]

@NgModule({ imports: moduleImports, exports: moduleImports })
export class NzLocalViewModule {}
