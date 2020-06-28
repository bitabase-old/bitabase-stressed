const { promisify } = require('util');

const axios = require('axios');
const rqlite = require('rqlite-fp');
const getOne = promisify(rqlite.getOne);

async function createSession (state, chance) {
  const user = await getOne(state.connection, 'SELECT email FROM users ORDER BY RANDOM() LIMIT 1');

  if (!user) {
    return {
      error: 'could not send createSession as no users exist'
    };
  }

  const record = {
    email: user.email,
    password: 'Password@11111'
  };

  return axios({
    url: 'http://localhost:8001/v1/sessions',
    method: 'post',
    timeout: 5000,
    data: JSON.stringify(record)
  }).then(response => {
    return {
      record: response.data,
      message: 'successfully created session ' + record.id
    };
  }).catch(error => {
    return {
      record,
      error
    };
  });
}

module.exports = createSession;
