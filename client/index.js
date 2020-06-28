const config = require('./config');
const app = require('./app')(config);

document.addEventListener('DOMContentLoaded', function () {
  require('./ui')(app, document.body);
});
