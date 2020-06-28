const menu = require('../components/menu');

function createInput (html, value, onChange) {
  function create (el) {
    el.dom.addEventListener('input', function () {
      onChange(el.dom.value);
    });
    el.dom.value = value;
  }

  function update (el) {
    if (document.activeElement !== el.dom) {
      el.dom.value = value;
    }
  }

  return html`
    <input oncreate=${create} onupdate=${update} />
  `;
}

function getAverages (object) {
  const values = Object.values(object);
  const sum = values.reduce((a, b) => a + b, 0);
  const average = (sum / values.length) || 0;
  return parseInt(average);
}

module.exports = function (app, html) {
  if (!app.state.stats) {
    return;
  }

  return html`
    <main>
      ${menu(app, html)}
      
      <section>
        <h1>Stats</h1>
        <table>
          <thead>
            <th>Name</th>
            <th>Runs in Batch</th>
            <th>Active Runs</th>
            <th>Per Second</th>
            <th>Successes</th>
            <th>Failures</th>
            <th>Last Error</th>
          </thead>
          <tbody>
          ${app.state.stats.actions.map(action => html`
            <tr>
              <td>${action.type}</td>
              <td>${createInput(html, action.runsInBatch, newValue => app.changeRunsInBatch(action, newValue))}</td>
              <td>${action.activeRuns}</td>
              <td>${getAverages(action.runTimes)}</td>
              <td>${action.success}</td>
              <td>${action.failed}</td>
              <td>${action.lastError}</td>
            </tr>
         `)}
        </tbody>
        </table>
      </section>
    </main>
  `;
};
