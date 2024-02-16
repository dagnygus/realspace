import { Component } from "@angular/core";
import { BehaviorSubject, Observable, Subject, firstValueFrom } from "rxjs";
import { Priority, detectChanges, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { TestBed, fakeAsync, flush } from "@angular/core/testing";
import { NzSwitchModule } from "../../template/switch/nz-switch.module";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";

@Component({
  selector: 'test-cmp',
  template: `
    <div [nzSwitch]="value" [priority]="priority" (render)="onRender()">
      <ng-container *nzSwitchCase="1"></ng-container>
      <ng-container *nzSwitchCase="2"></ng-container>
      <ng-container *nzSwitchDefault></ng-container>
    </div>
  `
})
class TestComponent {
  cdRef = initializeComponent(this);
  value!: Observable<number> | Promise<number> | number
  priority: Priority = Priority.normal;
  renderCount = 0;

  detectChanges(): void {
    detectChanges(this.cdRef);
  }

  onRender(): void {
    this.renderCount++;
  }
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      imports: [ NzSwitchModule ],
      declarations: [ TestComponent ],
      teardown: { destroyAfterEach: true }
    }).compileComponents();
  });

  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
    TestBed.resetTestingModule();
  });

}

function createComponent(): TestComponent {
  return TestBed.createComponent(TestComponent).componentInstance;
}

for (let prio = 1; prio < 6; prio++) {
  describe(`[nzSwitch]: After render event. Priority level ${prio}.`, () => {
    describe('Raw values. using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should rise render event', async () => {
        const component = createComponent();
        component.priority = prio;
        component.value = 1;
        expect(component.renderCount).toEqual(0);

        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(1);

        component.value = 2;
        component.detectChanges();
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(2);

        component.value = 5;
        component.detectChanges();
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(3);

        component.value = 1;
        component.detectChanges();
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(4);
      });
    });

    describe('Raw values. using flushScheduler() function.', () => {
      setupEnviroment();
      it('Should rise render event', () => {
        const component = createComponent();
        component.priority = prio;
        component.value = 1;
        expect(component.renderCount).toEqual(0);

        flushScheduler();
        expect(component.renderCount).toEqual(1);

        component.value = 2;
        component.detectChanges();
        flushScheduler();
        expect(component.renderCount).toEqual(2);

        component.value = 5;
        component.detectChanges();
        flushScheduler();
        expect(component.renderCount).toEqual(3);

        component.value = 1;
        component.detectChanges();
        flushScheduler();
        expect(component.renderCount).toEqual(4);
      });
    });

    describe('Promises. using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should rise render event', async () => {
        const component = createComponent();
        component.priority = prio;
        let promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(1); }, 100)
        });
        component.value = promise;
        expect(component.renderCount).toEqual(0);

        await waitUntilSchedulingDone();
        await promise;
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(1);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(2); }, 100)
        });
        component.value = promise;
        component.detectChanges();
        await waitUntilSchedulingDone();
        await promise;
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(2);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(5); }, 100)
        });
        component.value = promise;
        component.detectChanges();
        await waitUntilSchedulingDone();
        await promise;
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(3);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(2); }, 100)
        });
        component.value = promise;
        component.detectChanges();
        await waitUntilSchedulingDone();
        await promise;
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(4);
      });
    });

    describe('Promises. using flushScheduler() function.', () => {
      setupEnviroment();
      it('Should rise render event', fakeAsync(() => {
        const component = createComponent();
        component.priority = prio;
        let promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(1); }, 100)
        });
        component.value = promise;
        expect(component.renderCount).toEqual(0);

        flushScheduler();
        flush();
        flushScheduler();
        flush();
        flushScheduler();
        expect(component.renderCount).toEqual(1);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(2); }, 100)
        });
        component.value = promise;
        component.detectChanges();
        flushScheduler();
        flush();
        flushScheduler();
        flush();
        flushScheduler();
        expect(component.renderCount).toEqual(2);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(5); }, 100)
        });
        component.value = promise;
        component.detectChanges();
        flushScheduler();
        flush();
        flushScheduler();
        flush();
        flushScheduler();
        expect(component.renderCount).toEqual(3);

        promise = new Promise<number>((resolve) => {
          setTimeout(() => { resolve(2); }, 100)
        });
        component.value = promise;
        component.detectChanges();
        flushScheduler();
        flush();
        flushScheduler();
        flush();
        flushScheduler();
        expect(component.renderCount).toEqual(4);
      }));
    });

    describe('Observables. using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should rise render event', async () => {
        const component = createComponent();
        component.priority = prio;
        let observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(1); }, 100);
        });
        component.value = observable;
        expect(component.renderCount).toEqual(0);

        await waitUntilSchedulingDone();
        await firstValueFrom(observable);
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(1);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(2); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        await waitUntilSchedulingDone();
        await firstValueFrom(observable);
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(2);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(5); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        await waitUntilSchedulingDone();
        await firstValueFrom(observable);
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(3);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(1); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        await waitUntilSchedulingDone();
        await firstValueFrom(observable);
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(4);
      });
    });

    describe('Observables. using flushScheduler() function.', () => {
      setupEnviroment();
      it('Should rise render event',  fakeAsync(() => {
        const component = createComponent();
        component.priority = prio;
        let observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(1); }, 100);
        });
        component.value = observable;
        expect(component.renderCount).toEqual(0);

        flushScheduler();
        flush();
        flushScheduler();
        expect(component.renderCount).toEqual(1);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(2); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        flushScheduler();
        flush();
        flushScheduler();
        expect(component.renderCount).toEqual(2);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(5); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        flushScheduler();
        flush();
        flushScheduler();
        expect(component.renderCount).toEqual(3);

        observable = new Observable<number>((observer) => {
          setTimeout(() => { observer.next(1); }, 100);
        });
        component.value = observable;
        component.detectChanges();
        flushScheduler();
        flush();
        flushScheduler();
        expect(component.renderCount).toEqual(4);
      }));
    });

    describe('Subject. using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should rise render event', async () => {
        const component = createComponent();
        component.priority = prio;
        const subject = new BehaviorSubject(1);
        component.value = subject;
        expect(component.renderCount).toEqual(0);

        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(1);

        subject.next(2)
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(2);

        subject.next(5)
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(3);

        subject.next(1)
        await waitUntilSchedulingDone();
        expect(component.renderCount).toEqual(4);
      });
    });

    describe('Subject. using flushScheduler() function.', () => {
      setupEnviroment();
      it('Should rise render event', () => {
        const component = createComponent();
        component.priority = prio;
        const subject = new BehaviorSubject(1);
        component.value = subject;
        expect(component.renderCount).toEqual(0);

        flushScheduler();
        expect(component.renderCount).toEqual(1);

        subject.next(2)
        flushScheduler();
        expect(component.renderCount).toEqual(2);

        subject.next(5)
        flushScheduler();
        expect(component.renderCount).toEqual(3);

        subject.next(1)
        flushScheduler();
        expect(component.renderCount).toEqual(4);
      });
    });
  });
}
