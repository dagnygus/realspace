import { Subject, Subscription, async, take } from "rxjs";
import { Priority, disposeNoopZoneTestingEnviroment, initialNoopZoneTestingEnviroment, onSchedulerDone, onSchedulerStart, onStable, scheduleWork } from "../../core"
import { flushScheduler, waitUntilSchedulingDone } from "../../core/src/testing/testing";

type IndexedPriority = { priority: number, index: number };

function getPriority(): Priority {
  return Math.round(4 * Math.random() + 1);
}


function verifyPriorities(indexedPrios: IndexedPriority[]): boolean {
  if (indexedPrios.length < 2) {
    return true;
  }

  for (let i = 0; i < indexedPrios.length - 1; i++) {
    for (let j = i + 1; j < indexedPrios.length; j++) {
      if (indexedPrios[i].priority > indexedPrios[j].priority) {
        return false;
      }

      if (
        indexedPrios[j - 1].priority === indexedPrios[j].priority
        && indexedPrios[j - 1].index > indexedPrios[j].index
      ) {
        return false;
      }
    }
  }

  return true;
}




describe('React main threat concurrent scheduler.', () => {

  describe('Testing scheduling order', () => {


    describe('using waitUntilSchedulingDone() function', () => {

      beforeEach(() => {
        initialNoopZoneTestingEnviroment();
      });
      afterEach(() => {
        disposeNoopZoneTestingEnviroment();
      });

      it('Should run 1000 callbacks with nested callbacks in nondecrematal order', async () => {
        const indexedPriosDeepLevel1: IndexedPriority[] = [];
        const indexedPriosDeepLevel2: IndexedPriority[][] = [];
        const indexedPriosDeepLevel3: IndexedPriority[][][] = [];
        const flags: string[] = [];
        let startCount = 0
        let doneCount = 0;

        onSchedulerStart.pipe(take(1)).subscribe(() => {
          flags.push('start');
          startCount++;
        });
        onSchedulerDone.pipe(take(1)).subscribe(() => {
          flags.push('done');
          doneCount++;
        });

        const totalCount = 10;

        for (let i = 0; i < totalCount; i++) {
          indexedPriosDeepLevel2.push([])
        }

        for (let i = 0; i < totalCount; i++) {
          const priosDL2: IndexedPriority[][] = []
          indexedPriosDeepLevel3.push(priosDL2);

          for (let j = 0; j < totalCount; j++) {
            priosDL2.push([]);
          }
        }

        for (let i = 0; i < totalCount; i++) {

          const prio1 = getPriority();
          const indexedPrio1: IndexedPriority = {
            priority: prio1,
            index: i
          }
          scheduleWork(prio1, null, () => {
            indexedPriosDeepLevel1.push(indexedPrio1);

            for (let j = 0; j < totalCount; j++) {

              const prio2 = getPriority();
              const indexedPrio2: IndexedPriority = {
                priority: prio2,
                index: j
              }
              scheduleWork(prio2, null, () => {
                indexedPriosDeepLevel2[i].push(indexedPrio2);
                for (let k = 0; k < totalCount; k++) {

                  const prio3 = getPriority();
                  const indexedPrio3: IndexedPriority = {
                    priority: prio3,
                    index: k
                  }
                  scheduleWork(prio3, null, () => {
                    indexedPriosDeepLevel3[i][j].push(indexedPrio3);
                  });
                }

              });

            }

          });

        }



        expect(flags.length).toEqual(0);
        expect(startCount).toEqual(0);
        expect(doneCount).toEqual(0);

        await waitUntilSchedulingDone();

        expect(flags.length).toEqual(2);
        expect(flags[0]).toEqual('start');
        expect(flags[1]).toEqual('done');
        expect(startCount).toEqual(1);
        expect(doneCount).toEqual(1);

        expect(verifyPriorities(indexedPriosDeepLevel1)).toBeTrue();

        indexedPriosDeepLevel2.forEach((ipriosDL1) => {
          expect(verifyPriorities(ipriosDL1)).toBeTrue();
        });

        indexedPriosDeepLevel3.forEach((ipriosDL2) => {
          ipriosDL2.forEach((ipriosDL1) => {
            expect(verifyPriorities(ipriosDL1)).toBeTrue();
          });
        });

      });

    });

    describe('using flushScheduler() function', () => {

      beforeEach(() => {
        initialNoopZoneTestingEnviroment();
      });
      afterEach(() => {
        disposeNoopZoneTestingEnviroment();
      });

      it('Should run 1000 callbacks with nested callbacks in nondecreamatal order', () => {
        const indexedPriosDeepLevel1: IndexedPriority[] = [];
        const indexedPriosDeepLevel2: IndexedPriority[][] = [];
        const indexedPriosDeepLevel3: IndexedPriority[][][] = [];
        const flags: string[] = [];
        let startCount = 0
        let doneCount = 0;

        onSchedulerStart.pipe(take(1)).subscribe(() => {
          flags.push('start');
          startCount++;
        });
        onSchedulerDone.pipe(take(1)).subscribe(() => {
          flags.push('done');
          doneCount++;
        });

        const totalCount = 10;

        for (let i = 0; i < totalCount; i++) {
          indexedPriosDeepLevel2.push([])
        }

        for (let i = 0; i < totalCount; i++) {
          const priosDL2: IndexedPriority[][] = []
          indexedPriosDeepLevel3.push(priosDL2);

          for (let j = 0; j < totalCount; j++) {
            priosDL2.push([]);
          }
        }

        for (let i = 0; i < totalCount; i++) {

          const prio1 = getPriority();
          const indexedPrio1: IndexedPriority = {
            priority: prio1,
            index: i
          }
          scheduleWork(prio1, null, () => {
            indexedPriosDeepLevel1.push(indexedPrio1);

            for (let j = 0; j < totalCount; j++) {

              const prio2 = getPriority();
              const indexedPrio2: IndexedPriority = {
                priority: prio2,
                index: j
              }
              scheduleWork(prio2, null, () => {
                indexedPriosDeepLevel2[i].push(indexedPrio2);
                for (let k = 0; k < totalCount; k++) {

                  const prio3 = getPriority();
                  const indexedPrio3: IndexedPriority = {
                    priority: prio3,
                    index: k
                  }
                  scheduleWork(prio3, null, () => {
                    indexedPriosDeepLevel3[i][j].push(indexedPrio3);
                  });
                }

              });

            }

          });

        }

        expect(flags.length).toEqual(0);
        expect(startCount).toEqual(0);
        expect(doneCount).toEqual(0);

        flushScheduler();

        expect(flags.length).toEqual(2);
        expect(flags[0]).toEqual('start');
        expect(flags[1]).toEqual('done');
        expect(startCount).toEqual(1);
        expect(doneCount).toEqual(1);

        expect(verifyPriorities(indexedPriosDeepLevel1)).toBeTrue();

        indexedPriosDeepLevel2.forEach((ipriosDL1) => {
          expect(verifyPriorities(ipriosDL1)).toBeTrue();
        });

        indexedPriosDeepLevel3.forEach((ipriosDL2) => {
          ipriosDL2.forEach((ipriosDL1) => {
            expect(verifyPriorities(ipriosDL1)).toBeTrue();
          });
        });

      });

    });

  });

  describe('Testing waitUntilSchedulingDone() and flushScheduler() together.', () => {

    beforeEach(() => {
      initialNoopZoneTestingEnviroment();
    });
    afterEach(() => {
      disposeNoopZoneTestingEnviroment();
    });

    for (let prio = 1; prio < 6; prio++) {
      it(`Priority level: ${prio}`, async () => {
        let callCount = 0;
        const totalCount = 20;
        let flags: string[] = [];
        let startCount = 0
        let doneCount = 0;
        const subscription = new Subscription()

        subscription.add(onSchedulerStart.subscribe(() => {
          flags.push('start');
          startCount++;
        }));
        subscription.add(onSchedulerDone.subscribe(() => {
          flags.push('done');
          doneCount++;
        }));

        for (let i = 0; i < totalCount; i++) {
          scheduleWork(prio, null, () => {
            callCount++
          });
        }

        expect(flags.length).toEqual(0);
        expect(startCount).toEqual(0);
        expect(doneCount).toEqual(0);

        await waitUntilSchedulingDone();

        expect(callCount).toEqual(totalCount);
        expect(flags.length).toEqual(2);
        expect(flags[0]).toEqual('start');
        expect(flags[1]).toEqual('done');
        expect(startCount).toEqual(1);
        expect(doneCount).toEqual(1);

        callCount = 0;
        flags = [];
        startCount = 0
        doneCount = 0;


        for (let i = 0; i < totalCount; i++) {
          scheduleWork(prio, null, () => {
            callCount++
          });
        }

        expect(flags.length).toEqual(0);
        expect(startCount).toEqual(0);
        expect(doneCount).toEqual(0);

        flushScheduler();

        expect(callCount).toEqual(totalCount);
        expect(flags.length).toEqual(2);
        expect(flags[0]).toEqual('start');
        expect(flags[1]).toEqual('done');
        expect(startCount).toEqual(1);
        expect(doneCount).toEqual(1);

        callCount = 0;
        flags = [];
        startCount = 0
        doneCount = 0;

        for (let i = 0; i < totalCount; i++) {
          scheduleWork(prio, null, () => {
            callCount++
          });
        }

        expect(flags.length).toEqual(0);
        expect(startCount).toEqual(0);
        expect(doneCount).toEqual(0);

        await waitUntilSchedulingDone();

        expect(flags.length).toEqual(2);
        expect(flags[0]).toEqual('start');
        expect(flags[1]).toEqual('done');
        expect(startCount).toEqual(1);
        expect(doneCount).toEqual(1);

        callCount = 0;
        flags = [];
        startCount = 0
        doneCount = 0;

        for (let i = 0; i < totalCount; i++) {
          scheduleWork(prio, null, () => {
            callCount++
          });
        }

        expect(flags.length).toEqual(0);
        expect(startCount).toEqual(0);
        expect(doneCount).toEqual(0);

        flushScheduler();

        expect(flags.length).toEqual(2);
        expect(flags[0]).toEqual('start');
        expect(flags[1]).toEqual('done');
        expect(startCount).toEqual(1);
        expect(doneCount).toEqual(1);

        subscription.unsubscribe();

      });
    }
  });

  describe('Testing priotity level 1.', () => {
    beforeEach(() => {
      initialNoopZoneTestingEnviroment();
    });
    afterEach(() => {
      disposeNoopZoneTestingEnviroment();
    });

    it('Should not be sync.', (done) => {

      setTimeout(() => {
        let sync = true;
        let workDone = false;
        scheduleWork(Priority.immediate, null, () => {
          workDone = true;
          expect(sync).toBeFalse();
          if (!sync) {
            done()
          }
        });
        sync = false
        if (workDone) {
          done();
        }
      }, 100)

    })
  });

  describe('Testing on stable hook', () => {
    beforeEach(() => {
      initialNoopZoneTestingEnviroment();
    });
    afterEach(() => {
      disposeNoopZoneTestingEnviroment();
    });

    it('Should run hooks in correct order.', async () => {
      let flags: string[] = [];
      const subscription = new Subscription();
      const prios = [1, 2, 3, 4, 5]
        .map((value) => ({ value, sortNumber: Math.random() }))
        .sort((a, b) => a.sortNumber - b.sortNumber)
        .map(({ value }) => value);

      let onDoneCb: (() => void) | null = null

      subscription.add(onSchedulerStart.subscribe(() => {
        flags.push('start');
      }));
      subscription.add(onSchedulerDone.subscribe(() => {
        flags.push('done');
        if (onDoneCb) {
          onDoneCb();
          onDoneCb = null;
        }
      }));
      subscription.add(onStable.subscribe(() => {
        flags.push('stable');
      }))

      for (let prio of prios) {
        scheduleWork(prio, null, () => flags.push('callback'));
      }

      await waitUntilSchedulingDone();

      expect(flags.length).toEqual(8);

      for (let index = 0; index < flags.length; index++) {
        if (index === 0) {
          expect(flags[index]).toEqual('start');
        } else if (index === 6) {
          expect(flags[index]).toEqual('done');
        } else if (index === 7) {
          expect(flags[index]).toEqual('stable');
        } else {
          expect(flags[index]).toEqual('callback');
        }
      }

      flags = [];

      for (let prio of prios) {
        scheduleWork(prio, null, () => flags.push('callback'));
      }

      flushScheduler();

      expect(flags.length).toEqual(8);

      for (let index = 0; index < flags.length; index++) {
        if (index === 0) {
          expect(flags[index]).toEqual('start');
        } else if (index === 6) {
          expect(flags[index]).toEqual('done');
        } else if (index === 7) {
          expect(flags[index]).toEqual('stable');
        } else {
          expect(flags[index]).toEqual('callback');
        }
      }

      flags = [];
      onDoneCb = () => {
        for (let prio of prios) {
          scheduleWork(prio, null, () => flags.push('callback'));
        }
      };
      for (let prio of prios) {
        scheduleWork(prio, null, () => flags.push('callback'));
      }

      await waitUntilSchedulingDone();

      expect(flags.length).toEqual(15);

      for (let index = 0; index < flags.length; index++) {
        if (index === 0 || index === 7) {
          expect(flags[index]).toEqual('start');
        } else if (index === 6 || index === 13) {
          expect(flags[index]).toEqual('done');
        } else if (index === 14) {
          expect(flags[index]).toEqual('stable');
        } else {
          expect(flags[index]).toEqual('callback');
        }
      }

      flags = [];
      onDoneCb = () => {
        for (let prio of prios) {
          scheduleWork(prio, null, () => flags.push('callback'));
        }
      };
      for (let prio of prios) {
        scheduleWork(prio, null, () => flags.push('callback'));
      }

      flushScheduler();

      expect(flags.length).toEqual(15);

      for (let index = 0; index < flags.length; index++) {
        if (index === 0 || index === 7) {
          expect(flags[index]).toEqual('start');
        } else if (index === 6 || index === 13) {
          expect(flags[index]).toEqual('done');
        } else if (index === 14) {
          expect(flags[index]).toEqual('stable');
        } else {
          expect(flags[index]).toEqual('callback');
        }
      }

      subscription.unsubscribe();
    });
  });

});
