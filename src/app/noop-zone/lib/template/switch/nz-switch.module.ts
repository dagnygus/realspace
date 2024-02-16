import { NgModule } from "@angular/core";
import { NzSwitchCaseDirective, NzSwitchDefaultDirective, NzSwitchDirective } from "./nz-switch.directive";

const moduleImports = [ NzSwitchDirective, NzSwitchCaseDirective, NzSwitchDefaultDirective ];

@NgModule({
  imports: moduleImports,
  exports: moduleImports
})
export class NzSwitchModule {}
