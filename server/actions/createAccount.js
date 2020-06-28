const axios = require('axios');

function createAccount (state, chance) {
  const record = {
    email: chance.email(),
    password: 'Password@11111'
  };

  return axios({
    url: 'http://localhost:8001/v1/users',
    method: 'post',
    timeout: 5000,
    data: JSON.stringify(record)
  }).then(response => {
    return {
      record: response.data,
      message: 'successfully created account ' + record.email
    };
  }).catch(error => {
    return {
      record,
      error
    };
  });
}

module.exports = createAccount;
