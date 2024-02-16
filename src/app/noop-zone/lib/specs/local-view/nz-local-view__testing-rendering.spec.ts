import { Component, ElementRef, inject } from "@angular/core";
import { Priority, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { TestBed } from "@angular/core/testing";
import { NzLocalViewModule } from "../../template/local-view/nz-local-view.module";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";

@Component({
  selector: 'test-cmp',
  template: `
    <ng-container *nzLocalView="priority">
      <p>RENDERED_TEXT</p>
    </ng-container>
  `
})
class TestComponent {
  cdRef = initializeComponent(this);
  priority = Priority.normal;
  elementRef: ElementRef<HTMLElement> = inject(ElementRef);
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      imports: [ NzLocalViewModule ],
      declarations: [ TestComponent ],
      teardown: { destroyAfterEach: true }
    }).compileComponents();
  });

  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
    TestBed.resetTestingModule();
  });
}

function createComponent(): TestComponent {
  return TestBed.createComponent(TestComponent).componentInstance;
}

for (let prio = 1; prio < 6; prio++) {
  describe(`[nzLocalView]: Testing rendering. Priority level ${prio}`, () => {
    describe('Using waitUntilSchedulingDone()', () => {
      setupEnviroment();
      it('Should render text.', async () => {
        const component = createComponent();
        component.priority = prio;
        expect(component.elementRef.nativeElement.querySelector('p')).toBeFalsy();

        await waitUntilSchedulingDone();
        expect(component.elementRef.nativeElement.querySelector('p')?.textContent).toEqual('RENDERED_TEXT');
      });
    });

    describe('Using flushScheduler()', () => {
      setupEnviroment();
      it('Should render text.', () => {
        const component = createComponent();
        component.priority = prio;
        expect(component.elementRef.nativeElement.querySelector('p')).toBeFalsy();

        flushScheduler();
        expect(component.elementRef.nativeElement.querySelector('p')?.textContent).toEqual('RENDERED_TEXT');
      });
    });
  });
}
