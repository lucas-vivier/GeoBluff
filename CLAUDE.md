# CLAUDE.md - Instructions pour GeoBluff

## Philosophie
Ce projet doit rester SIMPLE. Privilégier toujours la solution la plus directe.

## Règles de développement

### Code
- Pas de sur-ingénierie : une fonction = une tâche
- Pas de classes abstraites inutiles
- Commentaires uniquement si le code n'est pas évident
- Docstrings simples (une ligne) sauf fonctions complexes
- Noms de variables explicites en anglais

### Frontend
- Vanilla JS uniquement (pas de React, Vue, etc.)
- CSS simple, pas de framework (pas de Tailwind, Bootstrap)
- Mobile-first : tester sur petit écran d'abord
- Animations CSS simples (transitions), pas de librairies

### Backend
- FastAPI avec le minimum de routes nécessaires
- État du jeu en mémoire (dict Python), pas de base de données
- Une seule partie à la fois (MVP)

### Fichiers
- Éviter de multiplier les fichiers inutilement
- Tout le JS dans un seul fichier app.js
- Tout le CSS dans un seul fichier style.css

### Données pays
- Un seul fichier countries.json
- Utiliser les emoji drapeaux (ex: 🇫🇷) plutôt que des images

### UX
- Maximum 2 clics pour toute action
- Textes courts sur les boutons
- Feedback visuel immédiat (couleurs, animations légères)
- Pas de modales sauf pour la saisie de capitale

### Ce qu'on NE fait PAS dans le MVP
- Pas de compte utilisateur
- Pas de sauvegarde de parties
- Pas de multijoueur en réseau
- Pas de sons
- Pas de scores/classements
- Pas de paramètres personnalisables

## Commandes utiles
```bash
# Installation
pip install -r requirements.txt

# Lancement
uvicorn main:app --reload

# Test
ouvrir http://localhost:8000
```

## Structure
```
geobluff/
├── main.py           # App FastAPI + routes
├── game.py           # Logique du jeu
├── countries.json    # Données pays
├── static/
│   ├── style.css
│   └── app.js
├── templates/
│   └── index.html
├── requirements.txt
└── CLAUDE.md
```
