// GeoBluff - Main JavaScript

let gameState = null;
let toastTimeout = null;
let isLoading = false;
let gameId = null;
let revealEnabled = true;
let pollInterval = null;

const POLL_INTERVAL_MS = 1000;

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
const messageArea = document.getElementById('message-area');
const toggleOpponentBtn = document.getElementById('toggle-opponent-btn');
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
const languageBtnStart = document.getElementById('language-btn-start');
const categorySetSelect = document.getElementById('category-set-select');
const categorySetDesc = document.getElementById('category-set-desc');
const modeSelect = document.getElementById('play-mode-select');
const presenceIndicator = document.getElementById('presence-indicator');
const presenceText = document.getElementById('presence-text');
const inviteModal = document.getElementById('invite-modal');
const inviteLinkInput = document.getElementById('invite-link-input');
const inviteCopyBtn = document.getElementById('invite-copy-btn');
const inviteCloseBtn = document.getElementById('invite-close-btn');

let currentLanguage = 'fr';
const clientId = getOrCreateClientId();
let currentMode = 'local';

const translations = {
    fr: {
        subtitle: 'Jeu de géographie pour deux équipes',
        start_description: 'Placez vos cartes du plus grand au plus petit et appelez le bluff au bon moment.',
        category_mode_title: 'Mode de categories',
        category_set_basic: 'Basique',
        category_set_basic_desc: 'Population, superficie, nord/sud, est/ouest',
        category_set_economics: 'Economie',
        category_set_economics_desc: 'Basique + PIB, inflation, chomage, internet, electricite',
        category_set_energy: 'Energie',
        category_set_energy_desc: 'Basique + mix electrique, renouvelable, nucleaire, charbon, gaz',
        category_set_fun: 'Advanced',
        category_set_fun_desc: 'Basique + tourisme, forets, pollution, alcool, fertilite',
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
        winner_text: "L'équipe {team} gagne !",
        toggle_opponent_title: 'Masquer/afficher adversaire',
        toggle_opponent_show: 'Afficher adversaire',
        toggle_opponent_hide: 'Masquer adversaire',
        tutorial_title: 'Tutoriel',
        copy_link_success: 'Lien copie !',
        copy_link_error: 'Copie impossible.',
        copy_link_missing: "Demarrez une partie d'abord.",
        presence_waiting: "En attente d'un adversaire",
        presence_connected: 'Adversaire connecte',
        mode_title: 'Mode de jeu',
        mode_local: 'Passer le telephone',
        mode_online: 'En ligne (en cours)',
        invite_title: 'Inviter un joueur',
        invite_description: 'Copiez ce lien et partagez-le.',
        invite_copy: 'Copier le lien',
        invite_close: 'Fermer'
    },
    en: {
        subtitle: 'Geography game for two teams',
        start_description: 'Place your cards from largest to smallest and call the bluff at the right time.',
        category_mode_title: 'Category mode',
        category_set_basic: 'Basic',
        category_set_basic_desc: 'Population, area, north/south, east/west',
        category_set_economics: 'Economics',
        category_set_economics_desc: 'Basic + GDP, inflation, unemployment, internet, electricity',
        category_set_energy: 'Energy',
        category_set_energy_desc: 'Basic + power mix, renewables, nuclear, coal, gas',
        category_set_fun: 'Advanced',
        category_set_fun_desc: 'Basic + tourism, forests, pollution, alcohol, birth rate',
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
        winner_text: 'Team {team} wins!',
        toggle_opponent_title: 'Show/hide opponent',
        toggle_opponent_show: 'Show opponent',
        toggle_opponent_hide: 'Hide opponent',
        tutorial_title: 'Tutorial',
        copy_link_success: 'Link copied!',
        copy_link_error: 'Copy failed.',
        copy_link_missing: 'Start a game first.',
        presence_waiting: 'Waiting for opponent',
        presence_connected: 'Opponent connected',
        mode_title: 'Game mode',
        mode_local: 'Pass the phone',
        mode_online: 'Online (in progress)',
        invite_title: 'Invite a player',
        invite_description: 'Copy this link and share it.',
        invite_copy: 'Copy link',
        invite_close: 'Close'
    }
};

function getOrCreateClientId() {
    const existing = localStorage.getItem('clientId');
    if (existing) return existing;
    const id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `client-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('clientId', id);
    return id;
}

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

    // Update both language buttons (game screen and start screen)
    const target = currentLanguage === 'fr' ? 'en' : 'fr';
    const btnText = target === 'en' ? '🇬🇧' : '🇫🇷';
    const btnTitle = currentLanguage === 'fr' ? t('switch_to_en') : t('switch_to_fr');

    if (languageBtn) {
        languageBtn.textContent = btnText;
        languageBtn.title = btnTitle;
    }
    if (languageBtnStart) {
        languageBtnStart.textContent = btnText;
        languageBtnStart.title = btnTitle;
    }

    updateCategorySetDescription();
}

function updateCategorySetDescription() {
    if (!categorySetSelect || !categorySetDesc) return;
    const selected = categorySetSelect.value || 'basic';
    const descKey = `category_set_${selected}_desc`;
    categorySetDesc.textContent = t(descKey);
}

function syncModeSelection() {
    if (!modeSelect) return;
    const stored = localStorage.getItem('playMode');
    if (stored) {
        modeSelect.value = stored;
    }
    currentMode = modeSelect.value || 'local';
    modeSelect.addEventListener('change', () => {
        currentMode = modeSelect.value || 'local';
        localStorage.setItem('playMode', currentMode);
    });
}

function getSelectedCategorySet() {
    return categorySetSelect ? categorySetSelect.value : null;
}

function syncCategorySetSelection() {
    if (!categorySetSelect) return;
    const stored = localStorage.getItem('categorySet');
    if (stored) {
        categorySetSelect.value = stored;
    } else {
        categorySetSelect.value = 'basic';
    }
    updateCategorySetDescription();
    categorySetSelect.addEventListener('change', () => {
        localStorage.setItem('categorySet', categorySetSelect.value);
        updateCategorySetDescription();
    });
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
        mobile_subscriptions: ' /100',
        population_density: ' people/km²',
        percent: ' %',
        tourism: { million: ' M', thousand: ' k' },
        air_pollution: ' ug/m3',
        energy_use: ' kg oe',
        alcohol: ' L',
        fertility_rate: ' births/woman'
    } : {
        population: { billion: ' Mrd', million: ' M', thousand: ' k' },
        area: { million: ' M km²', thousand: 'k km²', unit: ' km²' },
        gdp: { trillion: ' T$', billion: ' Mrd$', million: ' M$', unit: ' $' },
        life_expectancy: ' ans',
        mobile_subscriptions: ' /100',
        population_density: ' hab/km²',
        percent: ' %',
        tourism: { million: ' M', thousand: ' k' },
        air_pollution: ' ug/m3',
        energy_use: ' kg eq',
        alcohol: ' L',
        fertility_rate: ' enfants/femme'
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
    if (category === 'mobile_subscriptions') {
        return num.toFixed(1) + units.mobile_subscriptions;
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
    if (category === 'tourism_arrivals') {
        if (num >= 1e6) return (num / 1e6).toFixed(1) + units.tourism.million;
        if (num >= 1e3) return (num / 1e3).toFixed(0) + units.tourism.thousand;
        return num.toFixed(0);
    }
    if (category === 'forest_area') {
        return num.toFixed(1) + units.percent;
    }
    if (category === 'urban_population') {
        return num.toFixed(1) + units.percent;
    }
    if (category === 'air_pollution') {
        return num.toFixed(1) + units.air_pollution;
    }
    if (category === 'renewable_electricity') {
        return num.toFixed(1) + units.percent;
    }
    if (category === 'electricity_from_hydro') {
        return num.toFixed(1) + units.percent;
    }
    if (category === 'electricity_from_nuclear') {
        return num.toFixed(1) + units.percent;
    }
    if (category === 'electricity_from_gas') {
        return num.toFixed(1) + units.percent;
    }
    if (category === 'electricity_from_oil') {
        return num.toFixed(1) + units.percent;
    }
    if (category === 'electricity_from_coal') {
        return num.toFixed(1) + units.percent;
    }
    if (category === 'energy_use_per_capita') {
        return num.toFixed(0) + units.energy_use;
    }
    if (category === 'alcohol_consumption') {
        return num.toFixed(1) + units.alcohol;
    }
    if (category === 'fertility_rate') {
        return num.toFixed(1) + units.fertility_rate;
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
    if (presenceIndicator && presenceText) {
        const isOnlineMode = currentMode === 'online';
        presenceIndicator.classList.toggle('hidden', !isOnlineMode);
        if (isOnlineMode) {
            const isConnected = Boolean(gameState.other_present);
            presenceIndicator.classList.toggle('connected', isConnected);
            presenceIndicator.classList.toggle('waiting', !isConnected);
            presenceText.textContent = t(isConnected ? 'presence_connected' : 'presence_waiting');
        }
    }

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

    // Swap visual: active player always at bottom, opponent always at top
    const currentPlayer = gameState.current_player;
    const isPlaying = gameState.phase === 'playing';

    // Get the cards for current player and opponent
    const activeCards = currentPlayer === 1 ? gameState.player1_cards : gameState.player2_cards;
    const opponentCards = currentPlayer === 1 ? gameState.player2_cards : gameState.player1_cards;
    const opponentTeam = currentPlayer === 1 ? 2 : 1;

    // Update player areas - bottom area (player1-area in HTML) is always active
    const bottomArea = document.querySelector('.player1-area');
    const topArea = document.querySelector('.player2-area');

    bottomArea.classList.toggle('active', isPlaying);
    topArea.classList.remove('active'); // Opponent is never "active" visually
    bottomArea.classList.toggle('team-1', currentPlayer === 1);
    bottomArea.classList.toggle('team-2', currentPlayer === 2);
    topArea.classList.toggle('team-1', opponentTeam === 1);
    topArea.classList.toggle('team-2', opponentTeam === 2);

    // Update labels to show correct team numbers
    const bottomLabel = bottomArea.querySelector('.player-label');
    if (bottomLabel) {
        bottomLabel.textContent = t('team_1_label').replace('1', currentPlayer);
        bottomLabel.classList.toggle('team-1', currentPlayer === 1);
        bottomLabel.classList.toggle('team-2', currentPlayer === 2);
    }
    const topLabel = topArea.querySelector('.player-label');
    if (topLabel) {
        topLabel.textContent = t('team_2_label').replace('2', opponentTeam);
        topLabel.classList.toggle('team-1', opponentTeam === 1);
        topLabel.classList.toggle('team-2', opponentTeam === 2);
    }

    // Render active player cards (bottom - player1Cards container)
    player1Cards.innerHTML = '';
    activeCards.forEach(card => {
        player1Cards.appendChild(createCard(card, { isActive: isPlaying, showValue: false }));
    });

    // Render opponent cards (top - player2Cards container)
    player2Cards.innerHTML = '';
    opponentCards.forEach(card => {
        player2Cards.appendChild(createCard(card, { isActive: false, showValue: false }));
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
    placingBar.classList.add('hidden');
    bluffResultBar.classList.add('hidden');

    if (gameState.phase === 'placing') {
        placingBar.classList.remove('hidden');
    } else if (gameState.phase === 'bluff_result' || gameState.phase === 'final_validation_result') {
        bluffResultBar.classList.remove('hidden');
        bluffResultMessage.textContent = gameState.message;
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

function getInviteLink() {
    if (!gameId) return null;
    const url = new URL(window.location);
    url.searchParams.set('game', gameId);
    return url.toString();
}

function showInviteModal(inviteLink) {
    if (!inviteModal || !inviteLinkInput) return;
    inviteLinkInput.value = inviteLink || '';
    inviteModal.classList.remove('hidden');
}

function hideInviteModal() {
    if (!inviteModal) return;
    inviteModal.classList.add('hidden');
}

async function copyInviteLink() {
    const inviteLink = inviteLinkInput ? inviteLinkInput.value : getInviteLink();
    if (!inviteLink) {
        showToast(t('copy_link_missing'));
        return;
    }

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(inviteLink);
        } else {
            const tempInput = document.createElement('textarea');
            tempInput.value = inviteLink;
            tempInput.setAttribute('readonly', '');
            tempInput.style.position = 'absolute';
            tempInput.style.left = '-9999px';
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        }
        showToast(t('copy_link_success'));
    } catch (err) {
        console.error('Copy link failed:', err);
        showToast(t('copy_link_error'));
    }
}

function startPolling() {
    stopPolling();
    if (currentMode !== 'online') return;
    pollInterval = setInterval(async () => {
        if (!gameId) return;
        try {
            const state = await api(`game-state?game_id=${gameId}&client_id=${clientId}`, 'GET');
            if (!state.error) {
                gameState = state;
                render();
            }
        } catch (err) {
            console.error('Polling error:', err);
        }
    }, POLL_INTERVAL_MS);
}

function stopPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}

// Start new game
async function startGame() {
    const cardsCount = cardsCountSelect ? parseInt(cardsCountSelect.value) : 7;
    currentMode = modeSelect ? modeSelect.value : 'local';
    localStorage.setItem('playMode', currentMode);
    try {
        const categorySet = getSelectedCategorySet();
        gameState = await api('new-game', 'POST', {
            cards_per_player: cardsCount,
            language: currentLanguage,
            category_set: categorySet
        });
        gameId = gameState.game_id;
        updateUrlWithGameId(gameId);
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        render();
        if (currentMode === 'online') {
            const inviteLink = getInviteLink();
            showInviteModal(inviteLink);
            startPolling();
        } else {
            stopPolling();
        }

        // Show tutorial for first-time users
        if (shouldShowTutorial()) {
            setTimeout(showTutorial, 500);
        }
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
    stopPolling();
    hideInviteModal();
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

// Toggle opponent visibility (hidden by default)
if (toggleOpponentBtn) {
    toggleOpponentBtn.addEventListener('click', () => {
        const player2Area = document.querySelector('.player2-area');
        const isCollapsed = player2Area.classList.toggle('collapsed');
        toggleOpponentBtn.classList.toggle('active', !isCollapsed); // Active when showing
        toggleOpponentBtn.textContent = isCollapsed ? '👁️‍🗨️' : '👁️';
        toggleOpponentBtn.title = t(isCollapsed ? 'toggle_opponent_show' : 'toggle_opponent_hide');
        // Toggle class on game screen for bigger board/cards when opponent hidden
        gameScreen.classList.toggle('opponent-hidden', isCollapsed);
        // Save preference
        localStorage.setItem('opponentVisible', !isCollapsed);
    });
    // Default: opponent hidden, unless user explicitly chose to show
    const savedVisible = localStorage.getItem('opponentVisible') === 'true';
    if (!savedVisible) {
        document.querySelector('.player2-area').classList.add('collapsed');
        toggleOpponentBtn.textContent = '👁️‍🗨️';
        gameScreen.classList.add('opponent-hidden');
    } else {
        toggleOpponentBtn.classList.add('active');
        toggleOpponentBtn.textContent = '👁️';
    }
}

if (languageBtn) {
    languageBtn.addEventListener('click', () => {
        setLanguage(currentLanguage === 'fr' ? 'en' : 'fr');
    });
}
if (languageBtnStart) {
    languageBtnStart.addEventListener('click', () => {
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

if (inviteCopyBtn) {
    inviteCopyBtn.addEventListener('click', copyInviteLink);
}
if (inviteCloseBtn) {
    inviteCloseBtn.addEventListener('click', hideInviteModal);
}
if (inviteModal) {
    inviteModal.addEventListener('click', (e) => {
        if (e.target === inviteModal) {
            hideInviteModal();
        }
    });
}

// Tutorial walkthrough
const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialText = document.getElementById('tutorial-text');
const tutorialProgress = document.getElementById('tutorial-progress');
const tutorialNextBtn = document.getElementById('tutorial-next');
const tutorialHighlight = document.querySelector('.tutorial-highlight');
const tutorialTooltip = document.querySelector('.tutorial-tooltip');

let tutorialStep = 0;

const tutorialSteps = {
    fr: [
        { target: '#player1-cards', text: 'Cliquez sur une carte pour la placer sur le plateau.', position: 'above' },
        { target: '#board-area', text: 'Placez vos cartes dans le bon ordre : du plus petit a gauche au plus grand a droite.', position: 'below' },
        { target: '#bluff-btn', text: "Appelez BLUFF si l'ordre est faux. Attention : toutes les erreurs seront revelees, meme celles de votre equipe !", position: 'above' },
        { target: '#board-area', text: 'Pour gagner, posez toutes vos cartes et donnez la capitale de votre dernier pays !', position: 'below' }
    ],
    en: [
        { target: '#player1-cards', text: 'Click a card to place it on the board.', position: 'above' },
        { target: '#board-area', text: 'Place cards in order: smallest on the left, largest on the right.', position: 'below' },
        { target: '#bluff-btn', text: 'Call BLUFF if the order is wrong. Warning: all mistakes will be revealed, even your own team\'s!', position: 'above' },
        { target: '#board-area', text: 'To win, play all your cards and name the capital of your last country!', position: 'below' }
    ]
};

function getTutorialSteps() {
    return tutorialSteps[currentLanguage] || tutorialSteps.fr;
}

function showTutorial() {
    tutorialStep = 0;
    tutorialOverlay.classList.remove('hidden');
    renderTutorialStep();
}

function hideTutorial() {
    tutorialOverlay.classList.add('hidden');
    localStorage.setItem('tutorialSeen', 'true');
}

function renderTutorialStep() {
    const steps = getTutorialSteps();
    const step = steps[tutorialStep];
    const targetEl = document.querySelector(step.target);

    if (!targetEl) {
        nextTutorialStep();
        return;
    }

    tutorialText.textContent = step.text;

    // Update progress dots
    tutorialProgress.innerHTML = steps.map((_, i) =>
        `<span class="${i === tutorialStep ? 'active' : ''}"></span>`
    ).join('');

    // Update button text
    const isLastStep = tutorialStep === steps.length - 1;
    tutorialNextBtn.textContent = isLastStep
        ? (currentLanguage === 'en' ? 'Got it!' : 'Compris !')
        : (currentLanguage === 'en' ? 'Next' : 'Suivant');

    // Position highlight over target
    const rect = targetEl.getBoundingClientRect();
    const padding = 8;

    tutorialHighlight.style.top = `${rect.top - padding}px`;
    tutorialHighlight.style.left = `${rect.left - padding}px`;
    tutorialHighlight.style.width = `${rect.width + padding * 2}px`;
    tutorialHighlight.style.height = `${rect.height + padding * 2}px`;

    // Position tooltip
    positionTooltip(rect, step.position);
}

function positionTooltip(targetRect, position) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Remove existing arrow classes
    tutorialTooltip.classList.remove('arrow-up', 'arrow-down');

    // Get tooltip dimensions after a brief delay to ensure it's rendered
    const tooltipWidth = 280;
    const tooltipHeight = 150;

    let top, left;

    if (position === 'above') {
        top = targetRect.top - tooltipHeight - 30;
        tutorialTooltip.classList.add('arrow-down');
    } else {
        top = targetRect.bottom + 30;
        tutorialTooltip.classList.add('arrow-up');
    }

    // Center horizontally relative to target
    left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);

    // Keep within viewport bounds
    left = Math.max(16, Math.min(left, viewportWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, viewportHeight - tooltipHeight - 16));

    tutorialTooltip.style.top = `${top}px`;
    tutorialTooltip.style.left = `${left}px`;
}

function nextTutorialStep() {
    const steps = getTutorialSteps();
    tutorialStep++;

    if (tutorialStep >= steps.length) {
        hideTutorial();
    } else {
        renderTutorialStep();
    }
}

function shouldShowTutorial() {
    return !localStorage.getItem('tutorialSeen');
}

tutorialNextBtn.addEventListener('click', nextTutorialStep);

tutorialOverlay.addEventListener('click', (e) => {
    if (e.target === tutorialOverlay) {
        hideTutorial();
    }
});

// Tutorial button in top bar
const tutorialBtn = document.getElementById('tutorial-btn');
if (tutorialBtn) {
    tutorialBtn.addEventListener('click', showTutorial);
}

const storedLanguage = localStorage.getItem('language');
const browserLanguage = navigator.language || '';
currentLanguage = storedLanguage || (browserLanguage.startsWith('en') ? 'en' : 'fr');
applyTranslations();
syncCategorySetSelection();
syncModeSelection();

// Check if there's a game_id in URL and try to load it
async function initFromUrl() {
    const urlGameId = getGameIdFromUrl();
    if (urlGameId) {
        try {
            const state = await api(`game-state?game_id=${urlGameId}&client_id=${clientId}`, 'GET');
            if (!state.error) {
                currentMode = 'online';
                localStorage.setItem('playMode', currentMode);
                if (modeSelect) {
                    modeSelect.value = 'online';
                }
                gameId = urlGameId;
                gameState = state;
                startScreen.classList.add('hidden');
                gameScreen.classList.remove('hidden');
                render();
                startPolling();
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
