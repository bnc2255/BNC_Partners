import test from 'node:test';
import assert from 'node:assert/strict';
import { runFollowUpBatch } from '../src/crm/followUpBatch.js';

test('bulk operations keep personalised results and isolate recipient failures', async () => {
  let active = 0;
  let peak = 0;
  const completed = [];
  const attempts = [];
  const results = await runFollowUpBatch(['one', 'two', 'three', 'four', 'five'], async recipient => {
    attempts.push(recipient);
    active++; peak = Math.max(peak, active);
    await new Promise(resolve => setTimeout(resolve, 5));
    active--;
    if (recipient === 'two') throw new Error('Provider rejected this recipient');
    return { recipient, html: `Email for ${recipient}` };
  }, result => completed.push(result), 3);
  assert.equal(peak, 3);
  assert.equal(completed.length, 5);
  assert.equal(attempts.filter(id => id === 'two').length, 1);
  assert.equal(results[1].status, 'rejected');
  assert.equal(results[4].value.html, 'Email for five');
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 4);
});

test('an empty selection makes no requests', async () => {
  const result = await runFollowUpBatch([], () => assert.fail('No recipient should be processed'));
  assert.deepEqual(result, []);
});
