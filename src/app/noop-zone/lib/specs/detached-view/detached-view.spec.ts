import { AfterContentInit, Component, Directive, DoCheck } from "@angular/core";
import { Priority, detectChanges, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, initializeComponent } from "../../core";
import { TestBed } from "@angular/core/testing";
import { NzDetachedViewModule } from "../../template/detached-view/detached-view.module";
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";

@Directive({ selector: '[testDir]' })
class TestDir implements DoCheck, AfterContentInit {
  checkCount = 0;
  private _isInit = false;

  constructor(testComp: TestComponent) {
    if (!testComp.testDir1) {
      testComp.testDir1 = this;
    } else {
      testComp.testDir2 = this;
    }
  }

  ngDoCheck(): void {
    if (this._isInit) {
      this.checkCount++;
    }
  }

  ngAfterContentInit(): void {
    this._isInit = true;
  }

}

@Component({
  selector: 'test-comp',
  template: `
    <div testDir></div>
    <div *nzDetachedView="priority">
      <div testDir></div>
    </div>
  `
})
class TestComponent {
  testDir1: TestDir | null = null;
  testDir2: TestDir | null = null;
  priority: Priority = Priority.normal;
  cdRef = initializeComponent(this);

  detectChanges(): void {
    detectChanges(this.cdRef);
  }
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      declarations: [ TestComponent, TestDir ],
      imports: [ NzDetachedViewModule ],
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
  describe(`Testing detached view. Priority level: ${prio}.`, () => {
    describe('With waitUntilSchedingDone() function.', () => {
      setupEnviroment();
      it('Should cd not reach nested directive', async () => {
        const component = createComponent();
        component.priority = prio;
        await waitUntilSchedulingDone();
        expect(component.testDir1?.checkCount).toEqual(0);
        expect(component.testDir2?.checkCount).toEqual(0);
        component.detectChanges();
        await waitUntilSchedulingDone();
        expect(component.testDir1?.checkCount).toEqual(1);
        expect(component.testDir2?.checkCount).toEqual(0);
        component.detectChanges();
        await waitUntilSchedulingDone();
        expect(component.testDir1?.checkCount).toEqual(2);
        expect(component.testDir2?.checkCount).toEqual(0);
      });
    });

    describe('With flushScheduler() function.', () => {
      setupEnviroment();
      it('Should cd not reach nested directive', () => {
        const component = createComponent();
        component.priority = prio;
        flushScheduler();
        expect(component.testDir1?.checkCount).toEqual(0);
        expect(component.testDir2?.checkCount).toEqual(0);
        component.detectChanges();
        flushScheduler();
        expect(component.testDir1?.checkCount).toEqual(1);
        expect(component.testDir2?.checkCount).toEqual(0);
        component.detectChanges();
        flushScheduler();
        expect(component.testDir1?.checkCount).toEqual(2);
        expect(component.testDir2?.checkCount).toEqual(0);
      });
    });
  });
}
