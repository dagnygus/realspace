import { BehaviorSubject, NextObserver, Observer, Subject } from "rxjs";
import { NzScheduler, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment } from "../../core"
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";
import { TestBed } from "@angular/core/testing";

function setupEnivroment(): void {
  beforeEach(() => {
    initialNoopZoneTestingEnviroment();
    TestBed.configureTestingModule({
      providers: [ NzScheduler ]
    });
  });
  afterEach(() => {
    disposeNoopZoneTestingEnviroment();
    TestBed.resetTestingModule();
  });
}

for (let prio = 1; prio < 6; prio++) {
  describe(`NzScheduler#observeOn. Priority level ${prio}.`, () => {
    describe('Using waitUntilSchedulingDone() function.', () => {
      setupEnivroment();
      it('Should schedule next and complate.', async () => {
        const subject = new Subject<number>();
        let num = -1;
        let complete = false;
        const nzScheduler = TestBed.inject(NzScheduler);
        const observer: Partial<Observer<number>> = {
          next: (val) => num = val,
          complete: () => complete = true
        }
        subject.pipe(nzScheduler.observeOn(prio)).subscribe(observer);

        subject.next(0);
        expect(num).toEqual(-1);
        await waitUntilSchedulingDone();
        expect(num).toEqual(0);

        subject.next(1);
        expect(num).toEqual(0);
        await waitUntilSchedulingDone();
        expect(num).toEqual(1);

        subject.next(2);
        expect(num).toEqual(1);
        await waitUntilSchedulingDone();
        expect(num).toEqual(2);

        subject.next(3);
        expect(num).toEqual(2);
        await waitUntilSchedulingDone();
        expect(num).toEqual(3);

        subject.complete()
        expect(complete).toBeFalse();
        await waitUntilSchedulingDone();
        expect(complete).toBeTrue();

      });

      it('Should schedule error.', async () => {
        const subject = new Subject<number>();
        const nzScheduler = TestBed.inject(NzScheduler);
        let errorEmitted = false;
        const observer: Partial<Observer<number>> = {
          error: () => errorEmitted = true
        }
        subject.pipe(nzScheduler.observeOn(prio)).subscribe(observer);

        subject.error({});
        expect(errorEmitted).toBeFalse();
        await waitUntilSchedulingDone();
        expect(errorEmitted).toBeTrue();
      });
    });

    describe('Using flushScheduler() function.', () => {
      setupEnivroment();
      it('Should schedule next and complate.', () => {
        const subject = new Subject<number>();
        let num = -1;
        let complete = false;
        const nzScheduler = TestBed.inject(NzScheduler);
        const observer: Partial<Observer<number>> = {
          next: (val) => num = val,
          complete: () => complete = true
        }
        subject.pipe(nzScheduler.observeOn(prio)).subscribe(observer);

        subject.next(0);
        expect(num).toEqual(-1);
        flushScheduler();
        expect(num).toEqual(0);

        subject.next(1);
        expect(num).toEqual(0);
        flushScheduler();
        expect(num).toEqual(1);

        subject.next(2);
        expect(num).toEqual(1);
        flushScheduler();
        expect(num).toEqual(2);

        subject.next(3);
        expect(num).toEqual(2);
        flushScheduler();
        expect(num).toEqual(3);

        subject.complete()
        expect(complete).toBeFalse();
        flushScheduler();
        expect(complete).toBeTrue();

      });

      it('Should schedule error.', () => {
        const subject = new Subject<number>();
        const nzScheduler = TestBed.inject(NzScheduler);
        let errorEmitted = false;
        const observer: Partial<Observer<number>> = {
          error: () => errorEmitted = true
        }
        subject.pipe(nzScheduler.observeOn(prio)).subscribe(observer);

        subject.error({});
        expect(errorEmitted).toBeFalse();
        flushScheduler();
        expect(errorEmitted).toBeTrue();
      });
    });
  });

  describe(`NzScheduler#subscribeOn. Priority level ${prio}.`, () => {
    describe('Using waitUntilSchedulingDone() function.', () => {
      setupEnivroment()
      it('Should schedule subscription.', async () => {
        const subject = new BehaviorSubject<number>(0);
        let num = -1;
        const nzScheduler = TestBed.inject(NzScheduler);
        subject.pipe(nzScheduler.subscribeOn(prio)).subscribe((val) => num = val);

        expect(num).toEqual(-1);
        await waitUntilSchedulingDone();
        expect(num).toEqual(0);

        subject.next(1);
        expect(num).toEqual(1);

        subject.next(2);
        expect(num).toEqual(2);
      });
    });

    describe('Using flushScheduler() function.', () => {
      setupEnivroment()
      it('Should schedule subscription.', () => {
        const subject = new BehaviorSubject<number>(0);
        let num = -1;
        const nzScheduler = TestBed.inject(NzScheduler);
        subject.pipe(nzScheduler.subscribeOn(prio)).subscribe((val) => num = val);

        expect(num).toEqual(-1);
        flushScheduler();
        expect(num).toEqual(0);

        subject.next(1);
        expect(num).toEqual(1);

        subject.next(2);
        expect(num).toEqual(2);
      });
    });
  });
}
