import { AfterViewInit, Component, DoCheck, NO_ERRORS_SCHEMA, ViewChild } from "@angular/core";
import { detectChanges, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core"
import { TestBed } from "@angular/core/testing";
import { Subject, of } from "rxjs";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";
import { provideNgNoopZone } from "../../core/src/enviroment/enviroment";


@Component({
  selector: 'child-test-comp',
  template: ``
})
class ChildTestingComponent implements DoCheck, AfterViewInit {

  cdRef = initializeComponent(this);

  checkCount = 0;
  private _init = false;

  ngDoCheck(): void {
    if (this._init) {
      this.checkCount++;
    }
  }

  ngAfterViewInit(): void {
    this._init = true;
  }
}

@Component({
  selector: 'parent-test-comp',
  template: `
    <child-test-comp></child-test-comp>
  `
})
class ParentTestComponent {

  @ViewChild(ChildTestingComponent) childTestComp?: ChildTestingComponent;
  cdRef = initializeComponent(this);

  callbackIndex = 0;

  triggerCdTenTimes(): void {
      detectChanges(this.cdRef, { abort$: of(), onDone: () =>  this.callbackIndex = 1});
      detectChanges(this.cdRef, { abort$: of(), onDone: () =>  this.callbackIndex = 2});
      detectChanges(this.cdRef, { abort$: of(), onDone: () =>  this.callbackIndex = 3});
      detectChanges(this.cdRef, { abort$: of(), onDone: () =>  this.callbackIndex = 4});
      detectChanges(this.cdRef, { abort$: of(), onDone: () =>  this.callbackIndex = 5});
      detectChanges(this.cdRef, { abort$: of(), onDone: () =>  this.callbackIndex = 6});
      detectChanges(this.cdRef, { abort$: of(), onDone: () =>  this.callbackIndex = 7});
      detectChanges(this.cdRef, { abort$: of(), onDone: () =>  this.callbackIndex = 8});
      detectChanges(this.cdRef, { abort$: of(), onDone: () =>  this.callbackIndex = 9});
      detectChanges(this.cdRef, { abort$: of(), onDone: () =>  this.callbackIndex = 10});
  }

  triggerCdWithAbortSignal() {

    const abort$ = new Subject<void>();

    detectChanges(this.cdRef, { abort$, onDone: () =>  this.callbackIndex = 1});
    abort$.next();
    detectChanges(this.cdRef, { abort$, onDone: () =>  this.callbackIndex = 2});
    abort$.next();
    detectChanges(this.cdRef, { abort$, onDone: () =>  this.callbackIndex = 3});
    abort$.next();
    detectChanges(this.cdRef, { abort$, onDone: () =>  this.callbackIndex = 4});
    abort$.next();
    detectChanges(this.cdRef, { abort$, onDone: () =>  this.callbackIndex = 5});
    abort$.next();
    detectChanges(this.cdRef, { abort$, onDone: () =>  this.callbackIndex = 6});
    abort$.next();
    detectChanges(this.cdRef, { abort$, onDone: () =>  this.callbackIndex = 7});
    abort$.next();
    detectChanges(this.cdRef, { abort$, onDone: () =>  this.callbackIndex = 8});
    abort$.next();
    detectChanges(this.cdRef, { abort$, onDone: () =>  this.callbackIndex = 9});
    abort$.next();
    detectChanges(this.cdRef, { abort$, onDone: () =>  this.callbackIndex = 10});
  }
}

function createTestingComponent(): ParentTestComponent {
  return TestBed.createComponent(ParentTestComponent).componentInstance;
}

function getCheckCount(comp: ParentTestComponent): number | undefined {
  return  comp.childTestComp?.checkCount;
}

function getCallbackIndex(comp: ParentTestComponent): number {
  return comp.callbackIndex;
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();

    await TestBed.configureTestingModule({
      declarations: [
        ParentTestComponent,
        ChildTestingComponent
      ],
      schemas: [NO_ERRORS_SCHEMA],
      teardown: { destroyAfterEach: true },
      providers: [ provideNgNoopZone() ]
    }).compileComponents();
  });

  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
    TestBed.resetTestingModule();
  });
}

describe('Change detection coalescing.', () => {

  describe('Using waitUntilSchedulingDone() function.', () => {

    describe('Without aborting.', () => {

      setupEnviroment();

      it('checkCount==0, callbackIndex==0 and then checkCount==1 callbackIndex==1', async () => {
        const component = createTestingComponent();
        await waitUntilSchedulingDone();

        expect(getCheckCount(component)).toEqual(0);
        expect(getCallbackIndex(component)).toEqual(0);

        component.triggerCdTenTimes();
        await waitUntilSchedulingDone();

        expect(getCheckCount(component)).toEqual(1);
        expect(getCallbackIndex(component)).toEqual(1);

      })

    });

    describe('With aborting.', () => {


      setupEnviroment();

      it('checkCount==0, callbackIndex==0 and then checkCount==1 callbackIndex==10', async () => {
        const component = createTestingComponent();
        await waitUntilSchedulingDone();

        expect(getCheckCount(component)).toEqual(0);
        expect(getCallbackIndex(component)).toEqual(0);

        component.triggerCdWithAbortSignal();
        await waitUntilSchedulingDone();

        expect(getCheckCount(component)).toEqual(1);
        expect(getCallbackIndex(component)).toEqual(10);

      })
    });

  });

  describe('Using flushScheduler() function', () => {

    describe('Without aborting.', () => {

      setupEnviroment();

      it ('checkCount==0, callbackIndex==0 and then checkCount==1 callbackIndex==1', () => {
        const component = createTestingComponent();
        flushScheduler();

        expect(getCheckCount(component)).toEqual(0);
        expect(getCallbackIndex(component)).toEqual(0);

        component.triggerCdTenTimes();
        flushScheduler();

        expect(getCheckCount(component)).toEqual(1);
        expect(getCallbackIndex(component)).toEqual(1);
      });

    });

    describe('With aborting.', () => {


      setupEnviroment();

      it('checkCount==0, callbackIndex==0 and then checkCount==1 callbackIndex==10', () => {
        const component = createTestingComponent();
        flushScheduler();

        expect(getCheckCount(component)).toEqual(0);
        expect(getCallbackIndex(component)).toEqual(0);

        component.triggerCdWithAbortSignal();
        flushScheduler();

        expect(getCheckCount(component)).toEqual(1);
        expect(getCallbackIndex(component)).toEqual(10);

      });
    });

  });
});
