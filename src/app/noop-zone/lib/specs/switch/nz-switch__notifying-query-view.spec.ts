import { AfterContentInit, Component, Directive, DoCheck, ElementRef, inject } from "@angular/core";
import { Priority, detectChanges, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { BehaviorSubject, Observable, firstValueFrom } from "rxjs";
import { TestBed, fakeAsync, flush } from "@angular/core/testing";
import { NzSwitchModule } from "../../template/switch/nz-switch.module";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";
import { NzQueryViewModule } from "../../template/query-view/query-view.module";

@Directive({ selector: '[testDir]' })
class TestDirective implements AfterContentInit, DoCheck {
  checkCount = 0;
  private _isInit = false;

  constructor(testComp: TestComponent) {
    testComp.testDir = this;
  }

  ngDoCheck(): void {
    if (this._isInit) {
      this.checkCount++;
    }
  }

  ngAfterContentInit(): void {
    this._isInit = true;
  }
}

@Component({
  selector: 'test-cmp',
  template: `
    <ng-container *nzQueryView="queryViewPriority">
      <div testDir [nzSwitch]="value" [priority]="priority">

        <ng-container *nzSwitchCase="1">
          <p class="case-1"></p>
        </ng-container>
        <ng-container *nzSwitchCase="1">
          <p class="case-1"></p>
        </ng-container>
        <ng-container *nzSwitchCase="1">
          <p class="case-1"></p>
        </ng-container>

        <ng-container *nzSwitchCase="2">
          <p class="case-2"></p>
        </ng-container>
        <ng-container *nzSwitchCase="2">
          <p class="case-2"></p>
        </ng-container>

        <ng-container *nzSwitchCase="3">
          <p class="case-3"></p>
        </ng-container>

        <ng-container *nzSwitchDefault>
          <p class="case-default"></p>
        </ng-container>
        <ng-container *nzSwitchDefault>
          <p class="case-default"></p>
        </ng-container>
        <ng-container *nzSwitchDefault>
          <p class="case-default"></p>
        </ng-container>

      </div>
    </ng-container>
  `
})
class TestComponent {
  cdRef = initializeComponent(this);
  value!: number | Promise<number> | Observable<number>;
  priority: Priority = Priority.normal;
  elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  queryViewPriority = Math.round(4 * Math.random() + 1);
  testDir!: TestDirective;

  detectChanges(): void {
    detectChanges(this.cdRef);
  }
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      imports: [ NzSwitchModule, NzQueryViewModule ],
      declarations: [ TestComponent, TestDirective ],
      teardown: { destroyAfterEach: true }
    }).compileComponents();
  });

  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
    TestBed.resetTestingModule();
  })
}

function createComponent(): TestComponent {
  return TestBed.createComponent(TestComponent).componentInstance;
}

for (let prio = 1; prio < 6; prio++) {
  describe(`[nzSwitch]: Notifying query view. Priority level ${prio}.`, () => {
    describe('Raw values. Using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should render the right view.', async () => {
        const component = createComponent();
        component.priority = prio;
        component.value = 1;
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(1);

        component.value = 2;
        component.detectChanges();
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(3);

        component.value = 3;
        component.detectChanges();
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(5);

        component.value = 5;
        component.detectChanges();
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        expect(component.testDir.checkCount).toEqual(7);

        component.value = 1;
        component.detectChanges();
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(9);
      });
    });

    describe('Raw values. Using flushScheduler() function.', () => {
      setupEnviroment();
      it('Should render the right view.', () => {
        const component = createComponent();
        component.priority = prio;
        component.value = 1;
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(1);

        component.value = 2;
        component.detectChanges();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(3);

        component.value = 3;
        component.detectChanges();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(5);

        component.value = 5;
        component.detectChanges();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        expect(component.testDir.checkCount).toEqual(7);

        component.value = 1;
        component.detectChanges();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(9);
      });
    });

    describe('Promises. Using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should render the right view.', async () => {
        const component = createComponent();
        component.priority = prio;
        let promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(1); }, 100);
        });
        component.value = promise;
        await waitUntilSchedulingDone();
        await promise;
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(1);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(2); }, 100);
        });
        component.value = promise;
        component.detectChanges();
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(2);

        await promise;
        await waitUntilSchedulingDone();

        expect(component.testDir.checkCount).toEqual(3);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(3); }, 100);
        });
        component.value = promise;
        component.detectChanges();
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(4);

        await promise;
        await waitUntilSchedulingDone();

        expect(component.testDir.checkCount).toEqual(5);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(5); }, 100);
        });
        component.value = promise;
        component.detectChanges();
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(6);

        await promise;
        await waitUntilSchedulingDone();

        expect(component.testDir.checkCount).toEqual(7);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(1); }, 100);
        });
        component.value = promise;
        component.detectChanges();
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        expect(component.testDir.checkCount).toEqual(8);

        await promise;
        await waitUntilSchedulingDone();

        expect(component.testDir.checkCount).toEqual(9);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);
      });
    });

    describe('Promises. Using flushScheduler() function.', () => {
      setupEnviroment();
      it('Should render the right view.', fakeAsync(() => {
        const component = createComponent();
        component.priority = prio;
        let promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(1); }, 100);
        });
        component.value = promise;
        flushScheduler();
        flush();
        flushScheduler();
        flush();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(1);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(2); }, 100);
        });
        component.value = promise;
        component.detectChanges();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(2);

        flush();
        flushScheduler();
        flush();
        flushScheduler();

        expect(component.testDir.checkCount).toEqual(3);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(3); }, 100);
        });
        component.value = promise;
        component.detectChanges();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(4);

        flush();
        flushScheduler();
        flush();
        flushScheduler();

        expect(component.testDir.checkCount).toEqual(5);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(5); }, 100);
        });
        component.value = promise;
        component.detectChanges();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(6);

        flush();
        flushScheduler();
        flush();
        flushScheduler();

        expect(component.testDir.checkCount).toEqual(7);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(1); }, 100);
        });
        component.value = promise;
        component.detectChanges();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        expect(component.testDir.checkCount).toEqual(8);

        flush();
        flushScheduler();
        flush();
        flushScheduler();

        expect(component.testDir.checkCount).toEqual(9);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);
      }));
    });

    describe('Observables. Using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should render the right view.', async () => {
        const component = createComponent();
        component.priority = prio;
        let observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(1); }, 100);
        });
        component.value = observable;
        await waitUntilSchedulingDone();
        await firstValueFrom(observable);
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(1);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(2); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(2);

        await firstValueFrom(observable);
        await waitUntilSchedulingDone();

        expect(component.testDir.checkCount).toEqual(3);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(3); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(4);

        await firstValueFrom(observable);
        await waitUntilSchedulingDone();

        expect(component.testDir.checkCount).toEqual(5);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(5); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(6);

        await firstValueFrom(observable);
        await waitUntilSchedulingDone();

        expect(component.testDir.checkCount).toEqual(7);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(1); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        expect(component.testDir.checkCount).toEqual(8);

        await firstValueFrom(observable);
        await waitUntilSchedulingDone();

        expect(component.testDir.checkCount).toEqual(9);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);
      });
    });

    describe('Observables. Using flushScheduler() function.', () => {
      setupEnviroment();
      it('Should render the right view.', fakeAsync(() => {
        const component = createComponent();
        component.priority = prio;
        let observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(1); }, 100);
        });
        component.value = observable;
        flushScheduler();
        flush();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(1);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(2); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(2);

        flush();
        flushScheduler();

        expect(component.testDir.checkCount).toEqual(3);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(3); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(4);

        flush();
        flushScheduler();

        expect(component.testDir.checkCount).toEqual(5);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(5); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(6);

        flush();
        flushScheduler();

        expect(component.testDir.checkCount).toEqual(7);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(1); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        expect(component.testDir.checkCount).toEqual(8);

        flush();
        flushScheduler();

        expect(component.testDir.checkCount).toEqual(9);

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);
      }));
    });

    describe('Subject. Using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should render the right view.', async () => {
        const component = createComponent();
        component.priority = prio;
        const subject = new BehaviorSubject<number>(1);
        component.value = subject;
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(1);

        subject.next(2);
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(2);

        subject.next(3);
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(3);

        subject.next(5)
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        expect(component.testDir.checkCount).toEqual(4);

        subject.next(1)
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(5);
      });
    });

    describe('Subject. Using flushScheduler() function.', () => {
      setupEnviroment();
      it('Should render the right view.', () => {
        const component = createComponent();
        component.priority = prio;
        const subject = new BehaviorSubject<number>(1);
        component.value = subject;
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(1);

        subject.next(2);
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(2);

        subject.next(3);
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(3);

        subject.next(5)
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        expect(component.testDir.checkCount).toEqual(4);

        subject.next(1)
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        expect(component.testDir.checkCount).toEqual(5);
      });
    });
  });
}
