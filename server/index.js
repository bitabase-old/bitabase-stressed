const http = require('http');
const rqlite = require('rqlite-fp');

const WebSocket = require('ws');
const Chance = require('chance');
const finalStream = require('final-stream');

const chance = new Chance();

const createAccount = require('./actions/createAccount');
const createSession = require('./actions/createSession');
const createDatabase = require('./actions/createDatabase');
const createCollection = require('./actions/createCollection');
const createRecord = require('./actions/createRecord');

const state = {
  connection: null,

  actions: [{
    method: createAccount,
    type: 'account:create',
    runs: [],
    runTimes: {},
    runsInBatch: 0,
    success: 0,
    failed: 0,
    lastError: null,
    lastSuccess: null,
    lastRecord: null
  }, {
    method: createSession,
    type: 'session:create',
    runs: [],
    runTimes: {},
    runsInBatch: 0,
    success: 0,
    failed: 0,
    lastError: null,
    lastSuccess: null,
    lastRecord: null
  }, {
    method: createDatabase,
    type: 'database:create',
    runs: [],
    runTimes: {},
    runsInBatch: 0,
    success: 0,
    failed: 0,
    lastError: null,
    lastSuccess: null,
    lastRecord: null
  }, {
    method: createCollection,
    type: 'collection:create',
    runs: [],
    runTimes: {},
    runsInBatch: 0,
    success: 0,
    failed: 0,
    lastError: null,
    lastSuccess: null,
    lastRecord: null
  }, {
    method: createRecord,
    type: 'record:create',
    runs: [],
    runTimes: {},
    runsInBatch: 0,
    success: 0,
    failed: 0,
    lastError: null,
    lastSuccess: null,
    lastRecord: null
  }]
};

rqlite.connect('http://localhost:4001', function (error, connection) {
  if (error) {
    throw error;
  }

  state.connection = connection;
});

const server = http.createServer(function (request, response) {
  if (request.method === 'get') {
    response.writeHead(404);
    response.end('not found');
    return;
  }

  finalStream(request, function (error, body) {
    if (error) {
      console.log(error);
      return response.end('error');
    }
    const data = JSON.parse(body);

    const actionType = request.url.split('/')[2];
    const action = state.actions.find(action => action.type === actionType);

    action.runsInBatch = data.runsInBatch || action.runsInBatch;

    response.writeHead(200);
    response.end(JSON.stringify(action));
  });
});
const wss = new WebSocket.Server({ server });

const startTime = Date.now();
setInterval(() => {
  if (!state.connection) {
    return console.log('no connection yet');
  }

  state.actions.forEach(action => {
    for (let i = 0; i < action.runsInBatch; i++) {
      const promise = action.method(state, chance)
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
  });
}, 1000);

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
  }, 60);

  ws.on('close', function () {
    clearTimeout(timer);
  });
});

server.listen(3001);
