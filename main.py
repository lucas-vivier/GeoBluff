"""FastAPI app for GeoBluff."""
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel

import game

RULES_FILE = Path(__file__).parent / "rules.md"

app = FastAPI(title="GeoBluff")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


class PlayCardRequest(BaseModel):
    player: int
    card_name: str


class BluffRequest(BaseModel):
    player: int


class CapitalRequest(BaseModel):
    player: int
    answer: str


class PositionRequest(BaseModel):
    position: int  # Index where to insert (0 = leftmost)


class CapitalDecisionRequest(BaseModel):
    accepted: bool  # True if opponent accepts the answer


class RevealCardRequest(BaseModel):
    index: int  # Index of card to reveal


@app.get("/")
async def index(request: Request):
    """Serve the game page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/rules")
async def get_rules():
    """Get game rules from markdown file."""
    if RULES_FILE.exists():
        content = RULES_FILE.read_text(encoding="utf-8")
        return PlainTextResponse(content)
    return PlainTextResponse("Regles non disponibles")


@app.post("/api/new-game")
async def new_game():
    """Start a new game."""
    return game.new_game()


@app.get("/api/game-state")
async def game_state():
    """Get current game state."""
    state = game.get_state()
    if state is None:
        return JSONResponse({"error": "No game in progress"}, status_code=404)
    return state


@app.post("/api/play-card")
async def play_card(req: PlayCardRequest):
    """Play a card."""
    result = game.play_card(req.player, req.card_name)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/call-bluff")
async def call_bluff(req: BluffRequest):
    """Call bluff."""
    result = game.call_bluff(req.player)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/reveal-card")
async def reveal_card(req: RevealCardRequest):
    """Reveal a specific card during bluff."""
    result = game.reveal_card(req.index)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/check-capital")
async def check_capital(req: CapitalRequest):
    """Check capital answer."""
    result = game.check_capital_answer(req.player, req.answer)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/set-position")
async def set_position(req: PositionRequest):
    """Set position for pending card."""
    result = game.set_position(req.position)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/validate-placement")
async def validate_placement():
    """Validate card placement and end turn."""
    result = game.validate_placement()
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/cancel-placement")
async def cancel_placement():
    """Cancel placement and return card to hand."""
    result = game.cancel_placement()
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/capital-decision")
async def capital_decision(req: CapitalDecisionRequest):
    """Opponent decides if capital answer is acceptable."""
    result = game.validate_capital_decision(req.accepted)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/change-category")
async def change_category():
    """Change to a different category."""
    result = game.change_category()
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/continue-after-bluff")
async def continue_after_bluff():
    """Continue game after viewing bluff result."""
    result = game.continue_after_bluff()
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result
