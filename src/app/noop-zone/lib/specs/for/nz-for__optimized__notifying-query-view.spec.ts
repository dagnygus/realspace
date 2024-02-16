import { AfterContentInit, Component, Directive, DoCheck, OnDestroy } from "@angular/core";
import { Observable, Subject, Subscription, firstValueFrom } from "rxjs";
import { Priority, detectChanges, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { TestBed, fakeAsync, flush } from "@angular/core/testing";
import { NzForDirective } from "../../template/for/nz-for.directive";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";
import { NzQueryViewModule } from "../../template/query-view/query-view.module";
import { provideNzForConfiguration } from "../../template";

interface Item {
  id: string
}

@Directive({
  selector: '[testDir]'
})
class TestDirective implements DoCheck, AfterContentInit, OnDestroy {
  private _allawCheckCount = true;
  private _isInit = false;
  private _subscription = new Subscription();

  checkCount = 0;

  constructor(testComponent: TestComponent) {

    testComponent.testDir = this;
  }

  ngDoCheck(): void {
    if (this._allawCheckCount && this._isInit) {
      this.checkCount++;
    }
  }

  ngAfterContentInit(): void {
    this._isInit = true;
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}

@Component({
  selector: 'test-cmp',
  template: `
    <ng-container *nzQueryView="queryViewPriority">
      <div testDir></div>
      <div *nzFor="let item of items; priority: priority"></div>
    </ng-container>
  `
})
class TestComponent {
  items!: Item[] | Promise<Item[]> | Observable<Item[]>;
  queryViewPriority = Math.round(4 * Math.random()) + 1;
  priority = Priority.normal;
  testDir?: TestDirective;
  cdRef = initializeComponent(this);

  detectChanges(): void {
    detectChanges(this.cdRef);
  }
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      imports: [ NzForDirective, NzQueryViewModule ],
      declarations: [ TestComponent, TestDirective ],
      teardown: { destroyAfterEach: true },
      providers: [ provideNzForConfiguration({ optimized: true }) ]
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

function getItems(): Item[] {
  const items: Item[] = [];
  for (let i = 0; i < 10; i++) {
    items.push({ id: 'id' + i });
  }
  return items;
}

function getChangedItems(items: Item[]): Item[] {
  const copy = items.slice();
  const operationCount = Math.round(2 * Math.random()) + 1;

  switch (operationCount) {
    case 1:
      const operations = ['add', 'remove', 'move'];
      const operation = operations[Math.round(2 * Math.random())];

      switch (operation) {
        case 'add':
          copy.splice(5, 0, { id: 'id10' });
          break;
        case 'remove':
          copy.splice(5, 1);
          break;
        case 'move':
          copy.splice(8 - 1, 0, copy.splice(2, 1)[0]);
          break;
      }

      break;
    case 2:
      const operations2 = ['add_remove', 'add_move', 'remove_move'];
      const operation2 = operations2[Math.round(2 * Math.random())];
      switch (operation2) {
        case 'add_remove':
          copy.splice(3, 1);
          copy.splice(7, 0, { id: 'id10' });
          break;
        case 'add_move':
          copy.splice(3, 0, { id: 'id10' });
          copy.splice(7, 0, copy.splice(7, 1)[0]);
          break;
        case 'remove_move':
          copy.splice(2, 1);
          copy.splice(7, 0, copy.splice(5, 1)[0]);
          break;
      }
      break;
    case 3:
      copy.splice(2, 0);
      copy.splice(5, 0, { id: 'id10' });
      copy.splice(8, 0, copy.splice(6, 1)[0]);
      break;
  }

  return copy;
}

for (let prio = 1; prio < 6; prio++) {
  describe(`[NzFor] optimized: Notifying query view. Priority ${prio}.`, () => {

    describe('Observable. Using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should increase check count.', async () => {
        const component = createComponent();
        const items = getItems();
        let observable = new Observable<Item[]>((observer) => {
          setTimeout(() => { observer.next(items) })
        })

        component.items = observable;
        component.priority = prio;
        await waitUntilSchedulingDone();
        await firstValueFrom(observable);
        await waitUntilSchedulingDone();
        expect(component.testDir?.checkCount).toEqual(1);

        observable = new Observable<Item[]>((observer) => {
          setTimeout(() => { observer.next(getChangedItems(items)); }, 100);
        });

        component.items = observable;
        component.detectChanges();
        await waitUntilSchedulingDone();
        await firstValueFrom(observable);
        await waitUntilSchedulingDone();
        expect(component.testDir?.checkCount).toEqual(3);
      });
    });

    describe('Observable. Using flushScheduler() function.', () => {
      setupEnviroment();
      it('Should increase check count.',  fakeAsync(() => {
        const component = createComponent();
        const items = getItems();
        let observable = new Observable<Item[]>((observer) => {
          setTimeout(() => { observer.next(items); })
        })

        component.items = observable;
        component.priority = prio;
        flushScheduler();
        flush();
        flushScheduler();
        expect(component.testDir?.checkCount).toEqual(1);

        observable = new Observable<Item[]>((observer) => {
          setTimeout(() => { observer.next(getChangedItems(items)); }, 100);
        });

        component.items = observable;
        component.detectChanges();
        flushScheduler();
        flush();
        flushScheduler();
        expect(component.testDir?.checkCount).toEqual(3);
      }));
    });

    describe('Subject. Using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should increase check count.', async () => {
        const component = createComponent();
        const items = getItems();
        const subject = new Subject<Item[]>();

        component.items = subject;
        subject.next(items);
        component.priority = prio;
        await waitUntilSchedulingDone();
        expect(component.testDir?.checkCount).toEqual(0);

        subject.next(getChangedItems(items));
        await waitUntilSchedulingDone();
        expect(component.testDir?.checkCount).toEqual(1);
      });
    });

    describe('Subject. Using flushScheduler() function.', () => {
      setupEnviroment();
      it('Should increase check count.', fakeAsync(() => {
        const component = createComponent();
        const items = getItems();
        const subject = new Subject<Item[]>();

        component.items = subject;
        subject.next(items);
        component.priority = prio;
        flushScheduler();
        expect(component.testDir?.checkCount).toEqual(0);

        subject.next(getChangedItems(items));
        flushScheduler();
        expect(component.testDir?.checkCount).toEqual(1);
      }));
    });
  });
}
