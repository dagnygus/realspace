import { ChangeDetectorRef } from "@angular/core";

export class DefaultNzContext {
  $implicit: ChangeDetectorRef = null!;
  cdRef: ChangeDetectorRef = null!;
}
