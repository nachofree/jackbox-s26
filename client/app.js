/**
 * Majority Rules – Student client
 * Complete the TODO blocks by implementing fetch() calls to the API.
 * Use the API_BASE constant; do not hardcode localhost elsewhere.
 */

// Base URL for the API. Use this for all requests (e.g. API_BASE + '/api/join').
const API_BASE = window.location.origin;

// -----------------------------------------------------------------------------
// State (set after join)
// -----------------------------------------------------------------------------
let playerId = null;
let playerName = null;
let pollInterval = null;

// -----------------------------------------------------------------------------
// TODO: Implement joinGame()
// POST /api/join with body: { "name": "..." }
// On success: store player_id and name, then call onJoined() and start polling.
// On error: call showJoinError(message).
// -----------------------------------------------------------------------------
async function joinGame(name) {
  // TODO: use fetch() to POST to API_BASE + '/api/join'
  // Body: JSON.stringify({ name: name })
  // Headers: { 'Content-Type': 'application/json' }
  // Parse response with .json(), check for player_id, then:
  //   playerId = data.player_id;
  //   playerName = data.name;
  //   onJoined();
  //   startPolling();
  // On error response (e.g. !response.ok), read JSON and call showJoinError(data.error || 'Join failed');
  throw new Error('TODO: implement joinGame()');
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
// TODO: Implement pollState()
// GET /api/state – returns phase, round_id, round_total, prompt, etc.
// Update the UI: phase display, prompt display, show/hide answer/guess/results areas.
// -----------------------------------------------------------------------------
async function pollState() {
  // TODO: use fetch() to GET API_BASE + '/api/state'
  // Parse JSON, then update:
  //   document.getElementById('phase-display').textContent = 'Phase: ' + data.phase + '  Round ' + data.round_id + '/' + data.round_total;
  //   document.getElementById('prompt-display').textContent = data.prompt || '—';
  //   Show/hide #answer-area (phase === 'ANSWER'), #guess-area (phase === 'GUESS'), #results-area (phase === 'RESULTS')
  throw new Error('TODO: implement pollState()');
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollState();
  pollInterval = setInterval(pollState, 2000);
}

// -----------------------------------------------------------------------------
// TODO: Implement submitAnswer()
// POST /api/answer with body: { player_id, round_id, answer }
// You need round_id from the last pollState() – store it in a variable when you implement pollState().
// On success: clear answer input and show "Answer submitted". On error: show error message in #answer-status.
// -----------------------------------------------------------------------------
let currentRoundId = null; // set this in pollState() from data.round_id

async function submitAnswer() {
  const answer = document.getElementById('answer').value.trim();
  if (!answer) return;
  // TODO: use fetch() to POST to API_BASE + '/api/answer'
  // Body: JSON.stringify({ player_id: playerId, round_id: currentRoundId, answer: answer })
  // Headers: { 'Content-Type': 'application/json' }
  // On success: clear input, set #answer-status to "Answer submitted"
  // On error (e.g. 409): read JSON and show data.error in #answer-status with class "status error"
  throw new Error('TODO: implement submitAnswer()');
}

// -----------------------------------------------------------------------------
// TODO: Implement submitGuess()
// POST /api/guess with body: { player_id, round_id, guess }
// On success: clear guess input and show "Guess submitted". On error: show error in #guess-status.
// -----------------------------------------------------------------------------
async function submitGuess() {
  const guess = document.getElementById('guess').value.trim();
  if (!guess) return;
  // TODO: use fetch() to POST to API_BASE + '/api/guess'
  // Body: JSON.stringify({ player_id: playerId, round_id: currentRoundId, guess: guess })
  // Headers: { 'Content-Type': 'application/json' }
  // On success: clear input, set #guess-status to "Guess submitted"
  // On error: show data.error in #guess-status with class "status error"
  throw new Error('TODO: implement submitGuess()');
}

// -----------------------------------------------------------------------------
// TODO: Implement fetchResults()
// GET /api/results?round_id=<currentRoundId>
// Display the returned breakdown and majority_answers in #results (e.g. JSON.stringify(data, null, 2)).
// -----------------------------------------------------------------------------
async function fetchResults() {
  // TODO: use fetch() to GET API_BASE + '/api/results?round_id=' + currentRoundId
  // Parse JSON, then set document.getElementById('results').textContent = JSON.stringify(data, null, 2);
  // On error (e.g. 409): show message that results are not available yet
  throw new Error('TODO: implement fetchResults()');
}

// -----------------------------------------------------------------------------
// UI wiring (no TODOs)
// -----------------------------------------------------------------------------
document.getElementById('btn-join').addEventListener('click', function() {
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
