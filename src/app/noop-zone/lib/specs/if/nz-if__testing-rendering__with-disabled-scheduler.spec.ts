import { Component } from "@angular/core";
import { ComponentFixture, TestBed, fakeAsync, flush } from "@angular/core/testing";
import { Observable, Subject, of } from "rxjs";
import { isPromiseLike, initializeComponent, Priority, detectChanges, initialNoopZoneTestingEnviroment, disposeNoopZoneTestingEnviroment } from "../../core";
import { provideNgNoopZone } from "../../core/src/enviroment/enviroment";
import { NzIfDirecive, NzIfModule } from "../../template";

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

const TEXT = 'RENDERED_TEXT'

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

    initialNoopZoneTestingEnviroment(true);

    await TestBed.configureTestingModule({
      declarations: [ TestComponent ],
      imports: [ NzIfModule ],
      teardown: { destroyAfterEach: true },
      providers: [ provideNgNoopZone() ]
    }).compileComponents();
  });

  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
    TestBed.resetTestingModule()
  })
}

describe('[nzIf] Scheduler disabled. Raw values.', () => {
  setupEnviroment();

  it('Should toogle view', () => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;

    for (let i = 0; i < truthyValues.length; i++) {
      component.setValue(falsyValues[i]);
      fixture.detectChanges();
      expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();

      component.setValue(truthyValues[i]);
      fixture.detectChanges();
      expect(getTextContent(fixture, 'test-p-1')).toEqual(TEXT);
    }

    component.setValue(falsyValues[0]);
    fixture.detectChanges();
    expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
  });
});

describe('[nzIf] Scheduler disabled. Subjects.', () => {
  setupEnviroment();

  it('Should toogle view', () => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    const subject = new Subject<any>();
    component.setValue(subject);

    for (let i = 0; i < truthyValues.length - 2; i++) {
      subject.next(falsyValues[i]);
      fixture.detectChanges();
      expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();

      subject.next(truthyValues[i]);
      fixture.detectChanges();
      expect(getTextContent(fixture, 'test-p-1')).toEqual(TEXT);
    }

    subject.next(falsyValues[0]);
    fixture.detectChanges();
    expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
  });
});

describe('[nzIf] Scheduler disabled. Late resolved promises', () => {
  setupEnviroment();

  it('Should toogle view', fakeAsync(() => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    const values: any[] = [];

    for (let i = 0; i < truthyValues.length - 2; i++) {
      values.push(truthyValues[i]);
      values.push(falsyValues[i]);
    }

    const getPromise = (value: any) => new Promise((resolve) => {
      setTimeout(() => {
        resolve(value);
      }, 100)
    });

    for (let i = 0; i < values.length; i++) {
      component.setValue(getPromise(values[i]));
      fixture.detectChanges()
      if ((i + 1) % 2) {
        expect(values[i]).toBeTruthy()
        expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
      } else {
        expect(values[i]).toBeFalsy();
        expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
      }

      flush();
      flush();

      if ((i + 1) % 2) {
        expect(getTextContent(fixture, 'test-p-1')).toEqual(TEXT);
      } else {
        expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
      }
    }
  }));
});

describe('[nzIf] Scheduler disabled. Late resolved observables', () => {
  setupEnviroment();

  it('Should toogle view', fakeAsync(() => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    const values: any[] = [];

    for (let i = 0; i < truthyValues.length - 2; i++) {
      values.push(truthyValues[i]);
      values.push(falsyValues[i]);
    }

    const getObserveble = (value: any) => new Observable((observer) => {
      setTimeout(() => {
        observer.next(value);
      }, 100)
    });

    for (let i = 0; i < values.length; i++) {
      component.setValue(getObserveble(values[i]));
      fixture.detectChanges()
      if ((i + 1) % 2) {
        expect(values[i]).toBeTruthy()
        expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
      } else {
        expect(values[i]).toBeFalsy();
        expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
      }

      flush();
      flush();

      if ((i + 1) % 2) {
        expect(getTextContent(fixture, 'test-p-1')).toEqual(TEXT);
      } else {
        expect(getTextContent(fixture, 'test-p-1')).toBeFalsy();
      }
    }
  }));
});
