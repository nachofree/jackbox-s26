"""
Majority Rules - Flask backend for classroom HTTP GET/POST game.
In-memory storage only; resets on server restart.
"""

import os
import uuid
from collections import Counter
from datetime import datetime, timedelta, timezone
from flask import (
    Flask,
    jsonify,
    request,
    render_template,
    send_from_directory,
    abort,
)

# -----------------------------------------------------------------------------
# Config & constants
# -----------------------------------------------------------------------------
MAX_NAME_LEN = 80
MAX_ANSWER_LEN = 80
MAX_GUESS_LEN = 80
DEFAULT_ROUNDS = 3
ANSWER_TIMER_SECONDS = 45
GUESS_TIMER_SECONDS = 20
PHASES = ("LOBBY", "ANSWER", "GUESS", "RESULTS")

PROMPTS = [
    "The real reason Thanos did it was ___",
    "What Dumbledore actually said in the mirror was ___",
    "The real villain in every Disney movie is ___",
    "What the One Ring whispered to you when you were alone: ___",
    "The real reason Barbie left Ken: ___",
    "What Walter White's second career should have been: ___",
    "The real plot twist in every M. Night Shyamalan movie: ___",
    "What the cast of Friends would be doing in 2025: ___",
    "The real reason Squid Game was so popular: ___",
    "What the dinosaurs in Jurassic Park were really thinking: ___",
    "The real reason Tony Stark built the suit: ___",
    "What Stranger Things would be called if it was honest: ___",
    "The real villain in every rom-com is ___",
    "What the Hogwarts sorting hat really wanted to say: ___",
    "The real reason everyone left the group chat: ___",
    "What the iceberg said to the Titanic: ___",
    "The real plot of every true crime documentary: ___",
    "What the cast of The Office would post on LinkedIn: ___",
    "The real reason the dinosaurs went extinct: ___",
    "What the yellow Minion is actually saying: ___",
]


def _client_dir():
    base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, "..", "client")


def _client_solved_dir():
    base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, "..", "client_solved")


def _now_utc():
    return datetime.now(timezone.utc)


def _iso(dt):
    return dt.isoformat() if dt else None


# -----------------------------------------------------------------------------
# In-memory game state
# -----------------------------------------------------------------------------
_state = {
    "phase": "LOBBY",
    "round_id": 0,
    "round_total": DEFAULT_ROUNDS,
    "prompt": None,
    "ends_at": None,
    "players": {},  # player_id -> { "name", "score" }
    "answers": {},  # round_id -> { player_id -> answer }
    "guesses": {},  # round_id -> { player_id -> guess }
    "prompts_used": [],
}


def _reset_state():
    _state["phase"] = "LOBBY"
    _state["round_id"] = 0
    _state["round_total"] = DEFAULT_ROUNDS
    _state["prompt"] = None
    _state["ends_at"] = None
    _state["players"] = {}
    _state["answers"] = {}
    _state["guesses"] = {}
    _state["prompts_used"] = []


def _pick_prompt():
    used = set(_state["prompts_used"])
    available = [p for p in PROMPTS if p not in used]
    if not available:
        _state["prompts_used"] = []
        available = PROMPTS[:]
    import random
    chosen = random.choice(available)
    _state["prompts_used"].append(chosen)
    return chosen


def _phase_expired():
    if _state["phase"] not in ("ANSWER", "GUESS") or not _state["ends_at"]:
        return False
    try:
        end = datetime.fromisoformat(_state["ends_at"].replace("Z", "+00:00"))
        return _now_utc() >= end
    except Exception:
        return False


def _sanitize(s, max_len=80):
    if s is None:
        return ""
    s = str(s).strip()
    s = s[:max_len] if max_len else s
    return s


def _err(message, details=None, status=400):
    body = {"error": message}
    if details is not None:
        body["details"] = details
    return jsonify(body), status


# -----------------------------------------------------------------------------
# Flask app
# -----------------------------------------------------------------------------
app = Flask(__name__, template_folder=os.path.join(os.path.dirname(__file__), "templates"))

# CORS for local development and ngrok (preflight + response headers)
@app.after_request
def cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response




@app.before_request
def cors_preflight():
    if request.method == "OPTIONS":
        resp = app.make_default_options_response()
        return resp


@app.route("/")
def index():
    return send_from_directory(_client_dir(), "index.html")


@app.route("/student")
@app.route("/student/")
def student_index():
    return send_from_directory(_client_dir(), "index.html")


@app.route("/student/<path:path>")
def student_static(path):
    return send_from_directory(_client_dir(), path)


@app.route("/student_solved")
@app.route("/student_solved/")
def student_solved_index():
    return send_from_directory(_client_solved_dir(), "index.html")


@app.route("/student_solved/<path:path>")
def student_solved_static(path):
    return send_from_directory(_client_solved_dir(), path)


@app.route("/tv")
def tv():
    return render_template("tv.html")


@app.route("/admin")
def admin():
    return render_template("admin.html")


# -----------------------------------------------------------------------------
# API: join
# -----------------------------------------------------------------------------
@app.route("/api/join", methods=["POST"])
def api_join():
    if request.content_type and "application/json" not in request.content_type:
        return _err("Content-Type must be application/json", status=415)
    try:
        data = request.get_json(force=True) or {}
    except Exception:
        return _err("Invalid JSON body", status=400)
    name = data.get("name")
    if name is None or (isinstance(name, str) and not name.strip()):
        return _err("Missing or empty 'name'", details="body: { \"name\": \"Your Name\" }")
    name = _sanitize(name, MAX_NAME_LEN)
    if not name:
        return _err("Name cannot be empty after sanitization")
    player_id = str(uuid.uuid4())
    print(f"Player {name} joined with ID {player_id}")
    _state["players"][player_id] = {"name": name, "score": 0}
    return jsonify({"player_id": player_id, "name": name})


# -----------------------------------------------------------------------------
# API: state
# -----------------------------------------------------------------------------
@app.route("/api/state", methods=["GET"])
def api_state():
    phase = _state["phase"]
    if _phase_expired():
        phase = "EXPIRED"
    n_answers = 0
    rid = _state["round_id"]
    if rid and rid in _state["answers"]:
        n_answers = len(_state["answers"][rid])
    return jsonify({
        "phase": phase,
        "round_id": _state["round_id"],
        "round_total": _state["round_total"],
        "prompt": _state["prompt"],
        "ends_at": _iso(_state["ends_at"]),
        "players_connected": len(_state["players"]),
        "answers_received": n_answers,
    })


# -----------------------------------------------------------------------------
# API: answer
# -----------------------------------------------------------------------------
@app.route("/api/answer", methods=["POST"])
def api_answer():
    if _state["phase"] != "ANSWER":
        return _err(
            "Answers only accepted in ANSWER phase",
            details=f"current phase: {_state['phase']}",
            status=409,
        )
    if request.content_type and "application/json" not in request.content_type:
        return _err("Content-Type must be application/json", status=415)
    try:
        data = request.get_json(force=True) or {}
    except Exception:
        return _err("Invalid JSON body", status=400)
    player_id = data.get("player_id")
    round_id = data.get("round_id")
    answer = data.get("answer")
    if not player_id:
        return _err("Missing 'player_id'")
    if round_id is None:
        return _err("Missing 'round_id'")
    if answer is None:
        return _err("Missing 'answer'")
    if player_id not in _state["players"]:
        return _err("Unknown player_id", status=404)
    if round_id != _state["round_id"] or round_id < 1:
        return _err("Invalid or mismatched round_id", status=409)
    answer = _sanitize(answer, MAX_ANSWER_LEN)
    if not answer:
        return _err("Answer cannot be empty after sanitization")
    if round_id not in _state["answers"]:
        _state["answers"][round_id] = {}
    if player_id in _state["answers"][round_id]:
        return _err("Already submitted an answer for this round", status=409)
    _state["answers"][round_id][player_id] = answer
    print(f"Answer {answer} submitted by player {player_id} for round {round_id}")
    return jsonify({"ok": True, "round_id": round_id})


# -----------------------------------------------------------------------------
# API: guess
# -----------------------------------------------------------------------------
@app.route("/api/guess", methods=["POST"])
def api_guess():
    if _state["phase"] != "GUESS":
        return _err(
            "Guesses only accepted in GUESS phase",
            details=f"current phase: {_state['phase']}",
            status=409,
        )
    if request.content_type and "application/json" not in request.content_type:
        return _err("Content-Type must be application/json", status=415)
    try:
        data = request.get_json(force=True) or {}
    except Exception:
        return _err("Invalid JSON body", status=400)
    player_id = data.get("player_id")
    round_id = data.get("round_id")
    guess = data.get("guess")
    if not player_id:
        return _err("Missing 'player_id'")
    if round_id is None:
        return _err("Missing 'round_id'")
    if guess is None:
        return _err("Missing 'guess'")
    if player_id not in _state["players"]:
        return _err("Unknown player_id", status=404)
    if round_id != _state["round_id"] or round_id < 1:
        return _err("Invalid or mismatched round_id", status=409)
    guess = _sanitize(guess, MAX_GUESS_LEN)
    if not guess:
        return _err("Guess cannot be empty after sanitization")
    if round_id not in _state["guesses"]:
        _state["guesses"][round_id] = {}
    if player_id in _state["guesses"][round_id]:
        return _err("Already submitted a guess for this round", status=409)
    _state["guesses"][round_id][player_id] = guess
    print(f"Guess {guess} submitted by player {player_id} for round {round_id}")
    return jsonify({"ok": True, "round_id": round_id})


# -----------------------------------------------------------------------------
# API: results
# -----------------------------------------------------------------------------
@app.route("/api/results", methods=["GET"])
def api_results():
    round_id = request.args.get("round_id", type=int)
    if round_id is None:
        return _err("Missing query parameter 'round_id'")
    if _state["phase"] != "RESULTS" and _state["phase"] != "LOBBY":
        if _state["phase"] == "ANSWER" or _state["phase"] == "GUESS":
            return _err(
                "Results available only in RESULTS phase",
                details=f"current phase: {_state['phase']}",
                status=409,
            )
    if round_id < 1 or round_id > _state["round_id"]:
        return _err("Invalid round_id", status=404)
    answers = _state["answers"].get(round_id) or {}
    if not answers:
        return jsonify({
            "round_id": round_id,
            "prompt": _state["prompt"] or "",
            "breakdown": [],
            "majority_answers": [],
            "total_answers": 0,
        })
    counts = Counter(answers.values())
    total = len(answers)
    breakdown = [
        {"answer": a, "count": c, "pct": round(100 * c / total, 1)}
        for a, c in counts.most_common()
    ]
    if not breakdown:
        majority = []
    else:
        top_count = breakdown[0]["count"]
        majority = [b["answer"] for b in breakdown if b["count"] == top_count]
    prompt_used = _state["prompt"]
    if round_id != _state["round_id"]:
        prompt_used = None
    return jsonify({
        "round_id": round_id,
        "prompt": prompt_used or "(prompt not stored)",
        "breakdown": breakdown,
        "majority_answers": majority,
        "total_answers": total,
    })


# -----------------------------------------------------------------------------
# API: scoreboard
# -----------------------------------------------------------------------------
@app.route("/api/scoreboard", methods=["GET"])
def api_scoreboard():
    rows = [
        {"player_id": pid, "name": p["name"], "score": p["score"]}
        for pid, p in _state["players"].items()
    ]
    rows.sort(key=lambda r: (-r["score"], r["name"]))
    return jsonify(rows)


# -----------------------------------------------------------------------------
# Scoring helper (called when moving to RESULTS)
# -----------------------------------------------------------------------------
def _apply_round_scoring():
    rid = _state["round_id"]
    answers = _state["answers"].get(rid) or {}
    guesses = _state["guesses"].get(rid) or {}
    if not answers:
        return
    counts = Counter(answers.values())
    if not counts:
        return
    top_count = counts.most_common(1)[0][1]
    majority_answers = [a for a, c in counts.items() if c == top_count]
    for pid in answers:
        _state["players"][pid]["score"] = _state["players"][pid].get("score", 0) + 1
    for pid, guess in guesses.items():
        if guess in majority_answers:
            _state["players"][pid]["score"] = _state["players"][pid].get("score", 0) + 2


# -----------------------------------------------------------------------------
# Admin: start
# -----------------------------------------------------------------------------
@app.route("/api/admin/start", methods=["POST"])
def api_admin_start():
    if request.content_type and "application/json" in (request.content_type or ""):
        try:
            data = request.get_json(force=True) or {}
        except Exception:
            data = {}
    else:
        data = {}
    round_total = data.get("round_total", DEFAULT_ROUNDS)
    if not isinstance(round_total, int) or round_total < 1 or round_total > 10:
        round_total = DEFAULT_ROUNDS
    _reset_state()
    _state["round_total"] = round_total
    _state["phase"] = "LOBBY"
    return jsonify({"ok": True, "round_total": _state["round_total"]})


# -----------------------------------------------------------------------------
# Admin: next_phase
# -----------------------------------------------------------------------------
@app.route("/api/admin/next_phase", methods=["POST"])
def api_admin_next_phase():
    phase = _state["phase"]
    idx = list(PHASES).index(phase) if phase in PHASES else 0
    next_idx = (idx + 1) % len(PHASES)
    next_phase = PHASES[next_idx]
    _state["phase"] = next_phase
    if next_phase == "ANSWER":
        _state["ends_at"] = _now_utc() + timedelta(seconds=ANSWER_TIMER_SECONDS)
        if _state["round_id"] == 0:
            _state["round_id"] = 1
            _state["answers"][1] = {}
            _state["guesses"][1] = {}
        if not _state["prompt"]:
            _state["prompt"] = _pick_prompt()
    elif next_phase == "GUESS":
        _state["ends_at"] = _now_utc() + timedelta(seconds=GUESS_TIMER_SECONDS)
    else:
        _state["ends_at"] = None
    if next_phase == "RESULTS":
        _apply_round_scoring()
    return jsonify({"ok": True, "phase": _state["phase"], "ends_at": _iso(_state["ends_at"])})


# -----------------------------------------------------------------------------
# Admin: next_round
# -----------------------------------------------------------------------------
@app.route("/api/admin/next_round", methods=["POST"])
def api_admin_next_round():
    _state["round_id"] = min(_state["round_id"] + 1, _state["round_total"])
    _state["phase"] = "ANSWER"
    _state["prompt"] = _pick_prompt()
    _state["ends_at"] = _now_utc() + timedelta(seconds=ANSWER_TIMER_SECONDS)
    rid = _state["round_id"]
    _state["answers"][rid] = {}
    _state["guesses"][rid] = {}
    return jsonify({
        "ok": True,
        "round_id": _state["round_id"],
        "round_total": _state["round_total"],
        "prompt": _state["prompt"],
        "ends_at": _iso(_state["ends_at"]),
    })


# -----------------------------------------------------------------------------
# Admin: reset
# -----------------------------------------------------------------------------
@app.route("/api/admin/reset", methods=["POST"])
def api_admin_reset():
    _reset_state()
    return jsonify({"ok": True})


@app.route("/<path:path>")
def root_client_static(path):
    """Serve client static files (e.g. /app.js) when opening the app from / ."""
    return send_from_directory(_client_dir(), path)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
