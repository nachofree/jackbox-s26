/**
 * Majority Rules – Student client (solved)
 * All fetch() calls implemented using .then() / .catch() only.
 */

const API_BASE = "http://localhost:5001";

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
    headers: { 'Content-Type': 'application/json' },
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
  fetch(API_BASE + '/api/state')
    .then(function (response) {
      return response.json();
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
    .catch(function () {
      document.getElementById('phase-display').textContent = 'Could not load state';
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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

  fetch(API_BASE + '/api/results?round_id=' + currentRoundId)
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
