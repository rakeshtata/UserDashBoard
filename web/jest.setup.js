import '@testing-library/jest-dom';

// Ant Design v5+ requires MessageChannel in JSDOM
class MessageChannel {
  constructor() {
    this.port1 = { postMessage: () => {} };
    this.port2 = { postMessage: () => {} };
  }
}
global.MessageChannel = MessageChannel;

// Ant Design often requires matchMedia
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};
