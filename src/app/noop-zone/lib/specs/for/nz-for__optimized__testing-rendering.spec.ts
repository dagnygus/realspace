import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject } from "@angular/core";
import { Observable, Subject, Subscription, combineLatest, firstValueFrom } from "rxjs";
import { Priority, detectChanges, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { TestBed, fakeAsync, flush } from "@angular/core/testing";
import { NzForModule } from "../../template/for/nz-for.module";
import { InPipeModule, provideNzForConfiguration } from "../../template";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";

interface Item {
  id: string,
}

interface ChildData {
  item: Item;
  index: number;
  first: boolean;
  last: boolean;
  even: boolean;
  odd: boolean;
}

@Component({
  selector: 'child-test-cmp',
  template: `
    <p class="rx-child-index">{{index$ | in:cdRef}}</p>
  `
})
class ChildTestComponent implements OnInit, OnDestroy {

  private _subscription: Subscription
  cdRef = initializeComponent(this);
  rxData: ChildData | null = null;

  @Input() item$!: Observable<Item>;
  @Input() index$!: Observable<number>;
  @Input() first$!: Observable<boolean>;
  @Input() last$!: Observable<boolean>;
  @Input() even$!: Observable<boolean>;
  @Input() odd$!: Observable<boolean>;

  constructor(parent: ParentTestComponent) {
    this._subscription = parent.collectChildren$.subscribe(() => {
      parent.children.push(this);
    });
  }

  ngOnInit(): void {
    this._subscription.add(
      combineLatest({
        item: this.item$,
        index: this.index$,
        first: this.first$,
        last: this.last$,
        even: this.even$,
        odd: this.odd$
      }).subscribe((data) => this.rxData = data)
    );
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

}

@Component({
  selector: 'parent-test-cmp',
  template: `
    <child-test-cmp *nzFor="let item$ = item$ of items;
                            let index$ = index$;
                            let first$ = first$;
                            let last$ = last$;
                            let even$ = even$;
                            let odd$ = odd$;
                            trackBy: 'id';
                            priority: priority"
                    [item$]="item$"
                    [index$]="index$"
                    [first$]="first$"
                    [last$]="last$"
                    [even$]="even$"
                    [odd$]="odd$"></child-test-cmp>
  `
})
class ParentTestComponent {
  cdRef = initializeComponent(this);
  items: Item[] | Promise<Item[]> | Observable<Item[]> | null = null;
  oldChildren: ChildTestComponent[] | null = null;
  children: ChildTestComponent[] = [];
  collectChildren$ = new Subject<void>();
  elementRef: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>);
  priority = Priority.normal

  detectChanges(): void {
    detectChanges(this.cdRef);
  }
}

function createComponent(): ParentTestComponent {
  return TestBed.createComponent(ParentTestComponent).componentInstance;
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      imports: [ NzForModule, InPipeModule ],
      declarations: [ ParentTestComponent, ChildTestComponent ],
      providers: [ provideNzForConfiguration({ optimized: true }) ],
      teardown: { destroyAfterEach: true }
    }).compileComponents();
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    disposeNoopZoneTestingEnviroment();
  })
}

for (let prio = 1; prio < 6; prio++) {
  describe(`[nzFor] optimized: testing rendering. Priority level ${prio}.`, () => {

    describe('Observable. Using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should make the appropriate changes to child components.', async () => {
        const component = createComponent();
        let items: Item[] = [];
        for (let i = 0; i < 240; i++) {
          items.push({ id: 'id' + i });
        }

        let observable = new Observable<Item[]>((observer) => {
          setTimeout(() => {
            observer.next(items);
          }, 100);
        });

        component.items = observable;
        await waitUntilSchedulingDone();
        await firstValueFrom(observable);
        await waitUntilSchedulingDone();
        component.collectChildren$.next();
        component.elementRef.nativeElement.querySelectorAll('p.child-index').forEach((p, index) => {
          expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
        });
        component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
          expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
        });
        expect(component.children.length).toEqual(240);
        component.children.forEach((child, index) => {
          expect(child.rxData?.index).toEqual(index);
          expect(child.rxData?.item).toEqual(items[index]);
          expect(child.rxData?.even).toEqual(index % 2 === 0);
          expect(child.rxData?.odd).toEqual(index % 2 !== 0);
          expect(child.rxData?.first).toEqual(index === 0);
          expect(child.rxData?.last).toEqual(index === items.length - 1);
        });

        component.oldChildren = component.children;
        component.children = [];

        items = items.slice();

        items.splice(99, 40);

        expect(items.length).toEqual(200);

        const newItems: Item[] = [];
        for (let i = 240; i < 300; i++) {
          newItems.push({ id: 'id' + i });
        }

        items.splice(119, 0, ...newItems);

        let subset = items.splice(4, 5);

        items.splice(14 - 5, 0, ...subset);

        subset = items.splice(229, 5);

        items.splice(244 - 5, 0, ...subset);

        for (let i = 29; i < 35; i++) {
          items[i] = { ...items[i] };
        }

        for (let i = 189; i < 180; i++) {
          items[i] = { ...items[i] };
        }

        observable = new Observable<Item[]>((observer) => {
          setTimeout(() => {
            observer.next(items);
          }, 100);
        });

        component.items = observable;
        component.detectChanges();
        await waitUntilSchedulingDone();
        await firstValueFrom(observable);
        await waitUntilSchedulingDone();
        component.collectChildren$.next();
        component.elementRef.nativeElement.querySelectorAll('p.child-index').forEach((p, index) => {
          expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
        });
        component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
          expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
        });

        const pTags = component.elementRef.nativeElement.querySelectorAll('p.rx-child-index');

        expect(pTags.length).toEqual(260);

        expect(component.children.length).toEqual(260);
        component.children.sort((a, b) => a.rxData!.index - b.rxData!.index);
        component.children.forEach((child, index) => {
          expect(child.rxData?.index).toEqual(index);
          expect(child.rxData?.item).toEqual(items[index]);
          expect(child.rxData?.even).toEqual(index % 2 === 0);
          expect(child.rxData?.odd).toEqual(index % 2 !== 0);
          expect(child.rxData?.first).toEqual(index === 0);
          expect(child.rxData?.last).toEqual(index === items.length - 1);
        });

        for (let i = 29; i < 35; i++) {
          expect(component.children[i]).toEqual(component.oldChildren[i]);
        }

        for (let i = 189; i < 180; i++) {
          expect(component.children[i]).toEqual(component.oldChildren[i]);
        }

        items = [];
        observable = new Observable<Item[]>((observer) => {
          setTimeout(() => {
            observer.next(items);
          }, 100);
        });
        component.items = observable;
        component.detectChanges();
        await waitUntilSchedulingDone();
        await firstValueFrom(observable);
        await waitUntilSchedulingDone();
        expect(component.elementRef.nativeElement.querySelectorAll('p.child-index').length).toEqual(0);
      });
    });

    describe('Observable. Using flushScheduler() function.', () => {
      setupEnviroment();
      it('Should make the appropriate changes to child components.', fakeAsync(() => {
        const component = createComponent();
        let items: Item[] = [];
        for (let i = 0; i < 240; i++) {
          items.push({ id: 'id' + i });
        }

        let observable = new Observable<Item[]>((observer) => {
          setTimeout(() => {
            observer.next(items);
          }, 100);
        });

        component.items = observable;
        flushScheduler();
        flush();
        flushScheduler();
        component.collectChildren$.next();
        component.elementRef.nativeElement.querySelectorAll('p.child-index').forEach((p, index) => {
          expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
        });
        component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
          expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
        });
        expect(component.children.length).toEqual(240);
        component.children.forEach((child, index) => {
          expect(child.rxData?.index).toEqual(index);
          expect(child.rxData?.item).toEqual(items[index]);
          expect(child.rxData?.even).toEqual(index % 2 === 0);
          expect(child.rxData?.odd).toEqual(index % 2 !== 0);
          expect(child.rxData?.first).toEqual(index === 0);
          expect(child.rxData?.last).toEqual(index === items.length - 1);
        });

        component.oldChildren = component.children;
        component.children = [];

        items = items.slice();

        items.splice(99, 40);

        expect(items.length).toEqual(200);

        const newItems: Item[] = [];
        for (let i = 240; i < 300; i++) {
          newItems.push({ id: 'id' + i });
        }

        items.splice(119, 0, ...newItems);

        let subset = items.splice(4, 5);

        items.splice(14 - 5, 0, ...subset);

        subset = items.splice(229, 5);

        items.splice(244 - 5, 0, ...subset);

        for (let i = 29; i < 35; i++) {
          items[i] = { ...items[i] };
        }

        for (let i = 189; i < 180; i++) {
          items[i] = { ...items[i] };
        }

        observable = new Observable<Item[]>((observer) => {
          setTimeout(() => {
            observer.next(items);
          }, 100);
        });

        component.items = observable;
        component.detectChanges();
        flushScheduler();
        flush();
        flushScheduler();
        component.collectChildren$.next();
        component.elementRef.nativeElement.querySelectorAll('p.child-index').forEach((p, index) => {
          expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
        });
        component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
          expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
        });

        const pTags = component.elementRef.nativeElement.querySelectorAll('p.rx-child-index');

        expect(pTags.length).toEqual(260);

        expect(component.children.length).toEqual(260);
        component.children.sort((a, b) => a.rxData!.index - b.rxData!.index);
        component.children.forEach((child, index) => {
          expect(child.rxData?.index).toEqual(index);
          expect(child.rxData?.item).toEqual(items[index]);
          expect(child.rxData?.even).toEqual(index % 2 === 0);
          expect(child.rxData?.odd).toEqual(index % 2 !== 0);
          expect(child.rxData?.first).toEqual(index === 0);
          expect(child.rxData?.last).toEqual(index === items.length - 1);
        });

        for (let i = 29; i < 35; i++) {
          expect(component.children[i]).toEqual(component.oldChildren[i]);
        }

        for (let i = 189; i < 180; i++) {
          expect(component.children[i]).toEqual(component.oldChildren[i]);
        }

        items = [];
        observable = new Observable<Item[]>((observer) => {
          setTimeout(() => {
            observer.next(items);
          }, 100);
        });
        component.items = observable;
        component.detectChanges();
        flushScheduler();
        flush();
        flushScheduler();
        expect(component.elementRef.nativeElement.querySelectorAll('p.child-index').length).toEqual(0);
      }));
    });

    describe('Subject. Using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should make the appropriate changes to child components.', async () => {
        const component = createComponent();
        let items: Item[] = [];
        for (let i = 0; i < 240; i++) {
          items.push({ id: 'id' + i });
        }

        let subject = new Subject<Item[]>()

        component.items = subject;
        await waitUntilSchedulingDone();
        subject.next(items);
        await waitUntilSchedulingDone();
        component.collectChildren$.next();
        component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
          expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
        });
        expect(component.children.length).toEqual(240);
        component.children.forEach((child, index) => {
          expect(child.rxData?.index).toEqual(index);
          expect(child.rxData?.item).toEqual(items[index]);
          expect(child.rxData?.even).toEqual(index % 2 === 0);
          expect(child.rxData?.odd).toEqual(index % 2 !== 0);
          expect(child.rxData?.first).toEqual(index === 0);
          expect(child.rxData?.last).toEqual(index === items.length - 1);
        });

        component.oldChildren = component.children;
        component.children = [];

        items = items.slice();

        items.splice(99, 40);

        expect(items.length).toEqual(200);

        const newItems: Item[] = [];
        for (let i = 240; i < 300; i++) {
          newItems.push({ id: 'id' + i });
        }

        items.splice(119, 0, ...newItems);

        let subset = items.splice(4, 5);

        items.splice(14 - 5, 0, ...subset);

        subset = items.splice(229, 5);

        items.splice(244 - 5, 0, ...subset);

        for (let i = 29; i < 35; i++) {
          items[i] = { ...items[i] };
        }

        for (let i = 189; i < 180; i++) {
          items[i] = { ...items[i] };
        }

        subject.next(items)
        await waitUntilSchedulingDone();
        component.collectChildren$.next();
        component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
          expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
        });

        const pTags = component.elementRef.nativeElement.querySelectorAll('p.rx-child-index');

        expect(pTags.length).toEqual(260);

        expect(component.children.length).toEqual(260);
        component.children.sort((a, b) => a.rxData!.index - b.rxData!.index);
        component.children.forEach((child, index) => {
          expect(child.rxData?.index).toEqual(index);
          expect(child.rxData?.item).toEqual(items[index]);
          expect(child.rxData?.even).toEqual(index % 2 === 0);
          expect(child.rxData?.odd).toEqual(index % 2 !== 0);
          expect(child.rxData?.first).toEqual(index === 0);
          expect(child.rxData?.last).toEqual(index === items.length - 1);
        });

        for (let i = 29; i < 35; i++) {
          expect(component.children[i]).toEqual(component.oldChildren[i]);
        }

        for (let i = 189; i < 180; i++) {
          expect(component.children[i]).toEqual(component.oldChildren[i]);
        }

        items = [];
        subject.next(items);
        await waitUntilSchedulingDone();
        expect(component.elementRef.nativeElement.querySelectorAll('p.child-index').length).toEqual(0);
      });
    });

    describe('Subject. Using fushScheduler() function.', () => {
      setupEnviroment();
      it('Should make the appropriate changes to child components.', fakeAsync(() => {
        const component = createComponent();
        let items: Item[] = [];
        for (let i = 0; i < 240; i++) {
          items.push({ id: 'id' + i });
        }

        let subject = new Subject<Item[]>()

        component.items = subject;
        flushScheduler();
        subject.next(items);
        flushScheduler();
        component.collectChildren$.next();
        component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
          expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
        });
        expect(component.children.length).toEqual(240);
        component.children.forEach((child, index) => {
          expect(child.rxData?.index).toEqual(index);
          expect(child.rxData?.item).toEqual(items[index]);
          expect(child.rxData?.even).toEqual(index % 2 === 0);
          expect(child.rxData?.odd).toEqual(index % 2 !== 0);
          expect(child.rxData?.first).toEqual(index === 0);
          expect(child.rxData?.last).toEqual(index === items.length - 1);
        });

        component.oldChildren = component.children;
        component.children = [];

        items = items.slice();

        items.splice(99, 40);

        expect(items.length).toEqual(200);

        const newItems: Item[] = [];
        for (let i = 240; i < 300; i++) {
          newItems.push({ id: 'id' + i });
        }

        items.splice(119, 0, ...newItems);

        let subset = items.splice(4, 5);

        items.splice(14 - 5, 0, ...subset);

        subset = items.splice(229, 5);

        items.splice(244 - 5, 0, ...subset);

        for (let i = 29; i < 35; i++) {
          items[i] = { ...items[i] };
        }

        for (let i = 189; i < 180; i++) {
          items[i] = { ...items[i] };
        }

        subject.next(items)
        flushScheduler();
        component.collectChildren$.next();
        component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
          expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
        });

        const pTags = component.elementRef.nativeElement.querySelectorAll('p.rx-child-index');

        expect(pTags.length).toEqual(260);

        expect(component.children.length).toEqual(260);
        component.children.sort((a, b) => a.rxData!.index - b.rxData!.index);
        component.children.forEach((child, index) => {
          expect(child.rxData?.index).toEqual(index);
          expect(child.rxData?.item).toEqual(items[index]);
          expect(child.rxData?.even).toEqual(index % 2 === 0);
          expect(child.rxData?.odd).toEqual(index % 2 !== 0);
          expect(child.rxData?.first).toEqual(index === 0);
          expect(child.rxData?.last).toEqual(index === items.length - 1);
        });

        for (let i = 29; i < 35; i++) {
          expect(component.children[i]).toEqual(component.oldChildren[i]);
        }

        for (let i = 189; i < 180; i++) {
          expect(component.children[i]).toEqual(component.oldChildren[i]);
        }

        items = [];
        subject.next(items);
        flushScheduler();
        expect(component.elementRef.nativeElement.querySelectorAll('p.child-index').length).toEqual(0);
      }));
    });
  });
}
