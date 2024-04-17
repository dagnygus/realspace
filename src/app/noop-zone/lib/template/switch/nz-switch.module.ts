import { NgModule } from "@angular/core";
import { NzSwitchCaseDirective, NzSwitchDefaultDirective, NzSwitchDirective } from "./nz-switch.directive";
import { SigSwitchCaseDirective, SigSwitchDefaultDirective, SigSwitchDirective } from "./sig-switch.directive";

const moduleImports = [ NzSwitchDirective, NzSwitchCaseDirective, NzSwitchDefaultDirective, SigSwitchDirective, SigSwitchCaseDirective, SigSwitchDefaultDirective ];

@NgModule({
  imports: moduleImports,
  exports: moduleImports
})
export class NzSwitchModule {}
