import { Component, ElementRef, inject } from "@angular/core";
import { Priority, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { Observable, Subject, firstValueFrom } from "rxjs";
import { TestBed, fakeAsync, flush } from "@angular/core/testing";
import { InPipeModule } from "../../template";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";

@Component({
  selector: 'test-comp',
  template: `
    <p>
      {{ valueSource | in:cdRef:priority }}
    </p>
  `
})
class TestComponent {
  cdRef = initializeComponent(this);
  valueSource: Promise<any> | Observable<any> | null = null;
  priority: Priority = Priority.immediate;
  elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  setValueSource(valueSource: Promise<any> | Observable<any>) {
    this.valueSource = valueSource;
  }
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      imports: [ InPipeModule ],
      declarations: [ TestComponent ],
      teardown: { destroyAfterEach: true }
    }).compileComponents();
  });

  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
  });
}

function createComponent(): TestComponent {
  return TestBed.createComponent(TestComponent).componentInstance;
}

for (let prio = 1; prio < 6; prio++) {
  describe(`Priority level ${prio}. Promise.`, () => {
    describe('with waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should render text', async () => {
        const component = createComponent();
        component.priority = prio;
        const promise = new Promise<any>((resolve) => {
          setTimeout(() => { resolve('RENDERED_TEXT'); }, 100);
        });
        component.setValueSource(promise);
        await waitUntilSchedulingDone();
        let text = component.elementRef.nativeElement.querySelector('p')?.textContent?.trim();
        expect(text).toEqual('');
        await promise;
        await waitUntilSchedulingDone();
        text = component.elementRef.nativeElement.querySelector('p')?.textContent?.trim();
        expect(text).toEqual('RENDERED_TEXT');
      });
    });

    describe('with flushScheduler() function.', () => {
      setupEnviroment();
      it('Should render text', fakeAsync(() => {
        const component = createComponent();
        component.priority = prio;
        const promise = new Promise<any>((resolve) => {
          setTimeout(() => { resolve('RENDERED_TEXT'); }, 100);
        });
        component.setValueSource(promise);
        flushScheduler();
        let text = component.elementRef.nativeElement.querySelector('p')?.textContent?.trim();
        expect(text).toEqual('');
        flush();
        flushScheduler();
        flush();
        flushScheduler();
        text = component.elementRef.nativeElement.querySelector('p')?.textContent?.trim();
        expect(text).toEqual('RENDERED_TEXT');
      }));
    });
  });

  describe(`Priority level ${prio}. Observable.`, () => {
    describe('with waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should render text', async () => {
        const component = createComponent();
        component.priority = prio;
        const observable = new Observable<any>((observer) => {
          setTimeout(() => { observer.next('RENDERED_TEXT') }, 100);
        });
        component.setValueSource(observable);
        await waitUntilSchedulingDone();
        let text = component.elementRef.nativeElement.querySelector('p')?.textContent?.trim();
        expect(text).toEqual('');
        await firstValueFrom(observable);
        await waitUntilSchedulingDone();
        text = component.elementRef.nativeElement.querySelector('p')?.textContent?.trim();
        expect(text).toEqual('RENDERED_TEXT');
      });
    });

    describe('with flushScheduler() function.', () => {
      setupEnviroment();
      it('Should render text', fakeAsync(() => {
        const component = createComponent();
        component.priority = prio;
        const observable = new Observable<any>((observer) => {
          setTimeout(() => { observer.next('RENDERED_TEXT') }, 100);
        });
        component.setValueSource(observable);
        flushScheduler();
        let text = component.elementRef.nativeElement.querySelector('p')?.textContent?.trim();
        expect(text).toEqual('');
        flush();
        flushScheduler();
        text = component.elementRef.nativeElement.querySelector('p')?.textContent?.trim();
        expect(text).toEqual('RENDERED_TEXT');
      }));
    });
  });

  describe(`Priority level ${prio}. Subject.`, () => {
    describe('with waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should render text', async () => {
        const component = createComponent();
        component.priority = prio;
        const subject = new Subject<any>()
        component.setValueSource(subject);
        await waitUntilSchedulingDone();
        let text = component.elementRef.nativeElement.querySelector('p')?.textContent?.trim();
        expect(text).toEqual('');
        subject.next('RENDERED_TEXT');
        await waitUntilSchedulingDone();
        text = component.elementRef.nativeElement.querySelector('p')?.textContent?.trim();
        expect(text).toEqual('RENDERED_TEXT');
      });
    });

    describe('with flushScheduler() function.', () => {
      setupEnviroment();
      it('Should render text', fakeAsync(() => {
        const component = createComponent();
        component.priority = prio;
        const subject = new Subject<any>();
        component.setValueSource(subject);
        flushScheduler();
        let text = component.elementRef.nativeElement.querySelector('p')?.textContent?.trim();
        expect(text).toEqual('');
        subject.next('RENDERED_TEXT')
        flushScheduler();
        text = component.elementRef.nativeElement.querySelector('p')?.textContent?.trim();
        expect(text).toEqual('RENDERED_TEXT');
      }));
    });
  });
}
