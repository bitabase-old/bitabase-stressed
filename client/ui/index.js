const minthril = require('minthril');
const html = require('hyperx')(minthril);
const pushStateAnchors = require('spath/pushStateAnchors');
require('./modules/onUrlChange');

const pages = {
  home: require('./pages/home'),
  notFound: require('./pages/notFound')
};

module.exports = function (app, container) {
  document.addEventListener('click', pushStateAnchors);
  window.addEventListener('locationchange', app.changeUrl);
  app.changeUrl();

  function render (data) {
    if (data && data.force) {
      minthril.render(container, '');
    }

    if (!app.state.page) {
      return;
    }

    const page = pages[app.state.page] || pages.notFound;

    const content = page(app, html);
    minthril.render(container, content);
  }

  app.on('stateChanged', render);
  render();
};
