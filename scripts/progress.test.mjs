import test from 'node:test';
import assert from 'node:assert/strict';
import { useProgressStore } from '../src/store/progressStore.ts';
import { assess } from '../src/lib/labs/assessment.ts';

test('lifetime best scores survive 200-history trimming, rehydration and v1 migration', async () => {
  const store = useProgressStore;
  store.setState({ attempts: [], best: [] });
  store.getState().record(assess('assembly', 1, 50));
  for (let i = 0; i < 205; i++) store.getState().record(assess('algorithm:bubble', 0, 2));
  assert.equal(store.getState().attempts.length, 200);
  assert.equal(store.getState().best.find(a => a.exercise === 'assembly').score, 100);
  await store.persist.rehydrate();
  assert.equal(store.getState().best.find(a => a.exercise === 'assembly').score, 100);

  const options = store.persist.getOptions();
  await options.storage.setItem(options.name, {
    version: 1,
    state: { attempts: [assess('logic:and', 1, 10), { exercise: 'invalid', score: 500 }] },
  });
  await store.persist.rehydrate();
  assert.equal(store.getState().attempts.length, 1);
  assert.equal(store.getState().best[0].exercise, 'logic:and');
  assert.equal(store.getState().best[0].score, 100);
  assert.equal((await options.storage.getItem(options.name)).version, 2);
});
