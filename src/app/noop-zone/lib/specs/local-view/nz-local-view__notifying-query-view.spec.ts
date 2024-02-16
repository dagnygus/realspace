import { Component, Directive, DoCheck } from "@angular/core";
import { Priority, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { TestBed } from "@angular/core/testing";
import { NzLocalViewModule } from "../../template/local-view/nz-local-view.module";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";
import { NzQueryViewModule } from "../../template";

@Directive({ selector: '[testDir]' })
class TestDirective implements DoCheck {
  checkCount = 0;

  constructor(component: TestComponent) {
    component.testDir = this;
  }

  ngDoCheck(): void {
    this.checkCount++;
  }

}

@Component({
  selector: 'test-cmp',
  template: `
    <ng-container *nzQueryView="queryViewPriority">
      <div testDir></div>
      <ng-container *nzLocalView="priority">
        <p>RENDERED_TEXT</p>
      </ng-container>
    </ng-container>
  `
})
class TestComponent {
  cdRef = initializeComponent(this);
  testDir!: TestDirective;
  queryViewPriority = Math.round(4 * Math.random() + 1);
  priority = Priority.normal;
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      imports: [ NzLocalViewModule,  NzQueryViewModule ],
      declarations: [ TestComponent, TestDirective ],
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
  describe(`[nzLocalView]: Notifying query view. Priority level ${prio}.`, () => {
    describe('Using waitUntilSchedulingDone() function', () => {
      setupEnviroment();
      it('Should notify query view', async () => {
        const component = createComponent();
        component.priority = prio;
        await waitUntilSchedulingDone();
        expect(component.testDir.checkCount).toEqual(2);
      });
    });

    describe('Using flushScheduler() function', () => {
      setupEnviroment();
      it('Should notify query view', () => {
        const component = createComponent();
        component.priority = prio;
        flushScheduler();
        expect(component.testDir.checkCount).toEqual(2);
      });
    });
  });
}
