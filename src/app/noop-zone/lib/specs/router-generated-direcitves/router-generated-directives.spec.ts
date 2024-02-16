import { ChangeDetectionStrategy, Component, ElementRef, inject } from "@angular/core";
import { disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { TestBed, fakeAsync, flush } from "@angular/core/testing";
import { NzForModule, NzIfModule, NzSwitchModule, provideNzForConfiguration, provideNzIfConfiguration, provideNzSwitchConfiguration } from "../../template";
import { RouterTestingModule } from "@angular/router/testing";
import { BehaviorSubject } from "rxjs";
import { Router } from "@angular/router";
import { flushScheduler } from "../../core/src/testing/testing";

@Component({
  selector: 'host-test-cmp',
  template: `
    <router-outlet></router-outlet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class HostTestCmp {
  cdRef = initializeComponent(this);
  elRef: ElementRef<HTMLElement> = inject(ElementRef);
  childCmp: ChildTestCmp | null = null;
}

@Component({
  selector: 'child-test-cmp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p *nzIf="nzIfValue$" class="rendered-text nz-if">RENDERED_TEXT</p>
    <p *nzFor="let item of nzForValue$" class="rendered-text nz-for">RENDERED_TEXT</p>
    <div [nzSwitch]="nzSwitchValue$">
      <p *nzSwitchCase="1" class="rendered-text nz-switch">RENDERED_TEXT</p>
    </div>
  `
})
class ChildTestCmp {
  cdRef = initializeComponent(this);
  nzIfValue$ = new BehaviorSubject(true);
  nzForValue$ = new BehaviorSubject([1]);
  nzSwitchValue$ = new BehaviorSubject(1);


  constructor(parentCmp: HostTestCmp) {
    parentCmp.childCmp = this;
  }

}

function setupEnviromnet(): void {

  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      imports: [
        NzIfModule,
        NzForModule,
        NzSwitchModule,
        RouterTestingModule.withRoutes([{ path: '', component: ChildTestCmp }])
      ],
      declarations: [
        HostTestCmp,
        ChildTestCmp,
      ],
      providers: [
        provideNzIfConfiguration({ optimized: true }),
        provideNzForConfiguration({ optimized: true }),
        provideNzSwitchConfiguration({ optimized: true })
      ]
    }).compileComponents()
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    disposeNoopZoneTestingEnviroment();
  });
}

describe('Removing dom elements from components', () => {

  setupEnviromnet();

  it('should remove dom elements', fakeAsync(() => {
    const hostCmp = TestBed.createComponent(HostTestCmp).componentInstance;
    const router = TestBed.inject(Router);
    hostCmp.cdRef.detectChanges();
    router.initialNavigation();

    flush();
    flushScheduler();
    flush();
    flushScheduler();

    hostCmp.cdRef.detectChanges();


    let pTags = hostCmp.elRef.nativeElement.querySelectorAll('p.rendered-text');

    expect(pTags.length).toEqual(3);
    expect(hostCmp.childCmp).not.toBeNull();
    const childCmp = hostCmp.childCmp!;

    childCmp.nzIfValue$.next(false);
    childCmp.nzForValue$.next([]);
    childCmp.nzSwitchValue$.next(0);

    flushScheduler();
    pTags = hostCmp.elRef.nativeElement.querySelectorAll('p.rendered-text');
    expect(pTags.length).toEqual(0);
  }));
});
