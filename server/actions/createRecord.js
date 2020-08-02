const { promisify } = require('util');

const axios = require('axios');
const rqlite = require('rqlite-fp');
const getOne = promisify(rqlite.getOne);

async function createRecord (config, state, chance) {
  const collection = await getOne(state.connection, `
    SELECT collections.id as id,
           collections.name as name,
           databases.id as databaseId, 
           databases.name as databaseName,
           sessions.id as sessionId,
           sessions.secret as sessionSecret
    FROM collections
    LEFT JOIN databases ON databases.id = collections.database_id
    LEFT JOIN database_users ON database_users.database_id = databases.id
    LEFT JOIN users ON users.id = database_users.user_id
    LEFT JOIN sessions ON sessions.user_id = users.id
    ORDER BY RANDOM()
    LIMIT 1
  `);

  if (!collection) {
    return {
      error: 'could not send createRecord as no databases, collection, user and session match exists'
    };
  }

  const record = {
    testField: chance.sentence({ words: 4 }).replace(/ /g, '-').replace(/\./g, '')
  };

  return axios({
    url: `http://${config.remoteServerIp}:8002/${collection.name}`,
    headers: {
      host: `${collection.databaseName}.bitabase.test`
    },
    method: 'post',
    timeout: 5000,
    data: JSON.stringify(record)
  }).then(response => {
    return {
      record: response.data,
      message: 'successfully created record ' + record.id
    };
  }).catch(error => {
    console.log(error.response ? error.response.data : error);
    return {
      record,
      error
    };
  });
}

module.exports = createRecord;
