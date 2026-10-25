const test = require('node:test');
const assert = require('node:assert/strict');
const { hasDisplayGeometryChanged } = require('./display-policy.cjs');

test('Dock/menu bar work-area changes never trigger a fullscreen refit', () => {
  assert.equal(hasDisplayGeometryChanged(['workArea']), false);
  assert.equal(hasDisplayGeometryChanged([]), false);
});

test('real resolution, rotation, and display scaling changes trigger a refit', () => {
  for (const metric of ['bounds', 'rotation', 'scaleFactor']) {
    assert.equal(hasDisplayGeometryChanged([metric]), true);
    assert.equal(hasDisplayGeometryChanged(['workArea', metric]), true);
  }
});
