const { promisify } = require('util');

const axios = require('axios');
const rqlite = require('rqlite-fp');
const getOne = promisify(rqlite.getOne);

async function createDatabase (config, state, chance) {
  const session = await getOne(state.connection, 'SELECT id, secret FROM sessions ORDER BY RANDOM() LIMIT 1');

  if (!session) {
    return {
      error: 'could not send createDatabase as no sessions exist'
    };
  }

  const record = {
    name: chance.sentence({ words: 4 }).replace(/ /g, '-').replace(/\./g, '')
  };

  return axios({
    url: 'http://' + config.remoteServerIp + ':8001/v1/databases',
    method: 'post',
    headers: {
      'x-session-id': session.id,
      'x-session-secret': session.secret
    },
    timeout: 5000,
    data: JSON.stringify(record)
  }).then(response => {
    return {
      record: response.data,
      message: 'successfully created database ' + record.id
    };
  }).catch(error => {
    return {
      record,
      error
    };
  });
}

module.exports = createDatabase;
