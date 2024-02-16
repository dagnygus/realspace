import { Component, Directive, DoCheck, ElementRef, Input, OnInit, inject } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Priority, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { TestBed, fakeAsync } from "@angular/core/testing";
import { provideNgNoopZone } from "../../core/src/enviroment/enviroment";
import { InPipe, NzIfModule, provideNzIfConfiguration } from "../../template";
import { NzDetachedViewModule } from "../../template/detached-view/detached-view.module";
import { NzQueryViewModule } from "../../template/query-view/query-view.module";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";


@Directive({ selector: '[testDir]' })
class TestDirective implements DoCheck, OnInit {
  static instanceCount = 0
  private _isInit = false;
  checkCount = 0;

  @Input() set testDir(value: number) {
    if (this._isInit) { return; }
    switch (value) {
      case 1:
        this.component.testDirective1 = this;
        break
      case 2:
        this.component.testDirective2 = this;
        break
      case 3:
        this.component.testDirective3 = this;
        break;
      case 4:
        this.component.testDirective4 = this;
        break;
      case 5:
        this.component.testDirective5 = this;
        break;
    }
  }

  constructor(private component: TestComponent) {

  }

  ngDoCheck(): void {
    if (!this._isInit) { return; }
    this.checkCount++;
  }

  ngOnInit(): void {
    this._isInit = true;
  }

  reset(): void {
    this.checkCount = 0;
  }

}

@Component({
  selector: 'text-comp',
  template: `
    <ng-container *nzIf="value$; let val$ = nzIf$; let cdRef = cdRef">
      <p id="p1" [testDir]="1">{{val$|in:cdRef}}</p>
    </ng-container>
    <ng-container *nzQueryView="qwPrio">
      <div [testDir]="2">
        <ng-container *nzIf="value$; let val$ = nzIf$; let cdRef = cdRef">
          <p id="p2" [testDir]="3">{{val$|in:cdRef}}</p>
        </ng-container>
      </div>
    </ng-container>
    <ng-container *nzQueryView="qwPrio2">
      <div [testDir]="4">
        <ng-container *nzDetachedView="dvPrio">
          <ng-container *nzIf="value$; let val$ = nzIf$; let cdRef = cdRef">
            <p id="p3" [testDir]="5">{{val$|in:cdRef}}</p>
          </ng-container>
        </ng-container>
      </div>
    </ng-container>
  `
})
class TestComponent {
  priority = Priority.normal;
  _cdRef = initializeComponent(this, Math.round(4 * Math.random() + 1));
  itsValue = 1;
  value$ = new BehaviorSubject(1);
  qwPrio = 4 * Math.random() + 1;
  qwPrio2 = 4 * Math.random() + 1;
  dvPrio = 4 * Math.random() + 1;
  testDirective1: TestDirective | null = null;
  testDirective2: TestDirective | null = null;
  testDirective3: TestDirective | null = null;
  testDirective4: TestDirective | null = null;
  testDirective5: TestDirective | null = null;
  elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  reset(): void {
    if (this.testDirective1) {
      this.testDirective1.reset();
    }
    if (this.testDirective2) {
      this.testDirective2.reset();
    }
    if (this.testDirective3) {
      this.testDirective3.reset();
    }
    if (this.testDirective4) {
      this.testDirective4.reset();
    }
    if (this.testDirective5) {
      this.testDirective5.reset();
    }
  }

  getValueForP1(): number {
    return +this.elementRef.nativeElement.querySelector('#p1')!.textContent!.trim();
  }

  getValueForP2(): number {
    return +this.elementRef.nativeElement.querySelector('#p2')!.textContent!.trim();
  }

  getValueForP3(): number {
    return +this.elementRef.nativeElement.querySelector('#p3')!.textContent!.trim();
  }

  increament(): void {
    this.itsValue++;
    this.value$.next(this.itsValue);
  }
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      imports: [ NzIfModule, NzQueryViewModule, NzDetachedViewModule, InPipe ],
      declarations: [ TestComponent, TestDirective ],
      providers: [ provideNgNoopZone(), provideNzIfConfiguration({ optimized: true }) ],
      teardown: { destroyAfterEach: true }
    }).compileComponents()
  });

  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
    TestBed.resetTestingModule();
  });



}

function createTestComponent(): TestComponent {
  return TestBed.createComponent(TestComponent).componentInstance;
}

describe('[nzIf] Optimized. Updating context.', () => {
  describe('With waitUntilChedulingDone() function.', () => {
    for (let prio = 0; prio < 6; prio++) {
      describe(`Priority level: ${prio}`, () => {
        setupEnviroment();
        it('Should update test', async () => {
          const component = createTestComponent();
          component.priority = prio;
          await waitUntilSchedulingDone();

          component.reset();

          expect(component.getValueForP1()).toEqual(component.itsValue);
          expect(component.getValueForP2()).toEqual(component.itsValue);
          expect(component.getValueForP3()).toEqual(component.itsValue);

          component.increament();
          await waitUntilSchedulingDone();

          expect(component.testDirective1!.checkCount).toEqual(1);
          expect(component.testDirective2!.checkCount).toEqual(0);
          expect(component.testDirective3!.checkCount).toEqual(1);
          expect(component.testDirective4!.checkCount).toEqual(0);
          expect(component.testDirective5!.checkCount).toEqual(1);

          expect(component.getValueForP1()).toEqual(component.itsValue);
          expect(component.getValueForP2()).toEqual(component.itsValue);
          expect(component.getValueForP3()).toEqual(component.itsValue);

          component.reset();
          component.increament();
          await waitUntilSchedulingDone();

          expect(component.testDirective1!.checkCount).toEqual(1);
          expect(component.testDirective2!.checkCount).toEqual(0);
          expect(component.testDirective3!.checkCount).toEqual(1);
          expect(component.testDirective4!.checkCount).toEqual(0);
          expect(component.testDirective5!.checkCount).toEqual(1);

          expect(component.getValueForP1()).toEqual(component.itsValue);
          expect(component.getValueForP2()).toEqual(component.itsValue);
          expect(component.getValueForP3()).toEqual(component.itsValue);
        })
      });
    }
  });

  describe('With flushScheduler() function.', () => {
    for (let prio = 0; prio < 6; prio++) {
      describe(`Priority level: ${prio}`, () => {
        setupEnviroment();
        it('Should update test', fakeAsync(() => {
          const component = createTestComponent();
          component.priority = prio;
          flushScheduler();

          component.reset();

          expect(component.getValueForP1()).toEqual(component.itsValue);
          expect(component.getValueForP2()).toEqual(component.itsValue);
          expect(component.getValueForP3()).toEqual(component.itsValue);

          component.increament();
          flushScheduler();

          expect(component.testDirective1!.checkCount).toEqual(1);
          expect(component.testDirective2!.checkCount).toEqual(0);
          expect(component.testDirective3!.checkCount).toEqual(1);
          expect(component.testDirective4!.checkCount).toEqual(0);
          expect(component.testDirective5!.checkCount).toEqual(1);

          expect(component.getValueForP1()).toEqual(component.itsValue);
          expect(component.getValueForP2()).toEqual(component.itsValue);
          expect(component.getValueForP3()).toEqual(component.itsValue);

          component.reset();
          component.increament();
          flushScheduler();

          expect(component.testDirective1!.checkCount).toEqual(1);
          expect(component.testDirective2!.checkCount).toEqual(0);
          expect(component.testDirective3!.checkCount).toEqual(1);
          expect(component.testDirective4!.checkCount).toEqual(0);
          expect(component.testDirective5!.checkCount).toEqual(1);

          expect(component.getValueForP1()).toEqual(component.itsValue);
          expect(component.getValueForP2()).toEqual(component.itsValue);
          expect(component.getValueForP3()).toEqual(component.itsValue);
        }))
      });
    }
  })
});
