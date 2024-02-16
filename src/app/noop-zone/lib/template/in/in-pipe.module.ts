import { NgModule } from "@angular/core";
import { InPipe } from "./in.pipe";

const moduleInports = [InPipe]

@NgModule({
  imports: moduleInports,
  exports: moduleInports
})
export class InPipeModule {}
