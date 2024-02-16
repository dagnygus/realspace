import { Component, OnDestroy, QueryList, ViewChildren } from "@angular/core";
import { Priority, detectChanges, fromPromiseLike, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { NzIfDirecive, NzIfModule } from "../../template";
import { TestBed, fakeAsync, flush } from "@angular/core/testing";
import { disposeNoopZoneTestingEnviroment, provideNgNoopZone } from "../../core/src/enviroment/enviroment";
import { NextObserver, Subject, Subscription } from "rxjs";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";

type Values = [any, any, any, any, any];

@Component({
  selector: 'test-one-component',
  template: `
    <div *nzIf="value1; priority: prio1; renderCallback: renderCb1"></div>
    <div *nzIf="value2; priority: prio2; renderCallback: renderCb2"></div>
    <div *nzIf="value3; priority: prio3; renderCallback: renderCb3"></div>
    <div *nzIf="value4; priority: prio4; renderCallback: renderCb4"></div>
    <div *nzIf="value5; priority: prio5; renderCallback: renderCb5"></div>
  `
})
class TestComponent implements OnDestroy {

  private _subscription: Subscription;

  @ViewChildren(NzIfDirecive) directives: QueryList<NzIfDirecive<any>> | null = null;

  onRender = new Subject<Priority>;

  renderOrder: Priority[] = [];

  value1: any;
  value2: any;
  value3: any;
  value4: any;
  value5: any;

  prio1: Priority = Priority.normal;
  prio2: Priority = Priority.normal;
  prio3: Priority = Priority.normal;
  prio4: Priority = Priority.normal;
  prio5: Priority = Priority.normal;

  renderCb1: NextObserver<any> | null = null;
  renderCb2: NextObserver<any> | null = null;
  renderCb3: NextObserver<any> | null = null;
  renderCb4: NextObserver<any> | null = null;
  renderCb5: NextObserver<any> | null = null;


  cdRef = initializeComponent(this, Math.round(4 * Math.random() + 1));

  constructor() {
    this._subscription = this.onRender.subscribe((prio) => {
      if (this.renderOrder.length === 5) {
        throw new Error('Render order out of the range!')
      }
      this.renderOrder.push(prio);
    });
    this.renderCb1 = {
      next: () => {
        this.onRender.next(this.prio1);
      }
    }
    this.renderCb2 = {
      next: () => {
        this.onRender.next(this.prio2);
      }
    }
    this.renderCb3 = {
      next: () => {
        this.onRender.next(this.prio3);
      }
    }
    this.renderCb4 = {
      next: () => {
        this.onRender.next(this.prio4);
      }
    }
    this.renderCb5 = {
      next: () => {
        this.onRender.next(this.prio5);
      }
    }

  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  setValues([ value1, value2, value3, value4, value5]: Values): void {
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
    this.value4 = value4;
    this.value5 = value5;
  }

  setPriorities([ prio1, prio2, prio3, prio4, prio5 ]: Priority[]): void {
    this.prio1 = prio1;
    this.prio2 = prio2;
    this.prio3 = prio3;
    this.prio4 = prio4;
    this.prio5 = prio5;
  }

  detectChanges(pririty: Priority = Priority.normal): void {
    detectChanges(this.cdRef, pririty);
  }

  reset(): void {
    this.renderOrder = [];
  }

}

function getRandomOrderedPriorities(): Priority[] {
  let prios: Priority[] = [ 1, 2, 3, 4, 5 ];

  prios = prios.map((prio) => ({ prio, sortIndex: Math.random() }))
                   .sort((a, b) => a.sortIndex - b.sortIndex)
                   .map((item) => item.prio);

  return prios;
}


function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      declarations: [ TestComponent ],
      imports: [ NzIfModule ],
      providers: [ provideNgNoopZone() ],
      teardown: { destroyAfterEach: true }
    }).compileComponents();
  });

  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
    TestBed.resetTestingModule();
  })
}

function createTestComponent(): TestComponent {
  return TestBed.createComponent(TestComponent).componentInstance;
}

describe('NzIf - render notificarions.', () => {

  describe('Raw walues with waitUntilSchedulingDone() function.', () => {

  setupEnviroment();

    it('Should run callbacks in correct order.', async () => {
      const component = createTestComponent();
      expect(component.directives).toBeFalsy();
      component.setValues([ 1, -1, true, [], {} ]);
      component.setPriorities(getRandomOrderedPriorities());
      await waitUntilSchedulingDone();
      expect(component.directives).toBeTruthy();
      expect(component.renderOrder.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
      component.reset();
      expect(component.renderOrder.length).toEqual(0);
      component.setValues([null, undefined, 0, '', false]);
      expect(component.renderOrder.length).toEqual(0);
      component.detectChanges();
      expect(component.renderOrder.length).toEqual(0);
      await waitUntilSchedulingDone();
      expect(component.renderOrder.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
      component.reset();
      expect(component.renderOrder.length).toEqual(0);
      component.setValues(['a1', 'b1', 'c1', 'd1', 'e1']);
      component.setPriorities(getRandomOrderedPriorities())
      expect(component.renderOrder.length).toEqual(0);
      component.detectChanges();
      expect(component.renderOrder.length).toEqual(0);
      await waitUntilSchedulingDone();
      expect(component.renderOrder.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
    });

  });

  describe('Raw walues with flushScheduler() function.', () => {

    setupEnviroment();

    it('Should run callbacks in correct order.', async () => {
      const component = createTestComponent();
      expect(component.directives).toBeFalsy();
      component.setValues([ 1, -1, true, [], {} ]);
      component.setPriorities(getRandomOrderedPriorities());
      flushScheduler();
      expect(component.directives).toBeTruthy();
      expect(component.renderOrder.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
      component.reset();
      expect(component.renderOrder.length).toEqual(0);
      component.setValues(['a', 'b', 'c', 'd', 'e']);
      expect(component.renderOrder.length).toEqual(0);
      component.detectChanges();
      expect(component.renderOrder.length).toEqual(0);
      flushScheduler();
      expect(component.renderOrder.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
      component.reset();
      expect(component.renderOrder.length).toEqual(0);
      component.setValues(['a1', 'b1', 'c1', 'd1', 'e1']);
      component.setPriorities(getRandomOrderedPriorities());
      expect(component.renderOrder.length).toEqual(0);
      component.detectChanges();
      expect(component.renderOrder.length).toEqual(0);
      flushScheduler();
      expect(component.renderOrder.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
    });
  });

  describe('Promises using waitUntilSchedulingDone()', () => {
    setupEnviroment()
    it('Should run callbacks in correct order.', async () => {
      const component = createTestComponent();
      expect(component.directives).toBeFalsy();

      let promise = new Promise<any>((resolve) => {
        setTimeout(() => resolve({}), 100);
      });

      component.setValues([ promise, promise, promise, promise, promise]);
      component.setPriorities(getRandomOrderedPriorities());
      await promise;
      await waitUntilSchedulingDone();
      expect(component.directives).toBeTruthy();
      expect(component.renderOrder.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
      component.reset();
      expect(component.renderOrder.length).toEqual(0);

      promise = new Promise((resolve) => {
        setTimeout(() => resolve(true), 100);
      });
      component.setValues([ promise, promise, promise, promise, promise]);

      //update bindings
      component.detectChanges();
      await waitUntilSchedulingDone();

      expect(component.directives?.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
      await promise;

      // reset after updated bindings;;
      component.reset();

      await waitUntilSchedulingDone();
      expect(component.directives?.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
    });
  });

  describe('Promises using flushScheduler()', () => {
    setupEnviroment()
    it('Should run callbacks in correct order.', fakeAsync(() => {
      const component = createTestComponent();
      expect(component.directives).toBeFalsy();

      let promise = new Promise<any>((resolve) => {
        setTimeout(() => resolve({}), 100);
      });

      component.setValues([ promise, promise, promise, promise, promise]);
      component.setPriorities(getRandomOrderedPriorities());
      flush();
      flushScheduler();
      flush();
      flushScheduler();
      expect(component.directives).toBeTruthy();
      expect(component.renderOrder.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
      component.reset();
      expect(component.renderOrder.length).toEqual(0);

      promise = new Promise((resolve) => {
        setTimeout(() => resolve(true), 100);
      });
      component.setValues([ promise, promise, promise, promise, promise]);

      //update bindings
      component.detectChanges();
      flushScheduler();


      expect(component.directives?.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }

      flush();

      // reset after updated bindings;
      component.reset();

      flushScheduler();
      expect(component.directives?.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
    }));
  });

  describe('Obeservables using waitUntilSchedulingDone()', () => {
    setupEnviroment()
    it('Should run callbacks in correct order.', async () => {
      const component = createTestComponent();
      expect(component.directives).toBeFalsy();

      let promise = new Promise<any>((resolve) => {
        setTimeout(() => resolve({}), 100);
      });

      let observable = fromPromiseLike(promise);

      component.setValues([ observable, observable, observable, observable, observable]);
      component.setPriorities(getRandomOrderedPriorities());
      await promise;
      await waitUntilSchedulingDone();
      expect(component.directives).toBeTruthy();
      expect(component.renderOrder.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
      component.reset();
      expect(component.renderOrder.length).toEqual(0);

      promise = new Promise((resolve) => {
        setTimeout(() => resolve(true), 100);
      });

      observable = fromPromiseLike(promise);

      component.setValues([ observable, observable, observable, observable, observable]);

      //update bindings
      component.detectChanges();
      await waitUntilSchedulingDone();

      expect(component.directives?.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
      await promise;

      // reset after updated bindings;;
      component.reset();

      await waitUntilSchedulingDone();
      expect(component.directives?.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
    });
  });

  describe('Obeservables using flushScheduler()', () => {
    setupEnviroment()
    it('Should run callbacks in correct order.',  fakeAsync(() => {
      const component = createTestComponent();
      expect(component.directives).toBeFalsy();

      let promise = new Promise<any>((resolve) => {
        setTimeout(() => resolve({}), 100);
      });

      let observable = fromPromiseLike(promise);

      component.setValues([ observable, observable, observable, observable, observable]);
      component.setPriorities(getRandomOrderedPriorities());
      flush();
      flushScheduler();
      flush();
      flushScheduler();
      expect(component.directives).toBeTruthy();
      expect(component.renderOrder.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
      component.reset();
      expect(component.renderOrder.length).toEqual(0);

      promise = new Promise((resolve) => {
        setTimeout(() => resolve(true), 100);
      });

      observable = fromPromiseLike(promise);

      component.setValues([ observable, observable, observable, observable, observable]);

      //update bindings
      component.detectChanges();
      flush();
      flushScheduler();

      expect(component.directives?.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
      flush();

      // reset after updated bindings;;
      component.reset();

      flushScheduler();
      expect(component.directives?.length).toEqual(5);
      for (let i = 0; i < component.renderOrder.length; i++) {
        expect(component.renderOrder[i]).toEqual(i + 1);
      }
    }));
  });

});
