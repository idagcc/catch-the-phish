function hasDisplayGeometryChanged(changedMetrics) {
  return changedMetrics.some(metric => ['bounds', 'rotation', 'scaleFactor'].includes(metric));
}

module.exports = { hasDisplayGeometryChanged };
