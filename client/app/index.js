const EventEmitter = require('events');
const routemeup = require('routemeup');
const WebSocket = require('reconnecting-websocket');

const routes = {
  '/': () => 'home'
};

module.exports = function (config) {
  const eventEmitter = new EventEmitter();

  const state = {
  };

  const socket = new WebSocket('ws://localhost:3001', [], {
    minReconnectionDelay: 500,
    reconnectionDelayGrowFactor: 1
  });

  // socket.addEventListener('open', function (event) {
  //   socket.send('Hello Server!');
  // });

  socket.addEventListener('message', function (event) {
    state.stats = JSON.parse(event.data);
    eventEmitter.emit('stateChanged');
  });

  function changeUrl () {
    const route = routemeup(routes, { url: window.location.pathname });

    state.page = route ? route.controller() : 'notFound';
    state.tokens = route ? route.tokens : {};

    eventEmitter.emit('stateChanged', { force: true });
  }

  function emitStateChanged () {
    eventEmitter.emit('stateChanged');
  }

  return {
    state,
    emitStateChanged,

    changeUrl,

    on: eventEmitter.addListener.bind(eventEmitter),
    off: eventEmitter.removeListener.bind(eventEmitter)
  };
};
