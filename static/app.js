// GeoBluff - Main JavaScript

let gameState = null;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');
const bluffBtn = document.getElementById('bluff-btn');
const turnIndicator = document.getElementById('turn-indicator');
const messageArea = document.getElementById('message-area');
const categoryName = document.getElementById('category-name');
const player1Cards = document.getElementById('player1-cards');
const player2Cards = document.getElementById('player2-cards');
const boardCards = document.getElementById('board-cards');
const boardArea = document.getElementById('board-area');
const capitalModal = document.getElementById('capital-modal');
const capitalCountry = document.getElementById('capital-country');
const capitalInput = document.getElementById('capital-input');
const capitalSubmit = document.getElementById('capital-submit');
const gameoverModal = document.getElementById('gameover-modal');
const winnerText = document.getElementById('winner-text');
const gameoverMessage = document.getElementById('gameover-message');
const restartBtn = document.getElementById('restart-btn');
const actionBar = document.getElementById('action-bar');
const placingBar = document.getElementById('placing-bar');
const cancelBtn = document.getElementById('cancel-btn');
const validateBtn = document.getElementById('validate-btn');
const revealBar = document.getElementById('reveal-bar');
const revealBtn = document.getElementById('reveal-btn');
const revealCurrent = document.getElementById('reveal-current');
const revealTotal = document.getElementById('reveal-total');
const rulesBtn = document.getElementById('rules-btn');
const rulesModal = document.getElementById('rules-modal');
const closeRulesBtn = document.getElementById('close-rules-btn');

// API calls
async function api(endpoint, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`/api/${endpoint}`, options);
    return res.json();
}

// Format numbers for display
function formatValue(value, category) {
    if (category === 'population') {
        if (value >= 1e9) return (value / 1e9).toFixed(1) + ' Mrd';
        if (value >= 1e6) return (value / 1e6).toFixed(1) + ' M';
        if (value >= 1e3) return (value / 1e3).toFixed(0) + ' k';
        return value.toString();
    }
    if (category === 'area') {
        if (value >= 1e6) return (value / 1e6).toFixed(2) + ' M km²';
        if (value >= 1e3) return (value / 1e3).toFixed(0) + 'k km²';
        return value + ' km²';
    }
    if (category === 'gdp') {
        if (value >= 1e12) return (value / 1e12).toFixed(1) + ' T$';
        if (value >= 1e9) return (value / 1e9).toFixed(0) + ' Mrd$';
        if (value >= 1e6) return (value / 1e6).toFixed(0) + ' M$';
        return value + ' $';
    }
    return value.toString();
}

// Create card element
function createCard(card, options = {}) {
    const { isActive = false, showValue = false, isReference = false, isPending = false } = options;

    const div = document.createElement('div');
    div.className = 'card';
    if (isReference) div.classList.add('reference');
    if (isPending) div.classList.add('pending');
    div.dataset.name = card.name;

    const flag = document.createElement('div');
    flag.className = 'flag';
    flag.textContent = card.flag;

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = card.name;

    div.appendChild(flag);
    div.appendChild(name);

    if (showValue && card.value !== undefined) {
        const value = document.createElement('div');
        value.className = 'value';
        value.textContent = formatValue(card.value, gameState.category);
        div.appendChild(value);
    }

    if (isActive) {
        div.addEventListener('click', () => selectAndPlayCard(card));
    }

    return div;
}

// Create slot element for placement
function createSlot(index, isActive) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    if (isActive) slot.classList.add('active');

    const arrow = document.createElement('span');
    arrow.className = 'slot-arrow';
    arrow.textContent = '↓';
    slot.appendChild(arrow);

    slot.addEventListener('click', () => setPosition(index));

    return slot;
}

// Select and play card (enter placing phase)
async function selectAndPlayCard(card) {
    if (gameState.phase !== 'playing') return;

    const result = await api('play-card', 'POST', {
        player: gameState.current_player,
        card_name: card.name
    });

    if (!result.error) {
        gameState = result;
        render();
    }
}

// Set position for pending card (index)
async function setPosition(position) {
    if (gameState.phase !== 'placing') return;

    const result = await api('set-position', 'POST', { position });

    if (!result.error) {
        gameState = result;
        render();
    }
}

// Validate placement
async function validatePlacement() {
    if (gameState.phase !== 'placing') return;

    const result = await api('validate-placement', 'POST');

    if (!result.error) {
        gameState = result;
        render();
    }
}

// Cancel placement
async function cancelPlacement() {
    if (gameState.phase !== 'placing') return;

    const result = await api('cancel-placement', 'POST');

    if (!result.error) {
        gameState = result;
        render();
    }
}

// Call bluff
async function callBluff() {
    if (gameState.phase !== 'playing') return;
    if (gameState.board.length < 2) return;

    const result = await api('call-bluff', 'POST', {
        player: gameState.current_player
    });

    if (!result.error) {
        gameState = result;
        render();
    }
}

// Reveal card during bluff
async function revealCard() {
    if (gameState.phase !== 'bluff_reveal') return;

    const result = await api('reveal-card', 'POST');

    if (!result.error) {
        gameState = result;
        render();
    }
}

// Submit capital answer
async function submitCapital() {
    const answer = capitalInput.value.trim();
    if (!answer) return;

    const currentPlayer = gameState.player1_cards.length === 0 ? 1 : 2;

    const result = await api('check-capital', 'POST', {
        player: currentPlayer,
        answer: answer
    });

    if (!result.error) {
        gameState = result;
        capitalInput.value = '';
        render();
    }
}

// Render game state
function render() {
    if (!gameState) return;

    console.log('Render state:', gameState.phase, 'Player:', gameState.current_player);

    // Update category
    categoryName.textContent = gameState.category_label;

    // Update turn indicator
    turnIndicator.textContent = `Tour: Joueur ${gameState.current_player}`;
    turnIndicator.className = gameState.current_player === 2 ? 'player2' : '';

    // Update player areas
    const isPlaying = gameState.phase === 'playing';
    document.querySelector('.player1-area').classList.toggle('active', gameState.current_player === 1 && isPlaying);
    document.querySelector('.player2-area').classList.toggle('active', gameState.current_player === 2 && isPlaying);

    // Render player 1 cards (never show values in hand)
    player1Cards.innerHTML = '';
    gameState.player1_cards.forEach(card => {
        const isActive = gameState.current_player === 1 && gameState.phase === 'playing';
        player1Cards.appendChild(createCard(card, { isActive, showValue: false }));
    });

    // Render player 2 cards (never show values in hand)
    player2Cards.innerHTML = '';
    gameState.player2_cards.forEach(card => {
        const isActive = gameState.current_player === 2 && gameState.phase === 'playing';
        player2Cards.appendChild(createCard(card, { isActive, showValue: false }));
    });

    // Render board
    boardCards.innerHTML = '';

    if (gameState.phase === 'placing' && gameState.pending_card) {
        // Placing phase: show slots between cards
        const pendingPos = gameState.pending_position;
        const boardLength = gameState.board.length;

        for (let i = 0; i <= boardLength; i++) {
            // Add slot before card at index i
            const slotActive = (i === pendingPos);
            boardCards.appendChild(createSlot(i, slotActive));

            // Add card if exists
            if (i < boardLength) {
                const card = gameState.board[i];
                const isReference = card.is_reference || false;
                boardCards.appendChild(createCard(card, { isReference }));
            }
        }

        // Show pending card preview at selected position
        // We rebuild with the card inserted visually
        boardCards.innerHTML = '';
        for (let i = 0; i <= boardLength; i++) {
            // Slot
            const slotActive = (i === pendingPos);
            boardCards.appendChild(createSlot(i, slotActive));

            // If this is where pending card goes, show it
            if (i === pendingPos) {
                boardCards.appendChild(createCard(gameState.pending_card, { isPending: true }));
            }

            // Board card
            if (i < boardLength) {
                const card = gameState.board[i];
                const isReference = card.is_reference || false;
                boardCards.appendChild(createCard(card, { isReference }));
            }
        }
    } else if (gameState.phase === 'bluff_reveal') {
        // Bluff reveal: show cards, revealed ones show value
        gameState.board.forEach((card, index) => {
            const isReference = card.is_reference || false;
            const showValue = card.revealed || false;
            const cardEl = createCard(card, { showValue, isReference });

            if (card.revealed) {
                cardEl.classList.add('revealed');
            }

            boardCards.appendChild(cardEl);
        });
    } else {
        // Normal display
        gameState.board.forEach((card, index) => {
            const isReference = card.is_reference || false;
            const showValue = card.revealed || (gameState.phase === 'game_over');
            boardCards.appendChild(createCard(card, { isReference, showValue }));
        });
    }

    // Show/hide action bars
    actionBar.classList.add('hidden');
    placingBar.classList.add('hidden');
    revealBar.classList.add('hidden');

    if (gameState.phase === 'placing') {
        placingBar.classList.remove('hidden');
    } else if (gameState.phase === 'bluff_reveal') {
        revealBar.classList.remove('hidden');
        revealCurrent.textContent = gameState.reveal_index;
        revealTotal.textContent = gameState.board.length;
    } else {
        actionBar.classList.remove('hidden');
    }

    // Update bluff button - only enabled when there are at least 2 cards on board
    bluffBtn.disabled = gameState.phase !== 'playing' || gameState.board.length < 2;

    // Show/hide modals
    if (gameState.phase === 'capital_check') {
        const lastCard = gameState.board[gameState.board.length - 1];
        capitalCountry.textContent = `${lastCard.flag} ${lastCard.name}`;
        capitalModal.classList.remove('hidden');
        capitalInput.focus();
    } else {
        capitalModal.classList.add('hidden');
    }

    if (gameState.phase === 'game_over') {
        winnerText.textContent = `Joueur ${gameState.winner} gagne !`;
        gameoverMessage.textContent = gameState.message;
        gameoverModal.classList.remove('hidden');
    } else {
        gameoverModal.classList.add('hidden');
    }

    // Show message if any
    if (gameState.message && gameState.phase !== 'game_over' && gameState.phase !== 'capital_check' && gameState.phase !== 'placing') {
        messageArea.textContent = gameState.message;
        messageArea.classList.remove('hidden');
    } else {
        messageArea.classList.add('hidden');
    }
}

// Start new game
async function startGame() {
    gameState = await api('new-game', 'POST');
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    render();
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
bluffBtn.addEventListener('click', callBluff);
capitalSubmit.addEventListener('click', submitCapital);
capitalInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitCapital();
});

// Placing phase buttons
cancelBtn.addEventListener('click', cancelPlacement);
validateBtn.addEventListener('click', validatePlacement);

// Reveal phase button
revealBtn.addEventListener('click', revealCard);

// Rules modal
rulesBtn.addEventListener('click', () => {
    rulesModal.classList.remove('hidden');
});

closeRulesBtn.addEventListener('click', () => {
    rulesModal.classList.add('hidden');
});

rulesModal.addEventListener('click', (e) => {
    if (e.target === rulesModal) {
        rulesModal.classList.add('hidden');
    }
});
