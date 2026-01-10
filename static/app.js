// GeoBluff - Main JavaScript

let gameState = null;
let toastTimeout = null;
let isLoading = false;
let gameId = null;
let revealEnabled = true;

// Get game_id from URL if present
function getGameIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('game');
}

// Update URL with game_id
function updateUrlWithGameId(id) {
    const url = new URL(window.location);
    url.searchParams.set('game', id);
    window.history.replaceState({}, '', url);
}

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
const capitalSkip = document.getElementById('capital-skip');
const gameoverModal = document.getElementById('gameover-modal');
const winnerText = document.getElementById('winner-text');
const gameoverMessage = document.getElementById('gameover-message');
const restartBtn = document.getElementById('restart-btn');
const actionBar = document.getElementById('action-bar');
const placingBar = document.getElementById('placing-bar');
const cancelBtn = document.getElementById('cancel-btn');
const validateBtn = document.getElementById('validate-btn');
const rulesBtn = document.getElementById('rules-btn');
const rulesModal = document.getElementById('rules-modal');
const rulesContent = document.getElementById('rules-content');
const closeRulesBtn = document.getElementById('close-rules-btn');
const restartGameBtn = document.getElementById('restart-game-btn');
const capitalValidationModal = document.getElementById('capital-validation-modal');
const capitalValidationText = document.getElementById('capital-validation-text');
const capitalAcceptBtn = document.getElementById('capital-accept-btn');
const capitalRefuseBtn = document.getElementById('capital-refuse-btn');
const changeCategoryBtn = document.getElementById('change-category-btn');
const bluffResultBar = document.getElementById('bluff-result-bar');
const bluffResultMessage = document.getElementById('bluff-result-message');
const continueBtn = document.getElementById('continue-btn');
const homeBtn = document.getElementById('home-btn');
const cardsCountSelect = document.getElementById('cards-count');
const lastCapitalDiv = document.getElementById('last-capital');
const languageBtn = document.getElementById('language-btn');

let currentLanguage = 'fr';

const translations = {
    fr: {
        subtitle: 'Jeu de géographie pour deux équipes',
        start_description: 'Placez vos cartes du plus grand au plus petit et appelez le bluff au bon moment.',
        chip_population: '👥 Population',
        chip_area: '📐 Superficie',
        chip_gdp: '💰 PIB',
        chip_life_expectancy: '❤️ Espérance de vie',
        chip_density: '🏘️ Densité',
        chip_internet: '🌐 Internet',
        chip_electricity: '💡 Électricité',
        chip_unemployment: '📉 Chômage',
        chip_north_south: '🧭 Nord/Sud',
        chip_east_west: '🧭 Est/Ouest',
        cards_label: 'Cartes par équipe :',
        start_button: 'Nouvelle Partie',
        home_title: 'Retour au menu',
        restart_title: 'Recommencer',
        rules_title: 'Règles',
        change_category_title: 'Changer de catégorie',
        team_1_label: 'équipe 1',
        team_2_label: 'équipe 2',
        bluff_button: 'BLUFF !',
        bluff_title: "Posez d'abord une carte",
        turn_indicator: 'Tour: équipe {team}',
        cancel_button: 'Annuler',
        placing_hint: 'Cliquez entre les cartes',
        validate_button: 'Valider',
        continue_button: 'Continuer',
        capital_prompt: 'Entrez la capitale',
        capital_placeholder: 'Capitale...',
        dont_know_button: 'Je ne sais pas',
        replay_button: 'Rejouer',
        capital_validation_title: 'Validation de la capitale',
        accept_button: 'Accepter',
        refuse_button: 'Refuser',
        rules_title_text: 'Regles du jeu',
        close_rules_button: 'Compris !',
        small: 'Petit',
        big: 'Grand',
        north: 'Nord',
        south: 'Sud',
        east: 'Est',
        west: 'Ouest',
        switch_to_en: 'Passer en anglais',
        switch_to_fr: 'Passer en français',
        winner_text: "L'équipe {team} gagne !"
    },
    en: {
        subtitle: 'Geography game for two teams',
        start_description: 'Place your cards from largest to smallest and call the bluff at the right time.',
        chip_population: '👥 Population',
        chip_area: '📐 Area',
        chip_gdp: '💰 GDP',
        chip_life_expectancy: '❤️ Life expectancy',
        chip_density: '🏘️ Density',
        chip_internet: '🌐 Internet',
        chip_electricity: '💡 Electricity',
        chip_unemployment: '📉 Unemployment',
        chip_north_south: '🧭 North/South',
        chip_east_west: '🧭 East/West',
        cards_label: 'Cards per team:',
        start_button: 'New Game',
        home_title: 'Back to menu',
        restart_title: 'Restart',
        rules_title: 'Rules',
        change_category_title: 'Change category',
        team_1_label: 'team 1',
        team_2_label: 'team 2',
        bluff_button: 'BLUFF!',
        bluff_title: 'Play a card first',
        turn_indicator: 'Turn: team {team}',
        cancel_button: 'Cancel',
        placing_hint: 'Click between cards',
        validate_button: 'Confirm',
        continue_button: 'Continue',
        capital_prompt: 'Enter the capital',
        capital_placeholder: 'Capital...',
        dont_know_button: "Don't know",
        replay_button: 'Play again',
        capital_validation_title: 'Capital validation',
        accept_button: 'Accept',
        refuse_button: 'Refuse',
        rules_title_text: 'Game rules',
        close_rules_button: 'Got it!',
        small: 'Small',
        big: 'Big',
        north: 'North',
        south: 'South',
        east: 'East',
        west: 'West',
        switch_to_en: 'Switch to English',
        switch_to_fr: 'Switch to French',
        winner_text: 'Team {team} wins!'
    }
};

function t(key, params = {}) {
    const bundle = translations[currentLanguage] || translations.fr;
    const template = bundle[key] || translations.fr[key] || key;
    return template.replace(/\{(\w+)\}/g, (_, token) => {
        return params[token] !== undefined ? params[token] : `{${token}}`;
    });
}

function applyTranslations() {
    document.documentElement.lang = currentLanguage;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
        el.title = t(el.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    if (languageBtn) {
        const target = currentLanguage === 'fr' ? 'en' : 'fr';
        languageBtn.textContent = target === 'en' ? '🇬🇧' : '🇫🇷';
        languageBtn.title = currentLanguage === 'fr' ? t('switch_to_en') : t('switch_to_fr');
    }
}

async function syncLanguage() {
    try {
        const result = await api('set-language', 'POST', { game_id: gameId, language: currentLanguage });
        if (result && result.category) {
            gameState = result;
            render();
        }
    } catch (err) {
        console.error('Error setting language:', err);
    }
}

function setLanguage(language) {
    currentLanguage = language;
    localStorage.setItem('language', language);
    applyTranslations();
    syncLanguage();
}

// API calls
async function api(endpoint, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`/api/${endpoint}`, options);
    return res.json();
}

// Format hemisphere values with sign and direction
function formatHemisphere(value, positiveLabel, negativeLabel) {
    const num = Number(value);
    if (Number.isNaN(num)) return value.toString();
    const sign = num >= 0 ? '+' : '-';
    const label = num >= 0 ? positiveLabel : negativeLabel;
    const absVal = Math.abs(num);
    const formatted = absVal.toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted} ${label}`;
}

// Format numbers for display
function formatValue(value, category) {
    const num = Number(value);
    const units = currentLanguage === 'en' ? {
        population: { billion: ' B', million: ' M', thousand: ' k' },
        area: { million: ' M km²', thousand: 'k km²', unit: ' km²' },
        gdp: { trillion: ' T$', billion: ' B$', million: ' M$', unit: ' $' },
        life_expectancy: ' yrs',
        co2_per_capita: ' t',
        population_density: ' people/km²',
        percent: ' %'
    } : {
        population: { billion: ' Mrd', million: ' M', thousand: ' k' },
        area: { million: ' M km²', thousand: 'k km²', unit: ' km²' },
        gdp: { trillion: ' T$', billion: ' Mrd$', million: ' M$', unit: ' $' },
        life_expectancy: ' ans',
        co2_per_capita: ' t',
        population_density: ' hab/km²',
        percent: ' %'
    };

    if (category === 'population') {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + units.population.billion;
        if (num >= 1e6) return (num / 1e6).toFixed(1) + units.population.million;
        if (num >= 1e3) return (num / 1e3).toFixed(0) + units.population.thousand;
        return num.toString();
    }
    if (category === 'area') {
        if (num >= 1e6) return (num / 1e6).toFixed(2) + units.area.million;
        if (num >= 1e3) return (num / 1e3).toFixed(0) + units.area.thousand;
        return num + units.area.unit;
    }
    if (category === 'gdp') {
        if (num >= 1e12) return (num / 1e12).toFixed(1) + units.gdp.trillion;
        if (num >= 1e9) return (num / 1e9).toFixed(0) + units.gdp.billion;
        if (num >= 1e6) return (num / 1e6).toFixed(0) + units.gdp.million;
        return num + units.gdp.unit;
    }
    if (category === 'life_expectancy') {
        return num.toFixed(1) + units.life_expectancy;
    }
    if (category === 'co2_per_capita') {
        return num.toFixed(2) + units.co2_per_capita;
    }
    if (category === 'population_density') {
        return num.toFixed(1) + units.population_density;
    }
    if (category === 'inflation') {
        return num.toFixed(1) + units.percent;
    }
    if (category === 'internet_users') {
        return num.toFixed(1) + units.percent;
    }
    if (category === 'electricity_access') {
        return num.toFixed(1) + units.percent;
    }
    if (category === 'unemployment') {
        return num.toFixed(1) + units.percent;
    }
    if (category === 'north_south') {
        return formatHemisphere(value, 'N', 'S');
    }
    if (category === 'east_west') {
        return formatHemisphere(value, 'E', 'W');
    }
    return value.toString();
}

// Create card element
function createCard(card, options = {}) {
    const { isActive = false, showValue = false, isReference = false, isPending = false, canReveal = false, cardIndex = -1 } = options;

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

    if (canReveal) {
        div.classList.add('clickable');
        div.addEventListener('click', () => revealCardByIndex(cardIndex));
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
    if (gameState.phase !== 'playing' || isLoading) return;

    isLoading = true;
    const result = await api('play-card', 'POST', {
        game_id: gameId,
        player: gameState.current_player,
        card_name: card.name
    });
    isLoading = false;

    if (!result.error) {
        gameState = result;
        render();
    }
}

// Set position for pending card (index)
async function setPosition(position) {
    if (gameState.phase !== 'placing' || isLoading) return;

    isLoading = true;
    const result = await api('set-position', 'POST', { game_id: gameId, position });
    isLoading = false;

    if (!result.error) {
        gameState = result;
        render();
    }
}

// Validate placement
async function validatePlacement() {
    if (gameState.phase !== 'placing') return;

    const result = await api('validate-placement', 'POST', { game_id: gameId });

    if (!result.error) {
        gameState = result;
        render();
    }
}

// Cancel placement
async function cancelPlacement() {
    if (gameState.phase !== 'placing') return;

    const result = await api('cancel-placement', 'POST', { game_id: gameId });

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
        game_id: gameId,
        player: gameState.current_player
    });

    if (!result.error) {
        gameState = result;
        // Disable reveals briefly to prevent accidental clicks
        revealEnabled = false;
        render();
        setTimeout(() => { revealEnabled = true; }, 300);
    }
}

// Reveal card during bluff or final validation (by clicking on it)
async function revealCardByIndex(index) {
    if (!revealEnabled) return;
    if (gameState.phase !== 'bluff_reveal' && gameState.phase !== 'final_validation') return;

    const result = await api('reveal-card', 'POST', { game_id: gameId, index });

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
        game_id: gameId,
        player: currentPlayer,
        answer: answer
    });

    if (!result.error) {
        gameState = result;
        capitalInput.value = '';
        render();
    }
}

// Skip capital (don't know)
async function skipCapital() {
    const currentPlayer = gameState.player1_cards.length === 0 ? 1 : 2;

    const result = await api('check-capital', 'POST', {
        game_id: gameId,
        player: currentPlayer,
        answer: ''
    });

    if (!result.error) {
        gameState = result;
        capitalInput.value = '';
        render();
    }
}

// Capital validation decision (opponent accepts or refuses)
async function capitalDecision(accepted) {
    const result = await api('capital-decision', 'POST', { game_id: gameId, accepted });

    if (!result.error) {
        gameState = result;
        render();
    }
}

// Change category
async function changeCategory() {
    const result = await api('change-category', 'POST', { game_id: gameId });

    if (!result.error) {
        gameState = result;
        render();
    }
}

// Continue after bluff result or final validation result
async function continueAfterResult() {
    let endpoint = 'continue-after-bluff';
    if (gameState.phase === 'final_validation_result') {
        endpoint = 'continue-after-final-validation';
    }

    const result = await api(endpoint, 'POST', { game_id: gameId });

    if (!result.error) {
        gameState = result;
        render();
    }
}

// Render game state
function render() {
    if (!gameState) return;

    console.log('Render state:', gameState.phase, 'Player:', gameState.current_player);

    // Update category
    categoryName.textContent = gameState.category_label;

    // Update board indicators based on category
    const minusIndicator = document.querySelector('.board-indicator.minus');
    const plusIndicator = document.querySelector('.board-indicator.plus');

    if (gameState.category === 'north_south') {
        minusIndicator.querySelector('.icon').textContent = '↓';
        minusIndicator.querySelector('.label').textContent = t('south');
        plusIndicator.querySelector('.icon').textContent = '↑';
        plusIndicator.querySelector('.label').textContent = t('north');
    } else if (gameState.category === 'east_west') {
        minusIndicator.querySelector('.icon').textContent = '←';
        minusIndicator.querySelector('.label').textContent = t('west');
        plusIndicator.querySelector('.icon').textContent = '→';
        plusIndicator.querySelector('.label').textContent = t('east');
    } else {
        minusIndicator.querySelector('.icon').textContent = '-';
        minusIndicator.querySelector('.label').textContent = t('small');
        plusIndicator.querySelector('.icon').textContent = '+';
        plusIndicator.querySelector('.label').textContent = t('big');
    }

    // Clear last capital display (not used anymore)
    lastCapitalDiv.textContent = '';

    // Update turn indicator
    turnIndicator.textContent = t('turn_indicator', { team: gameState.current_player });
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
    } else if (gameState.phase === 'bluff_reveal' || gameState.phase === 'final_validation') {
        // Bluff reveal or final validation: click on cards to reveal them
        gameState.board.forEach((card, index) => {
            const isReference = card.is_reference || false;
            const isRevealed = card.revealed || false;
            const canReveal = !isRevealed;
            const cardEl = createCard(card, {
                showValue: isRevealed,
                isReference,
                canReveal,
                cardIndex: index
            });

            if (isRevealed) {
                cardEl.classList.add('revealed');
            }

            boardCards.appendChild(cardEl);
        });
    } else if (gameState.phase === 'bluff_result' || gameState.phase === 'final_validation_result') {
        // Bluff result or final validation result: show all cards with values (all revealed)
        gameState.board.forEach((card, index) => {
            const isReference = card.is_reference || false;
            const cardEl = createCard(card, { showValue: true, isReference });
            cardEl.classList.add('revealed');
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
    bluffResultBar.classList.add('hidden');

    if (gameState.phase === 'placing') {
        placingBar.classList.remove('hidden');
    } else if (gameState.phase === 'bluff_result' || gameState.phase === 'final_validation_result') {
        bluffResultBar.classList.remove('hidden');
        bluffResultMessage.textContent = gameState.message;
    } else if (gameState.phase !== 'bluff_reveal' && gameState.phase !== 'final_validation') {
        actionBar.classList.remove('hidden');
    }

    // Update bluff button - only enabled when there are at least 2 cards on board
    bluffBtn.disabled = gameState.phase !== 'playing' || gameState.board.length < 2;

    // Update change category button - only enabled when board has just reference card
    changeCategoryBtn.disabled = gameState.phase !== 'playing' || gameState.board.length > 1;

    // Show/hide modals
    if (gameState.phase === 'capital_check') {
        // Use capital_card (the card the player just placed)
        const card = gameState.capital_card || gameState.board[gameState.board.length - 1];
        capitalCountry.textContent = `${card.flag} ${card.name}`;
        capitalModal.classList.remove('hidden');
        capitalInput.focus();
    } else {
        capitalModal.classList.add('hidden');
    }

    if (gameState.phase === 'capital_validation') {
        capitalValidationText.textContent = gameState.message;
        capitalValidationModal.classList.remove('hidden');
    } else {
        capitalValidationModal.classList.add('hidden');
    }

    if (gameState.phase === 'game_over') {
        winnerText.textContent = t('winner_text', { team: gameState.winner });
        gameoverMessage.textContent = gameState.message;
        gameoverModal.classList.remove('hidden');
    } else {
        gameoverModal.classList.add('hidden');
    }

    // Show message as toast
    if (gameState.message && gameState.phase !== 'game_over' && gameState.phase !== 'capital_check' && gameState.phase !== 'placing') {
        showToast(gameState.message);
    } else {
        hideToast();
    }
}

// Toast functions
function showToast(message) {
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    messageArea.textContent = message;
    messageArea.classList.remove('hidden', 'toast-out');

    // Auto-hide after 4 seconds
    toastTimeout = setTimeout(() => {
        messageArea.classList.add('toast-out');
        setTimeout(() => {
            messageArea.classList.add('hidden');
        }, 300);
    }, 4000);
}

function hideToast() {
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    messageArea.classList.add('hidden');
}

// Start new game
async function startGame() {
    const cardsCount = cardsCountSelect ? parseInt(cardsCountSelect.value) : 7;
    try {
        gameState = await api('new-game', 'POST', { cards_per_player: cardsCount, language: currentLanguage });
        gameId = gameState.game_id;
        updateUrlWithGameId(gameId);
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        render();
    } catch (err) {
        console.error('Error starting game:', err);
    }
}

// Go back to home
function goHome() {
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    gameState = null;
    gameId = null;
    // Clear game_id from URL
    const url = new URL(window.location);
    url.searchParams.delete('game');
    window.history.replaceState({}, '', url);
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
restartGameBtn.addEventListener('click', startGame);
if (homeBtn) homeBtn.addEventListener('click', goHome);
if (languageBtn) {
    languageBtn.addEventListener('click', () => {
        setLanguage(currentLanguage === 'fr' ? 'en' : 'fr');
    });
}
bluffBtn.addEventListener('click', callBluff);
capitalSubmit.addEventListener('click', submitCapital);
capitalSkip.addEventListener('click', skipCapital);
capitalInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitCapital();
});

// Placing phase buttons
cancelBtn.addEventListener('click', cancelPlacement);
validateBtn.addEventListener('click', validatePlacement);

// Capital validation buttons
capitalAcceptBtn.addEventListener('click', () => capitalDecision(true));
capitalRefuseBtn.addEventListener('click', () => capitalDecision(false));

// Change category button
changeCategoryBtn.addEventListener('click', changeCategory);

// Continue after bluff button
continueBtn.addEventListener('click', continueAfterResult);

// Rules modal - load from file
async function loadRules() {
    const res = await fetch(`/api/rules?lang=${currentLanguage}`);
    const text = await res.text();
    // Simple markdown to HTML conversion
    const html = text
        .replace(/^# (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h4>$1</h4>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/gs, '<ul>$&</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[hul])/gm, '<p>')
        .replace(/(?<![>])$/gm, '</p>')
        .replace(/<p><\/p>/g, '')
        .replace(/<p>(<[hul])/g, '$1')
        .replace(/(<\/[hul]>)<\/p>/g, '$1');
    rulesContent.innerHTML = html;
}

rulesBtn.addEventListener('click', () => {
    loadRules();
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

const storedLanguage = localStorage.getItem('language');
const browserLanguage = navigator.language || '';
currentLanguage = storedLanguage || (browserLanguage.startsWith('en') ? 'en' : 'fr');
applyTranslations();

// Check if there's a game_id in URL and try to load it
async function initFromUrl() {
    const urlGameId = getGameIdFromUrl();
    if (urlGameId) {
        try {
            const state = await api(`game-state?game_id=${urlGameId}`, 'GET');
            if (!state.error) {
                gameId = urlGameId;
                gameState = state;
                startScreen.classList.add('hidden');
                gameScreen.classList.remove('hidden');
                render();
                return;
            }
        } catch (err) {
            console.error('Error loading game from URL:', err);
        }
    }
    // No game in URL or failed to load - sync language for future games
    syncLanguage();
}

initFromUrl();
