import { Component } from "@angular/core";
import { TestBed, fakeAsync, flush } from "@angular/core/testing";
import { Observable, NextObserver, firstValueFrom, Subject } from "rxjs";
import { Priority, initializeComponent, detectChanges, initialNoopZoneTestingEnviroment, disposeNoopZoneTestingEnviroment } from "../../core";
import { NzForDirective } from "../../template/for/nz-for.directive";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";
import { provideNzForConfiguration } from "../../template";

interface Item {
  id: string
}

@Component({
  selector: 'test-cmp',
  template: `
    <div *nzFor="let item of items; priority: priority; renderCallback: renderCb"></div>
  `
})
class TestComponent {
  items!: Item[] | Promise<Item[]> | Observable<Item[]>;
  queryViewPriority = Math.round(4 * Math.random()) + 1;
  priority = Priority.normal;
  cdRef = initializeComponent(this);
  renderCb: NextObserver<any> = { next: () => {
    this.callbackCallCount++;
  } };

  callbackCallCount = 0;

  detectChanges(): void {
    detectChanges(this.cdRef);
  }
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      imports: [ NzForDirective ],
      declarations: [ TestComponent ],
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
  describe(`[nzFor] Optimized: After render callback. Priority level ${prio}.`, () => {

    describe('Subject. Using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should run render callback.', async () => {
        const component = createComponent();
        const subject = new Subject<Item[]>();
        const items = getItems();
        component.items = subject;
        component.priority = prio;
        await waitUntilSchedulingDone();
        subject.next(items);
        await waitUntilSchedulingDone();
        expect(component.callbackCallCount).toEqual(1);
        component.detectChanges();
        await waitUntilSchedulingDone();
        expect(component.callbackCallCount).toEqual(1);
        subject.next(getChangedItems(items));
        await waitUntilSchedulingDone();
        expect(component.callbackCallCount).toEqual(2);
      });
    });

    describe('Subject. Using flushScheduler() function.', () => {
      setupEnviroment();
      it('Should run render callback.', async () => {
        const component = createComponent();
        const subject = new Subject<Item[]>();
        const items = getItems();
        component.items = subject;
        component.priority = prio;
        await waitUntilSchedulingDone();
        subject.next(items);
        await waitUntilSchedulingDone();
        expect(component.callbackCallCount).toEqual(1);
        component.detectChanges();
        await waitUntilSchedulingDone();
        expect(component.callbackCallCount).toEqual(1);
        subject.next(getChangedItems(items));
        await waitUntilSchedulingDone();
        expect(component.callbackCallCount).toEqual(2);
      });
    });
  });
}

