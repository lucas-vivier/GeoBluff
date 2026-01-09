"""Game logic for GeoBluff."""
import json
import random
import unicodedata
from pathlib import Path

# Use countries.json for production, fallback to countries_test.json if needed
COUNTRIES_FILE = Path(__file__).parent / "countries.json"
FALLBACK_COUNTRIES_FILE = Path(__file__).parent / "countries_test.json"

DEFAULT_CATEGORIES = [
    {"id": "population", "label": "Population"},
    {"id": "area", "label": "Superficie (km²)"},
    {"id": "gdp", "label": "PIB ($)"},
]

CONFIG_FILE = Path(__file__).parent / "categories_config.json"


def load_categories_config(countries):
    if not CONFIG_FILE.exists():
        enabled = [c["id"] for c in DEFAULT_CATEGORIES]
        labels = {c["id"]: c["label"] for c in DEFAULT_CATEGORIES}
    else:
        with open(CONFIG_FILE, encoding="utf-8") as f:
            config = json.load(f)

        categories = config.get("categories", DEFAULT_CATEGORIES)
        enabled = config.get("enabled_categories") or [c["id"] for c in categories]
        labels = {c["id"]: c.get("label", c["id"]) for c in categories if c["id"] in enabled}

    if countries:
        available = set(countries[0].keys())
        enabled = [cat_id for cat_id in enabled if cat_id in available]
        labels = {cat_id: labels[cat_id] for cat_id in enabled}

    return enabled, labels

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
CATEGORIES, CATEGORY_LABELS = load_categories_config(COUNTRIES)

game_state = None

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

def new_game(cards_per_player=7):
    """Start a new game."""
    global game_state

    cards_per_player = max(3, min(cards_per_player, 10))

    category = random.choice(CATEGORIES)
    shuffled = random.sample(COUNTRIES, len(COUNTRIES))

    # Reference card (after player hands)
    ref_index = cards_per_player * 2
    reference_card = shuffled[ref_index]
    player1_cards = shuffled[:cards_per_player]
    player2_cards = shuffled[cards_per_player:cards_per_player * 2]

    game_state = {
        "category": category,
        "category_label": CATEGORY_LABELS[category],
        "player1_cards": player1_cards,
        "player2_cards": player2_cards,
        "board": [reference_card],  # Start with reference card on board
        "current_player": 1,
        "phase": "playing",  # playing, placing, bluff_reveal, capital_check, game_over
        "winner": None,
        "message": None,
        "bluff_caller": None,
        "reveal_index": 0,
        "pending_card": None,  # Card being placed (not yet validated)
        "pending_position": 0  # Index where card will be inserted (0 = leftmost)
    }

    return get_state()

def get_state():
    """Get current game state (hiding opponent's card values)."""
    if game_state is None:
        return None

    state = game_state.copy()
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

    return state

def change_category():
    """Change to a different category (only during playing phase with just reference card)."""
    global game_state

    if game_state is None:
        return {"error": "No game in progress"}

    if game_state["phase"] != "playing":
        return {"error": "Can only change category during playing phase"}

    # Only allow category change when board has just the reference card
    if len(game_state["board"]) > 1:
        return {"error": "Cannot change category after cards have been placed"}

    # Pick a different category
    old_category = game_state["category"]
    available = [c for c in CATEGORIES if c != old_category]
    new_category = random.choice(available)

    game_state["category"] = new_category
    game_state["category_label"] = CATEGORY_LABELS[new_category]
    game_state["message"] = f"Nouvelle catégorie : {CATEGORY_LABELS[new_category]}"

    return get_state()


def play_card(player, card_name):
    """Play a card from hand - enters placing phase."""
    global game_state

    if game_state is None:
        return {"error": "No game in progress"}

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
    game_state["message"] = "Choisissez la position puis validez"

    return get_state()

def set_position(position):
    """Change the position of the pending card (index)."""
    global game_state

    if game_state is None or game_state["phase"] != "placing":
        return {"error": "Not in placing phase"}

    # Position is an index from 0 to len(board)
    max_pos = len(game_state["board"])
    if not isinstance(position, int) or position < 0 or position > max_pos:
        return {"error": f"Position must be between 0 and {max_pos}"}

    game_state["pending_position"] = position
    return get_state()

def validate_placement():
    """Validate the card placement and end turn."""
    global game_state

    if game_state is None or game_state["phase"] != "placing":
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
        game_state["message"] = "Validation finale - cliquez sur les cartes pour les révéler"
        return get_state()

    # Switch player
    game_state["current_player"] = 2 if player == 1 else 1
    game_state["phase"] = "playing"
    game_state["message"] = None

    return get_state()

def cancel_placement():
    """Cancel placement and return card to hand."""
    global game_state

    if game_state is None or game_state["phase"] != "placing":
        return {"error": "Not in placing phase"}

    player = game_state["current_player"]
    card = game_state["pending_card"]

    # Return card to hand
    game_state[f"player{player}_cards"].append(card)
    game_state["pending_card"] = None
    game_state["pending_position"] = None
    game_state["phase"] = "playing"
    game_state["message"] = None

    return get_state()

def call_bluff(player):
    """Call bluff on the last played card."""
    global game_state

    if game_state is None:
        return {"error": "No game in progress"}

    if game_state["phase"] != "playing":
        return {"error": "Cannot call bluff now"}

    if len(game_state["board"]) < 2:
        return {"error": "Need at least 2 cards on board"}

    if game_state["current_player"] != player:
        return {"error": "Not your turn"}

    game_state["phase"] = "bluff_reveal"
    game_state["bluff_caller"] = player
    game_state["reveal_index"] = 0
    game_state["message"] = "Cliquez sur les cartes pour les révéler"

    return get_state()

def reveal_card(index):
    """Reveal a specific card during bluff check or final validation."""
    global game_state

    if game_state is None or game_state["phase"] not in ("bluff_reveal", "final_validation"):
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
            return check_bluff_result()
        else:
            return check_final_validation_result()

    return get_state()

def check_bluff_result():
    """Check if bluff was correct after all cards revealed - enter result phase."""
    global game_state

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
        game_state["message"] = f"Tout était en ordre ! L'équipe {bluff_caller} piochera 2 cartes."
    else:
        # Order was wrong, bluff caller wins
        loser = 2 if bluff_caller == 1 else 1
        game_state["message"] = f"Bien vu ! Le bluff est démasqué ! L'équipe {loser} piochera 2 cartes."

    # Enter result phase - wait for user to click continue
    game_state["phase"] = "bluff_result"
    game_state["bluff_loser"] = loser

    return get_state()


def check_final_validation_result():
    """Check if order is correct after final validation - either ask capital or penalize."""
    global game_state

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
        game_state["message"] = f"Ordre correct ! L'équipe {player} doit entrer la capitale de {card['name']}"
    else:
        # Order wrong - player draws 2 cards, enter result phase
        game_state["phase"] = "final_validation_result"
        game_state["final_validation_failed"] = True
        game_state["message"] = f"Mauvais ordre ! L'équipe {player} piochera 2 cartes."

    return get_state()


def continue_after_final_validation():
    """Continue game after failed final validation - end of round like bluff."""
    global game_state

    if game_state is None:
        return {"error": "No game in progress"}

    if game_state["phase"] != "final_validation_result":
        return {"error": "Not in final validation result phase"}

    player = game_state["final_player"]

    # Clear the board (cards are discarded)
    game_state["board"] = []

    # Player draws 2 new cards
    draw_new_cards(player, 2)

    # Clear validation state
    game_state["final_player"] = None
    game_state["capital_card"] = None
    game_state["final_validation_failed"] = None

    # Start new round with new category, other player starts
    other_player = 2 if player == 1 else 1
    start_new_round(other_player)

    return get_state()


def continue_after_bluff():
    """Continue game after bluff result has been shown."""
    global game_state

    if game_state is None:
        return {"error": "No game in progress"}

    if game_state["phase"] != "bluff_result":
        return {"error": "Not in bluff result phase"}

    loser = game_state["bluff_loser"]

    # Clear the board (cards are discarded)
    game_state["board"] = []

    # Loser draws 2 new cards from available countries
    draw_new_cards(loser, 2)

    # Check if someone has won (no cards left) - unlikely after drawing but check anyway
    for player in [1, 2]:
        if len(game_state[f"player{player}_cards"]) == 0:
            game_state["phase"] = "game_over"
            game_state["winner"] = player
            game_state["message"] = f"L'équipe {player} gagne la partie !"
            return get_state()

    # Start new round with new category and new reference card
    start_new_round(loser)

    return get_state()


def draw_new_cards(player, count):
    """Draw new cards for a player from available countries."""
    global game_state

    # Get all cards currently in players' hands
    player_cards = set(c["name"] for c in game_state["player1_cards"] + game_state["player2_cards"])

    # Get available countries (not in any player's hand)
    available = [c for c in COUNTRIES if c["name"] not in player_cards]

    # Draw up to 'count' cards
    cards_to_draw = min(count, len(available))
    if cards_to_draw > 0:
        new_cards = random.sample(available, cards_to_draw)
        game_state[f"player{player}_cards"].extend(new_cards)

def start_new_round(starting_player):
    """Start a new round with a new category."""
    global game_state

    # Pick new category (different from current)
    old_category = game_state["category"]
    available = [c for c in CATEGORIES if c != old_category]
    new_category = random.choice(available)

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
    game_state["category_label"] = CATEGORY_LABELS[new_category]
    game_state["current_player"] = starting_player
    game_state["phase"] = "playing"
    game_state["bluff_caller"] = None
    game_state["reveal_index"] = 0
    game_state["message"] += f" Nouvelle catégorie : {CATEGORY_LABELS[new_category]}"

def check_capital_answer(player, answer):
    """Check if the capital answer is correct."""
    global game_state

    if game_state is None:
        return {"error": "No game in progress"}

    if game_state["phase"] != "capital_check":
        return {"error": "Not in capital check phase"}

    # Use the stored capital_card (the card the player just placed)
    card = game_state.get("capital_card") or game_state["board"][-1]
    correct_capital = card["capital"]

    if check_capital(answer, correct_capital):
        game_state["phase"] = "game_over"
        game_state["winner"] = player
        game_state["message"] = f"Bravo ! {correct_capital} est correct. L'équipe {player} gagne !"
    else:
        # Wrong answer - enter validation phase where opponent can accept or refuse
        game_state["phase"] = "capital_validation"
        game_state["capital_answer"] = answer
        game_state["capital_player"] = player
        game_state["message"] = f"Reponse: '{answer}'. La vraie capitale est '{correct_capital}'. L'adversaire peut accepter ou refuser."

    return get_state()


def validate_capital_decision(accepted):
    """Opponent decides if the capital answer is acceptable."""
    global game_state

    if game_state is None:
        return {"error": "No game in progress"}

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
        game_state["message"] = f"L'adversaire a accepte ! L'équipe {player} gagne !"
    else:
        # Opponent refuses - remove the capital_card from board and player draws 2 new cards
        if game_state.get("capital_card"):
            # Find and remove the capital_card from board
            game_state["board"] = [c for c in game_state["board"] if c["name"] != card["name"]]
        else:
            game_state["board"].pop()
        draw_new_cards(player, 2)
        game_state["phase"] = "playing"
        game_state["current_player"] = 2 if player == 1 else 1
        game_state["message"] = f"Refuse ! La capitale etait {correct_capital}. L'équipe {player} pioche 2 cartes."

    # Clear validation state
    game_state["capital_answer"] = None
    game_state["capital_player"] = None
    game_state["capital_card"] = None

    return get_state()
