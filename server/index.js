const http = require('http');

const WebSocket = require('ws');
const Chance = require('chance');
const chance = new Chance();

const createAccount = require('./actions/createAccount');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const state = {
  actions: [{
    type: 'account:create',
    runs: [],
    runTimes: {},
    runsInBatch: 50,
    success: 0,
    failed: 0,
    lastError: null,
    lastSuccess: null,
    lastRecord: null
  }]
};

const startTime = Date.now();
setInterval(() => {
  const action = state.actions.find(action => action.type === 'account:create');

  for (let i = 0; i < action.runsInBatch; i++) {
    const promise = createAccount(chance)
      .then(result => {
        action.runs.splice(action.runs.indexOf(promise), 1);
        const secondGroup = parseInt((Date.now() - startTime) / 1000);
        action.runTimes[secondGroup] = action.runTimes[secondGroup] ? action.runTimes[secondGroup] + 1 : 1;

        if (result.error) {
          action.failed = action.failed + 1;
          action.lastError = result.error.message;
          action.lastRecord = result.record;
          return;
        }

        action.success = action.success + 1;
        action.lastSuccess = result.message;
        action.lastRecord = result.record;
      });

    action.runs.push({
      promise,
      timeStarted: Date.now()
    });
  }
}, 250);

wss.on('connection', function connection (ws) {
  ws.on('message', function incoming (message) {
    console.log('received: %s', message);
  });

  const timer = setInterval(() => {
    ws.send(JSON.stringify({
      actions: state.actions.map(action => ({
        type: action.type,
        activeRuns: action.runs.length,
        runsInBatch: action.runsInBatch,
        runTimes: action.runTimes,
        success: action.success,
        failed: action.failed,
        lastError: action.lastError,
        lastSuccess: action.lastSuccess,
        lastRecord: action.lastRecord
      }))
    }));

    ws.on('close', function () {
      clearTimeout(timer);
    });
  }, 60);
});

server.listen(3001);
