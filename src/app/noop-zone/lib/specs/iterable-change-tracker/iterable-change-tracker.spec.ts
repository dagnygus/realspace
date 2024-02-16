import { IterableChangeRecord } from "@angular/core";
import { DefaultIterableChangeTracker } from "../../core/src/iterable-change-trackers/default-iterable-change-tracker";
import { IterableChangeObserver } from "../../core/src/iterable-change-trackers/iterable-change-trackers";

const removeSeed = Math.round(8 * Math.random()) + 2;
const moveSeed = Math.round(8 * Math.random()) + 2;
const identitieChangeSeed = Math.round(8 * Math.random()) + 2;
const addSeed = Math.round(8 * Math.random()) + 2;

interface addFn<V> {
  (record: IterableChangeRecord<V>, index: number | undefined): void;
}

interface removeFn<V> {
  (record: IterableChangeRecord<V>, adjIndex: number): void;
}

interface moveFn<V> {
  (record: IterableChangeRecord<V>, adjPrevIndex: number, currentIndex: number, identityChange: boolean): void;
}

interface updateFn<V> {
  (record: IterableChangeRecord<V>, index: number): void;
}

interface nextFn<V> {
  (item: IterableChangeRecord<V>, index: number): void;
}

interface doneFn {
  (): void;
}


function createArray(): { id: number }[] {
  const length = Math.round(100 * Math.random()) + 100;
  const array: { id: number }[] = [];

  for (let i = 0; i < length; i++) {
    array.push({ id: i });
  }

  return array
}

function createArrayWithDuplicates(): object[] {

  const length = Math.round(100 * Math.random()) + 50;
  const array: { id: number }[] = [];

  for (let i = 0; i < length; i++) {
    array.push({ id: i });
  }

  let offset = Math.round(array.length * Math.random());

  while (offset < array.length) {
    const dupCount = Math.round(100 * array.length);
    for (let i = 0; i < dupCount; i++) {
      const item = array[offset];
      array.splice(offset, 0, item);
    }

    offset += Math.max(Math.round(100 * (array.length - offset / 2)), offset + dupCount + 1);
  }

  return array;
}

const noopFn = () => {};

function createObserver<V>(
  onAdd: addFn<V> | null = null,
  onRemove: removeFn<V> | null = null,
  onMove: moveFn<V> | null = null,
  onUpdate: updateFn<V> | null = null,
  onIterate: nextFn<V> | null = null,
  onDone: doneFn | null = null,
): IterableChangeObserver<V> {

  onAdd = onAdd || noopFn;
  onRemove = onRemove || noopFn;
  onMove = onMove || noopFn;
  onUpdate = onUpdate || noopFn;
  onIterate = onIterate || noopFn;
  onDone = onDone || noopFn;

  return {
    onAdd,
    onRemove,
    onMove,
    onUpdate,
    onIterate,
    onDone
  }
}

function getRandomBooleanValue(seed: number) {
  seed--
  seed = Math.max(seed, 0);
  return Math.round(seed * Math.random()) === seed;
}

function randomRemoveItems(array: object[], seed: number): number {
  if (array.length < 1) { return 0; }
  const oldLength = array.length;
  let copy = array.slice();


  // let offset = 0;
  // const indexes: number[] = []
  for (let i = 0; i < array.length; i++) {
    if (getRandomBooleanValue(seed)) {
      // indexes.push(i);
      copy[i] = null!;
    }
  }

  copy = copy.filter((item) => item != null);

  // indexes.forEach((index) => {
  //   array.splice(index + offset, 1);
  //   offset--;
  // });

  array.splice(0);

  copy.forEach((item) => {
    array.push(item);
  })

  return oldLength - array.length;
}

function randomMoveItems(array: object[], moveSeed: number): void {
  const skip = Math.round((array.length / 3) * Math.random());
  for (let i = array.length - 1; i >= skip; i--) {
    if (getRandomBooleanValue(moveSeed)) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
}
}

function randomChangeIdentites(array: object[], seed: number): number;
function randomChangeIdentites(array: object[], subset: object[] | number, seed: number): number;
function randomChangeIdentites(array: object[], subsetOrSeed: object[] | number, seed?: number): number {
  if (array.length < 1) { return 0; }
  let changeCount = 0;
  let subset: object[] = null!;
  let localSeed = 0;
  if (Array.isArray(subsetOrSeed)) {
    subset = subset;
    localSeed = seed!
  } else {
    localSeed = subsetOrSeed
  }

  if (subset!) {

    subset.forEach((item) => {
      if (getRandomBooleanValue(localSeed)) {
        const index = array.indexOf(item);
        if (index > -1) {
          array[index] = Object.assign({}, item);
          changeCount++
        }
      }
    })

  } else {
    for (let index = 0; index < array.length; index++) {
      if (getRandomBooleanValue(localSeed)) {
        array[index] = Object.assign({}, array[index]);
        changeCount++
      }
    }
  }

  return changeCount;
}

function randomInsertItemsWithIds(array: { id: number }[], startingId: number, seed: number): number {
  const oldLength = array.length
  let id = startingId;

  for (let i = 0; i <= array.length; i++) {
    if (getRandomBooleanValue(seed)) {
      const insertCount = Math.round(20 * Math.random()) + 1;
      for (let j = 0; j < insertCount; j++) {
        if (i === array.length) {
          array.push({ id });
        } else {
          array.splice(i, 0, { id });
        }
        id++;
      }
      i += insertCount;
    }
  }

  return array.length - oldLength;
}

function randomInsertItems(array: object[], seed: number): number {
  const oldLength = array.length

  for (let i = 0; i <= array.length; i++) {
    if (getRandomBooleanValue(seed)) {
      const insertCount = Math.round(20 * Math.random()) + 1;
      for (let j = 0; j < insertCount; j++) {
        if (i === array.length) {
          array.push({ });
        } else {
          array.splice(i, 0, { });
        }
      }
      i += insertCount;
    }
  }

  return array.length - oldLength;
}

describe('Testing DefaultIterableChangeTracker with TrackByFunction', () => {

  describe('Removing items from array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<{ id: number }>((_, item) => item.id);
      const array = createArray();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      let identityChangeCount = 0
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record, _1, _2, changed) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          if (changed) {
            identityChangeCount++
          }
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          identityChangeCount++
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      const expectedRemoveCount = randomRemoveItems(array, removeSeed);

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount;
      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(removeCount).toEqual(expectedRemoveCount);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();
    });
  });

  describe('Movig items in array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<{ id: number }>((_, item) => item.id);
      const array = createArray();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      let identityChangeCount = 0
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record, _1, _2, changed) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          if (changed) {
            identityChangeCount++
          }
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          identityChangeCount++
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      randomMoveItems(array, moveSeed);

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount;
      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();

    });
  });

  describe('Inserting items in to array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<{ id: number }>((_, item) => item.id);
      const array = createArray();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      let identityChangeCount = 0;
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record, _1, _2, changed) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          if (changed) {
            identityChangeCount++
          }
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          identityChangeCount++
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      const expectedAddCount = randomInsertItemsWithIds(array, array.length, addSeed);

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount + addCount;

      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length)
      expect(addCount).toEqual(expectedAddCount);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();

    });
  });

  describe('Updating items in to array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<{ id: number }>((_, item) => item.id);
      const array = createArray();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      let identityChangeCount = 0;
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record, _1, _2, changed) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          if (changed) {
            identityChangeCount++
          }
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          identityChangeCount++
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }


      const expectedUpdateCount = randomChangeIdentites(array, identitieChangeSeed)

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount + addCount;

      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(updateCount).toEqual(expectedUpdateCount);
      expect(identityChangeCount).toEqual(expectedUpdateCount);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();

    });
  });

  describe('Removing and adding items in to array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<{ id: number }>((_, item) => item.id);
      const array = createArray();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      let identityChangeCount = 0;
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record, _1, _2, changed) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          if (changed) {
            identityChangeCount++;
          }
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          identityChangeCount++;
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      const expectedRemoveCount = randomRemoveItems(array, removeSeed);
      const expectedAddCount = randomInsertItemsWithIds(array, prevLength, addSeed);

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount + addCount;

      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(removeCount).toEqual(expectedRemoveCount);
      expect(addCount).toEqual(expectedAddCount);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();
    });
  });

  describe('Removing and moving items in array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<{ id: number }>((_, item) => item.id);
      const array = createArray();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      let identityChangeCount = 0;
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record, _1, _2, changed) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          if (changed) {
            identityChangeCount++
          }
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          identityChangeCount++
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      const expectedRemoveCount = randomRemoveItems(array, removeSeed);
      randomMoveItems(array, moveSeed);

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount + addCount;

      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(removeCount).toEqual(expectedRemoveCount);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();
    });
  });

  describe('Removing and updating items in array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<{ id: number }>((_, item) => item.id);
      const array = createArray();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      let identityChangeCount = 0;
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record, _1, _2, changed) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          if (changed) {
            identityChangeCount++
          }
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          identityChangeCount++;
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      const expectedRemoveCount = randomRemoveItems(array, removeSeed);
      const expectedUpdateCount = randomChangeIdentites(array, identitieChangeSeed);

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount + addCount;

      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(removeCount).toEqual(expectedRemoveCount);
      expect(updateCount).toEqual(expectedUpdateCount);
      expect(identityChangeCount).toEqual(expectedUpdateCount);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();
    });
  });

  describe('Removing, adding, moving items in array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<{ id: number }>((_, item) => item.id);
      const array = createArray();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = [];
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      let idendityChangeCount = 0;
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record, _1, _2, changed) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          if (changed) {
            idendityChangeCount++;
          }
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          idendityChangeCount++;
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      const expectedRemoveCount = randomRemoveItems(array, removeSeed);
      randomMoveItems(array, moveSeed);
      const expectedAddCount = randomInsertItemsWithIds(array, prevLength, addSeed)

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount + addCount;

      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(removeCount).toEqual(expectedRemoveCount);
      expect(addCount).toEqual(expectedAddCount);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();
    });
  });

  describe('Removing, adding, moving and updating items in array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<{ id: number }>((_, item) => item.id);
      const array = createArray();
      const testArray: any[] = [];
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let identityChangeCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;

      const changeObeserver = createObserver<{ id: number }>(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record, _1, _2, changed) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          if (changed) {
            identityChangeCount++;
          }
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          identityChangeCount++
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      const expectedRemoveCount = randomRemoveItems(array, removeSeed);
      randomMoveItems(array, identitieChangeSeed);
      const expectedIdentityChangeCount = randomChangeIdentites(array, identitieChangeSeed)
      const expectedAddCount = randomInsertItemsWithIds(array, prevLength, addSeed)

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount + addCount;

      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(removeCount).toEqual(expectedRemoveCount);
      expect(addCount).toEqual(expectedAddCount);
      expect(identityChangeCount).toEqual(expectedIdentityChangeCount);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();
    });
  });

  describe('Changing identities and then moving items in to array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<{ id: number }>((_, item) => item.id);
      const array = createArray();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      let identityChangeCount = 0;
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record, _1, _2, changed) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          moveCount++;
          if (changed) {
            identityChangeCount++;
          }
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          updateCount++
          identityChangeCount++;
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      const expectedIdentityChangeCount = randomChangeIdentites(array, identitieChangeSeed);
      randomMoveItems(array, moveSeed);

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount;
      expect(array.length).toEqual(expectedLength);
      expect(identityChangeCount).toEqual(expectedIdentityChangeCount)
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();

    });
  });

});


describe('Testing DefaultIterableChangeTracker for collection with duplicates', () => {

  describe('Removing items from array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<object>();
      const array = createArrayWithDuplicates();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      const expectedRemoveCount = randomRemoveItems(array, removeSeed);

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount;
      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(removeCount).toEqual(expectedRemoveCount);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();
    });
  });

  describe('Movig items in array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<object>();
      const array = createArrayWithDuplicates();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      randomMoveItems(array, moveSeed);

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount;
      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();
    });
  });

  describe('Inserting items in to array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<object>();
      const array = createArrayWithDuplicates();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      const expectedAddCount = randomInsertItems(array, addSeed);

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount + addCount;

      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(addCount).toEqual(expectedAddCount);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();

    });
  });

  describe('Removing and adding items in to array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<object>();
      const array = createArrayWithDuplicates();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      const expectedRemoveCount = randomRemoveItems(array, removeSeed);
      const expectedAddCount = randomInsertItems(array, addSeed);//

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount + addCount;

      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(addCount - expectedAddCount).toEqual(removeCount - expectedRemoveCount);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();
    });
  });

  describe('Removing and moving items in array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<object>();
      const array = createArrayWithDuplicates();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      const expectedRemoveCount = randomRemoveItems(array, removeSeed);
      randomMoveItems(array, moveSeed);

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount + addCount;

      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(removeCount).toEqual(expectedRemoveCount);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();
    });
  });

  describe('Removing, adding, moving items in array', () => {
    it('', () => {
      const tracker = new DefaultIterableChangeTracker<object>();
      const array = createArrayWithDuplicates();
      const testArray: any[] = []
      const prevLength = array.length;
      const removedIndexes: number[] = []
      let addCount = 0;
      let moveCount = 0;
      let updateCount = 0;
      let removeCount = 0;
      let doneCount = 0;
      let iterateCount = 0;
      const changeObeserver = createObserver(
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          addCount++
        },
        ({ previousIndex }) => {
          removedIndexes.push(previousIndex!)
          expect(doneCount).toEqual(0);
          removeCount++;
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          moveCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          updateCount++
        },
        (record) => {
          testArray.push(record.item);
          expect(doneCount).toEqual(0);
          iterateCount++
        },
        () => { doneCount++; }
      );

      if(!tracker.findChanges(array)) {
        return;
      }

      const expectedRemoveCount = randomRemoveItems(array, removeSeed);
      randomMoveItems(array, moveSeed);
      const expectedAddCount = randomInsertItems(array, addSeed)

      if(!tracker.findChanges(array)) { return; }
      tracker.applyChanges(changeObeserver);

      const expectedLength = moveCount + iterateCount + updateCount + addCount;

      expect(array.length).toEqual(expectedLength);
      expect(prevLength + addCount - removeCount).toEqual(array.length);
      expect(addCount - expectedAddCount).toEqual(removeCount - expectedRemoveCount);
      expect(doneCount).toEqual(1);

      for (let i = 1; i < removedIndexes.length; i++) {
        expect(removedIndexes[i - 1] < removedIndexes[i]).toBeTrue();
      }

      expect(tracker.findChanges(testArray)).toBeFalse();
    });
  });
});
