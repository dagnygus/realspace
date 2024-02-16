import { Component, ElementRef, inject } from "@angular/core";
import { BehaviorSubject, Observable, firstValueFrom } from "rxjs";
import { initializeComponent, Priority, detectChanges, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment } from "../../core";
import { TestBed } from "@angular/core/testing";
import { NzSwitchModule } from "../../template";

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

  // detectChanges(): void {
  //   detectChanges(this.cdRef);
  // }
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment(true);
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

describe('[nzSwitch] Scheduler disabled. Testing rendering with raw values.', () => {
  setupEnviroment();
  it('Should render the right view.', () => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    component.value = 1;
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

    component.value = 2;
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

    component.value = 3;
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

    component.value = 5;
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

    component.value = 1;
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);
  });
});

describe('[nzSwitch] Scheduler disabled. Testing rendering with promises.', () => {
  setupEnviroment();
  it('Should render the right view.', async () => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    let promise = new Promise<number>((resolve) => {
      setTimeout(() => { resolve(1); }, 100);
    });
    component.value = promise;
    fixture.detectChanges();
    await promise;
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

    promise = new Promise<number>((resolve) => {
      setTimeout(() => { resolve(2); }, 100);
    });
    component.value = promise;
    fixture.detectChanges();
    await promise;
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

    promise = new Promise<number>((resolve) => {
      setTimeout(() => { resolve(3); }, 100);
    });
    component.value = promise;
    fixture.detectChanges();
    await promise;
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

    promise = new Promise<number>((resolve) => {
      setTimeout(() => { resolve(5); }, 100);
    });
    component.value = promise;
    fixture.detectChanges();
    await promise;
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

    promise = new Promise<number>((resolve) => {
      setTimeout(() => { resolve(1); }, 100);
    });
    component.value = promise;
    fixture.detectChanges();
    await promise;
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);
  })
});

describe('[nzSwitch] Scheduler disabled. Testing rendering with observables.', () => {
  setupEnviroment();
  it('Should render the right view.', async () => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    let observable = new Observable<number>((observer) => {
      setTimeout(() => { observer.next(1) }, 100)
    });
    component.value = observable;
    fixture.detectChanges();
    await firstValueFrom(observable);
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

    observable = new Observable<number>((observer) => {
      setTimeout(() => { observer.next(2) }, 100)
    });
    component.value = observable;
    fixture.detectChanges();
    await firstValueFrom(observable);
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

    observable = new Observable<number>((observer) => {
      setTimeout(() => { observer.next(3) }, 100)
    });
    component.value = observable;
    fixture.detectChanges();
    await firstValueFrom(observable);
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

    observable = new Observable<number>((observer) => {
      setTimeout(() => { observer.next(5) }, 100)
    });
    component.value = observable;
    fixture.detectChanges();
    await firstValueFrom(observable);
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

    observable = new Observable<number>((observer) => {
      setTimeout(() => { observer.next(1) }, 100)
    });
    component.value = observable;
    fixture.detectChanges();
    await firstValueFrom(observable);
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);
  })
});

describe('[nzSwitch] Scheduler disabled. Testing rendering with subject.', () => {
  setupEnviroment();
  it('Should render the right view.', () => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    const subject = new BehaviorSubject(1);
    component.value = subject;
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

    subject.next(2)
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(2);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

    subject.next(3);
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(1);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);

    subject.next(5);
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(3);

    subject.next(1);
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.querySelectorAll('p.case-1').length).toEqual(3);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-2').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-3').length).toEqual(0);
    expect(component.elementRef.nativeElement.querySelectorAll('p.case-default').length).toEqual(0);
  });
});
