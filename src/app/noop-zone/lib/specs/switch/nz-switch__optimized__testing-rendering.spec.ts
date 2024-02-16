import { Component, ElementRef, inject } from "@angular/core";
import { Priority, detectChanges, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { BehaviorSubject, Observable, Subject, firstValueFrom } from "rxjs";
import { TestBed, fakeAsync, flush } from "@angular/core/testing";
import { NzSwitchModule } from "../../template/switch/nz-switch.module";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";
import { provideNzSwitchConfiguration } from "../../template";

@Component({
  selector: 'test-cmp',
  template: `
    <div [nzSwitch]="value" [priority]="priority">

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
  `
})
class TestComponent {
  cdRef = initializeComponent(this);
  value!: number | Promise<number> | Observable<number>;
  priority: Priority = Priority.normal;
  elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  detectChanges(): void {
    detectChanges(this.cdRef);
  }
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      imports: [ NzSwitchModule ],
      declarations: [ TestComponent ],
      providers: [ provideNzSwitchConfiguration({ optimized: true }) ],
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
  describe(`[nzSwitch] Optimized: Testing rendering. Priority level ${prio}.`, () => {

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

        await firstValueFrom(observable);
        await waitUntilSchedulingDone();

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

        await firstValueFrom(observable);
        await waitUntilSchedulingDone();

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

        await firstValueFrom(observable);
        await waitUntilSchedulingDone();

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

        await firstValueFrom(observable);
        await waitUntilSchedulingDone();

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

        flush();
        flushScheduler();

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

        flush();
        flushScheduler();

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

        flush();
        flushScheduler();

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

        flush();
        flushScheduler();

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

        subject.next(2);
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        subject.next(3);
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        subject.next(5);
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        subject.next(1);
        await waitUntilSchedulingDone();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);
      });
    });

    describe('Subject. Using waitUntilSchedulingDone() function.', () => {
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

        subject.next(2);
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        subject.next(3);
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

        subject.next(5)
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

        subject.next(1)
        flushScheduler();

        expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
        expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);
      });
    });
  });
}