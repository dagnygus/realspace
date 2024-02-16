import { Component, ElementRef, inject } from "@angular/core";
import { Observable, firstValueFrom } from "rxjs";
import { Priority, initializeComponent, detectChanges, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, fromPromiseLike } from "../../core";
import { TestBed } from "@angular/core/testing";
import { provideNgNoopZone } from "../../core/src/enviroment/enviroment";
import { NzLetModule } from "../../template";

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
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment(true);
    await TestBed.configureTestingModule({
      declarations: [ TestComponent ],
      imports: [ NzLetModule ],
      providers: [ provideNgNoopZone() ],
      teardown: { destroyAfterEach: true }
    }).compileComponents()
  });

  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
    TestBed.resetTestingModule();
  });
}

describe('[nzLet] Scheduler disabled. Testing rendering with Promises', () => {
  setupEnviroment();
  it('Should render text after promise resolved', async () => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    let oldText = 'RENDERED_TEXT_1';
    let newText = oldText;
    let promise = new Promise((resolve) => {
      setTimeout(() => { resolve(newText); }, 100);
    });
    component.setValueSource(promise);
    fixture.detectChanges();

    expect(component.getParagtaph()).toBeNull();
    await promise;
    fixture.detectChanges();

    expect(component.getParagtaph()).not.toBeNull();
    expect(component.getTextContent()).toEqual(newText);

    newText = 'RENDERED_TEXT_2';
    promise = new Promise((resolve) => {
      setTimeout(() => { resolve(newText); }, 100);
    });
    component.setValueSource(promise);
    fixture.detectChanges();

    expect(component.getTextContent()).toEqual(oldText);
    await promise;
    fixture.detectChanges();
    expect(component.getTextContent()).toEqual(newText);
  });
});

describe('[nzLet] Scheduler disabled. Testing rendering with Observables', () => {
  setupEnviroment();
  it('Should render text after promise resolved', async () => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    let oldText = 'RENDERED_TEXT_1';
    let newText = oldText;
    let observable = fromPromiseLike(new Promise((resolve) => {
      setTimeout(() => { resolve(newText); }, 100)
    }));
    component.setValueSource(observable);
    fixture.detectChanges();

    expect(component.getParagtaph()).toBeNull();
    await firstValueFrom(observable);
    fixture.detectChanges();

    expect(component.getParagtaph()).not.toBeNull();
    expect(component.getTextContent()).toEqual(newText);

    newText = 'RENDERED_TEXT_2';
    observable = fromPromiseLike(new Promise((resolve) => {
      setTimeout(() => { resolve(newText); }, 100)
    }));
    component.setValueSource(observable);
    fixture.detectChanges();

    expect(component.getTextContent()).toEqual(oldText);
    await firstValueFrom(observable);
    fixture.detectChanges();
    expect(component.getTextContent()).toEqual(newText);
  });
});
