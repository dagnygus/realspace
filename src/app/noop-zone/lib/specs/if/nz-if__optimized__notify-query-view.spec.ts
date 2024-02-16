import { Component, Directive, DoCheck, ElementRef, Inject, inject } from "@angular/core";
import { Priority, detectChanges, fromPromiseLike, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { TestBed, fakeAsync, flush } from "@angular/core/testing";
import { NZ_QUERY_VIEW, NzIfModule, QueryView, provideNzIfConfiguration } from "../../template";
import { NzQueryViewModule } from "../../template/query-view/query-view.module";
import { disposeNoopZoneTestingEnviroment, provideNgNoopZone } from "../../core/src/enviroment/enviroment";
import { Subject, firstValueFrom, take } from "rxjs";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";

type Values = [any, any, any, any, any];


@Directive({ selector: '[testOneDir]' })
class TestDirective implements DoCheck {
  enable = false;
  init = false;

  checkCount = 0;

  constructor(component: TestComponent,
              @Inject(NZ_QUERY_VIEW) queryView: QueryView) {
    component.testDirective = this;

    queryView.onCheckDone.pipe(take(1)).subscribe(() => this.init = true);
  }

  ngDoCheck(): void {
    if (this.enable && this.init) {
      this.checkCount++;
    }
  }

}

@Component({
  selector: 'test-one-comp',
  template: `
    <ng-container *nzQueryView="queryViewPriority">
      <p testOneDir></p>

      <div *nzIf="value1; priority: prio1"></div>
      <div *nzIf="value2; priority: prio2"></div>
      <div *nzIf="value3; priority: prio3"></div>
      <div *nzIf="value4; priority: prio4"></div>
      <div *nzIf="value5; priority: prio5"></div>
    </ng-container>
  `
})
class TestComponent {


  cdRef = initializeComponent(this, Math.round(4 * Math.random() + 1));
  queryViewPriority: Priority = Priority.normal;

  testDirective: TestDirective | null = null;

  value1: any
  value2: any
  value3: any
  value4: any
  value5: any

  prio1: Priority = Priority.normal;
  prio2: Priority = Priority.normal;
  prio3: Priority = Priority.normal;
  prio4: Priority = Priority.normal;
  prio5: Priority = Priority.normal;

  elementRef: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>);

  constructor() {
  }

  setValues([ value1, value2, value3, value4, value5]: Values): void {
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
    this.value4 = value4;
    this.value5 = value5;
  }

  setPriorities([ prio1, prio2, prio3, prio4, prio5 ]: Priority[]): void {
    this.prio1 = prio1;
    this.prio2 = prio2;
    this.prio3 = prio3;
    this.prio4 = prio4;
    this.prio5 = prio5;
  }

  reset(): void {
    if (this.testDirective) {
      this.testDirective.checkCount = 0;
    }
  }

  enableListening(): void {
    if (this.testDirective) {
      this.testDirective.enable = true;
    }
  }

  detectChangesAndResetCounter(): void {
    detectChanges(this.cdRef, {
      onDone: () => {
        if (this.testDirective) {
          this.testDirective.checkCount = 0;
        }
      }
    });
  }

  getChildrenLength() {
    return this.elementRef.nativeElement.querySelectorAll('div').length;
  }

  getCheckCount() {
    return this.testDirective?.checkCount;
  }
}

function getRandomOrderedPriorities(): Priority[] {
  let prios: Priority[] = [ 1, 2, 3, 4, 5 ];

  prios = prios.map((prio) => ({ prio, sortIndex: Math.random() }))
                   .sort((a, b) => a.sortIndex - b.sortIndex)
                   .map((item) => item.prio);

  return prios;
}

function createTestComponent(): TestComponent {
  return TestBed.createComponent(TestComponent).componentInstance;
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      imports: [ NzIfModule, NzQueryViewModule ],
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


describe('[nzIf] optimized. notifying query view', () => {
  for (let prio = 1; prio < 6; prio++) {
    describe(`Query view priority level ${prio}`, () => {
      describe('Raw values', () => {
        describe('using waitUntilSchedulingDone()', () => {
          setupEnviroment();
          it('Query view should run change detection',async () => {
            const component = createTestComponent();
            component.queryViewPriority = prio;
            component.setValues([0, false, '', undefined, null]);
            component.setPriorities(getRandomOrderedPriorities());
            await waitUntilSchedulingDone();

            component.enableListening();
            component.setValues([1, true, 'A', -1, {}]);
            component.detectChangesAndResetCounter();
            await waitUntilSchedulingDone();
            expect(component.getChildrenLength()).toEqual(0);
            expect(component.getCheckCount()).toEqual(0);

            component.reset();
            component.setValues([0, false, '', undefined, null]);
            component.detectChangesAndResetCounter();
            await waitUntilSchedulingDone();
            expect(component.getChildrenLength()).toEqual(0);
            expect(component.getCheckCount()).toEqual(0);


            component.reset();
            component.setValues([1, true, 'A', -1, {}]);
            component.detectChangesAndResetCounter();
            await waitUntilSchedulingDone();
            expect(component.getChildrenLength()).toEqual(0);
            expect(component.getCheckCount()).toEqual(0);
          });
        });

        describe('using flushScheduler()', () => {
          setupEnviroment();
          it('Query view should run change detection',async () => {
            const component = createTestComponent();
            component.queryViewPriority = prio;
            component.setValues([0, false, '', undefined, null]);
            component.setPriorities(getRandomOrderedPriorities());
            flushScheduler();

            component.enableListening();
            component.setValues([1, true, 'A', -1, {}]);
            component.detectChangesAndResetCounter();
            flushScheduler();
            expect(component.getChildrenLength()).toEqual(0);
            expect(component.getCheckCount()).toEqual(0);

            component.reset();
            component.setValues([0, false, '', undefined, null]);
            component.detectChangesAndResetCounter();
            flushScheduler();
            expect(component.getChildrenLength()).toEqual(0);
            expect(component.getCheckCount()).toEqual(0);


            component.reset();
            component.setValues([1, true, 'A', -1, {}]);
            component.detectChangesAndResetCounter();
            flushScheduler();
            expect(component.getChildrenLength()).toEqual(0);
            expect(component.getCheckCount()).toEqual(0);
          });
        });
      });

      describe('Promises', () => {
        describe('using waitUntilSchedulingDone()', () => {
          setupEnviroment();
          it('Query view should run change detection',async () => {
            const component = createTestComponent();
            component.queryViewPriority = prio;
            component.setValues([0, false, '', undefined, null]);
            component.setPriorities(getRandomOrderedPriorities());
            await waitUntilSchedulingDone();

            component.enableListening();

            let promise = new Promise<any>((resolve) => {
              setTimeout(() => resolve({}), 100)
            });

            component.setValues([promise, promise, promise, promise, promise]);
            component.detectChangesAndResetCounter();
            await waitUntilSchedulingDone();
            expect(component.getChildrenLength()).toEqual(0);
            await promise;
            await waitUntilSchedulingDone();
            expect(component.getCheckCount()).toEqual(0);
            expect(component.getChildrenLength()).toEqual(0);

            // component.reset()

            promise = new Promise<any>((resolve) => {
              setTimeout(() => resolve({}), 100)
            });

            component.setValues([promise, promise, promise, promise, promise]);
            component.detectChangesAndResetCounter();
            await waitUntilSchedulingDone();
            expect(component.getChildrenLength()).toEqual(0);
            component.reset()
            await promise;
            await waitUntilSchedulingDone();
            expect(component.getCheckCount()).toEqual(0);
            expect(component.getChildrenLength()).toEqual(0);
          });
        });

        describe('using flushScheduler()', () => {
          setupEnviroment();
          it('Query view should run change detection', fakeAsync(() => {
            const component = createTestComponent();
            component.queryViewPriority = prio;
            component.setValues([0, false, '', undefined, null]);
            component.setPriorities(getRandomOrderedPriorities());
            flushScheduler()

            component.enableListening();

            let promise = new Promise<any>((resolve) => {
              setTimeout(() => resolve({}), 100)
            });

            component.setValues([promise, promise, promise, promise, promise]);
            component.detectChangesAndResetCounter();
            flushScheduler();
            expect(component.getChildrenLength()).toEqual(0);

            flush();
            flushScheduler();
            flush();
            flushScheduler();
            expect(component.getCheckCount()).toEqual(0);
            expect(component.getChildrenLength()).toEqual(0);

            // component.reset();

            promise = new Promise<any>((resolve) => {
              setTimeout(() => resolve({}), 100)
            });

            component.setValues([promise, promise, promise, promise, promise]);
            component.detectChangesAndResetCounter();
            flushScheduler();
            expect(component.getChildrenLength()).toEqual(0);
            component.reset();
            flush();
            flushScheduler();
            flush();
            flushScheduler();
            expect(component.getCheckCount()).toEqual(0);
            expect(component.getChildrenLength()).toEqual(0);
          }));
        });
      });

      describe('Observables', () => {
        describe('using waitUntilSchedulingDone()', () => {
          setupEnviroment();
          it('Query view should run change detection',async () => {
            const component = createTestComponent();
            component.queryViewPriority = prio;
            component.setValues([0, false, '', undefined, null]);
            component.setPriorities(getRandomOrderedPriorities());
            await waitUntilSchedulingDone();

            component.enableListening();

            let observable = fromPromiseLike(new Promise<any>((resolve) => {
              setTimeout(() => resolve({}), 100)
            }));

            component.setValues([observable, observable, observable, observable, observable]);
            component.detectChangesAndResetCounter();
            await waitUntilSchedulingDone();
            expect(component.getChildrenLength()).toEqual(0);
            await firstValueFrom(observable);
            await waitUntilSchedulingDone();
            expect(component.getCheckCount()).toEqual(1);
            expect(component.getChildrenLength()).toEqual(5);

            component.reset()

            observable = fromPromiseLike(new Promise<any>((resolve) => {
              setTimeout(() => resolve({}), 100)
            }));

            component.setValues([observable, observable, observable, observable, observable]);
            component.detectChangesAndResetCounter();
            await waitUntilSchedulingDone();
            expect(component.getChildrenLength()).toEqual(0);
            component.reset()
            await firstValueFrom(observable);
            await waitUntilSchedulingDone();
            expect(component.getCheckCount()).toEqual(1);
            expect(component.getChildrenLength()).toEqual(5);
          });
        });

        describe('using flushScheduler()', () => {
          setupEnviroment();
          it('Query view should run change detection', fakeAsync(() => {
            const component = createTestComponent();
            component.queryViewPriority = prio;
            component.setValues([0, false, '', undefined, null]);
            component.setPriorities(getRandomOrderedPriorities());
            flushScheduler();

            component.enableListening();

            let observable = fromPromiseLike(new Promise<any>((resolve) => {
              setTimeout(() => resolve({}), 100)
            }));

            component.setValues([observable, observable, observable, observable, observable]);
            component.detectChangesAndResetCounter();
            flushScheduler();
            expect(component.getChildrenLength()).toEqual(0);
            flush();
            flushScheduler();
            expect(component.getCheckCount()).toEqual(1);
            expect(component.getChildrenLength()).toEqual(5);

            // component.reset()

            observable = fromPromiseLike(new Promise<any>((resolve) => {
              setTimeout(() => resolve({}), 100)
            }));

            component.setValues([observable, observable, observable, observable, observable]);
            component.detectChangesAndResetCounter();
            flushScheduler();
            expect(component.getChildrenLength()).toEqual(0);
            component.reset()
            flush();
            flushScheduler();
            expect(component.getCheckCount()).toEqual(1);
            expect(component.getChildrenLength()).toEqual(5);
          }));
        });
      });

      describe('Subject', () => {
        describe('using waitUntilSchedulingDone()', () => {
          setupEnviroment();
          it('Query view should run change detection', async () => {
            const component = createTestComponent();
            component.queryViewPriority = prio;
            component.setValues([0, false, '', undefined, null]);
            component.setPriorities(getRandomOrderedPriorities());
            await waitUntilSchedulingDone();

            component.enableListening();

            const subject = new Subject<any>();

            component.setValues([ subject, subject, subject, subject, subject ]);
            component.detectChangesAndResetCounter()
            await waitUntilSchedulingDone();
            expect(component.getChildrenLength()).toEqual(0);
            subject.next({});
            await waitUntilSchedulingDone();
            expect(component.getCheckCount()).toEqual(1);
            expect(component.getChildrenLength()).toEqual(5);

            component.reset();
            subject.next(null);
            await waitUntilSchedulingDone();
            expect(component.getCheckCount()).toEqual(1);
            expect(component.getChildrenLength()).toEqual(0);

            component.reset();
            subject.next({});
            await waitUntilSchedulingDone();
            expect(component.getCheckCount()).toEqual(1);
            expect(component.getChildrenLength()).toEqual(5);

            component.reset();
            subject.next(null);
            await waitUntilSchedulingDone();
            expect(component.getCheckCount()).toEqual(1);
            expect(component.getChildrenLength()).toEqual(0);
          });
        });

        describe('using flushScheduler()', () => {
          setupEnviroment();
          it('Query view should run change detection', () => {
            const component = createTestComponent();
            component.queryViewPriority = prio;
            component.setValues([0, false, '', undefined, null]);
            component.setPriorities(getRandomOrderedPriorities());
            flushScheduler();

            component.enableListening();

            const subject = new Subject<any>();

            component.setValues([ subject, subject, subject, subject, subject ]);
            component.detectChangesAndResetCounter()
            flushScheduler();
            expect(component.getChildrenLength()).toEqual(0);
            subject.next({});
            flushScheduler();
            expect(component.getCheckCount()).toEqual(1);
            expect(component.getChildrenLength()).toEqual(5);

            component.reset();
            subject.next(null);
            flushScheduler();
            expect(component.getCheckCount()).toEqual(1);
            expect(component.getChildrenLength()).toEqual(0);

            component.reset();
            subject.next({});
            flushScheduler();
            expect(component.getCheckCount()).toEqual(1);
            expect(component.getChildrenLength()).toEqual(5);

            component.reset();
            subject.next(null);
            flushScheduler();
            expect(component.getCheckCount()).toEqual(1);
            expect(component.getChildrenLength()).toEqual(0);
          });
        });
      });
    });
  }
});
