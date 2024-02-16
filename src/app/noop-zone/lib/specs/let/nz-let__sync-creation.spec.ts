import { Component, ElementRef, ViewChild, inject } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { Priority, initializeComponent, detectChanges, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment } from "../../core";
import { TestBed } from "@angular/core/testing";
import { provideNgNoopZone } from "../../core/src/enviroment/enviroment";
import { NzLetModule, provideNzLetConfiguration } from "../../template";
import { waitUntilSchedulingDone } from "../../core/src/testing/testing";

@Component({
  selector: 'test-comp',
  template: `
    <p #paragraph *nzLet="valueSource; let value">
      {{ value }}
    </p>
  `
})
class TestComponent {
  priority = Priority.normal
  elementRef: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>);
  cdRef = initializeComponent(this, 4 * Math.random() + 1);
  valueSource: Promise<any> | Observable<any> = null!;

  @ViewChild('paragraph') paragraph: ElementRef<HTMLElement> | null = null

  setValueSource(valueSource: Promise<any> | Observable<any>) {
    this.valueSource = valueSource;
  }

  detectChanges(): void {
    detectChanges(this.cdRef, Math.round(4 * Math.random() + 1));
  }
}

function setupEnviroment(): void {
  beforeEach(async () => {
    initialNoopZoneTestingEnviroment();
    await TestBed.configureTestingModule({
      declarations: [ TestComponent ],
      imports: [ NzLetModule ],
      providers: [
        provideNgNoopZone(),
        provideNzLetConfiguration({ syncCreation: true })
      ],
      teardown: { destroyAfterEach: true }
    }).compileComponents()
  });

  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
    TestBed.resetTestingModule();
  });
}

function createComponent(): TestComponent {
  return TestBed.createComponent(TestComponent).componentInstance;
}

function getPriority(): Priority {
  return 1 + Math.round(4 * Math.random())
}

describe('[nzLet] Sync creation', () => {
  describe('Behavior Subject, Using waitUntilSchedulingDone() function', () => {
    setupEnviroment();
    it('Should paragraph be not null', async () => {
      const component = createComponent()
      const text = 'RENDERED_TEXT';
      const subject = new BehaviorSubject(text);

      component.priority = getPriority();

      component.setValueSource(subject);
      component.detectChanges();
      await waitUntilSchedulingDone();
      expect(component.paragraph).toBeTruthy();
      expect(component.paragraph?.nativeElement.textContent?.trim()).toBe(text);
    })
  })
})
