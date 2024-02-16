import { Component, OnChanges, OnInit, OnDestroy, Input, SimpleChanges, ElementRef, inject } from "@angular/core";
import { Subscription, Observable, combineLatest, Subject, firstValueFrom, BehaviorSubject } from "rxjs";
import { initializeComponent, Priority, detectChanges, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment } from "../../core";
import { TestBed } from "@angular/core/testing";
import { NzForModule, InPipeModule } from "../../template";

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
    <p class="child-index">{{index}}</p>
    <p class="rx-child-index">{{index$ | in:cdRef}}</p>
  `
})
class ChildTestComponent implements OnChanges, OnInit, OnDestroy {

  private _subscription: Subscription
  cdRef = initializeComponent(this);

  data: ChildData | null = null;
  rxData: ChildData | null = null;

  @Input() item!: Item;
  @Input() index!: number;
  @Input() first!: boolean;
  @Input() last!: boolean;
  @Input() even!: boolean;
  @Input() odd!: boolean;

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

  ngOnChanges(_: SimpleChanges): void {
    this.data = {
      item: this.item,
      index: this.index,
      first: this.first,
      last: this.last,
      even: this.even,
      odd: this.odd,
    };
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
    <child-test-cmp *nzFor="let item of items;
                            let index = index;
                            let first = first;
                            let last = last;
                            let even = even;
                            let odd = odd;
                            let item$ = item$;
                            let index$ = index$;
                            let first$ = first$;
                            let last$ = last$;
                            let even$ = even$;
                            let odd$ = odd$;
                            trackBy: 'id';
                            priority: priority"
                    [item]="item"
                    [index]="index"
                    [first]="first"
                    [last]="last"
                    [even]="even"
                    [odd]="odd"
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

  // detectChanges(): void {
  //   detectChanges(this.cdRef);
  // }
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment(true);
    await TestBed.configureTestingModule({
      imports: [ NzForModule, InPipeModule ],
      declarations: [ ParentTestComponent, ChildTestComponent ],
      teardown: { destroyAfterEach: true }
    }).compileComponents();
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    disposeNoopZoneTestingEnviroment();
  });
}

describe('[nzFor] Disabled scheduler. Testing rendering with raw values.', () => {
  setupEnviroment();
  it('Should make the appropriate changes to child components.', () => {
    const fixture = TestBed.createComponent(ParentTestComponent);
    const component = fixture.componentInstance;
    const items: Item[] = [];
    for (let i = 0; i < 240; i++) {
      items.push({ id: 'id' + i });
    }
    component.items = items;
    fixture.detectChanges();
    component.collectChildren$.next();
    component.elementRef.nativeElement.querySelectorAll('p.child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });
    component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });
    expect(component.children.length).toEqual(240);
    component.children.forEach((child, index) => {
      expect(child.data?.index).toEqual(index);
      expect(child.rxData?.index).toEqual(index);
      expect(child.data?.item).toEqual(items[index]);
      expect(child.rxData?.item).toEqual(items[index]);
      expect(child.data?.even).toEqual(index % 2 === 0);
      expect(child.rxData?.even).toEqual(index % 2 === 0);
      expect(child.data?.odd).toEqual(index % 2 !== 0);
      expect(child.rxData?.odd).toEqual(index % 2 !== 0);
      expect(child.data?.first).toEqual(index === 0);
      expect(child.rxData?.first).toEqual(index === 0);
      expect(child.data?.last).toEqual(index === items.length - 1);
      expect(child.rxData?.last).toEqual(index === items.length - 1);
    });

    component.oldChildren = component.children;
    component.children = [];

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

    fixture.detectChanges();
    component.collectChildren$.next();
    component.elementRef.nativeElement.querySelectorAll('p.child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });
    component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });

    const pTags = component.elementRef.nativeElement.querySelectorAll('p.child-index');

    expect(pTags.length).toEqual(260);

    expect(component.children.length).toEqual(260);
    component.children.sort((a, b) => a.rxData!.index - b.rxData!.index);
    component.children.forEach((child, index) => {
      expect(child.data?.index).toEqual(index);
      expect(child.rxData?.index).toEqual(index);
      expect(child.data?.item).toEqual(items[index]);
      expect(child.rxData?.item).toEqual(items[index]);
      expect(child.data?.even).toEqual(index % 2 === 0);
      expect(child.rxData?.even).toEqual(index % 2 === 0);
      expect(child.data?.odd).toEqual(index % 2 !== 0);
      expect(child.rxData?.odd).toEqual(index % 2 !== 0);
      expect(child.data?.first).toEqual(index === 0);
      expect(child.rxData?.first).toEqual(index === 0);
      expect(child.data?.last).toEqual(index === items.length - 1);
      expect(child.rxData?.last).toEqual(index === items.length - 1);
    });

    for (let i = 29; i < 35; i++) {
      expect(component.children[i]).toEqual(component.oldChildren[i]);
    }

    for (let i = 189; i < 180; i++) {
      expect(component.children[i]).toEqual(component.oldChildren[i]);
    }

    items.splice(0);
    fixture.detectChanges();
    expect(component.elementRef.nativeElement.querySelectorAll('p.child-index').length).toEqual(0);
  });
});

describe('[nzFor] Disabled scheduler. Testing rendering with promises.', () => {
  setupEnviroment();
  it('Should make the appropriate changes to child components.', async () => {
    const fixture = TestBed.createComponent(ParentTestComponent);
    const component = fixture.componentInstance;
    let items: Item[] = [];
    for (let i = 0; i < 240; i++) {
      items.push({ id: 'id' + i });
    }
    let promise = new Promise<any[]>((resolve) => {
      setTimeout(() => { resolve(items); }, 100)
    });
    component.items = promise;
    fixture.detectChanges();
    await promise;
    fixture.detectChanges();
    component.collectChildren$.next();
    component.elementRef.nativeElement.querySelectorAll('p.child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });
    component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });
    expect(component.children.length).toEqual(240);
    component.children.forEach((child, index) => {
      expect(child.data?.index).toEqual(index);
      expect(child.rxData?.index).toEqual(index);
      expect(child.data?.item).toEqual(items[index]);
      expect(child.rxData?.item).toEqual(items[index]);
      expect(child.data?.even).toEqual(index % 2 === 0);
      expect(child.rxData?.even).toEqual(index % 2 === 0);
      expect(child.data?.odd).toEqual(index % 2 !== 0);
      expect(child.rxData?.odd).toEqual(index % 2 !== 0);
      expect(child.data?.first).toEqual(index === 0);
      expect(child.rxData?.first).toEqual(index === 0);
      expect(child.data?.last).toEqual(index === items.length - 1);
      expect(child.rxData?.last).toEqual(index === items.length - 1);
    });

    component.oldChildren = component.children;
    component.children = [];

    items = items.slice(0);
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

    promise = new Promise<any[]>((resolve) => {
      setTimeout(() => { resolve(items); }, 100)
    });
    component.items = promise;

    fixture.detectChanges();
    await promise;
    fixture.detectChanges();
    component.collectChildren$.next();
    component.elementRef.nativeElement.querySelectorAll('p.child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });
    component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });

    const pTags = component.elementRef.nativeElement.querySelectorAll('p.child-index');

    expect(pTags.length).toEqual(260);

    expect(component.children.length).toEqual(260);
    component.children.sort((a, b) => a.rxData!.index - b.rxData!.index);
    component.children.forEach((child, index) => {
      expect(child.data?.index).toEqual(index);
      expect(child.rxData?.index).toEqual(index);
      expect(child.data?.item).toEqual(items[index]);
      expect(child.rxData?.item).toEqual(items[index]);
      expect(child.data?.even).toEqual(index % 2 === 0);
      expect(child.rxData?.even).toEqual(index % 2 === 0);
      expect(child.data?.odd).toEqual(index % 2 !== 0);
      expect(child.rxData?.odd).toEqual(index % 2 !== 0);
      expect(child.data?.first).toEqual(index === 0);
      expect(child.rxData?.first).toEqual(index === 0);
      expect(child.data?.last).toEqual(index === items.length - 1);
      expect(child.rxData?.last).toEqual(index === items.length - 1);
    });

    for (let i = 29; i < 35; i++) {
      expect(component.children[i]).toEqual(component.oldChildren[i]);
    }

    for (let i = 189; i < 180; i++) {
      expect(component.children[i]).toEqual(component.oldChildren[i]);
    }

    items = items.slice(0);
    items.splice(0);
    promise = new Promise<any[]>((resolve) => {
      setTimeout(() => { resolve(items); }, 100)
    });
    component.items = promise;

    fixture.detectChanges();
    await promise;
    fixture.detectChanges();
    expect(component.elementRef.nativeElement.querySelectorAll('p.child-index').length).toEqual(0);
  });
});

describe('[nzFor] Disabled scheduler. Testing rendering with observables.', () => {
  setupEnviroment();
  it('Should make the appropriate changes to child components.', async () => {
    const fixture = TestBed.createComponent(ParentTestComponent);
    const component = fixture.componentInstance;
    let items: Item[] = [];
    for (let i = 0; i < 240; i++) {
      items.push({ id: 'id' + i });
    }
    let observable = new Observable<any[]>((observer) => {
      setTimeout(() => { observer.next(items) }, 100);
    });
    component.items = observable;
    fixture.detectChanges();
    await firstValueFrom(observable);
    fixture.detectChanges();
    component.collectChildren$.next();
    component.elementRef.nativeElement.querySelectorAll('p.child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });
    component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });
    expect(component.children.length).toEqual(240);
    component.children.forEach((child, index) => {
      expect(child.data?.index).toEqual(index);
      expect(child.rxData?.index).toEqual(index);
      expect(child.data?.item).toEqual(items[index]);
      expect(child.rxData?.item).toEqual(items[index]);
      expect(child.data?.even).toEqual(index % 2 === 0);
      expect(child.rxData?.even).toEqual(index % 2 === 0);
      expect(child.data?.odd).toEqual(index % 2 !== 0);
      expect(child.rxData?.odd).toEqual(index % 2 !== 0);
      expect(child.data?.first).toEqual(index === 0);
      expect(child.rxData?.first).toEqual(index === 0);
      expect(child.data?.last).toEqual(index === items.length - 1);
      expect(child.rxData?.last).toEqual(index === items.length - 1);
    });

    component.oldChildren = component.children;
    component.children = [];

    items = items.slice(0);
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

    observable = new Observable<any[]>((observer) => {
      setTimeout(() => { observer.next(items) }, 100);
    });
    component.items = observable;

    fixture.detectChanges();
    await firstValueFrom(observable);
    fixture.detectChanges();
    component.collectChildren$.next();
    component.elementRef.nativeElement.querySelectorAll('p.child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });
    component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });

    const pTags = component.elementRef.nativeElement.querySelectorAll('p.child-index');

    expect(pTags.length).toEqual(260);

    expect(component.children.length).toEqual(260);
    component.children.sort((a, b) => a.rxData!.index - b.rxData!.index);
    component.children.forEach((child, index) => {
      expect(child.data?.index).toEqual(index);
      expect(child.rxData?.index).toEqual(index);
      expect(child.data?.item).toEqual(items[index]);
      expect(child.rxData?.item).toEqual(items[index]);
      expect(child.data?.even).toEqual(index % 2 === 0);
      expect(child.rxData?.even).toEqual(index % 2 === 0);
      expect(child.data?.odd).toEqual(index % 2 !== 0);
      expect(child.rxData?.odd).toEqual(index % 2 !== 0);
      expect(child.data?.first).toEqual(index === 0);
      expect(child.rxData?.first).toEqual(index === 0);
      expect(child.data?.last).toEqual(index === items.length - 1);
      expect(child.rxData?.last).toEqual(index === items.length - 1);
    });

    for (let i = 29; i < 35; i++) {
      expect(component.children[i]).toEqual(component.oldChildren[i]);
    }

    for (let i = 189; i < 180; i++) {
      expect(component.children[i]).toEqual(component.oldChildren[i]);
    }

    items = items.slice(0);
    items.splice(0);
    observable = new Observable<any[]>((observer) => {
      setTimeout(() => { observer.next(items) }, 100);
    });
    component.items = observable;

    fixture.detectChanges();
    await firstValueFrom(observable);
    fixture.detectChanges();
    expect(component.elementRef.nativeElement.querySelectorAll('p.child-index').length).toEqual(0);
  });
});

describe('[nzFor] Disabled scheduler. Testing rendering with raw values.', () => {
  setupEnviroment();
  it('Should make the appropriate changes to child components.', () => {
    const fixture = TestBed.createComponent(ParentTestComponent);
    const component = fixture.componentInstance;
    let items: Item[] = [];
    for (let i = 0; i < 240; i++) {
      items.push({ id: 'id' + i });
    }
    const subject = new BehaviorSubject(items);
    component.items = subject;
    fixture.detectChanges();
    component.collectChildren$.next();
    component.elementRef.nativeElement.querySelectorAll('p.child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });
    component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });
    expect(component.children.length).toEqual(240);
    component.children.forEach((child, index) => {
      expect(child.data?.index).toEqual(index);
      expect(child.rxData?.index).toEqual(index);
      expect(child.data?.item).toEqual(items[index]);
      expect(child.rxData?.item).toEqual(items[index]);
      expect(child.data?.even).toEqual(index % 2 === 0);
      expect(child.rxData?.even).toEqual(index % 2 === 0);
      expect(child.data?.odd).toEqual(index % 2 !== 0);
      expect(child.rxData?.odd).toEqual(index % 2 !== 0);
      expect(child.data?.first).toEqual(index === 0);
      expect(child.rxData?.first).toEqual(index === 0);
      expect(child.data?.last).toEqual(index === items.length - 1);
      expect(child.rxData?.last).toEqual(index === items.length - 1);
    });

    component.oldChildren = component.children;
    component.children = [];

    items = items.slice(0);
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

    subject.next(items);
    fixture.detectChanges();
    component.collectChildren$.next();
    component.elementRef.nativeElement.querySelectorAll('p.child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });
    component.elementRef.nativeElement.querySelectorAll('p.rx-child-index').forEach((p, index) => {
      expect((p as HTMLElement).textContent?.trim()).toEqual(`${index}`);
    });

    const pTags = component.elementRef.nativeElement.querySelectorAll('p.child-index');

    expect(pTags.length).toEqual(260);

    expect(component.children.length).toEqual(260);
    component.children.sort((a, b) => a.rxData!.index - b.rxData!.index);
    component.children.forEach((child, index) => {
      expect(child.data?.index).toEqual(index);
      expect(child.rxData?.index).toEqual(index);
      expect(child.data?.item).toEqual(items[index]);
      expect(child.rxData?.item).toEqual(items[index]);
      expect(child.data?.even).toEqual(index % 2 === 0);
      expect(child.rxData?.even).toEqual(index % 2 === 0);
      expect(child.data?.odd).toEqual(index % 2 !== 0);
      expect(child.rxData?.odd).toEqual(index % 2 !== 0);
      expect(child.data?.first).toEqual(index === 0);
      expect(child.rxData?.first).toEqual(index === 0);
      expect(child.data?.last).toEqual(index === items.length - 1);
      expect(child.rxData?.last).toEqual(index === items.length - 1);
    });

    for (let i = 29; i < 35; i++) {
      expect(component.children[i]).toEqual(component.oldChildren[i]);
    }

    for (let i = 189; i < 180; i++) {
      expect(component.children[i]).toEqual(component.oldChildren[i]);
    }

    items = items.slice();
    items.splice(0);
    subject.next(items);
    fixture.detectChanges();
    expect(component.elementRef.nativeElement.querySelectorAll('p.child-index').length).toEqual(0);
  });
});
