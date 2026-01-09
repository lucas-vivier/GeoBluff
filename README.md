# GeoBluff

A geography-themed bluffing card game where two teams compete to get rid of their cards by placing them in order based on country statistics (population, area, or GDP).

## Game Rules

**Objective:** Be the first team to get rid of all your cards.

### How to Play

1. A random category is chosen: Population, Area (km²), or GDP ($)
2. A reference card is placed in the center
3. Players take turns placing cards on the board
4. Cards must be ordered from highest value (left) to lowest value (right)
5. You can bluff by placing a card in the wrong position!

### Calling a Bluff

- If you think the order is wrong, call "BLUFF!"
- All cards are revealed
- If the order was correct: you draw 2 new cards
- If the order was wrong: your opponent draws 2 new cards
- A new round begins with a new category

### Winning

- When you place your last card, you must name its capital
- Correct answer = Victory!
- Your opponent can accept close answers (e.g., "Pekin" instead of "Beijing")
- Wrong answer refused = you draw 2 new cards

## Installation

```bash
pip install -r requirements.txt
```

## Running the Game

```bash
uvicorn main:app --reload
```

Then open http://localhost:8000

## Data Generation

To regenerate country data from REST Countries API and World Bank API:

```bash
pip install requests
python generate_countries.py
```

This creates `countries.json` with ~195 countries containing name, capital, flag emoji, population, area, and GDP.

## Project Structure

```
geobluff/
├── main.py              # FastAPI app and routes
├── game.py              # Game logic
├── countries.json       # Country data
├── generate_countries.py # Script to generate country data
├── static/
│   ├── style.css
│   └── app.js
├── templates/
│   └── index.html
└── requirements.txt
```

## Tech Stack

- **Backend:** FastAPI (Python)
- **Frontend:** Vanilla JS, CSS
- **Data:** REST Countries API, World Bank API

## Data Sources

- Country information: [REST Countries API](https://restcountries.com/)
- Statistics: World Bank 2023
