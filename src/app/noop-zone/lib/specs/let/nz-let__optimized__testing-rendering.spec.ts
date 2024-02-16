import { detectChanges, provideNzLetConfiguration } from 'projects/noop-zone/src';
import { Component, ElementRef, inject } from "@angular/core";
import { Priority, fromPromiseLike, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { Observable, Subject, firstValueFrom } from "rxjs";
import { TestBed, fakeAsync, flush } from "@angular/core/testing";
import { NzLetModule } from "../../template/let/nz-let.module";
import { disposeNoopZoneTestingEnviroment, provideNgNoopZone } from "../../core/src/enviroment/enviroment";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";

@Component({
  selector: 'test-comp',
  template: `
    <p *nzLet="valueSource; let value">
      {{ value }}
    </p>
  `
})
class TestComponent {
  priority = Priority.normal
  elementRef: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>);
  cdRef = initializeComponent(this, 4 * Math.random() + 1);
  valueSource: Promise<any> | Observable<any> = null!;

  setValueSource(valueSource: Promise<any> | Observable<any>) {
    this.valueSource = valueSource;
  }

  getTextContent(): string | null | undefined {
    return this.elementRef.nativeElement.querySelector('p')?.textContent?.trim();
  }

  getParagtaph(): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector('p');
  }

  detectChanges(): void {
    detectChanges(this.cdRef, Math.round(4 * Math.random() + 1));
  }
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      declarations: [ TestComponent ],
      imports: [ NzLetModule ],
      providers: [ provideNgNoopZone(), provideNzLetConfiguration({ optimized: true }) ],
      teardown: { destroyAfterEach: true }
    }).compileComponents()
  });

  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
    TestBed.resetTestingModule();
  });
}

function createComponent(): TestComponent {
  return TestBed.createComponent(TestComponent).componentInstance;
}

describe('[nzLet] Optimized. Testing rendering.', () => {

  describe('Primises. Using waitUntilSchedulingDone() function', () => {
    for (let prio = 1; prio < 6; prio++) {
      describe(`Priority level ${prio}.`, () => {
        setupEnviroment();
        it('Should not render text after promise resolved', async () => {
          const component = createComponent();
          component.priority = prio;
          let oldText = 'RENDERED_TEXT_1';
          let newText = oldText;
          let promise = new Promise((resolve) => {
            setTimeout(() => { resolve(newText); }, 100)
          });
          component.setValueSource(promise);
          await waitUntilSchedulingDone();
          expect(component.getParagtaph()).toBeNull();
          await promise;
          await waitUntilSchedulingDone();
          // expect(component.getParagtaph()).not.toBeNull();
          // expect(component.getTextContent()).toEqual(newText);
          expect(component.getParagtaph()).toBeNull();

          newText = 'RENDERED_TEXT_2';
          promise = new Promise((resolve) => {
            setTimeout(() => { resolve(newText); }, 100);
          });
          component.setValueSource(promise);
          component.detectChanges();
          await waitUntilSchedulingDone();
          // expect(component.getTextContent()).toEqual(oldText);
          expect(component.getParagtaph()).toBeNull();
          await promise;
          await waitUntilSchedulingDone();
          // expect(component.getTextContent()).toEqual(newText);
          expect(component.getParagtaph()).toBeNull();
        });
      });
    }
  });

  describe('Primises. Using flushScheduler() function', () => {
    for (let prio = 1; prio < 6; prio++) {
      describe(`Priority level ${prio}.`, () => {
        setupEnviroment();
        it('Should not render text after promise resolved', fakeAsync(() => {
          const component = createComponent();
          component.priority = prio;
          let oldText = 'RENDERED_TEXT_1';
          let newText = oldText;
          let promise = new Promise((resolve) => {
            setTimeout(() => { resolve(newText); }, 100)
          });
          component.setValueSource(promise);
          flushScheduler();
          expect(component.getParagtaph()).toBeNull();
          flush();
          flushScheduler();
          // expect(component.getParagtaph()).not.toBeNull();
          // expect(component.getTextContent()).toEqual(newText);
          expect(component.getParagtaph()).toBeNull();

          newText = 'RENDERED_TEXT_2';
          promise = new Promise((resolve) => {
            setTimeout(() => { resolve(newText); }, 100);
          });
          component.setValueSource(promise);
          component.detectChanges();
          flushScheduler();
          // expect(component.getTextContent()).toEqual(oldText);
          expect(component.getParagtaph()).toBeNull();
          flush();
          flushScheduler();
          // expect(component.getTextContent()).toEqual(newText);
          expect(component.getParagtaph()).toBeNull();
        }));
      });
    }
  });

  describe('Observables. Using waitUntilSchedulingDone() function', () => {
    for (let prio = 1; prio < 6; prio++) {
      describe(`Priority level ${prio}.`, () => {
        setupEnviroment();
        it('Should render text after promise resolved', async () => {
          const component = createComponent();
          component.priority = prio;
          let oldText = 'RENDERED_TEXT_1';
          let newText = oldText;
          let observable = fromPromiseLike(new Promise((resolve) => {
            setTimeout(() => { resolve(newText); }, 100)
          }));
          component.setValueSource(observable);
          await waitUntilSchedulingDone();
          expect(component.getParagtaph()).toBeNull();
          await firstValueFrom(observable);
          await waitUntilSchedulingDone();
          expect(component.getParagtaph()).not.toBeNull();
          expect(component.getTextContent()).toEqual(newText);

          newText = 'RENDERED_TEXT_2';
          observable = fromPromiseLike(new Promise((resolve) => {
            setTimeout(() => { resolve(newText); }, 100)
          }));
          component.setValueSource(observable);
          component.detectChanges();
          await waitUntilSchedulingDone();
          expect(component.getTextContent()).toEqual(oldText);
          await firstValueFrom(observable);
          await waitUntilSchedulingDone();
          expect(component.getTextContent()).toEqual(newText);
        });
      });
    }
  });

  describe('Observables. Using flushScheduler() function', () => {
    for (let prio = 1; prio < 6; prio++) {
      describe(`Priority level ${prio}.`, () => {
        setupEnviroment();
        it('Should render text after promise resolved',  fakeAsync(() => {
          const component = createComponent();
          component.priority = prio;
          let oldText = 'RENDERED_TEXT_1';
          let newText = oldText;
          let observable = fromPromiseLike(new Promise((resolve) => {
            setTimeout(() => { resolve(newText); }, 100)
          }));
          component.setValueSource(observable);
          flushScheduler();
          expect(component.getParagtaph()).toBeNull();
          flush();
          flushScheduler();
          expect(component.getParagtaph()).not.toBeNull();
          expect(component.getTextContent()).toEqual(newText);

          newText = 'RENDERED_TEXT_2';
          observable = fromPromiseLike(new Promise((resolve) => {
            setTimeout(() => { resolve(newText); }, 100)
          }));
          component.setValueSource(observable);
          component.detectChanges();
          flushScheduler();
          expect(component.getTextContent()).toEqual(oldText);
          flush();
          flushScheduler();
          expect(component.getTextContent()).toEqual(newText);
        }));
      });
    }
  });


  describe('Subjects. Using waitUntilSchedulingDone() function', () => {
    for (let prio = 1; prio < 6; prio++) {
      describe(`Priority level ${prio}.`, () => {
        setupEnviroment();
        it('Should render text after promise resolved', async () => {
          const component = createComponent();
          component.priority = prio;
          let oldText = 'RENDERED_TEXT_1';
          let newText = oldText;
          let subject = new Subject<any>();
          component.setValueSource(subject);
          await waitUntilSchedulingDone();
          expect(component.getParagtaph()).toBeNull();
          subject.next(newText);
          await waitUntilSchedulingDone();
          expect(component.getParagtaph()).not.toBeNull();
          expect(component.getTextContent()).toEqual(newText);

          newText = 'RENDERED_TEXT_2';
          subject.next(newText);
          expect(component.getTextContent()).toEqual(oldText);
          await waitUntilSchedulingDone();
          expect(component.getTextContent()).toEqual(newText);
        });
      });
    }
  });

  describe('Subjects. Using flushScheduler() function', () => {
    for (let prio = 1; prio < 6; prio++) {
      describe(`Priority level ${prio}.`, () => {
        setupEnviroment();
        it('Should render text after promise resolved',  fakeAsync(() => {
          const component = createComponent();
          component.priority = prio;
          let oldText = 'RENDERED_TEXT_1';
          let newText = oldText;
          let subject = new Subject<any>();
          component.setValueSource(subject);
          flushScheduler();
          expect(component.getParagtaph()).toBeNull();
          subject.next(newText);
          flushScheduler();
          expect(component.getParagtaph()).not.toBeNull();
          expect(component.getTextContent()).toEqual(newText);

          newText = 'RENDERED_TEXT_2';
          subject.next(newText);
          expect(component.getTextContent()).toEqual(oldText);
          flushScheduler();
          expect(component.getTextContent()).toEqual(newText);
        }));
      });
    }
  });
});

