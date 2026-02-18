/**
 * Majority Rules – Student client (solved)
 * All fetch() calls implemented using .then() / .catch() only.
 */

// Instructor's backend. Use window.location.origin when serving this app from the same server.
var origin = window.location.origin;
var API_BASE = (origin && origin !== 'null') ? origin : 'https://unpopulously-ungrimed-pilar.ngrok-free.dev';
// Required when API_BASE is an ngrok URL (bypasses interstitial). Included in all fetch() calls.
var NGROK_HEADER = { 'ngrok-skip-browser-warning': '1' };

let playerId = null;
let playerName = null;
let pollInterval = null;
let currentRoundId = null;

// -----------------------------------------------------------------------------
// joinGame()
// -----------------------------------------------------------------------------
function joinGame(name) {
  fetch(API_BASE + '/api/join', {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, NGROK_HEADER),
    body: JSON.stringify({ name: name }),
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (response.ok && data.player_id) {
          playerId = data.player_id;
          playerName = data.name;
          onJoined();
          startPolling();
        } else {
          showJoinError(data.error || 'Join failed');
        }
      });
    })
    .catch(function (err) {
      showJoinError(err.message || 'Join failed');
    });
}

function onJoined() {
  document.getElementById('join-section').hidden = true;
  document.getElementById('game-section').hidden = false;
  document.getElementById('join-status').textContent = 'Joined as ' + playerName;
  document.getElementById('join-status').className = 'status';
}

function showJoinError(message) {
  const el = document.getElementById('join-status');
  el.textContent = message;
  el.className = 'status error';
}

// -----------------------------------------------------------------------------
// pollState()
// -----------------------------------------------------------------------------
function pollState() {
  fetch(API_BASE + '/api/state', { headers: NGROK_HEADER })
    .then(function (response) {
      return response.text().then(function (text) {
        var data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.warn('pollState: server returned non-JSON (status ' + response.status + '). First 300 chars:', text.slice(0, 300));
          if (text.indexOf('ngrok') !== -1) {
            throw new Error('Ngrok interstitial: API request got the warning page. Open ' + API_BASE + '/api/state in this tab, click through if needed, then refresh the app.');
          }
          throw new Error('Server returned non-JSON. Check console for response body.');
        }
        if (!response.ok) {
          throw new Error(data.error || 'Request failed');
        }
        return data;
      });
    })
    .then(function (data) {
      currentRoundId = data.round_id;

      document.getElementById('phase-display').textContent =
        'Phase: ' + data.phase + '  Round ' + data.round_id + '/' + data.round_total;
      document.getElementById('prompt-display').textContent = data.prompt || '—';

      document.getElementById('answer-area').hidden = data.phase !== 'ANSWER';
      document.getElementById('guess-area').hidden = data.phase !== 'GUESS';
      document.getElementById('results-area').hidden = data.phase !== 'RESULTS';
    })
    .catch(function (err) {
      document.getElementById('phase-display').textContent = err.message || 'Could not load state';
      document.getElementById('phase-display').title = err.message || '';
      console.warn('pollState failed:', err);
    });
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollState();
  pollInterval = setInterval(pollState, 2000);
}

// -----------------------------------------------------------------------------
// submitAnswer()
// -----------------------------------------------------------------------------
function submitAnswer() {
  const answer = document.getElementById('answer').value.trim();
  if (!answer) return;
  const statusEl = document.getElementById('answer-status');

  fetch(API_BASE + '/api/answer', {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, NGROK_HEADER),
    body: JSON.stringify({
      player_id: playerId,
      round_id: currentRoundId,
      answer: answer,
    }),
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (response.ok) {
          document.getElementById('answer').value = '';
          statusEl.textContent = 'Answer submitted';
          statusEl.className = 'status';
        } else {
          statusEl.textContent = data.error || 'Submit failed';
          statusEl.className = 'status error';
        }
      });
    })
    .catch(function (err) {
      statusEl.textContent = err.message || 'Submit failed';
      statusEl.className = 'status error';
    });
}

// -----------------------------------------------------------------------------
// submitGuess()
// -----------------------------------------------------------------------------
function submitGuess() {
  const guess = document.getElementById('guess').value.trim();
  if (!guess) return;
  const statusEl = document.getElementById('guess-status');

  fetch(API_BASE + '/api/guess', {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, NGROK_HEADER),
    body: JSON.stringify({
      player_id: playerId,
      round_id: currentRoundId,
      guess: guess,
    }),
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (response.ok) {
          document.getElementById('guess').value = '';
          statusEl.textContent = 'Guess submitted';
          statusEl.className = 'status';
        } else {
          statusEl.textContent = data.error || 'Submit failed';
          statusEl.className = 'status error';
        }
      });
    })
    .catch(function (err) {
      statusEl.textContent = err.message || 'Submit failed';
      statusEl.className = 'status error';
    });
}

// -----------------------------------------------------------------------------
// fetchResults()
// -----------------------------------------------------------------------------
function fetchResults() {
  const resultsEl = document.getElementById('results');

  fetch(API_BASE + '/api/results?round_id=' + currentRoundId, { headers: NGROK_HEADER })
    .then(function (response) {
      return response.json().then(function (data) {
        if (response.ok) {
          resultsEl.textContent = JSON.stringify(data, null, 2);
        } else {
          resultsEl.textContent = data.error || 'Results not available yet.';
        }
      });
    })
    .catch(function (err) {
      resultsEl.textContent = err.message || 'Could not load results.';
    });
}

// -----------------------------------------------------------------------------
// UI wiring
// -----------------------------------------------------------------------------
document.getElementById('btn-join').addEventListener('click', function () {
  const name = document.getElementById('name').value.trim();
  if (!name) {
    showJoinError('Enter your name');
    return;
  }
  joinGame(name);
});

document.getElementById('btn-submit-answer').addEventListener('click', submitAnswer);
document.getElementById('btn-submit-guess').addEventListener('click', submitGuess);
document.getElementById('btn-fetch-results').addEventListener('click', fetchResults);

if (window.location.protocol === 'file:') {
  document.getElementById('file-warning').style.display = 'block';
}
