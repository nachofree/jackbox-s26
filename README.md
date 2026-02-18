# Majority Rules

A classroom “Jackbox-style” web game for teaching HTTP GET/POST usage. Students implement `fetch()` calls against a Flask backend; the instructor runs the backend and projects the shared “TV” screen.

- **Backend:** Python Flask, in-memory storage, no database.
- **Frontend:** Plain HTML + vanilla JS. Student starter has TODO blocks to implement API calls.
- **Game:** Live poll + guess-the-majority over 3–5 rounds.

## How to run

From the **project root** (parent of `server/` and `client/`):

```bash
cd server
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
flask --app app run --debug
```

Then open:

- **Student (client):** http://127.0.0.1:5000/ or http://127.0.0.1:5000/student  
- **TV (projector):** http://127.0.0.1:5000/tv  
- **Admin (instructor):** http://127.0.0.1:5000/admin  

## URLs

| URL       | Purpose |
|----------|---------|
| `/`      | Student client (same as `/student`) |
| `/student` | Student client |
| `/tv`    | Shared screen: prompt, countdown, response count, results |
| `/admin` | Instructor controls: start, next phase, next round, reset |

## Student TODOs

Students edit `client/app.js` and implement:

1. **`joinGame(name)`** – `POST /api/join` with `{ "name": "..." }`. Store `player_id` and `name`, then show game UI and start polling.
2. **`pollState()`** – `GET /api/state`. Update phase, round, prompt and show/hide answer, guess, and results sections. Store `currentRoundId` for submit calls.
3. **`submitAnswer()`** – `POST /api/answer` with `{ "player_id", "round_id", "answer" }`.
4. **`submitGuess()`** – `POST /api/guess` with `{ "player_id", "round_id", "guess" }`.
5. **`fetchResults()`** – `GET /api/results?round_id=<id>`. Display breakdown and majority answers.

All requests use the `API_BASE` constant (e.g. `API_BASE + '/api/join'`). Do not hardcode `localhost` elsewhere.

## Sample curl commands

**Join**
```bash
curl -X POST http://127.0.0.1:5000/api/join \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}'
```

**Get state**
```bash
curl http://127.0.0.1:5000/api/state
```

**Submit answer** (use `player_id` and `round_id` from join/state)
```bash
curl -X POST http://127.0.0.1:5000/api/answer \
  -H "Content-Type: application/json" \
  -d '{"player_id":"<PLAYER_ID>","round_id":1,"answer":"404"}'
```

**Submit guess**
```bash
curl -X POST http://127.0.0.1:5000/api/guess \
  -H "Content-Type: application/json" \
  -d '{"player_id":"<PLAYER_ID>","round_id":1,"guess":"404"}'
```

**Get results**
```bash
curl "http://127.0.0.1:5000/api/results?round_id=1"
```

**Scoreboard**
```bash
curl http://127.0.0.1:5000/api/scoreboard
```

**Admin – start game**
```bash
curl -X POST http://127.0.0.1:5000/api/admin/start \
  -H "Content-Type: application/json" \
  -d '{"round_total":3}'
```

**Admin – next phase**
```bash
curl -X POST http://127.0.0.1:5000/api/admin/next_phase
```

**Admin – next round**
```bash
curl -X POST http://127.0.0.1:5000/api/admin/next_round
```

**Admin – reset**
```bash
curl -X POST http://127.0.0.1:5000/api/admin/reset
```

## Project structure

```
server/
  requirements.txt
  app.py
  templates/
    tv.html
    admin.html
client/
  index.html
  app.js
README.md
```

The Flask app serves the client from the `client/` folder at `/` and `/student`. All API responses are JSON. CORS is enabled for local development.
