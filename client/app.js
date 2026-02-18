/**
 * Majority Rules – Student client
 * Complete the TODO blocks by implementing fetch() calls using .then() and .catch() only.
 * Use the API_BASE constant; do not hardcode URLs elsewhere.
 */

// Instructor's backend (students develop locally and hit this). Change to window.location.origin if serving the client from the same server.
var API_BASE = 'https://unpopulously-ungrimed-pilar.ngrok-free.dev';
// Required when API_BASE is an ngrok URL (bypasses ngrok interstitial). Include in every fetch() headers object.
var NGROK_HEADER = { 'ngrok-skip-browser-warning': '1' };

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
function joinGame(name) {
  // TODO: use fetch() to POST to API_BASE + '/api/join'
  // Body: JSON.stringify({ name: name })
  // Headers: Object.assign({ 'Content-Type': 'application/json' }, NGROK_HEADER)
  // Parse response with .json(), check for player_id, then:
  //   playerId = data.player_id;
  //   playerName = data.name;
  //   onJoined();
  //   startPolling();
  // On error response (e.g. !response.ok), read JSON and call showJoinError(data.error || 'Join failed');
  showJoinError('TODO: implement joinGame()');
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
function pollState() {
  // TODO: use fetch(API_BASE + '/api/state', { headers: NGROK_HEADER })
  // then .then(r => r.json()). Parse JSON, then update:
  //   document.getElementById('phase-display').textContent = 'Phase: ' + data.phase + '  Round ' + data.round_id + '/' + data.round_total;
  //   document.getElementById('prompt-display').textContent = data.prompt || '—';
  //   Show/hide #answer-area (phase === 'ANSWER'), #guess-area (phase === 'GUESS'), #results-area (phase === 'RESULTS')
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

function submitAnswer() {
  const answer = document.getElementById('answer').value.trim();
  if (!answer) return;
  // TODO: use fetch() to POST to API_BASE + '/api/answer'
  // Body: JSON.stringify({ player_id: playerId, round_id: currentRoundId, answer: answer })
  // Headers: Object.assign({ 'Content-Type': 'application/json' }, NGROK_HEADER)
  // On success: clear input, set #answer-status to "Answer submitted"
  // On error (e.g. 409): read JSON and show data.error in #answer-status with class "status error"
}

// -----------------------------------------------------------------------------
// TODO: Implement submitGuess()
// POST /api/guess with body: { player_id, round_id, guess }
// On success: clear guess input and show "Guess submitted". On error: show error in #guess-status.
// -----------------------------------------------------------------------------
function submitGuess() {
  const guess = document.getElementById('guess').value.trim();
  if (!guess) return;
  // TODO: use fetch() to POST to API_BASE + '/api/guess'
  // Body: JSON.stringify({ player_id: playerId, round_id: currentRoundId, guess: guess })
  // Headers: Object.assign({ 'Content-Type': 'application/json' }, NGROK_HEADER)
  // On success: clear input, set #guess-status to "Guess submitted"
  // On error: show data.error in #guess-status with class "status error"
}

// -----------------------------------------------------------------------------
// TODO: Implement fetchResults()
// GET /api/results?round_id=<currentRoundId>
// Display the returned breakdown and majority_answers in #results (e.g. JSON.stringify(data, null, 2)).
// -----------------------------------------------------------------------------
function fetchResults() {
  // TODO: use fetch(API_BASE + '/api/results?round_id=' + currentRoundId, { headers: NGROK_HEADER })
  // Parse JSON, then set document.getElementById('results').textContent = JSON.stringify(data, null, 2);
  // On error (e.g. 409): show message that results are not available yet
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

if (window.location.protocol === 'file:') {
  document.getElementById('file-warning').style.display = 'block';
}
