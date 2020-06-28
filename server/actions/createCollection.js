const { promisify } = require('util');

const axios = require('axios');
const rqlite = require('rqlite-fp');
const getOne = promisify(rqlite.getOne);

async function createCollection (state, chance) {
  const database = await getOne(state.connection, `
    SELECT databases.id as id, 
           databases.name as name,
           sessions.id as sessionId,
           sessions.secret as sessionSecret
    FROM databases
    LEFT JOIN database_users ON database_users.database_id = databases.id
    LEFT JOIN users ON users.id = database_users.user_id
    LEFT JOIN sessions ON sessions.user_id = users.id
    ORDER BY RANDOM()
    LIMIT 1
  `);

  if (!database) {
    return {
      error: 'could not send createCollection as no databases, user and session match exists'
    };
  }

  const record = {
    name: chance.sentence({ words: 4 }).replace(/ /g, '-').replace(/\./g, '')
  };

  return axios({
    url: `http://localhost:8001/v1/databases/${database.name}/collections`,
    method: 'post',
    headers: {
      'x-session-id': database.sessionId,
      'x-session-secret': database.sessionSecret
    },
    timeout: 5000,
    data: JSON.stringify(record)
  }).then(response => {
    return {
      record: response.data,
      message: 'successfully created collection ' + record.id
    };
  }).catch(error => {
    console.log(error.response.data);
    return {
      record,
      error
    };
  });
}

module.exports = createCollection;
