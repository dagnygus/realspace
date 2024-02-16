import { Component, ElementRef, inject } from "@angular/core";
import { Priority, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { TestBed } from "@angular/core/testing";
import { NzLocalViewModule } from "../../template/local-view/nz-local-view.module";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";
import { NextObserver } from "rxjs";

@Component({
  selector: 'test-cmp',
  template: `
    <ng-container *nzLocalView="priority; renderCallback: renderCb">
      <p>RENDERED_TEXT</p>
    </ng-container>
  `
})
class TestComponent {
  cdRef = initializeComponent(this);
  priority = Priority.normal;
  callbackCallCount = 0;
  renderCb: NextObserver<void> = { next: () => {
    this.callbackCallCount++;
  } };
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
  describe(`[nzLocalView]: After render callback. Priority level ${prio}.`, () => {
    describe('Using waitUntilSchedulingDone() function.', () => {
      setupEnviroment();
      it('Should call render callback', async () => {
        const component = createComponent();
        component.priority = prio;
        await waitUntilSchedulingDone();
        expect(component.callbackCallCount).toEqual(1);
      });
    });
    describe('Using flushScheduler() function.', () => {
      setupEnviroment();
      it('Should call render callback', () => {
        const component = createComponent();
        component.priority = prio;
        flushScheduler();
        expect(component.callbackCallCount).toEqual(1);
      });
    });
  });
}
