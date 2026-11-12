const RN = require('react-native');

const polyfillInteractionManager = {
  runAfterInteractions: (task) => {
    if (typeof task === 'function') {
      setTimeout(task, 0);
    }
    return { cancel: () => {} };
  },
  createInteractionHandle: () => 1,
  clearInteractionHandle: () => {},
  setDeadline: () => {},
  addListener: () => ({ remove: () => {} }),
};

try {
  Object.defineProperty(RN, 'InteractionManager', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: polyfillInteractionManager,
  });
} catch (e) {
  console.warn('[Polyfill] Falha ao definir InteractionManager:', e);
}

module.exports = polyfillInteractionManager;
