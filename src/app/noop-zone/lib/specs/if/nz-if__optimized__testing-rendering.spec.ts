import { Component } from "@angular/core";
import { Priority, detectChanges, initializeComponent, isPromiseLike } from "../../core";
import { ComponentFixture, TestBed, fakeAsync, flush } from "@angular/core/testing";
import { disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, provideNgNoopZone } from "../../core/src/enviroment/enviroment";
import { NzIfDirecive, provideNzIfConfiguration } from "../../template";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";
import { Observable, Subject, of } from "rxjs";

class ImmediatePromise implements PromiseLike<any> {
  then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined): PromiseLike<TResult1 | TResult2> {

    let value: TResult1 | PromiseLike<TResult1>

    if (onfulfilled) {
      value = onfulfilled('B');

      if (isPromiseLike(value)) {
        return value;
      } else {
        return Promise.resolve(value);
      }
    }

    return Promise.resolve(undefined as any);
  }
}


const falsyValues: any[] = [ undefined, null, false, 0, -0, '', new Promise(() => {}) ,of() ];
const truthyValues: any[] = [ [], {}, true, 1, -1, 'A', new ImmediatePromise() , of('C') ];

const TEXT = 'TEXT_TEXT_TEXT'

@Component({
  selector: 'app-test-comp',
  template: `
    <p *nzIf="value" id="test-p-1">${TEXT}</p>
  `
})
class TestComponent {
  cdRef = initializeComponent(this, Math.round(4 * Math.random() + 1));

  value: any;
  priority: Priority = Priority.normal;

  setValue(newValue: any): void {
    this.value = newValue;
    detectChanges(this.cdRef, this.priority);
  }

}

function getTextContent(fixture: ComponentFixture<TestComponent>, id: string): string | null | undefined {
  return ((fixture.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLElement | null)?.textContent;
}

function setupEnviroment(): void {

  beforeEach(async () => {

    if (truthyValues.length !== falsyValues.length) {
      throw new Error('Arrays length not matching!');
    }

    initialNoopZoneTestingEnviroment();

    await TestBed.configureTestingModule({
      declarations: [ TestComponent ],
      imports: [ NzIfDirecive ],
      teardown: { destroyAfterEach: true },
      providers: [ provideNgNoopZone(), provideNzIfConfiguration({ optimized: true }) ]
    }).compileComponents();
  });

  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
    TestBed.resetTestingModule()
  })
}



describe('Testing optimized *nzIf directive rendering.', () => {

  for (let prio = 1; prio < 6; prio++) {
    describe('Raw values', () => {
      setupEnviroment();

      it(`Priority level ${prio}: Should not toogle view`, async () => {
        const fixture = TestBed.createComponent(TestComponent);
        await waitUntilSchedulingDone();
        const component = fixture.componentInstance;
        component.priority = prio

        for (let i = 0; i < truthyValues[i].length - 1; i++) {
          component.setValue(falsyValues[i]);
          await waitUntilSchedulingDone();
          expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();

          component.setValue(truthyValues[i])
          await waitUntilSchedulingDone();
          console.log(truthyValues[i])
          expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
        }

        component.setValue(falsyValues[0]);
        await waitUntilSchedulingDone();
        expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();

      });
    });
  }

  for (let prio = 1; prio < 6; prio++) {
    describe(`Priority level ${prio}: Observables sync`, () => {
      setupEnviroment();
      it('Should toogle view', async () => {
        const fixture = TestBed.createComponent(TestComponent);
        await waitUntilSchedulingDone();
        const component = fixture.componentInstance;
        component.priority = prio

        const subject = new Subject<any>();
        component.setValue(subject);
        await waitUntilSchedulingDone();

          for (let i = 0; i < truthyValues.length - 2; i++) {
            subject.next(falsyValues[i]);
            await waitUntilSchedulingDone();
            expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();

            subject.next(truthyValues[i]);
            await waitUntilSchedulingDone();
            expect(getTextContent(fixture, 'test-p-1')).toEqual(TEXT);
          }

          subject.next(falsyValues[0]);
          await waitUntilSchedulingDone();
          expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();

      });
    });
  }

  for (let prio = 1; prio < 6; prio++) {
    describe(`Priority level ${prio}: Late resolved promises - fake async zone`, () => {
      setupEnviroment();
      it('Should not toogle view', fakeAsync(() => {


        const fixture = TestBed.createComponent(TestComponent);
        flushScheduler();
        const component = fixture.componentInstance;
        component.priority = prio;
        const values: any[] = [];

        for (let i = 0; i < truthyValues.length - 2; i++) {
          values.push(truthyValues[i]);
          values.push(falsyValues[i]);
        }

        const getPromise = (value: any) => new Promise((resolve) => {
          setTimeout(() => {
            resolve(value);
            flushScheduler();
          }, 100)
        });


        for (let i = 0; i < values.length; i++) {
          component.setValue(getPromise(values[i]))
          flushScheduler();
          if ((i + 1) % 2) {
            expect(values[i]).toBeTruthy()
            expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
          } else {
            expect(values[i]).toBeFalsy();
            expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
          }

          flush();
          flushScheduler();

          if ((i + 1) % 2) {
            expect(getTextContent(fixture, 'test-p-1')).toBeFalsy()
          } else {
            expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
          }
        }

      }));
    });
  }
});

for (let prio = 1; prio < 6; prio++) {
  describe(`Priority level ${prio}: Late resolved observables - fake async zone`, () => {
    setupEnviroment();
    it('Should toogle view', fakeAsync(() => {


      const fixture = TestBed.createComponent(TestComponent);
      flushScheduler();
      const component = fixture.componentInstance;
      component.priority = prio;
      const values: any[] = [];

      for (let i = 0; i < truthyValues.length - 2; i++) {
        values.push(truthyValues[i]);
        values.push(falsyValues[i]);
      }

      const getObserveble = (value: any) => new Observable((observer) => {
        setTimeout(() => {
          observer.next(value);
          flushScheduler();
        }, 100)
      });


      for (let i = 0; i < values.length; i++) {
        component.setValue(getObserveble(values[i]))
        flushScheduler()
        if ((i + 1) % 2) {
          expect(values[i]).toBeTruthy();
          expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
        } else {
          expect(values[i]).toBeFalsy();
          expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
        }

        flush();
        flushScheduler();

        if ((i + 1) % 2) {
          expect(getTextContent(fixture, 'test-p-1')).toEqual(TEXT);
        } else {
          expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
        }
      }

    }));
  });
}

for (let prio = 1; prio < 6; prio++) {
  describe(`Priority level ${prio}: using subjects`, () => {
    setupEnviroment()
    it('Should toogle view', async () => {

      const fixture = TestBed.createComponent(TestComponent);
      await waitUntilSchedulingDone();
      const component = fixture.componentInstance;
      component.priority = prio;
      const values: any[] = [];

      for (let i = 0; i < truthyValues.length - 2; i++) {
        values.push(truthyValues[i]);
        values.push(falsyValues[i]);
      }

      const subject = new Subject<any>();

      component.setValue(subject);
      await waitUntilSchedulingDone();
      expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();

      for (let i = 0; i < values.length; i++) {
        subject.next(values[i]);
        await waitUntilSchedulingDone();

        if ((i + 1) % 2) {
          expect(getTextContent(fixture, 'test-p-1')).toEqual(TEXT)
        } else {
          expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
        }
      }

    })
  });
}
