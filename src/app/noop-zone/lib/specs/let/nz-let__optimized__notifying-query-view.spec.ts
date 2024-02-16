import { Component, Directive, DoCheck, ElementRef, inject } from "@angular/core";
import { TestBed, fakeAsync, flush } from "@angular/core/testing";
import { Observable, Subject, firstValueFrom } from "rxjs";
import { detectChanges, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { NzLetModule } from "../../template/let/nz-let.module";
import { disposeNoopZoneTestingEnviroment, provideNgNoopZone } from "../../core/src/enviroment/enviroment";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";
import { NzQueryViewModule } from "../../template/query-view/query-view.module";
import { provideNzLetConfiguration } from "../../template";

@Directive({ selector: '[testDir]' })
class TestDirective implements DoCheck {
  checkCount = 0;

  constructor(component: TestComponent) {
    component.testDir = this;
  }

  ngDoCheck(): void {
    this.checkCount++;
  }

  reset(): void {
    this.checkCount = 0;
  }
}

@Component({
  selector: 'test-comp',
  template: `
    <ng-container *nzQueryView="qvPrio">
      <div testDir>
        <p *nzLet="value; let val">{{val}}</p>
      </div>
    </ng-container>
  `
})
class TestComponent {
  testDir: TestDirective | null = null;
  qvPrio = Math.round(4 * Math.random() + 1);
  value: Promise<any> | Observable<any> = null!
  elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  cdRef = initializeComponent(this, Math.round(4 * Math.random() + 1))

  setValue(val: Observable<any> | Promise<any>) {
    this.value = val;
  }

  getCheckCount() {
    return this.testDir!.checkCount;
  }

  getPTag() {
    return this.elementRef.nativeElement.querySelector('p') as HTMLElement | null;
  }

  detectChanges(): void {
    detectChanges(this.cdRef, Math.round(4 * Math.random() + 1));
  }
}

function createComponent(): TestComponent {
  return TestBed.createComponent(TestComponent).componentInstance;
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      declarations: [ TestComponent, TestDirective ],
      imports: [ NzLetModule, NzQueryViewModule ],
      providers: [ provideNgNoopZone(), provideNzLetConfiguration({ optimized: true }) ]
    }).compileComponents();
  });

  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
    TestBed.resetTestingModule();
  })
}

describe('[nzLet] Optimized. Notifying query view', () => {

  describe('Primses.', () => {
    for (let prio = 1; prio < 6; prio++) {

      describe(`Priority level ${prio}. Using waitUntilSchedulingDone() function`, () => {
        setupEnviroment();
        it('Shold notify query view', async () => {
          const component = createComponent();
          let oldVal = 'RENDERED_TEXT_1';
          let newVal = oldVal

          let promise = new Promise((resolve) => {
            setTimeout(() => { resolve(newVal); }, 100)
          });
          component.setValue(promise);
          await waitUntilSchedulingDone();
          component.testDir!.reset();

          expect(component.getPTag()).toBeNull();

          await promise;
          await waitUntilSchedulingDone();
          // expect(component.getPTag()?.textContent).toEqual(newVal);
          // expect(component.testDir!.checkCount).toEqual(1);
          expect(component.getPTag()).toBeNull();
          expect(component.testDir!.checkCount).toEqual(0);

          newVal = newVal.replace('1', '2');
          promise = new Promise((resolve) => {
            setTimeout(() => { resolve(newVal); }, 100)
          });

          component.setValue(promise);
          component.detectChanges();
          await waitUntilSchedulingDone();
          component.testDir!.reset();

          // expect(component.getPTag()?.textContent).toEqual(oldVal);
          expect(component.getPTag()).toBeNull();

          await promise;
          await waitUntilSchedulingDone();
          // expect(component.getPTag()?.textContent).toEqual(newVal );
          // expect(component.testDir!.checkCount).toEqual(0);
          expect(component.getPTag()).toBeNull();
          expect(component.testDir!.checkCount).toEqual(0);
        });
      });

      describe(`Priority level ${prio}. Using flushScheduler() function`, () => {
        setupEnviroment();
        it('Shold notify query view',  fakeAsync(() => {
          const component = createComponent();
          let oldVal = 'RENDERED_TEXT_1';
          let newVal = oldVal

          let promise = new Promise((resolve) => {
            setTimeout(() => { resolve(newVal); }, 100)
          });
          component.setValue(promise);
          flushScheduler();
          component.testDir!.reset();

          expect(component.getPTag()).toBeNull();

          flush();
          flushScheduler();
          flush();
          flushScheduler();
          // expect(component.getPTag()?.textContent).toEqual(newVal);
          // expect(component.testDir!.checkCount).toEqual(1);
          expect(component.getPTag()).toBeNull();
          expect(component.testDir!.checkCount).toEqual(0);

          newVal = newVal.replace('1', '2');
          promise = new Promise((resolve) => {
            setTimeout(() => { resolve(newVal); }, 100)
          });

          component.setValue(promise);
          component.detectChanges();
          flushScheduler()
          component.testDir!.reset();

          // expect(component.getPTag()?.textContent).toEqual(oldVal);
          expect(component.getPTag()).toBeNull();

          flush();
          flushScheduler();
          flush();
          flushScheduler();
          // expect(component.getPTag()?.textContent).toEqual(newVal);
          expect(component.testDir!.checkCount).toEqual(0);
        }));
      });

    }
  });

  describe('Observables.', () => {
    for (let prio = 1; prio < 6; prio++) {

      describe(`Priority level ${prio}. Using waitUntilSchedulingDone() function`, () => {
        setupEnviroment();
        it('Shold notify query view', async () => {
          const component = createComponent();
          let oldVal = 'RENDERED_TEXT_1';
          let newVal = oldVal

          let observeble = new Observable((observer) => {
            setTimeout(() => { observer.next(newVal) }, 100)
          });
          component.setValue(observeble);
          await waitUntilSchedulingDone();
          component.testDir!.reset();

          expect(component.getPTag()).toBeNull();

          await firstValueFrom(observeble);
          await waitUntilSchedulingDone();
          expect(component.getPTag()?.textContent).toEqual(newVal);
          expect(component.testDir!.checkCount).toEqual(1);

          newVal = newVal.replace('1', '2');
          observeble = new Observable((observer) => {
            setTimeout(() => { observer.next(newVal) }, 100)
          });

          component.setValue(observeble);
          component.detectChanges();
          await waitUntilSchedulingDone();
          component.testDir!.reset();

          expect(component.getPTag()?.textContent).toEqual(oldVal);

          await firstValueFrom(observeble);
          await waitUntilSchedulingDone();
          expect(component.getPTag()?.textContent).toEqual(newVal);
          expect(component.testDir!.checkCount).toEqual(0);
        });
      });

      describe(`Priority level ${prio}. Using flushScheduler() function`, () => {
        setupEnviroment();
        it('Shold notify query view',  fakeAsync(() => {
          const component = createComponent();
          let oldVal = 'RENDERED_TEXT_1';
          let newVal = oldVal

          let observeble = new Observable((observer) => {
            setTimeout(() => { observer.next(newVal) }, 100)
          });
          component.setValue(observeble);
          flushScheduler();
          component.testDir!.reset();

          expect(component.getPTag()).toBeNull();

          flush();
          flushScheduler();
          expect(component.getPTag()?.textContent).toEqual(newVal);
          expect(component.testDir!.checkCount).toEqual(1);

          newVal = newVal.replace('1', '2');
          observeble = new Observable((observer) => {
            setTimeout(() => { observer.next(newVal) }, 100)
          });

          component.setValue(observeble);
          component.detectChanges();
          flushScheduler();
          component.testDir!.reset();

          expect(component.getPTag()?.textContent).toEqual(oldVal);

          flush();
          flushScheduler();
          expect(component.getPTag()?.textContent).toEqual(newVal);
          expect(component.testDir!.checkCount).toEqual(0);
        }));
      });

    }
  });

  describe('Primses.', () => {
    for (let prio = 1; prio < 6; prio++) {

      describe(`Priority level ${prio}. Using waitUntilSchedulingDone() function`, () => {
        setupEnviroment();
        it('Shold notify query view', async () => {
          const component = createComponent();
          let oldVal = 'RENDERED_TEXT_1';
          let newVal = oldVal;

          let subject = new Subject<any>();
          component.setValue(subject);
          await waitUntilSchedulingDone();
          component.testDir!.reset();

          expect(component.getPTag()).toBeNull();

          subject.next(newVal)
          await waitUntilSchedulingDone();
          expect(component.getPTag()?.textContent).toEqual(newVal);
          expect(component.testDir!.checkCount).toEqual(1);

          newVal = newVal.replace('1', '2');
          subject.next(newVal)
          component.testDir!.reset();

          expect(component.getPTag()?.textContent).toEqual(oldVal);

          await waitUntilSchedulingDone();
          expect(component.getPTag()?.textContent).toEqual(newVal);
          expect(component.testDir!.checkCount).toEqual(0);
        });
      });

      describe(`Priority level ${prio}. Using flushScheduler() function`, () => {
        setupEnviroment();
        it('Shold notify query view',  fakeAsync(() => {
          const component = createComponent();
          let oldVal = 'RENDERED_TEXT_1';
          let newVal = oldVal;

          let subject = new Subject<any>();
          component.setValue(subject);
          flushScheduler();
          component.testDir!.reset();

          expect(component.getPTag()).toBeNull();

          subject.next(newVal)
          flushScheduler();
          expect(component.getPTag()?.textContent).toEqual(newVal);
          expect(component.testDir!.checkCount).toEqual(1);

          newVal = newVal.replace('1', '2');
          subject.next(newVal)
          component.testDir!.reset();

          expect(component.getPTag()?.textContent).toEqual(oldVal);

          flushScheduler();
          expect(component.getPTag()?.textContent).toEqual(newVal);
          expect(component.testDir!.checkCount).toEqual(0);
        }));
      });

    }
  });

});
