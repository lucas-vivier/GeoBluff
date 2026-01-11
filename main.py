"""FastAPI app for GeoBluff."""
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, Request, Body
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel

import game

RULES_FILES = {
    "fr": Path(__file__).parent / "rules.md",
    "en": Path(__file__).parent / "rules_en.md"
}

app = FastAPI(title="GeoBluff")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


class GameRequest(BaseModel):
    game_id: str


class PlayCardRequest(BaseModel):
    game_id: str
    player: int
    card_name: str


class BluffRequest(BaseModel):
    game_id: str
    player: int


class CapitalRequest(BaseModel):
    game_id: str
    player: int
    answer: str


class PositionRequest(BaseModel):
    game_id: str
    position: int  # Index where to insert (0 = leftmost)


class CapitalDecisionRequest(BaseModel):
    game_id: str
    accepted: bool  # True if opponent accepts the answer


class RevealCardRequest(BaseModel):
    game_id: str
    index: int  # Index of card to reveal


class NewGameRequest(BaseModel):
    cards_per_player: int = 7
    language: Optional[str] = None
    game_id: Optional[str] = None
    category_set: Optional[str] = None


class SetLanguageRequest(BaseModel):
    game_id: Optional[str] = None
    language: str


class ChangeCategoryRequest(BaseModel):
    game_id: str


@app.get("/")
async def index(request: Request):
    """Serve the game page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/rules")
async def get_rules(lang: Optional[str] = None):
    """Get game rules from markdown file."""
    language = game.normalize_language(lang)
    rules_file = RULES_FILES.get(language, RULES_FILES["fr"])
    if rules_file.exists():
        content = rules_file.read_text(encoding="utf-8")
        return PlainTextResponse(content)
    fallback = "Regles non disponibles" if language == "fr" else "Rules not available"
    return PlainTextResponse(fallback)


@app.post("/api/new-game")
async def new_game(req: Optional[NewGameRequest] = Body(default=None)):
    """Start a new game."""
    cards = req.cards_per_player if req else 7
    language = req.language if req else None
    game_id = req.game_id if req else None
    category_set = req.category_set if req else None
    return game.new_game(cards, language=language, game_id=game_id, category_set=category_set)

@app.post("/api/set-language")
async def set_language(req: SetLanguageRequest):
    """Set current language for the game."""
    return game.set_language(req.game_id, req.language)


@app.get("/api/game-state")
async def game_state(game_id: str, client_id: Optional[str] = None):
    """Get current game state."""
    state = game.get_state(game_id, client_id=client_id)
    if state is None:
        return JSONResponse({"error": "No game in progress"}, status_code=404)
    return state


@app.post("/api/play-card")
async def play_card(req: PlayCardRequest):
    """Play a card."""
    result = game.play_card(req.game_id, req.player, req.card_name)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/call-bluff")
async def call_bluff(req: BluffRequest):
    """Call bluff."""
    result = game.call_bluff(req.game_id, req.player)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/reveal-card")
async def reveal_card(req: RevealCardRequest):
    """Reveal a specific card during bluff."""
    result = game.reveal_card(req.game_id, req.index)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/check-capital")
async def check_capital(req: CapitalRequest):
    """Check capital answer."""
    result = game.check_capital_answer(req.game_id, req.player, req.answer)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/set-position")
async def set_position(req: PositionRequest):
    """Set position for pending card."""
    result = game.set_position(req.game_id, req.position)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/validate-placement")
async def validate_placement(req: GameRequest):
    """Validate card placement and end turn."""
    result = game.validate_placement(req.game_id)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/cancel-placement")
async def cancel_placement(req: GameRequest):
    """Cancel placement and return card to hand."""
    result = game.cancel_placement(req.game_id)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/capital-decision")
async def capital_decision(req: CapitalDecisionRequest):
    """Opponent decides if capital answer is acceptable."""
    result = game.validate_capital_decision(req.game_id, req.accepted)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/change-category")
async def change_category(req: ChangeCategoryRequest):
    """Change to a different category."""
    result = game.change_category(req.game_id)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/continue-after-bluff")
async def continue_after_bluff(req: GameRequest):
    """Continue game after viewing bluff result."""
    result = game.continue_after_bluff(req.game_id)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result


@app.post("/api/continue-after-final-validation")
async def continue_after_final_validation(req: GameRequest):
    """Continue game after failed final validation."""
    result = game.continue_after_final_validation(req.game_id)
    if "error" in result:
        return JSONResponse(result, status_code=400)
    return result
