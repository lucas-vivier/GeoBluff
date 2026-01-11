"""Game logic for GeoBluff."""
import json
import random
import time
import unicodedata
import uuid
from pathlib import Path

# Use countries.json for production, fallback to countries_test.json if needed
COUNTRIES_FILE = Path(__file__).parent / "countries.json"
FALLBACK_COUNTRIES_FILE = Path(__file__).parent / "countries_test.json"

DEFAULT_CATEGORIES = [
    {"id": "population", "label": "Population"},
    {"id": "area", "label": "Superficie (km²)"},
    {"id": "gdp", "label": "PIB ($)"},
]

DEFAULT_CATEGORY_SETS = [
    {
        "id": "basic",
        "label": "Basique",
        "categories": ["population", "area", "north_south", "east_west"]
    },
    {
        "id": "economics",
        "label": "Economie",
        "categories": [
            "population",
            "area",
            "north_south",
            "east_west",
            "gdp",
            "inflation",
            "internet_users",
            "electricity_access",
            "unemployment"
        ]
    },
    {
        "id": "energy",
        "label": "Energie",
        "categories": [
            "population",
            "area",
            "north_south",
            "east_west",
            "energy_use_per_capita",
            "renewable_electricity",
            "electricity_from_hydro",
            "electricity_from_nuclear",
            "electricity_from_gas",
            "electricity_from_oil",
            "electricity_from_coal"
        ]
    },
    {
        "id": "fun",
        "label": "Advanced",
        "categories": [
            "population",
            "area",
            "north_south",
            "east_west",
            "tourism_arrivals",
            "forest_area",
            "urban_population",
            "air_pollution",
            "alcohol_consumption",
            "fertility_rate"
        ]
    }
]

CONFIG_FILE = Path(__file__).parent / "categories_config.json"

SUPPORTED_LANGUAGES = {"fr", "en"}
DEFAULT_LANGUAGE = "fr"
game_language = DEFAULT_LANGUAGE
PRESENCE_TIMEOUT_SECONDS = 6

CATEGORY_LABELS_EN = {
    "population": "Population",
    "area": "Area (km2)",
    "gdp": "GDP ($)",
    "life_expectancy": "Life expectancy (years)",
    "mobile_subscriptions": "Mobile subscriptions (per 100)",
    "population_density": "Density (people/km2)",
    "inflation": "Annual inflation (%)",
    "internet_users": "Internet users (%)",
    "electricity_access": "Electricity access (%)",
    "unemployment": "Unemployment (%)",
    "north_south": "North/South (latitude)",
    "east_west": "East/West (longitude)",
    "tourism_arrivals": "Tourism arrivals",
    "forest_area": "Forest area (%)",
    "urban_population": "Urban population (%)",
    "air_pollution": "Air pollution (PM2.5)",
    "renewable_electricity": "Renewable electricity (%)",
    "electricity_from_hydro": "Hydroelectricity (%)",
    "electricity_from_nuclear": "Nuclear electricity (%)",
    "electricity_from_gas": "Gas electricity (%)",
    "electricity_from_oil": "Oil electricity (%)",
    "electricity_from_coal": "Coal electricity (%)",
    "energy_use_per_capita": "Energy use (kg oil eq/capita)",
    "alcohol_consumption": "Alcohol consumption (L/capita)",
    "fertility_rate": "Fertility rate (births per woman)"
}

TRANSLATIONS = {
    "fr": {
        "choose_position": "Choisissez la position puis validez",
        "final_validation": "Validation finale - cliquez sur les cartes pour les révéler",
        "reveal_cards": "Cliquez sur les cartes pour les révéler",
        "new_category": "Nouvelle catégorie : {label}",
        "bluff_correct": "Tout était en ordre ! L'équipe {player} piochera 2 cartes.",
        "bluff_wrong": "Bien vu ! Le bluff est démasqué ! L'équipe {player} piochera 2 cartes.",
        "order_correct_capital": "Ordre correct ! L'équipe {player} doit entrer la capitale de {country}",
        "order_wrong": "Mauvais ordre ! L'équipe {player} piochera 2 cartes.",
        "game_over_win": "L'équipe {player} gagne la partie !",
        "capital_correct": "Bravo ! {capital} est correct. L'équipe {player} gagne !",
        "capital_incorrect": "Reponse: '{answer}'. La vraie capitale est '{capital}'. L'adversaire peut accepter ou refuser.",
        "capital_accepted": "L'adversaire a accepte ! L'équipe {player} gagne !",
        "capital_refused": "Refuse ! La capitale etait {capital}. L'équipe {player} pioche 2 cartes."
    },
    "en": {
        "choose_position": "Choose the position, then confirm",
        "final_validation": "Final validation - click the cards to reveal them",
        "reveal_cards": "Click the cards to reveal them",
        "new_category": "New category: {label}",
        "bluff_correct": "All in order! Team {player} draws 2 cards.",
        "bluff_wrong": "Nice catch! The bluff is exposed! Team {player} draws 2 cards.",
        "order_correct_capital": "Correct order! Team {player} must enter the capital of {country}",
        "order_wrong": "Wrong order! Team {player} draws 2 cards.",
        "game_over_win": "Team {player} wins the game!",
        "capital_correct": "Great! {capital} is correct. Team {player} wins!",
        "capital_incorrect": "Answer: '{answer}'. The real capital is '{capital}'. The opponent can accept or refuse.",
        "capital_accepted": "Opponent accepted! Team {player} wins!",
        "capital_refused": "Refused! The capital was {capital}. Team {player} draws 2 cards."
    }
}


def load_categories_config(countries):
    if not CONFIG_FILE.exists():
        enabled = [c["id"] for c in DEFAULT_CATEGORIES]
        labels = {c["id"]: c["label"] for c in DEFAULT_CATEGORIES}
        category_sets = DEFAULT_CATEGORY_SETS
    else:
        with open(CONFIG_FILE, encoding="utf-8") as f:
            config = json.load(f)

        categories = config.get("categories", DEFAULT_CATEGORIES)
        enabled = config.get("enabled_categories") or [c["id"] for c in categories]
        labels = {c["id"]: c.get("label", c["id"]) for c in categories if c["id"] in enabled}
        category_sets = config.get("category_sets") or DEFAULT_CATEGORY_SETS

    if countries:
        available = set(countries[0].keys())
        enabled = [cat_id for cat_id in enabled if cat_id in available]
        labels = {cat_id: labels[cat_id] for cat_id in enabled}

        filtered_sets = {}
        for cat_set in category_sets:
            set_id = cat_set.get("id")
            if not set_id:
                continue
            set_categories = [c for c in cat_set.get("categories", []) if c in enabled]
            if not set_categories:
                continue
            filtered_sets[set_id] = {
                "id": set_id,
                "label": cat_set.get("label", set_id),
                "categories": set_categories
            }
        category_sets = filtered_sets
    else:
        category_sets = {s["id"]: s for s in category_sets if s.get("id")}

    return enabled, labels, category_sets

def normalize_language(language):
    if not language:
        return DEFAULT_LANGUAGE
    language = language.lower().strip()
    return language if language in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE

def get_language(game_id=None):
    if game_id and game_id in games and "language" in games[game_id]:
        return games[game_id]["language"]
    return game_language

def get_category_label(category_id, language):
    if language == "en":
        return CATEGORY_LABELS_EN.get(category_id, CATEGORY_LABELS.get(category_id, category_id))
    return CATEGORY_LABELS.get(category_id, category_id)

def translate(key, language, **params):
    bundle = TRANSLATIONS.get(language, TRANSLATIONS[DEFAULT_LANGUAGE])
    template = bundle.get(key, TRANSLATIONS[DEFAULT_LANGUAGE].get(key, key))
    if "category_id" in params and "label" not in params:
        params["label"] = get_category_label(params["category_id"], language)
    return template.format(**params)

def set_message(game_state, key, **params):
    if game_state is None:
        return
    game_state["message_parts"] = [{"key": key, "params": params}]

def append_message(game_state, key, **params):
    if game_state is None:
        return
    if not game_state.get("message_parts"):
        game_state["message_parts"] = []
    game_state["message_parts"].append({"key": key, "params": params})

def clear_message(game_state):
    if game_state is None:
        return
    game_state["message_parts"] = None

def load_countries():
    """Load countries from JSON file."""
    primary = COUNTRIES_FILE if COUNTRIES_FILE.exists() else None
    fallback = FALLBACK_COUNTRIES_FILE if FALLBACK_COUNTRIES_FILE.exists() else None

    for path in [primary, fallback]:
        if path is None:
            continue
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if data and {"name", "capital", "flag"}.issubset(data[0].keys()):
            return data

    return []

COUNTRIES = load_countries()
CATEGORIES, CATEGORY_LABELS, CATEGORY_SETS = load_categories_config(COUNTRIES)

games = {}  # Dict of game_id -> game_state

def pick_random_category(category_pool=None, exclude=None):
    """Pick a random category from a pool, optionally excluding one."""
    pool = category_pool or CATEGORIES
    if not pool:
        return None
    if exclude and len(pool) > 1:
        candidates = [c for c in pool if c != exclude]
        if candidates:
            return random.choice(candidates)
    return random.choice(pool)

def normalize_text(text):
    """Remove accents and lowercase for comparison."""
    text = text.lower().strip()
    return ''.join(
        c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) != 'Mn'
    )

def levenshtein_distance(s1, s2):
    """Calculate Levenshtein distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]

def check_capital(input_capital, correct_capital):
    """Check if input capital matches (with tolerance)."""
    input_norm = normalize_text(input_capital)
    correct_norm = normalize_text(correct_capital)

    if input_norm == correct_norm:
        return True

    return levenshtein_distance(input_norm, correct_norm) <= 2

def resolve_category_pool(category_set_id):
    if category_set_id and category_set_id in CATEGORY_SETS:
        return CATEGORY_SETS[category_set_id]["categories"]
    return CATEGORIES


def new_game(cards_per_player=7, language=None, game_id=None, category_set=None):
    """Start a new game."""
    global game_language

    if language is not None:
        game_language = normalize_language(language)

    cards_per_player = max(3, min(cards_per_player, 10))

    category_pool = resolve_category_pool(category_set)
    category = pick_random_category(category_pool)
    shuffled = random.sample(COUNTRIES, len(COUNTRIES))

    # Reference card (after player hands)
    ref_index = cards_per_player * 2
    reference_card = shuffled[ref_index]
    player1_cards = shuffled[:cards_per_player]
    player2_cards = shuffled[cards_per_player:cards_per_player * 2]

    # Generate new game_id if not provided
    if not game_id:
        game_id = str(uuid.uuid4())[:8]

    game_state = {
        "game_id": game_id,
        "category": category,
        "category_label": get_category_label(category, game_language),
        "category_pool": category_pool,
        "category_set": category_set if category_set in CATEGORY_SETS else None,
        "player1_cards": player1_cards,
        "player2_cards": player2_cards,
        "board": [reference_card],  # Start with reference card on board
        "current_player": 1,
        "phase": "playing",  # playing, placing, bluff_reveal, capital_check, game_over
        "winner": None,
        "message_parts": None,
        "bluff_caller": None,
        "reveal_index": 0,
        "pending_card": None,  # Card being placed (not yet validated)
        "pending_position": 0,  # Index where card will be inserted (0 = leftmost)
        "language": game_language,
        "presence": {}
    }

    games[game_id] = game_state
    return get_state(game_id)

def get_state(game_id, client_id=None):
    """Get current game state (hiding opponent's card values)."""
    if game_id not in games:
        return None

    game_state = games[game_id]
    now = time.time()
    presence = game_state.setdefault("presence", {})
    stale = [cid for cid, ts in presence.items() if now - ts > PRESENCE_TIMEOUT_SECONDS]
    for cid in stale:
        presence.pop(cid, None)
    if client_id:
        presence[client_id] = now

    active_clients = len(presence)
    if client_id:
        other_present = any(cid != client_id for cid in presence)
    else:
        other_present = active_clients > 1

    state = game_state.copy()
    language = get_language(game_id)
    state["language"] = language
    state["category_label"] = get_category_label(state["category"], language)
    category = state["category"]

    # Hide values for cards in hand (only show name and flag)
    def hide_card(card):
        return {"name": card["name"], "flag": card["flag"], "capital": card["capital"]}

    def full_card(card):
        return {
            "name": card["name"],
            "flag": card["flag"],
            "capital": card["capital"],
            "value": card[category]
        }

    # During playing/placing phase, hide card values
    if state["phase"] in ("playing", "placing"):
        state["player1_cards"] = [hide_card(c) for c in state["player1_cards"]]
        state["player2_cards"] = [hide_card(c) for c in state["player2_cards"]]
        # All cards hidden (including reference)
        state["board"] = [
            {**hide_card(c), "is_reference": i == 0}
            for i, c in enumerate(state["board"])
        ]
        # Add pending card info
        if state["pending_card"]:
            state["pending_card"] = hide_card(state["pending_card"])
    elif state["phase"] in ("bluff_reveal", "final_validation"):
        # During bluff reveal or final validation, show values only for revealed cards
        state["player1_cards"] = [hide_card(c) for c in state["player1_cards"]]
        state["player2_cards"] = [hide_card(c) for c in state["player2_cards"]]
        state["board"] = [
            {**full_card(c), "revealed": c.get("revealed", False), "is_reference": i == 0}
            for i, c in enumerate(state["board"])
        ]
    else:
        # During other phases (game_over, capital_check, etc.), show all values
        state["player1_cards"] = [full_card(c) for c in state["player1_cards"]]
        state["player2_cards"] = [full_card(c) for c in state["player2_cards"]]
        state["board"] = [
            {**full_card(c), "revealed": True, "is_reference": i == 0}
            for i, c in enumerate(state["board"])
        ]

    # Include capital_card info for capital_check phase
    if state.get("capital_card"):
        state["capital_card"] = hide_card(state["capital_card"])

    if state.get("message_parts"):
        parts = [
            translate(part["key"], language, **(part.get("params") or {}))
            for part in state["message_parts"]
        ]
        state["message"] = " ".join(parts)
    else:
        state["message"] = None

    state.pop("message_parts", None)
    state.pop("category_pool", None)
    state.pop("presence", None)
    state["active_clients"] = active_clients
    state["other_present"] = other_present

    return state

def set_language(game_id, language):
    """Set current language for the game."""
    global game_language

    game_language = normalize_language(language)
    if game_id and game_id in games:
        game_state = games[game_id]
        game_state["language"] = game_language
        game_state["category_label"] = get_category_label(game_state["category"], game_language)
        return get_state(game_id)
    return {"language": game_language}

def change_category(game_id):
    """Change to a different category (only during playing phase with just reference card)."""
    if game_id not in games:
        return {"error": "No game in progress"}

    game_state = games[game_id]

    if game_state["phase"] != "playing":
        return {"error": "Can only change category during playing phase"}

    # Only allow category change when board has just the reference card
    if len(game_state["board"]) > 1:
        return {"error": "Cannot change category after cards have been placed"}

    # Pick a different category
    old_category = game_state["category"]
    category_pool = game_state.get("category_pool") or CATEGORIES
    new_category = pick_random_category(category_pool, exclude=old_category)

    game_state["category"] = new_category
    game_state["category_label"] = get_category_label(new_category, get_language(game_id))
    set_message(game_state, "new_category", category_id=new_category)

    return get_state(game_id)


def play_card(game_id, player, card_name):
    """Play a card from hand - enters placing phase."""
    if game_id not in games:
        return {"error": "No game in progress"}

    game_state = games[game_id]

    if game_state["phase"] != "playing":
        return {"error": "Cannot play card now"}

    if game_state["current_player"] != player:
        return {"error": "Not your turn"}

    cards = game_state[f"player{player}_cards"]
    card = next((c for c in cards if c["name"] == card_name), None)

    if card is None:
        return {"error": "Card not found"}

    # Remove card from hand and enter placing phase
    cards.remove(card)
    game_state["pending_card"] = card
    # Default position: rightmost (after all existing cards)
    game_state["pending_position"] = len(game_state["board"])
    game_state["phase"] = "placing"
    set_message(game_state, "choose_position")

    return get_state(game_id)

def set_position(game_id, position):
    """Change the position of the pending card (index)."""
    if game_id not in games:
        return {"error": "No game in progress"}

    game_state = games[game_id]

    if game_state["phase"] != "placing":
        return {"error": "Not in placing phase"}

    # Position is an index from 0 to len(board)
    max_pos = len(game_state["board"])
    if not isinstance(position, int) or position < 0 or position > max_pos:
        return {"error": f"Position must be between 0 and {max_pos}"}

    game_state["pending_position"] = position
    return get_state(game_id)

def validate_placement(game_id):
    """Validate the card placement and end turn."""
    if game_id not in games:
        return {"error": "No game in progress"}

    game_state = games[game_id]

    if game_state["phase"] != "placing":
        return {"error": "Not in placing phase"}

    card = game_state["pending_card"]
    position = game_state["pending_position"]
    player = game_state["current_player"]

    # Insert card at the specified index
    game_state["board"].insert(position, card)

    # Clear pending state
    game_state["pending_card"] = None
    game_state["pending_position"] = None

    # Check for win condition (last card played)
    cards = game_state[f"player{player}_cards"]
    if len(cards) == 0:
        # Enter final validation phase - reveal cards one by one like bluff
        game_state["phase"] = "final_validation"
        game_state["final_player"] = player  # Player who placed last card
        game_state["capital_card"] = card  # Store for capital check later
        set_message(game_state, "final_validation")
        return get_state(game_id)

    # Switch player
    game_state["current_player"] = 2 if player == 1 else 1
    game_state["phase"] = "playing"
    clear_message(game_state)

    return get_state(game_id)

def cancel_placement(game_id):
    """Cancel placement and return card to hand."""
    if game_id not in games:
        return {"error": "No game in progress"}

    game_state = games[game_id]

    if game_state["phase"] != "placing":
        return {"error": "Not in placing phase"}

    player = game_state["current_player"]
    card = game_state["pending_card"]

    # Return card to hand
    game_state[f"player{player}_cards"].append(card)
    game_state["pending_card"] = None
    game_state["pending_position"] = None
    game_state["phase"] = "playing"
    clear_message(game_state)

    return get_state(game_id)

def call_bluff(game_id, player):
    """Call bluff on the last played card."""
    if game_id not in games:
        return {"error": "No game in progress"}

    game_state = games[game_id]

    if game_state["phase"] != "playing":
        return {"error": "Cannot call bluff now"}

    if len(game_state["board"]) < 2:
        return {"error": "Need at least 2 cards on board"}

    if game_state["current_player"] != player:
        return {"error": "Not your turn"}

    game_state["phase"] = "bluff_reveal"
    game_state["bluff_caller"] = player
    game_state["reveal_index"] = 0
    set_message(game_state, "reveal_cards")

    return get_state(game_id)

def reveal_card(game_id, index):
    """Reveal a specific card during bluff check or final validation."""
    if game_id not in games:
        return {"error": "No game in progress"}

    game_state = games[game_id]

    if game_state["phase"] not in ("bluff_reveal", "final_validation"):
        return {"error": "Not in reveal phase"}

    if index < 0 or index >= len(game_state["board"]):
        return {"error": "Invalid card index"}

    # Mark this card as revealed
    game_state["board"][index]["revealed"] = True

    # Count revealed cards
    revealed_count = sum(1 for card in game_state["board"] if card.get("revealed", False))

    # Check if all cards revealed
    if revealed_count >= len(game_state["board"]):
        if game_state["phase"] == "bluff_reveal":
            return check_bluff_result(game_id)
        else:
            return check_final_validation_result(game_id)

    return get_state(game_id)

def check_bluff_result(game_id):
    """Check if bluff was correct after all cards revealed - enter result phase."""
    game_state = games[game_id]

    category = game_state["category"]
    board = game_state["board"]
    bluff_caller = game_state["bluff_caller"]

    # Check if order is correct (ascending, ties are valid)
    is_correct_order = True
    for i in range(len(board) - 1):
        val1 = board[i][category]
        val2 = board[i + 1][category]
        # Use tolerance for float comparison, ties (equal values) are valid
        if val1 > val2 + 0.0001:
            is_correct_order = False
            break

    if is_correct_order:
        # Order was correct, bluff caller loses
        loser = bluff_caller
        set_message(game_state, "bluff_correct", player=bluff_caller)
    else:
        # Order was wrong, bluff caller wins
        loser = 2 if bluff_caller == 1 else 1
        set_message(game_state, "bluff_wrong", player=loser)

    # Enter result phase - wait for user to click continue
    game_state["phase"] = "bluff_result"
    game_state["bluff_loser"] = loser

    return get_state(game_id)


def check_final_validation_result(game_id):
    """Check if order is correct after final validation - either ask capital or penalize."""
    game_state = games[game_id]

    category = game_state["category"]
    board = game_state["board"]
    player = game_state["final_player"]

    # Check if order is correct (ascending, ties are valid)
    is_correct_order = True
    for i in range(len(board) - 1):
        val1 = board[i][category]
        val2 = board[i + 1][category]
        if val1 > val2 + 0.0001:
            is_correct_order = False
            break

    if is_correct_order:
        # Order correct - now ask for capital
        card = game_state["capital_card"]
        game_state["phase"] = "capital_check"
        set_message(game_state, "order_correct_capital", player=player, country=card["name"])
    else:
        # Order wrong - player draws 2 cards, enter result phase
        game_state["phase"] = "final_validation_result"
        game_state["final_validation_failed"] = True
        set_message(game_state, "order_wrong", player=player)

    return get_state(game_id)


def continue_after_final_validation(game_id):
    """Continue game after failed final validation - end of round like bluff."""
    if game_id not in games:
        return {"error": "No game in progress"}

    game_state = games[game_id]

    if game_state["phase"] != "final_validation_result":
        return {"error": "Not in final validation result phase"}

    player = game_state["final_player"]

    # Clear the board (cards are discarded)
    game_state["board"] = []

    # Player draws 2 new cards
    draw_new_cards(game_id, player, 2)

    # Clear validation state
    game_state["final_player"] = None
    game_state["capital_card"] = None
    game_state["final_validation_failed"] = None

    # Start new round with new category, other player starts
    other_player = 2 if player == 1 else 1
    start_new_round(game_id, other_player)

    return get_state(game_id)


def continue_after_bluff(game_id):
    """Continue game after bluff result has been shown."""
    if game_id not in games:
        return {"error": "No game in progress"}

    game_state = games[game_id]

    if game_state["phase"] != "bluff_result":
        return {"error": "Not in bluff result phase"}

    loser = game_state["bluff_loser"]

    # Clear the board (cards are discarded)
    game_state["board"] = []

    # Loser draws 2 new cards from available countries
    draw_new_cards(game_id, loser, 2)

    # Check if someone has won (no cards left) - unlikely after drawing but check anyway
    for player in [1, 2]:
        if len(game_state[f"player{player}_cards"]) == 0:
            game_state["phase"] = "game_over"
            game_state["winner"] = player
            set_message(game_state, "game_over_win", player=player)
            return get_state(game_id)

    # Start new round with new category and new reference card
    start_new_round(game_id, loser)

    return get_state(game_id)


def draw_new_cards(game_id, player, count):
    """Draw new cards for a player from available countries."""
    game_state = games[game_id]

    # Get all cards currently in players' hands
    player_cards = set(c["name"] for c in game_state["player1_cards"] + game_state["player2_cards"])

    # Get available countries (not in any player's hand)
    available = [c for c in COUNTRIES if c["name"] not in player_cards]

    # Draw up to 'count' cards
    cards_to_draw = min(count, len(available))
    if cards_to_draw > 0:
        new_cards = random.sample(available, cards_to_draw)
        game_state[f"player{player}_cards"].extend(new_cards)

def start_new_round(game_id, starting_player):
    """Start a new round with a new category."""
    game_state = games[game_id]

    # Pick new category (pure random, repetition allowed)
    category_pool = game_state.get("category_pool") or CATEGORIES
    new_category = pick_random_category(category_pool)

    # Pick a reference card from remaining countries (not in players' hands)
    player_cards = set(c["name"] for c in game_state["player1_cards"] + game_state["player2_cards"])
    available_countries = [c for c in COUNTRIES if c["name"] not in player_cards]

    if available_countries:
        reference_card = random.choice(available_countries)
    else:
        # If all countries are in hands, take one from loser's hand
        reference_card = game_state[f"player{starting_player}_cards"].pop(0)

    game_state["board"] = [reference_card]
    game_state["category"] = new_category
    game_state["category_label"] = get_category_label(new_category, get_language(game_id))
    game_state["current_player"] = starting_player
    game_state["phase"] = "playing"
    game_state["bluff_caller"] = None
    game_state["reveal_index"] = 0
    append_message(game_state, "new_category", category_id=new_category)

def check_capital_answer(game_id, player, answer):
    """Check if the capital answer is correct."""
    if game_id not in games:
        return {"error": "No game in progress"}

    game_state = games[game_id]

    if game_state["phase"] != "capital_check":
        return {"error": "Not in capital check phase"}

    # Use the stored capital_card (the card the player just placed)
    card = game_state.get("capital_card") or game_state["board"][-1]
    correct_capital = card["capital"]

    if check_capital(answer, correct_capital):
        game_state["phase"] = "game_over"
        game_state["winner"] = player
        set_message(game_state, "capital_correct", capital=correct_capital, player=player)
    else:
        # Wrong answer - enter validation phase where opponent can accept or refuse
        game_state["phase"] = "capital_validation"
        game_state["capital_answer"] = answer
        game_state["capital_player"] = player
        set_message(game_state, "capital_incorrect", answer=answer, capital=correct_capital)

    return get_state(game_id)


def validate_capital_decision(game_id, accepted):
    """Opponent decides if the capital answer is acceptable."""
    if game_id not in games:
        return {"error": "No game in progress"}

    game_state = games[game_id]

    if game_state["phase"] != "capital_validation":
        return {"error": "Not in capital validation phase"}

    player = game_state["capital_player"]
    # Use the stored capital_card
    card = game_state.get("capital_card") or game_state["board"][-1]
    correct_capital = card["capital"]

    if accepted:
        # Opponent accepts the answer
        game_state["phase"] = "game_over"
        game_state["winner"] = player
        set_message(game_state, "capital_accepted", player=player)
    else:
        # Opponent refuses - remove the capital_card from board and player draws 2 new cards
        if game_state.get("capital_card"):
            # Find and remove the capital_card from board
            game_state["board"] = [c for c in game_state["board"] if c["name"] != card["name"]]
        else:
            game_state["board"].pop()
        draw_new_cards(game_id, player, 2)
        game_state["phase"] = "playing"
        game_state["current_player"] = 2 if player == 1 else 1
        set_message(game_state, "capital_refused", capital=correct_capital, player=player)

    # Clear validation state
    game_state["capital_answer"] = None
    game_state["capital_player"] = None
    game_state["capital_card"] = None

    return get_state(game_id)
