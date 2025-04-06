const players = [];
let currentRound = 1;
let matches = []; // Store matches here for reference in scoring
let isFirstRound = true; // Track if it's the first round
let pairHistory = {}; // Track pair history to avoid repeating the same pair
let previousRoundOpponents = []; // Store previous round's opponents for comparison
let previousRoundPairs = new Set(); // Store previous round's pairs
const matchHistory = new Set();
let previousRoundMatches = new Set();
const matchCounter = {}; // Object to store match counts
const recentPairHistory = []; // Array to store pair history for recent rounds
const extendedPairHistory = {};// Object to store pair counts for all pairs
const globalPairHistory = new Set(); // Track all pairs across rounds
// Counter to track the number of times each match has been played
const matchPlayCounter = {}; // Tracks unique matches across rounds





document.getElementById('addPlayersBtn').addEventListener('click', addPlayers);
document.getElementById('startTournament').addEventListener('click', generatePairsAndMatches);
document.getElementById('togglePlayerList').addEventListener('click', togglePlayerList);
document.getElementById('exportBtn').addEventListener('click', exportData);
document.getElementById('importFile').addEventListener('change', importData);
document.getElementById('clearBtn').addEventListener('click', clearState);

// Event listeners for sorting buttons
document.getElementById('sortVictoryPoints').addEventListener('click', () => {
    // Highlight active button
    clearActiveSortingButtons();
    document.getElementById('sortVictoryPoints').classList.add('active');
    
    const sortedPlayers = sortByVictoryPoints(players);
    displayPodium(sortedPlayers); // Update podium based on new sort
    displayPlayerStatsTable(sortedPlayers); // Update table based on new sort
});

document.getElementById('sortPicklePoints').addEventListener('click', () => {
    // Highlight active button
    clearActiveSortingButtons();
    document.getElementById('sortPicklePoints').classList.add('active');
    
    const sortedPlayers = sortByPicklePoints(players);
    displayPodium(sortedPlayers); // Update podium based on new sort
    displayPlayerStatsTable(sortedPlayers); // Update table based on new sort
});

document.getElementById('sortWinPercentage').addEventListener('click', () => {
    // Highlight active button
    clearActiveSortingButtons();
    document.getElementById('sortWinPercentage').classList.add('active');
    
    const sortedPlayers = sortByWinPercentage(players);
    displayPodium(sortedPlayers); // Update podium based on new sort
    displayPlayerStatsTable(sortedPlayers); // Update table based on new sort
});

document.getElementById('sortPicklePointAvg').addEventListener('click', () => {
    // Highlight active button
    clearActiveSortingButtons();
    document.getElementById('sortPicklePointAvg').classList.add('active');
    
    const sortedPlayers = sortByPicklePointAvg(players);
    displayPodium(sortedPlayers); // Update podium based on new sort
    displayPlayerStatsTable(sortedPlayers); // Update table based on new sort
});

document.getElementById('sortPickleDifferential').addEventListener('click', () => {
    // Highlight active button
    clearActiveSortingButtons();
    document.getElementById('sortPickleDifferential').classList.add('active');
    
    const sortedPlayers = sortByPickleDifferential(players);
    displayPodium(sortedPlayers); // Update podium based on new sort
    displayPlayerStatsTable(sortedPlayers); // Update table based on new sort
});

// Helper function to clear active class from all sorting buttons
function clearActiveSortingButtons() {
    const sortButtons = document.querySelectorAll('.sorting-buttons button');
    sortButtons.forEach(button => button.classList.remove('active'));
}

// Function to set default active sort button when podium is shown
function setDefaultActiveSortButton() {
    clearActiveSortingButtons();
    document.getElementById('sortVictoryPoints').classList.add('active');
}



// Create the debug area and log function for debugging messages
function createDebugArea() {
    const debugArea = document.getElementById('debugArea');
    return debugArea;
}

function logDebugMessage(message) {
    const debugArea = createDebugArea();
    if (debugArea) {
        debugArea.value += message + '\n';
        debugArea.scrollTop = debugArea.scrollHeight;
    }
}

// Function to clear the debug area
function clearDebugArea() {
    const debugArea = createDebugArea();
    if (debugArea) {
        debugArea.value = ''; // Clear previous messages
    }
}









// Function to add players and manage eligibility
function addPlayers() {
    const playerInput = document.getElementById('playerInput').value;
    const playerNames = playerInput.split(/[\n,]+/).map(name => name.trim()).filter(Boolean);

    playerNames.forEach(name => {
        let suffix = 1;
        let uniqueName = name;
        while (players.find(player => player.name === uniqueName)) {
            uniqueName = `${name}-${suffix++}`;
        }
        players.push({
            name: uniqueName,
            eligible: true,  // Default eligibility set to true initially
            manualSitOut: false, // Track manual sit-out
            gamesPlayed: 0,
            roundsSatOut: 0,
            victoryPoints: 0,
            picklePoints: 0,
            pickleDifferential: 0, // New property
            teammates: {}, // Initialize as an empty object
            satOutLastRound: false // New field to track if they sat out last round
        });
    });

    console.log("Players after adding:", players); // Debugging step
    players.forEach(player => {
        if (!player.teammates || typeof player.teammates !== 'object') {
            console.error(`Invalid teammates for player: ${player.name}`);
            player.teammates = {}; // Fix if invalid
        }
    });
    document.getElementById('playerInput').value = '';
    // Show the total player count, not just the newly added players
    document.getElementById('playerCount').textContent = `Player Count: ${players.length}`;
    updatePlayerList();
    togglePlayerList();
    autoSave();
}

function updatePlayerList() {
    const playerList = document.getElementById('playerList');
    const playerCount = document.getElementById('playerCount');
    
    // Clear the list
    playerList.innerHTML = '';
    
    // Update player count display
    playerCount.textContent = `Player Count: ${players.length}`;
    
    // Update the player list
    players.forEach((player, index) => {
        const row = document.createElement('tr');
        
        // Create a cell for the player name
        const nameCell = document.createElement('td');
        nameCell.textContent = player.name;
        row.appendChild(nameCell);
        
        // Create a cell for the sit-out selector
        const statusCell = document.createElement('td');
        
        const sitOutSelector = document.createElement('select');
        sitOutSelector.className = 'player-status-selector';
        sitOutSelector.setAttribute('data-player-index', index);
        
        const stayInOption = document.createElement('option');
        stayInOption.value = 'stay-in';
        stayInOption.textContent = 'Stay In';
        sitOutSelector.appendChild(stayInOption);
        
        const sitOutOption = document.createElement('option');
        sitOutOption.value = 'sit-out';
        sitOutOption.textContent = 'Sit Out';
        sitOutSelector.appendChild(sitOutOption);
        
        // Set the correct option based on the player's state
        sitOutSelector.value = player.manualSitOut ? 'sit-out' : 'stay-in';
        
        sitOutSelector.addEventListener('change', function() {
            const playerIndex = parseInt(this.getAttribute('data-player-index'));
            const sitOut = this.value === 'sit-out';
            players[playerIndex].manualSitOut = sitOut;
            console.log(`Player ${players[playerIndex].name} ${sitOut ? 'will sit out' : 'will play'} next round.`);
            autoSave();
        });
        
        statusCell.appendChild(sitOutSelector);
        
        // Add an edit button
        const editButton = document.createElement('button');
        editButton.className = 'small-btn edit-btn';
        editButton.innerHTML = '<span class="material-symbols-rounded">edit</span>';
        editButton.addEventListener('click', () => editPlayer(index));
        statusCell.appendChild(editButton);
        
        // Add a remove button
        const removeButton = document.createElement('button');
        removeButton.className = 'small-btn remove-btn';
        removeButton.innerHTML = '<span class="material-symbols-rounded">delete</span>';
        removeButton.addEventListener('click', () => removePlayer(index));
        statusCell.appendChild(removeButton);
        
        row.appendChild(statusCell);
        playerList.appendChild(row);
    });
    
    // Show the leaderboard button if there are players
    if (players.length > 0) {
        document.getElementById('floatingLeaderboardBtn').classList.add('visible');
    } else {
        document.getElementById('floatingLeaderboardBtn').classList.remove('visible');
    }
}


function editPlayer(index) {
    const player = players[index];
    const newName = prompt("Edit player name:", player.name);
    if (newName) {
        player.name = newName;
        updatePlayerList();
    }

    autoSave();
}

function removePlayer(index) {
    if (confirm("Are you sure you want to remove this player?")) {
        const player = players[index];
        if (confirm("Do you want to keep the player's stats?")) {
            player.eligible = false;
        } else {
            players.splice(index, 1);
        }
        updatePlayerList();
    }
    autoSave();
}

function togglePlayerList() {
    const playerListContainer = document.getElementById('playerListContainer');
    const toggleButton = document.getElementById('togglePlayerList');
    playerListContainer.classList.toggle('active');
    
    // Update toggle button content based on panel state
    if (playerListContainer.classList.contains('active')) {
        toggleButton.innerHTML = '<span class="material-symbols-rounded">arrow_back</span>';
        toggleButton.setAttribute('aria-label', 'Hide player list');
    } else {
        toggleButton.innerHTML = '<span class="material-symbols-rounded">people</span>';
        toggleButton.setAttribute('aria-label', 'Show player list');
    }
}

// Function to determine which players need to sit out

document.getElementById('startTournament').addEventListener('click', generatePairsAndMatches);


// Function to create teams while minimizing repetitive pairing
const previousPairs = new Set(); // Track previous pairs

// Generate all pairs with minimal encounters, sorted by encounter count




// Generate a unique key for a player pair
function generatePairKey(player1, player2) {
    return [player1.name, player2.name].sort().join('-');
}



// Function to generate match key (team1 vs team2)
function generateMatchKey(team1, team2) {
    if (!Array.isArray(team1) || !Array.isArray(team2)) {
        console.error("Expected team1 and team2 to be arrays, but found:", team1, team2);
        return ""; // Return empty string or handle error as needed
    }

    const team1Names = team1.map(player => player.name).sort().join("-");
    const team2Names = team2.map(player => player.name).sort().join("-");
    return [team1Names, team2Names].sort().join(" vs ");
}

// Track pair encounters globally
function updatePairEncounter(player1, player2) {
    const pairKey = generatePairKey(player1, player2);
    extendedPairHistory[pairKey] = (extendedPairHistory[pairKey] || 0) + 1;
}


function createMatchesForRound(eligiblePlayers, maxMatches) {
    logDebugMessage("=== START CREATE MATCHES FOR ROUND ===");
    logDebugMessage(`Creating matches with ${eligiblePlayers.length} eligible players: ${eligiblePlayers.map(p => p.name).join(', ')}`);
    logDebugMessage(`Maximum matches to create: ${maxMatches}`);
    
    let shuffledPlayers = shuffleArray([...eligiblePlayers]); // Shuffle for variety
    const matches = [];
    const usedPlayers = new Set(); // Track used players for this round
    const attemptedMatches = new Set(); // Track attempted match keys
    let relaxOpponentLogic = false; // Temporary variable to relax logic if needed

function isValidMatch(team1, team2) {
    const matchKey = generateMatchKey(team1, team2);

    // Check if match was already attempted
    if (attemptedMatches.has(matchKey)) {
        logDebugMessage(`Match ${matchKey} already attempted.`);
        return false;
    }

    // Helper to get frequent opponents
    const getFrequentOpponents = (player) => {
        const versusEntries = Object.entries(player.versus || {});
        if (versusEntries.length === 0) return [];
        const maxCount = Math.max(...versusEntries.map(([, count]) => count));
        return versusEntries
            .filter(([, count]) => count === maxCount)
            .map(([opponent]) => opponent);
    };

    // Helper to get eligible players who are not already used
    const getAvailableEligiblePlayers = (team1Players) => {
        return Array.from(eligiblePlayers).filter(player =>
            !usedPlayers.has(player) && !team1Players.includes(player)
        );
    };

    // Check for conflicts with frequent opponents
    const frequentOpponentsOne = getFrequentOpponents(team1[0]);
    const frequentOpponentsTwo = getFrequentOpponents(team1[1]);
    const team2PlayerNames = team2.map(player => player.name);

    const hasConflict = team2PlayerNames.some(name =>
        frequentOpponentsOne.includes(name) || frequentOpponentsTwo.includes(name)
    );

    if (hasConflict && !relaxOpponentLogic) {  // <--- Check for `relaxOpponentLogic`
        let unresolvedConflicts = [];
        const availablePlayers = getAvailableEligiblePlayers(team1);

        // Calculate availableCounts only once for performance
        const availableCounts = availablePlayers.map(player =>
            team1.map(t1Player => player.versus?.[t1Player.name] || 0)
        );

        const minAvailableCount = Math.min(
            ...availableCounts.flat(),
            Infinity // Default to infinity if no players are available
        );

        // Evaluate conflicts for each player in team2
        for (const team2Player of team2) {
            const versusCounts = team1.map(player => team2Player.versus?.[player.name] || 0);
            const maxVersusCount = Math.max(...versusCounts);

            // If the max versus count exceeds the minimum available count, conflict exists
            if (maxVersusCount > minAvailableCount) {
                unresolvedConflicts.push(team2Player);
            }
        }

        if (unresolvedConflicts.length > 0) {
            logDebugMessage(
                `Match ${matchKey} rejected: Conflicts exist for unresolved players in Team 2.`
            );
            return false;
        }
    }

    logDebugMessage(`Match ${matchKey} is valid.`);
    return true; // Match is valid
}

   function tryFormMatches(players, maxMatches, relaxationLevel = 0, depth = 0) {
    if (matches.length >= maxMatches || players.length < 4) return true; // Base case

    const currentPairs = generatePairs(players);
    logDebugMessage(`Generated ${currentPairs.length} possible pairs at depth ${depth}`);
    
    for (let i = 0; i < currentPairs.length; i++) {
        const pair1 = currentPairs[i];
        const remainingForOpponents = players.filter(
            p => p !== pair1.player1 && p !== pair1.player2
        );

        const opponentPairs = generatePairs(remainingForOpponents);
        for (let j = 0; j < opponentPairs.length; j++) {
            const pair2 = opponentPairs[j];
            const team1 = [pair1.player1, pair1.player2];
            const team2 = [pair2.player1, pair2.player2];

            if (isValidMatch(team1, team2, relaxationLevel)) {
                const matchKey = generateMatchKey(team1, team2);
                logDebugMessage(`Valid match found: ${matchKey}`);

                // Form match
                matches.push({ team1, team2 });
                attemptedMatches.add(matchKey);

                // Add pairs to recent history
                addPairToRecentHistory(pair1.pairKey);
                addPairToRecentHistory(pair2.pairKey);

                const allUsedPlayers = [...team1, ...team2];
                allUsedPlayers.forEach(player => usedPlayers.add(player));

                // Continue forming matches with remaining players
                const remainingPlayers = players.filter(
                    p => !allUsedPlayers.includes(p)
                );

                if (tryFormMatches(remainingPlayers, maxMatches, relaxationLevel, depth + 1)) {
                    return true; // Matches successfully formed
                }

                // Backtrack
                logDebugMessage(`Backtracking from match: ${matchKey}`);
                matches.pop();
                attemptedMatches.delete(matchKey);
                allUsedPlayers.forEach(player => usedPlayers.delete(player));
            }
        }
    }

    // If no valid matches can be formed, try increasing relaxation level
    if (depth === 0 && relaxationLevel < 2) {
        logDebugMessage(
            `Relaxing constraints to level ${relaxationLevel + 1} and retrying match formation.`
        );
        return tryFormMatches(players, maxMatches, relaxationLevel + 1, depth);
    }

    if (depth === 0) {
        logDebugMessage(`Failed to form matches even at max relaxation level.`);
    }
    return false; // Unable to form matches with current constraints
}


    function generatePairs(players) {
    const pairs = [];
    const recentPairThreshold = 3; // Number of rounds to consider for "recent" pairings
    const allPossiblePairKeys = new Set(); // Track all possible pair keys for eligible players

    // Step 1: Generate all possible pair keys for the given players
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const player1 = players[i];
            const player2 = players[j];
            const pairKey = generatePairKey(player1, player2);
            allPossiblePairKeys.add(pairKey);
        }
    }

    // Step 2: Check if all possible pairs have been used at least once
    const allPairsUsed = Array.from(allPossiblePairKeys).every(pairKey => extendedPairHistory[pairKey] > 0);
    logDebugMessage(`All possible pairs used at least once: ${allPairsUsed}`);

    // Create a list of all potential pairs with their history info
    const potentialPairs = [];
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const player1 = players[i];
            const player2 = players[j];
            const pairKey = generatePairKey(player1, player2);
            const pairCount = extendedPairHistory[pairKey] || 0;
            const isRecentlyPaired = isPairInRecentHistory(pairKey);
            
            potentialPairs.push({
                player1,
                player2,
                pairKey,
                pairCount,
                isRecentlyPaired
            });
        }
    }
    
    // Step 3: First, add pairs that meet the ideal criteria
    for (const pair of potentialPairs) {
        if ((allPairsUsed && !pair.isRecentlyPaired) || pair.pairCount === 0) {
            pairs.push({
                player1: pair.player1,
                player2: pair.player2,
                pairKey: pair.pairKey,
                pairCount: pair.pairCount
            });
        }
    }
    
    // Step 4: If no pairs meet the ideal criteria but we need to form matches, 
    // include all pairs but sort them by recency and count
    if (pairs.length === 0 && potentialPairs.length > 0) {
        logDebugMessage("No ideal pairs found, falling back to all possible pairs sorted by preference");
        
        // Sort potential pairs by preference: 
        // 1. Not in recent history (most important)
        // 2. Fewest occurrences overall
        potentialPairs.sort((a, b) => {
            // First prioritize pairs not in recent history
            if (a.isRecentlyPaired !== b.isRecentlyPaired) {
                return a.isRecentlyPaired ? 1 : -1;
            }
            // Then sort by pair count
            return a.pairCount - b.pairCount;
        });
        
        // Take the best available pairs
        for (const pair of potentialPairs) {
            pairs.push({
                player1: pair.player1,
                player2: pair.player2,
                pairKey: pair.pairKey,
                pairCount: pair.pairCount
            });
        }
    }

    logDebugMessage(`Generated ${pairs.length} valid pairs`);
    // Step 5: Sort pairs by fewest pairings and add some randomness for equal counts
    return pairs.sort((a, b) => a.pairCount - b.pairCount || Math.random() - 0.5);
}


    if (!tryFormMatches(shuffledPlayers, maxMatches)) {
        logDebugMessage("Failed to form matches for this round. Relaxing logic...");
        relaxOpponentLogic = true; // Enable relaxed logic
        if (!tryFormMatches(shuffledPlayers, maxMatches)) {
            logDebugMessage("Failed to form matches even with relaxed logic.");
        }
    }

    // Update teammate counts and global pair history
    matches.forEach(match => {
        updatePairEncounter(match.team1[0], match.team1[1]);
        updatePairEncounter(match.team2[0], match.team2[1]);
    });

    logDebugMessage(`Created ${matches.length} matches`);
    matches.forEach((match, idx) => {
        logDebugMessage(`Match ${idx+1}: Team 1: ${match.team1.map(p => p.name).join(' & ')}, Team 2: ${match.team2.map(p => p.name).join(' & ')}`);
    });
    
    logDebugMessage("=== END CREATE MATCHES FOR ROUND ===");
    return matches;
}





// Ensure teammate repetition is avoided
function hasPreviousPair(player1, player2) {
    const pairKey = generatePairKey(player1, player2);
    return extendedPairHistory[pairKey] > 0;
}



// Utility function to log errors or invalid cases clearly
function logErrorIf(condition, message) {
    if (condition) {
        logDebugMessage(message);
    }
}



function resetPreviousRoundPairs() {
    logDebugMessage("Resetting previous round pairs");
    previousRoundPairs.clear(); // Clear only pairs from the immediate previous round
}

// Function to reset recent pair history when needed
function resetRecentPairHistory() {
    logDebugMessage("Resetting recent pair history");
    
    // Clear the recentPairHistory array
    if (recentPairHistory && recentPairHistory.length > 0) {
        recentPairHistory.length = 0;
        logDebugMessage("Recent pair history has been reset");
    } else {
        logDebugMessage("No recent pair history to reset");
    }
}

// Helper function to check if a pair is in recent history
function isPairInRecentHistory(pairKey) {
    logDebugMessage(`Checking if pair ${pairKey} is in recent history with ${recentPairHistory.length} rounds of history`);
    for (let i = 0; i < recentPairHistory.length; i++) {
        const historySet = recentPairHistory[i];
        if (historySet && historySet.has(pairKey)) {
            logDebugMessage(`Pair ${pairKey} found in recent history round ${i+1}`);
            return true;
        }
    }
    logDebugMessage(`Pair ${pairKey} not found in recent history`);
    return false;
}

// Helper function to add a pair to recent history
function addPairToRecentHistory(pairKey) {
    logDebugMessage(`Adding pair ${pairKey} to recent history`);
    
    // Ensure we have a valid recentPairHistory array
    if (!recentPairHistory) {
        recentPairHistory = [];
        logDebugMessage(`Created new recentPairHistory array`);
    }
    
    // Limit the history size to the number of players
    if (recentPairHistory.length >= players.length) {
        const removedSet = recentPairHistory.shift(); // Remove the oldest round
        logDebugMessage(`Removed oldest history round with ${removedSet ? removedSet.size : 0} pairs`);
    }
    
    // Add a new set for this round if needed
    if (recentPairHistory.length === 0 || !recentPairHistory[recentPairHistory.length - 1]) {
        recentPairHistory.push(new Set());
        logDebugMessage(`Added new Set for current round`);
    }
    
    // Add the pair key to the most recent round's set
    const currentRoundSet = recentPairHistory[recentPairHistory.length - 1];
    currentRoundSet.add(pairKey);
    logDebugMessage(`Added pair ${pairKey} to round ${recentPairHistory.length}, now has ${currentRoundSet.size} pairs`);
}




// Function to check the remaining players for opponents after pairing all possible unique pairs


// Function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}



// Append matches and sit-out player information to the display
function appendMatchDisplay(matches, sitOutPlayers) {
    // Safety check to prevent errors with undefined or empty matches
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
        console.warn("No matches to display. Returning from appendMatchDisplay.");
        return;
    }

    const matchDisplay = document.getElementById('matchDisplay');
    const roundContainer = document.createElement('div');
    roundContainer.classList.add('round-container', currentRound % 2 === 0 ? 'even-round' : 'odd-round');

    const roundHeader = document.createElement('h3');
    roundHeader.textContent = `Round ${currentRound}`;
    roundContainer.appendChild(roundHeader);

      // Add Edit Round button
    const editRoundButton = document.createElement('button');
    editRoundButton.textContent = 'Edit Round';
    editRoundButton.classList.add('edit-round-btn');
    editRoundButton.addEventListener('click', () => toggleEditRound(roundContainer, editRoundButton));
    roundContainer.appendChild(editRoundButton);


    // Add "Add Match" button
    const addMatchButton = document.createElement('button');
    addMatchButton.textContent = 'Add Match';
    addMatchButton.classList.add('add-match-btn');
    addMatchButton.addEventListener('click', () => {
        addMatch(roundContainer, sitOutPlayers); // Pass the sit-out players list
    });
    roundContainer.appendChild(addMatchButton);

    matches.forEach((match, index) => {
        const matchDiv = document.createElement('div');
        matchDiv.classList.add('match');
        matchDiv.setAttribute('data-match', index);

        matchDiv.innerHTML = `
            <p>Match ${index + 1}:</p>
            <div class="team" data-team="1">
                <p>Team 1: ${match.team1.map(p => `<span class="team1-player">${p.name}</span>`).join(' & ')}</p>
                <label>Score: <input type="text" inputmode="numeric" pattern="[0-9]*" min="0" class="team-score" data-team="1" data-match="${index}"></label>
            </div>
            <div class="team" data-team="2">
                <p>Team 2: ${match.team2.map(p => `<span class="team2-player">${p.name}</span>`).join(' & ')}</p>
                <label>Score: <input type="text" inputmode="numeric" pattern="[0-9]*" min="0" class="team-score" data-team="2" data-match="${index}"></label>
            </div>
            <button class="skip-match-btn" data-match="${index}">Skip Match</button>
        `;

        const skipButton = matchDiv.querySelector('.skip-match-btn');
        skipButton.addEventListener('click', () => {
            const confirmation = confirm("Are you sure you want to skip this match? This action cannot be undone.");
            if (!confirmation) {
                logDebugMessage("Match skip canceled.");
                return; // Exit if the user cancels
            }

            // Get team players from the matchDiv
            const team1Players = Array.from(matchDiv.querySelectorAll('.team1-player')).map(el =>
                players.find(player => player.name === el.textContent.trim())
            );
            const team2Players = Array.from(matchDiv.querySelectorAll('.team2-player')).map(el =>
                players.find(player => player.name === el.textContent.trim())
            );

            if (!team1Players || !team2Players) {
                console.error("Unable to retrieve team players for skipping the match.");
                return;
            }
            // Proceed to skip the match
            matchDiv.style.display = 'none';
            matchDiv.setAttribute('data-skipped', 'true');

            [...match.team1, ...match.team2].forEach(player => {
                player.eligible = false;
                player.satOutLastRound = true;
                if (!sitOutPlayers.includes(player)) {
                    sitOutPlayers.push(player);
                }
            });

            // Remove from match relationships and tracking
            const matchKey = generateMatchKey(team1Players, team2Players);
            if (matchHistory.has(matchKey)) {
                matchHistory.delete(matchKey);
                logDebugMessage(`Removed match ${matchKey} from match history.`);
            }

            const pair1Key = generatePairKey(team1Players[0], team1Players[1]);
            if (previousRoundPairs.has(pair1Key)) {
                previousRoundPairs.delete(pair1Key);
                logDebugMessage(`Removed Team 1 pair from previous round pairs.`);
            }
            // Also remove from recent history
            removePairFromRecentHistory(pair1Key);
            
            const pair2Key = generatePairKey(team2Players[0], team2Players[1]);
            if (previousRoundPairs.has(pair2Key)) {
                previousRoundPairs.delete(pair2Key);
                logDebugMessage(`Removed Team 2 pair from previous round pairs.`);
            }
            // Also remove from recent history
            removePairFromRecentHistory(pair2Key);

            autoSave();
        });





            roundContainer.appendChild(matchDiv);
            });

    
        // Add section for sit-out players if none exists
        // Add section for sit-out players if any
        if (sitOutPlayers && sitOutPlayers.length > 0) {
            const sitOutDiv = document.createElement('div');
            sitOutDiv.classList.add('sit-out-players');
            sitOutDiv.textContent = `Sitting out: ${sitOutPlayers.map(p => p.name).join(', ')}`;
            roundContainer.appendChild(sitOutDiv);
        }
    // Add "Add Match" button
        const addSubmitScoresButton = document.createElement('button');
        addSubmitScoresButton.textContent = 'Submit Scores';
        addSubmitScoresButton.classList.add('submit-scores-btn');
        addSubmitScoresButton.addEventListener('click', () => { submitScores(); });
        roundContainer.appendChild(addSubmitScoresButton);


            updateSitOutDisplay(sitOutPlayers);

        matchDisplay.appendChild(roundContainer);
        currentRound++; // Move to the next round after display
        logDebugMessage(`Round ${currentRound} displayed successfully.`);
    
    // After all match displays are appended
    if (window.attachKeypadToInputs) {
        window.attachKeypadToInputs();
    }
}





    function submitScores() {
        const roundContainer = document.querySelector('.round-container:last-child');
        const currentMatches = Array.from(roundContainer.querySelectorAll('.match:not([data-skipped="true"])'));
        
        // First, check for valid scores
        let allScoresValid = true;
        currentMatches.forEach((matchDiv, matchIndex) => {
            const team1Score = parseInt(matchDiv.querySelector(`input[data-team="1"]`).value) || 0;
            const team2Score = parseInt(matchDiv.querySelector(`input[data-team="2"]`).value) || 0;
            
            if (isNaN(team1Score) || isNaN(team2Score)) {
                allScoresValid = false;
                console.log(`Invalid score for Match ${matchIndex + 1}: Team 1 Score: ${team1Score}, Team 2 Score: ${team2Score}`);
            }
        });
        
        if (!allScoresValid) {
            alert("Please enter valid scores for all matches.");
            return;
        }
        
        // Update players' stats and match history
        currentMatches.forEach((matchDiv, index) => {
            if (matchDiv.getAttribute('data-skipped') === 'true') return;
            
            const team1Players = Array.from(matchDiv.querySelectorAll('.team1-player')).map(el => players.find(p => p.name === el.textContent.trim()));
            const team2Players = Array.from(matchDiv.querySelectorAll('.team2-player')).map(el => players.find(p => p.name === el.textContent.trim()));
            const team1Score = parseInt(matchDiv.querySelector(`input[data-team="1"]`).value) || 0;
            const team2Score = parseInt(matchDiv.querySelector(`input[data-team="2"]`).value) || 0;
            
            // Update match history
            matches.push({
                round: currentRound,
                team1: team1Players,
                team2: team2Players,
                team1Score,
                team2Score
            });
            
            // Update player stats
            team1Players.forEach(player => {
                player.gamesPlayed += 1;
                player.picklePoints += team1Score;
                
                player.pickleDifferential = (player.pickleDifferential || 0) + (team1Score - team2Score); // Update differential
                
                
                if (team1Score > team2Score) player.victoryPoints += 1;
                
                // Update teammates count
                team1Players
                    .filter(teammate => teammate !== player)
                    .forEach(teammate => updateTeammates(player, teammate));
                
                // Update versus count
                team2Players.forEach(opponent => updateVersus(player, opponent));
            });
            
            team2Players.forEach(player => {
                player.gamesPlayed += 1;
                player.picklePoints += team2Score;
                
                player.pickleDifferential = (player.pickleDifferential || 0) + (team2Score - team1Score); // Update differential
                
                
                if (team2Score > team1Score) player.victoryPoints += 1;
                
                // Update teammates count
                team2Players
                    .filter(teammate => teammate !== player)
                    .forEach(teammate => updateTeammates(player, teammate));
                
                // Update versus count
                team1Players.forEach(opponent => updateVersus(player, opponent));
            });
            
            // Replace score inputs with read-only display and highlight winner
            const team1Container = matchDiv.querySelector(`.team[data-team="1"]`);
            const team2Container = matchDiv.querySelector(`.team[data-team="2"]`);
            const team1ScoreInput = team1Container.querySelector('input.team-score');
            const team2ScoreInput = team2Container.querySelector('input.team-score');
            
            // Create read-only score displays
            const team1ScoreDisplay = document.createElement('p');
            team1ScoreDisplay.className = 'score-display';
            team1ScoreDisplay.textContent = `Score: ${team1Score}`;

            const team2ScoreDisplay = document.createElement('p');
            team2ScoreDisplay.className = 'score-display';
            team2ScoreDisplay.textContent = `Score: ${team2Score}`;

            // Replace the label elements containing the inputs
            const team1Label = team1ScoreInput.parentNode;
            const team2Label = team2ScoreInput.parentNode;
            team1Container.replaceChild(team1ScoreDisplay, team1Label);
            team2Container.replaceChild(team2ScoreDisplay, team2Label);

            // Highlight winner
            if (team1Score > team2Score) {
                team1Container.classList.add('winner-team');
            } else if (team2Score > team1Score) {
                team2Container.classList.add('winner-team');
            } else {
                // Tie - highlight both teams with a different class
                team1Container.classList.add('tie-team');
                team2Container.classList.add('tie-team');
            }
            
            // Remove skip button if present
            const skipButton = matchDiv.querySelector('.skip-match-btn');
            if (skipButton) skipButton.remove();
        });
        
        // Update podium and stats table
        const sortedPlayers = sortByVictoryPoints(players);
        displayPodium(sortedPlayers);
        displayPlayerStatsTable(sortedPlayers);
        
        // Remove the Submit Scores button for the round
        const submitScoresButton = document.querySelector('.round-container:last-child .submit-scores-btn');
        if (submitScoresButton) {
            submitScoresButton.remove();
        }
        
        const addMatchButton = document.querySelector('.round-container:last-child .add-match-btn');
        if (addMatchButton) {
            addMatchButton.remove();
        }
        
        const skipMatchButtons = document.querySelectorAll('.round-container:last-child .skip-match-btn');
        if (skipMatchButtons.length > 0) {
            skipMatchButtons.forEach(button => button.remove());
        }
        
        const editRoundButtons = document.querySelectorAll('.round-container:last-child .edit-round-btn');
        if (editRoundButtons.length > 0) {
            editRoundButtons.forEach(button => button.remove());
        }
        
        alert("Scores submitted! Starting the next round...");
        generateNextRound();
        autoSave();
    }


// Function to generate the next round after submitting scores
function generateNextRound() {
    const matchDisplay = document.getElementById('matchDisplay');
    const roundContainer = document.createElement('div');
    roundContainer.classList.add('round-container', currentRound % 2 === 0 ? 'even-round' : 'odd-round');

    const roundHeader = document.createElement('h3');
    roundHeader.textContent = `Round ${currentRound}`;
    roundContainer.appendChild(roundHeader);
    resetPreviousRoundPairs();
    
    // Call generatePairsAndMatches function which generates teams internally
    // We don't need to capture its return value as it doesn't return anything
    generatePairsAndMatches();
    
    autoSave();
}




// Reset history and enable rematches while keeping the last round's pairs
function resetPairAndMatchHistory() {
    logDebugMessage("Resetting pair and match history while keeping the previous round pairs.");

    // Keep only the pairs from the immediate previous round
    previousRoundPairs.clear();

    // Reset the extended pair history, preserving the most recent pairs
    Object.keys(extendedPairHistory).forEach(pairKey => {
        if (!previousRoundPairs.has(pairKey)) {
            extendedPairHistory[pairKey] = 0; // Reset count for non-recent pairs
        }
    });

    // Clear other histories as needed
    recentPairHistory.length = 0; // Clear recent pairs
    matchHistory.clear(); // Reset unique matches
}


// Utility function to generate or update match counter
function updateMatchPlayCounter(matchKey) {
    matchPlayCounter[matchKey] = (matchPlayCounter[matchKey] || 0) + 1;
    logDebugMessage(`Match ${matchKey} played ${matchPlayCounter[matchKey]} times.`);
}


function updateSitOutDisplay(sitOutPlayers) {
    let sitOutDisplay = document.querySelector('.sit-out-players');
    if (!sitOutDisplay) {
        sitOutDisplay = document.createElement('div');
        sitOutDisplay.classList.add('sit-out-players');
        document.getElementById('matchDisplay').appendChild(sitOutDisplay);
    }

    if (!sitOutPlayers || sitOutPlayers.length === 0) {
        sitOutDisplay.innerHTML = '<strong>🎉 Everyone is playing! 🎉</strong>';
        sitOutDisplay.classList.add('all-playing');
    } else {
        const sitOutPlayerNames = sitOutPlayers.map(player => 
            `<span class="sitting-player">${player.name}</span>`
        ).join(' ');
        sitOutDisplay.innerHTML = `<strong>Sitting out:</strong> ${sitOutPlayerNames}`;
        sitOutDisplay.classList.remove('all-playing');
    }
}



// Update main function to generate pairs and display matches
function generatePairsAndMatches() {
    clearDebugArea();
    logDebugMessage("Starting pair generation for Round " + currentRound + "...");

    resetEligibilityAndSitOut();

    const eligiblePlayers = players.filter(player => player.eligible);
    const courtCount = parseInt(document.getElementById('courtSelect').value, 10) || 1;
    const maxMatches = courtCount; // Each court can host one match

    if (eligiblePlayers.length < 4) {
        logDebugMessage("Not enough players to form even a single match.");
        return;
    }

    const sitOutPlayers = determineSitOuts();
    const playingPlayers = eligiblePlayers.filter(player => !sitOutPlayers.includes(player));
    const usableCourts = Math.floor(playingPlayers.length / 4); // Determine actual court usage

    const teams = createMatchesForRound(playingPlayers, Math.min(usableCourts, maxMatches));
    if (teams.length === 0) {
        logDebugMessage("No matches generated. Resetting history and retrying.");
        resetPairAndMatchHistory();
        const retryTeams = createMatchesForRound(playingPlayers, Math.min(usableCourts, maxMatches));
        appendMatchDisplay(retryTeams, sitOutPlayers);
    } else {
        appendMatchDisplay(teams, sitOutPlayers);
    }
    autoSave();
}


function playRound() {
    currentRound = 1;
    generatePairsAndMatches();
    autoSave();
}

function updateVersus(player, opponent) {
    if (!player.versus) {
        player.versus = {}; // Initialize versus object if undefined
    }
    const name = opponent.name;
    player.versus[name] = (player.versus[name] || 0) + 1; // Increment count or initialize
}


// Update teammates count without resetting and move the most recent addition to the end
function updateTeammates(player, teammate) {
    if (!player.teammates) {
        player.teammates = {}; // Initialize teammates object if undefined
    }
    const name = teammate.name;
    player.teammates[name] = (player.teammates[name] || 0) + 1; // Increment count or initialize
}


function showPodium() {
    displayCurrentDate();
    
    const podiumDisplay = document.getElementById('podiumDisplay');
    podiumDisplay.classList.add('active'); // Show podium display
    
    // Set default active sort button
    setDefaultActiveSortButton();

    // Initially sort and display by Victory Points
    const sortedPlayers = sortByVictoryPoints(players);
    displayPodium(sortedPlayers);
    displayPlayerStatsTable(sortedPlayers);
}

// Display the top 3 players on the podium
function displayPodium(sortedPlayers) {
    document.getElementById('gold').textContent = sortedPlayers[0]?.name || '';
    document.getElementById('silver').textContent = sortedPlayers[1]?.name || '';
    document.getElementById('bronze').textContent = sortedPlayers[2]?.name || '';
}

function displayPlayerStatsTable(sortedPlayers) {
    const playerStatsTable = document.getElementById('playerStatsTable');
    playerStatsTable.innerHTML = `
        <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Games Played</th>
            <th>Victory Points</th>
            <th>Win Percentage</th>
            <th>Pickle Points</th>
            <th>Pickle Differential</th>
            <th>Pickle Point Avg</th>
            <th>Teammates</th>
            <th>Versus</th>
        </tr>
    `;

    sortedPlayers.forEach((player, index) => {
        if (!player.teammates || typeof player.teammates !== 'object') {
            console.warn(`Player "${player.name}" has invalid teammates. Resetting to empty object.`);
            player.teammates = {}; // Ensure teammates is valid
        }
        if (!player.versus || typeof player.versus !== 'object') {
            console.warn(`Player "${player.name}" has invalid versus. Resetting to empty object.`);
            player.versus = {}; // Ensure versus is valid
        }

        const teammatesDisplay = Object.entries(player.teammates)
            .map(([name, count]) => `${name} x${count}`)
            .join('<br>');

        const versusDisplay = Object.entries(player.versus)
            .map(([name, count]) => `${name} x${count}`)
            .join('<br>');

        const winPercentage = player.gamesPlayed > 0 
            ? (player.victoryPoints / player.gamesPlayed) * 100 
            : 0;

        const picklePointAvg = player.gamesPlayed > 0 
            ? (player.picklePoints / player.gamesPlayed) 
            : 0;
            

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${player.name}</td>
            <td>${player.gamesPlayed}</td>
            <td>${player.victoryPoints}</td>
            <td>${winPercentage.toFixed(2)}%</td>
            <td>${player.picklePoints}</td>
            <td>${player.pickleDifferential}</td>
            <td>${picklePointAvg.toFixed(2)}</td>
            <td>${teammatesDisplay}</td>
            <td>${versusDisplay}</td>
        `;
        playerStatsTable.appendChild(row);
    });
}


// Sorting functions with improved tie-breaking
function sortByVictoryPoints(players) {
    return players.slice().sort((a, b) => {
        // Primary sort: Victory Points
        if (b.victoryPoints !== a.victoryPoints) {
            return b.victoryPoints - a.victoryPoints;
        }
        
        // Tie-breaker 1: Win Percentage (victories per game played)
        const winPercentA = a.gamesPlayed ? a.victoryPoints / a.gamesPlayed : 0;
        const winPercentB = b.gamesPlayed ? b.victoryPoints / b.gamesPlayed : 0;
        if (winPercentB !== winPercentA) {
            return winPercentB - winPercentA;
        }
        
        // Tie-breaker 2: Pickle Differential
        if ((b.pickleDifferential || 0) !== (a.pickleDifferential || 0)) {
            return (b.pickleDifferential || 0) - (a.pickleDifferential || 0);
        }
        
        // Tie-breaker 3: Total Pickle Points
        if (b.picklePoints !== a.picklePoints) {
            return b.picklePoints - a.picklePoints;
        }
        
        // Tie-breaker 4: Average Pickle Points per game
        const avgA = a.gamesPlayed ? a.picklePoints / a.gamesPlayed : 0;
        const avgB = b.gamesPlayed ? b.picklePoints / b.gamesPlayed : 0;
        if (avgB !== avgA) {
            return avgB - avgA;
        }
        
        // Tie-breaker 5: Games Played (more games = higher rank for equal stats)
        return b.gamesPlayed - a.gamesPlayed;
    });
}

function sortByPicklePoints(players) {
    return players.slice().sort((a, b) => {
        // Primary sort: Pickle Points
        if (b.picklePoints !== a.picklePoints) {
            return b.picklePoints - a.picklePoints;
        }
        
        // Tie-breaker 1: Victory Points
        if (b.victoryPoints !== a.victoryPoints) {
            return b.victoryPoints - a.victoryPoints;
        }
        
        // Tie-breaker 2: Pickle Differential
        if ((b.pickleDifferential || 0) !== (a.pickleDifferential || 0)) {
            return (b.pickleDifferential || 0) - (a.pickleDifferential || 0);
        }
        
        // Tie-breaker 3: Average Pickle Points per game
        const avgA = a.gamesPlayed ? a.picklePoints / a.gamesPlayed : 0;
        const avgB = b.gamesPlayed ? b.picklePoints / b.gamesPlayed : 0;
        if (avgB !== avgA) {
            return avgB - avgA;
        }
        
        // Tie-breaker 4: Win Percentage
        const winPercentA = a.gamesPlayed ? a.victoryPoints / a.gamesPlayed : 0;
        const winPercentB = b.gamesPlayed ? b.victoryPoints / b.gamesPlayed : 0;
        if (winPercentB !== winPercentA) {
            return winPercentB - winPercentA;
        }
        
        // Tie-breaker 5: Games Played (more games = higher rank for equal stats)
        return b.gamesPlayed - a.gamesPlayed;
    });
}

function sortByWinPercentage(players) {
    return players.slice().sort((a, b) => {
        // Primary sort: Win Percentage
        const winPercentA = a.gamesPlayed ? a.victoryPoints / a.gamesPlayed : 0;
        const winPercentB = b.gamesPlayed ? b.victoryPoints / b.gamesPlayed : 0;
        if (winPercentB !== winPercentA) {
            return winPercentB - winPercentA;
        }
        
        // Tie-breaker 1: Victory Points (total wins)
        if (b.victoryPoints !== a.victoryPoints) {
            return b.victoryPoints - a.victoryPoints;
        }
        
        // Tie-breaker 2: Pickle Differential
        if ((b.pickleDifferential || 0) !== (a.pickleDifferential || 0)) {
            return (b.pickleDifferential || 0) - (a.pickleDifferential || 0);
        }
        
        // Tie-breaker 3: Pickle Points
        if (b.picklePoints !== a.picklePoints) {
            return b.picklePoints - a.picklePoints;
        }
        
        // Tie-breaker 4: Average Pickle Points
        const avgA = a.gamesPlayed ? a.picklePoints / a.gamesPlayed : 0;
        const avgB = b.gamesPlayed ? b.picklePoints / b.gamesPlayed : 0;
        if (avgB !== avgA) {
            return avgB - avgA;
        }
        
        // Tie-breaker 5: Games Played (more games is better with equal stats)
        return b.gamesPlayed - a.gamesPlayed;
    });
}

function sortByPicklePointAvg(players) {
    return players.slice().sort((a, b) => {
        // Primary sort: Average Pickle Points
        const avgA = a.gamesPlayed ? a.picklePoints / a.gamesPlayed : 0;
        const avgB = b.gamesPlayed ? b.picklePoints / b.gamesPlayed : 0;
        if (avgB !== avgA) {
            return avgB - avgA;
        }
        
        // Tie-breaker 1: Pickle Points (total)
        if (b.picklePoints !== a.picklePoints) {
            return b.picklePoints - a.picklePoints;
        }
        
        // Tie-breaker 2: Victory Points
        if (b.victoryPoints !== a.victoryPoints) {
            return b.victoryPoints - a.victoryPoints;
        }
        
        // Tie-breaker 3: Win Percentage
        const winPercentA = a.gamesPlayed ? a.victoryPoints / a.gamesPlayed : 0;
        const winPercentB = b.gamesPlayed ? b.victoryPoints / b.gamesPlayed : 0;
        if (winPercentB !== winPercentA) {
            return winPercentB - winPercentA;
        }
        
        // Tie-breaker 4: Pickle Differential
        if ((b.pickleDifferential || 0) !== (a.pickleDifferential || 0)) {
            return (b.pickleDifferential || 0) - (a.pickleDifferential || 0);
        }
        
        // Tie-breaker 5: Games Played (more games is better with equal stats)
        return b.gamesPlayed - a.gamesPlayed;
    });
}

function sortByPickleDifferential(players) {
    return players.slice().sort((a, b) => {
        // Primary sort: Pickle Differential
        if ((b.pickleDifferential || 0) !== (a.pickleDifferential || 0)) {
            return (b.pickleDifferential || 0) - (a.pickleDifferential || 0);
        }
        
        // Tie-breaker 1: Victory Points
        if (b.victoryPoints !== a.victoryPoints) {
            return b.victoryPoints - a.victoryPoints;
        }
        
        // Tie-breaker 2: Win Percentage
        const winPercentA = a.gamesPlayed ? a.victoryPoints / a.gamesPlayed : 0;
        const winPercentB = b.gamesPlayed ? b.victoryPoints / b.gamesPlayed : 0;
        if (winPercentB !== winPercentA) {
            return winPercentB - winPercentA;
        }
        
        // Tie-breaker 3: Pickle Points
        if (b.picklePoints !== a.picklePoints) {
            return b.picklePoints - a.picklePoints;
        }
        
        // Tie-breaker 4: Average Pickle Points
        const avgA = a.gamesPlayed ? a.picklePoints / a.gamesPlayed : 0;
        const avgB = b.gamesPlayed ? b.picklePoints / b.gamesPlayed : 0;
        if (avgB !== avgA) {
            return avgB - avgA;
        }
        
        // Tie-breaker 5: Games Played (more games is better with equal stats)
        return b.gamesPlayed - a.gamesPlayed;
    });
}



function closePodium() {
    const podiumDisplay = document.getElementById('podiumDisplay');
    podiumDisplay.classList.remove('active'); // Hide it
}

// Ensure close button has its event listener
document.getElementById('closePodiumBtn').addEventListener('click', closePodium);




// Reset eligibility and sit-out status for each round
function resetEligibilityAndSitOut() {
    players.forEach(player => {
        // Make players who sat out last round eligible
        if (player.satOutLastRound && !player.manualSitOut) {
            player.eligible = true;
        } else if (!player.manualSitOut) {
            // Set eligibility based on whether they are manually sitting out
            player.eligible = true;
        }

        // Reset satOutLastRound status for all players
        player.satOutLastRound = false;
    });
}

function determineSitOuts() {
    console.log("=====================================");
    console.log("Determining sit-out players...");

    // Step 1: Handle manual sit-out players first (they should be excluded from eligible players)
    const manualSitOutPlayers = players.filter(player => player.manualSitOut);
    console.log("Manual sit-out players:", manualSitOutPlayers.map(player => player.name));

    // Step 2: Get remaining players after filtering manual sit-out players
    const remainingPlayers = players.filter(player => !player.manualSitOut);
    console.log("Remaining players after manual sit-out:", remainingPlayers.map(player => player.name));

    // Step 3: Calculate total spots available based on the number of courts
    const courtCount = parseInt(document.getElementById('courtSelect').value, 10);
    const spotsAvailable = courtCount * 4; // Each court needs 4 players
    console.log("Total spots available:", spotsAvailable);

    // Step 4: Determine eligible players (including those who sat out last round)
    const eligiblePlayers = remainingPlayers.filter(player => player.eligible || player.satOutLastRound);
    console.log("Eligible players after manual sit-out filtering:", eligiblePlayers.map(player => player.name));

    const eligibleCount = eligiblePlayers.length;
    console.log(`Eligible player count: ${eligibleCount}`);

    // Step 5: Calculate how many excess players need to sit out
    let sitOutPlayers = [...manualSitOutPlayers]; // Start with manual sit-out players
    let excessPlayers = 0;

    if (eligibleCount < spotsAvailable) {
        // More spots than eligible players, no additional players need to sit out
        console.log("There are more courts than players. Adjusting for remaining spots.");
        const remainder = eligibleCount % 4;
        console.log(`Players that need to sit out due to remaining spots: ${remainder}`);

        // Add remainder players to the sit-out list (even though they are eligible, they will sit out)
        const sortedEligiblePlayers = shuffleByGamesPlayed(eligiblePlayers);  // Sort and shuffle eligible players by games played
        for (let i = 0; i < remainder; i++) {
            sitOutPlayers.push(sortedEligiblePlayers[i]);
            sortedEligiblePlayers[i].eligible = false;
            console.log(`Player ${sortedEligiblePlayers[i].name} eligibility set to: ${sortedEligiblePlayers[i].eligible} (due to remaining spots)`);
        }
    } else {
        // If there are excess players that need to sit out
        excessPlayers = eligibleCount - spotsAvailable;
        console.log(`Excess players that need to sit out: ${excessPlayers}`);

        // Step 6: Exclude players who sat out last round from sitting out again unless necessary
        const playersWhoSatOutLastRound = eligiblePlayers.filter(player => player.satOutLastRound);
        const playersNotSatOutLastRound = eligiblePlayers.filter(player => !player.satOutLastRound);

        console.log("Players who sat out last round:", playersWhoSatOutLastRound.map(player => player.name));
        console.log("Players who did not sit out last round:", playersNotSatOutLastRound.map(player => player.name));

        // Step 7: Sort and shuffle players who did not sit out last round by their game count
        const sortedPlayersNotSatOutLastRound = shuffleByGamesPlayed(playersNotSatOutLastRound);

        // Add players who did not sit out last round first, based on the highest number of games played
        for (let i = 0; i < excessPlayers && sortedPlayersNotSatOutLastRound[i]; i++) {
            sitOutPlayers.push(sortedPlayersNotSatOutLastRound[i]);  // Add them to sit-out list
            sortedPlayersNotSatOutLastRound[i].eligible = false; // Mark them as not eligible
            sortedPlayersNotSatOutLastRound[i].satOutLastRound = true; // Mark them as having sat out this round
            console.log(`Player ${sortedPlayersNotSatOutLastRound[i].name} eligibility set to: ${sortedPlayersNotSatOutLastRound[i].eligible} (excess players, did not sit out last round)`);
        }

        // If there are still remaining players to sit out, use the ones who sat out last round (only if necessary)
        const sortedPlayersWhoSatOutLastRound = shuffleByGamesPlayed(playersWhoSatOutLastRound);
        for (let i = sortedPlayersNotSatOutLastRound.length; i < excessPlayers; i++) {
            sitOutPlayers.push(sortedPlayersWhoSatOutLastRound[i]);  // Add them to sit-out list
            sortedPlayersWhoSatOutLastRound[i].eligible = false; // Mark them as not eligible
            sortedPlayersWhoSatOutLastRound[i].satOutLastRound = true; // Mark them as having sat out this round
            console.log(`Player ${sortedPlayersWhoSatOutLastRound[i].name} eligibility set to: ${sortedPlayersWhoSatOutLastRound[i].eligible} (excess players, sat out last round)`);
        }
    }

    // Step 8: Log the final sit-out players for debugging
    console.log("Final sit-out players for this round:", sitOutPlayers.map(player => player.name));

    // Step 9: Update the eligibility of all players based on the final sit-out list
    players.forEach(player => {
        player.eligible = !sitOutPlayers.includes(player); // Players in sit-out list are not eligible
        player.satOutLastRound = sitOutPlayers.includes(player); // Mark players who sat out this round
        console.log(`Player ${player.name} eligibility updated to: ${player.eligible}, satOutLastRound: ${player.satOutLastRound}`);
    });

    // Step 10: Update the UI with the sit-out players
    const sitOutDisplay = document.getElementById('sitOutDisplay');
    if (sitOutDisplay) {
        const sitOutPlayerNames = sitOutPlayers.map(player => player.name).join(", ");
        sitOutDisplay.textContent = `Sitting out: ${sitOutPlayerNames}`; // Display sit-out players correctly
    }

    return sitOutPlayers;
}

// Utility function to shuffle players with the same number of games played
function shuffleByGamesPlayed(players) {
    // Sort by games played (highest to lowest)
    players.sort((a, b) => b.gamesPlayed - a.gamesPlayed);

    // Shuffle players with the same number of games played
    const sameGamesPlayedPlayers = [];
    let previousGamesPlayed = -1;

    for (let i = 0; i < players.length; i++) {
        if (players[i].gamesPlayed === previousGamesPlayed) {
            sameGamesPlayedPlayers.push(players[i]);
        } else {
            if (sameGamesPlayedPlayers.length > 0) {
                // Shuffle the players with the same number of games played
                shuffleArray(sameGamesPlayedPlayers);
                players.splice(i - sameGamesPlayedPlayers.length, sameGamesPlayedPlayers.length, ...sameGamesPlayedPlayers);
            }
            sameGamesPlayedPlayers.length = 0;
            sameGamesPlayedPlayers.push(players[i]);
        }
        previousGamesPlayed = players[i].gamesPlayed;
    }

    // Shuffle any remaining players with the same number of games played
    if (sameGamesPlayedPlayers.length > 0) {
        shuffleArray(sameGamesPlayedPlayers);
        players.splice(players.length - sameGamesPlayedPlayers.length, sameGamesPlayedPlayers.length, ...sameGamesPlayedPlayers);
    }

    return players;
}


function exportData() {
    // Create a complete state object like we do for autosave
    const state = {
        players: players.map(player => ({
            ...player, // Spread to ensure all properties, including manualSitOut and eligible, are saved
        })),
        matches,
        currentRound,
        isFirstRound,
        pairHistory,
        previousRoundPairs: Array.from(previousRoundPairs),
        matchHistory: Array.from(matchHistory),
        recentPairHistory: recentPairHistory.map(set => Array.from(set)), // Convert Sets to arrays for saving
        extendedPairHistory,
        globalPairHistory: Array.from(globalPairHistory),
        matchPlayCounter,
    };

    const data = JSON.stringify(state);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Add date to filename for better tracking
    const currentDate = new Date().toISOString().slice(0, 10);
    a.download = `pickleball_competition_${currentDate}.json`;
    
    a.click();
    URL.revokeObjectURL(url); // Clean up to avoid memory leaks
}

function importData(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
        try {
            const importedData = JSON.parse(reader.result);
            
            // Check if it's the old format (just players array) or new format (full state object)
            if (Array.isArray(importedData)) {
                // Old format - just players
                players.length = 0; // Clear current players
                players.push(...importedData);
                updatePlayerList();
                alert("Players imported successfully. Note: Match history was not found in this file.");
            } else {
                // New format - full game state
                // Restore players
                players.length = 0;
                players.push(...(importedData.players || []).map(player => ({
                    ...player, // Ensure all properties are restored
                })));

                // Restore match history
                matches.length = 0;
                if (importedData.matches && Array.isArray(importedData.matches)) {
                    matches.push(...importedData.matches);
                }
                
                // Restore other game state
                currentRound = importedData.currentRound || 1;
                isFirstRound = importedData.isFirstRound !== undefined ? importedData.isFirstRound : true;

                // Clear and restore pairHistory
                Object.keys(pairHistory).forEach(key => delete pairHistory[key]);
                if (importedData.pairHistory) {
                    Object.assign(pairHistory, importedData.pairHistory);
                }

                // Clear and restore previousRoundPairs
                previousRoundPairs.clear();
                if (importedData.previousRoundPairs && Array.isArray(importedData.previousRoundPairs)) {
                    importedData.previousRoundPairs.forEach(item => previousRoundPairs.add(item));
                }

                // Clear and restore matchHistory
                matchHistory.clear();
                if (importedData.matchHistory && Array.isArray(importedData.matchHistory)) {
                    importedData.matchHistory.forEach(item => matchHistory.add(item));
                }

                // Clear and restore recentPairHistory
                recentPairHistory.length = 0;
                if (importedData.recentPairHistory && Array.isArray(importedData.recentPairHistory)) {
                    importedData.recentPairHistory.forEach(savedSet => {
                        recentPairHistory.push(new Set(savedSet)); // Convert arrays back to Sets
                    });
                }

                // Clear and restore extendedPairHistory
                Object.keys(extendedPairHistory).forEach(key => delete extendedPairHistory[key]);
                if (importedData.extendedPairHistory) {
                    Object.assign(extendedPairHistory, importedData.extendedPairHistory);
                }

                // Clear and restore globalPairHistory
                globalPairHistory.clear();
                if (importedData.globalPairHistory && Array.isArray(importedData.globalPairHistory)) {
                    importedData.globalPairHistory.forEach(item => globalPairHistory.add(item));
                }

                // Clear and restore matchPlayCounter
                Object.keys(matchPlayCounter).forEach(key => delete matchPlayCounter[key]);
                if (importedData.matchPlayCounter) {
                    Object.assign(matchPlayCounter, importedData.matchPlayCounter);
                }

                // Update UI with imported data
                updatePlayerList();
                
                // Update player stats table if needed
                const sortedPlayers = sortByVictoryPoints(players);
                displayPodium(sortedPlayers);
                displayPlayerStatsTable(sortedPlayers);
                
                // Save the imported state to localStorage
                autoSave();
                
                alert("Game state imported successfully with match history and all settings.");
            }
        } catch (error) {
            console.error("Error importing data:", error);
            alert("Error importing data. The file may be corrupted or in an invalid format.");
        }
    };

    reader.readAsText(file);
    
    // Reset the input field to allow re-importing the same file
    event.target.value = '';
}




// Event Listener for Match History Button
document.getElementById('matchesPlayed').addEventListener('click', () => {
    console.log("Match History button clicked");
    showMatchHistory();
});

// Close Match History Button
document.getElementById('closeMatchHistoryBtn').addEventListener('click', () => {
    console.log("Close Match History button clicked");
    const matchHistoryDisplay = document.getElementById('matchHistoryDisplay');
    
    // Clear both the style and class
    matchHistoryDisplay.style.visibility = 'hidden';
    matchHistoryDisplay.style.opacity = '0';
    matchHistoryDisplay.style.display = 'none';
    matchHistoryDisplay.classList.remove('active');
});

// Function to Show Match History
function showMatchHistory() {
    console.log("showMatchHistory function called");
    const matchHistoryDisplay = document.getElementById('matchHistoryDisplay');
    const matchHistoryContent = document.getElementById('matchHistoryContent');

    // Make sure the element exists
    if (!matchHistoryDisplay) {
        console.error("Match history display element not found!");
        return;
    }

    // Clear previous history
    matchHistoryContent.innerHTML = '';

    // Add direct style manipulation in addition to class
    matchHistoryDisplay.style.visibility = 'visible';
    matchHistoryDisplay.style.opacity = '1';
    matchHistoryDisplay.style.display = 'flex';
    
    // Add active class for CSS transitions
    matchHistoryDisplay.classList.add('active');

    if (matches.length === 0) {
        matchHistoryContent.innerHTML = '<div class="empty-state">No matches have been played yet.</div>';
    } else {
        // Create a table to display match history
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Round</th>
                    <th>Match</th>
                    <th>Team 1</th>
                    <th>Team 2</th>
                    <th>Score</th>
                    <th>Winner</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tableBody = table.querySelector('tbody');

        // Group matches by round and track match occurrences
        const matchColors = {}; // To store a unique color for each repeated match
        const matchKeyMap = {}; // To count occurrences of each match key

        // First, sort matches by round, then by original index
        // Create a copy of matches array with their original indices
        const sortedMatches = matches.map((match, index) => ({
            match,
            originalIndex: index
        })).sort((a, b) => {
            // Sort by round first (ascending)
            if (a.match.round !== b.match.round) {
                return a.match.round - b.match.round;
            }
            // If rounds are the same, sort by original index
            return a.originalIndex - b.originalIndex;
        });

        // Count match occurrences and prepare color mapping
        sortedMatches.forEach(({ match }) => {
            const matchKey = generateMatchKey(match.team1, match.team2);

            // Count occurrences of each match
            if (!matchKeyMap[matchKey]) {
                matchKeyMap[matchKey] = { count: 0, color: null };
            }
            matchKeyMap[matchKey].count++;

            // Assign a color if it's a repeated match
            if (matchKeyMap[matchKey].count > 1 && !matchKeyMap[matchKey].color) {
                matchKeyMap[matchKey].color = generateUniqueColor(Object.keys(matchColors).length);
                matchColors[matchKey] = matchKeyMap[matchKey].color;
            }
        });

        // Display matches in sorted order but keep original index reference for edit functionality
        sortedMatches.forEach(({ match, originalIndex }, displayIndex) => {
            const matchKey = generateMatchKey(match.team1, match.team2);
            const row = document.createElement('tr');
            row.setAttribute('data-match-index', originalIndex); // Keep original index for edit functionality

            // Apply the assigned color for repeated matches
            if (matchColors[matchKey]) {
                row.style.backgroundColor = matchColors[matchKey];
            }

            // Determine winner
            let winner = "Tie";
            if (match.team1Score > match.team2Score) {
                winner = match.team1.map(player => player.name).join(' & ');
            } else if (match.team2Score > match.team1Score) {
                winner = match.team2.map(player => player.name).join(' & ');
            }
            
            // Display round number (adjusted for 0-based rounds)
            const displayRound = match.round <= 0 ? match.round : match.round - 1;

            row.innerHTML = `
                <td>${displayRound}</td>
                <td>Match ${displayIndex + 1}</td>
                <td class="team-cell">${match.team1.map(player => 
                    `<span class="team1-badge">${player.name}</span>`).join(' & ')}
                </td>
                <td class="team-cell">${match.team2.map(player => 
                    `<span class="team2-badge">${player.name}</span>`).join(' & ')}
                </td>
                <td><strong>${match.team1Score || 0} - ${match.team2Score || 0}</strong></td>
                <td>${winner}</td>
                <td><button class="edit-match-btn" data-match-index="${originalIndex}">
                    <span class="material-symbols-rounded">edit</span>
                </button></td>
            `;
            tableBody.appendChild(row);
        });

        matchHistoryContent.appendChild(table);

        // Add event listeners to edit buttons
        const editButtons = table.querySelectorAll('.edit-match-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const matchIndex = parseInt(this.getAttribute('data-match-index'));
                editMatch(matchIndex);
            });
        });
    }
}

// Generate a unique color
function generateUniqueColor(index) {
    // More subtle colors for match highlighting
    const colors = [
        'rgba(255, 221, 193, 0.3)', // Light peach
        'rgba(255, 171, 171, 0.3)', // Light pink
        'rgba(255, 195, 160, 0.3)', // Light coral
        'rgba(213, 170, 255, 0.3)', // Light lavender
        'rgba(133, 227, 255, 0.3)', // Light blue
        'rgba(185, 251, 192, 0.3)', // Light mint
        'rgba(255, 156, 238, 0.3)'  // Light magenta
    ];
    return colors[index % colors.length];
}

document.getElementById('saveAsPictureBtn').addEventListener('click', () => {
    const podiumDiv = document.getElementById('podiumDisplay');
    
    // Use the new improved capture function from our inline script
    if (typeof captureElementAsImage === 'function') {
        captureElementAsImage(podiumDiv, 'leaderboard');
    } else {
        // Fallback to old method if the function doesn't exist
        const originalStyle = podiumDiv.style.cssText; // Save the original styles

        // Temporarily expand the div to include all scrollable content
        podiumDiv.style.overflow = 'visible';
        podiumDiv.style.height = 'auto';
        podiumDiv.style.maxHeight = 'none';

        // Allow table content to render fully by ensuring all rows are visible
        const tables = podiumDiv.querySelectorAll('table');
        tables.forEach(table => {
            table.style.overflow = 'visible';
            table.style.height = 'auto';
            table.style.maxHeight = 'none';
        });

        html2canvas(podiumDiv, {
            scrollX: 0,
            scrollY: 0,
            windowWidth: podiumDiv.scrollWidth,
            windowHeight: podiumDiv.scrollHeight,
            scale: 2 // Higher resolution
        }).then((canvas) => {
            // Revert the original styles after rendering
            podiumDiv.style.cssText = originalStyle;

            tables.forEach(table => {
                table.style.overflow = '';
                table.style.height = '';
                table.style.maxHeight = '';
            });

            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            const currentDate = new Date().toISOString().slice(0, 10); // Get current date
            link.download = `leaderboard-${currentDate}.png`;
            link.click();
        });
    }
});


function displayCurrentDate() {
        const dateDiv = document.getElementById('dateDisplay');
        const currentDate = new Date();
        
        // Format the date as desired, e.g., "November 20, 2024"
        const formattedDate = currentDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Insert the formatted date into the div
        dateDiv.textContent = `${formattedDate}`;
}









let originalPlayerData = []; // Store original data for reverting changes


function enablePlayerStatsEditing() {
    // Save a deep copy of the current player data for reverting if needed
    originalPlayerData = JSON.parse(JSON.stringify(players));

    const playerStatsTable = document.getElementById('playerStatsTable');
    const rows = playerStatsTable.querySelectorAll('tr');
    
    // Add mobile-edit class to the table to optimize for mobile
    playerStatsTable.classList.add('mobile-edit-mode');

    rows.forEach((row, index) => {
        // Skip header row
        if (index === 0) return;

        // Get player name from the second cell (Name column)
        const playerName = row.querySelector('td:nth-child(2)').textContent.trim();
        const player = players.find(p => p.name === playerName);

        if (!player) {
            console.error(`Player data not found for name "${playerName}"`);
            return;
        }

        const cells = row.querySelectorAll('td');

        // Convert static columns to inputs with better mobile styling
        cells[2].innerHTML = `<input type="number" value="${player.gamesPlayed || 0}" min="0" data-stat="gamesPlayed" data-player="${playerName}" class="stat-input">`;
        cells[3].innerHTML = `<input type="number" value="${player.victoryPoints || 0}" min="0" data-stat="victoryPoints" data-player="${playerName}" class="stat-input">`;
        cells[5].innerHTML = `<input type="number" value="${player.picklePoints || 0}" min="0" data-stat="picklePoints" data-player="${playerName}" class="stat-input">`;

        // Add editable teammates with better styling
        const teammatesCell = cells[8]; // Changed from 7 to 8 to match the Teammates column
        let teammatesHtml = '<div class="edit-relations-container">';
        if (player.teammates) {
            Object.entries(player.teammates).forEach(([name, count]) => {
                teammatesHtml += `
                    <div class="relation-item">
                        <span class="relation-name">${name}</span>
                        <input type="number" value="${count || 0}" min="0" data-type="teammates" data-name="${name}" data-player="${playerName}" class="relation-input">
                    </div>
                `;
            });
        }

        // Add "Add Teammate" dropdown with better styling
        const availableTeammates = players
            .filter(p => p.name !== player.name && (!player.teammates || !(p.name in player.teammates)))
            .map(p => `<option value="${p.name}">${p.name}</option>`)
            .join('');
        teammatesHtml += `
            <div class="add-relation">
                <select data-action="add-teammate" data-player="${playerName}" class="add-relation-select">
                    <option value="" disabled selected>Add Teammate</option>
                    ${availableTeammates}
                </select>
            </div>
        </div>`;
        teammatesCell.innerHTML = teammatesHtml;

        // Add editable versus opponents with better styling
        const versusCell = cells[9]; // Changed from 8 to 9 to match the Versus column
        let versusHtml = '<div class="edit-relations-container">';
        if (player.versus) {
            Object.entries(player.versus).forEach(([name, count]) => {
                versusHtml += `
                    <div class="relation-item">
                        <span class="relation-name">${name}</span>
                        <input type="number" value="${count || 0}" min="0" data-type="versus" data-name="${name}" data-player="${playerName}" class="relation-input">
                    </div>
                `;
            });
        }

        // Add "Add Opponent" dropdown with better styling
        const availableOpponents = players
            .filter(p => p.name !== player.name && (!player.versus || !(p.name in player.versus)))
            .map(p => `<option value="${p.name}">${p.name}</option>`)
            .join('');
        versusHtml += `
            <div class="add-relation">
                <select data-action="add-opponent" data-player="${playerName}" class="add-relation-select">
                    <option value="" disabled selected>Add Opponent</option>
                    ${availableOpponents}
                </select>
            </div>
        </div>`;
        versusCell.innerHTML = versusHtml;
    });

    // Add event listeners for the dropdowns
    document.querySelectorAll('select[data-action="add-teammate"]').forEach(dropdown => {
        dropdown.addEventListener('change', (event) => {
            const playerName = event.target.dataset.player;
            const teammateName = event.target.value;
            if (teammateName) {
                const player = players.find(p => p.name === playerName);
                if (!player.teammates) player.teammates = {};
                player.teammates[teammateName] = 1; // Add with a default value of 1
                enablePlayerStatsEditing(); // Re-render the table
            }
        });
    });

    document.querySelectorAll('select[data-action="add-opponent"]').forEach(dropdown => {
        dropdown.addEventListener('change', (event) => {
            const playerName = event.target.dataset.player;
            const opponentName = event.target.value;
            if (opponentName) {
                const player = players.find(p => p.name === playerName);
                if (!player.versus) player.versus = {};
                player.versus[opponentName] = 1; // Add with a default value of 1
                enablePlayerStatsEditing(); // Re-render the table
            }
        });
    });

    // Change "Edit Player Stats" button to "Save Stats"
    const editStatsButton = document.getElementById('editPlayerStatsBtn');
    editStatsButton.textContent = 'Save Stats';
    editStatsButton.onclick = savePlayerStats;

    // Enable Close Button to cancel edits
    const closeButton = document.getElementById('closePodiumBtn');
    closeButton.onclick = cancelPlayerStatsEditing;
    autoSave();
}

function savePlayerStats() {
    const inputs = document.querySelectorAll('#playerStatsTable input');

    inputs.forEach(input => {
        const playerName = input.dataset.player; // Get player name from the data attribute
        const stat = input.dataset.stat; // Stat being edited (e.g., gamesPlayed, victoryPoints, etc.)
        const type = input.dataset.type; // Type (teammates or versus)
        const name = input.dataset.name; // For teammates or versus
        const value = parseInt(input.value, 10) || 0; // Default to 0 if not a number

        const player = players.find(p => p.name === playerName);
        if (!player) {
            console.error(`Player not found for name "${playerName}"`);
            return;
        }

        if (stat) {
            // Update main stats (gamesPlayed, victoryPoints, picklePoints)
            player[stat] = value;
        } else if (type === 'teammates') {
            // Update teammates
            if (!player.teammates) player.teammates = {};
            if (value > 0) {
                player.teammates[name] = value;
            } else {
                delete player.teammates[name]; // Remove teammate if the value is 0
            }
        } else if (type === 'versus') {
            // Update versus
            if (!player.versus) player.versus = {};
            if (value > 0) {
                player.versus[name] = value;
            } else {
                delete player.versus[name]; // Remove opponent if the value is 0
            }
        }
    });

    // Remove mobile-edit class from the table
    document.getElementById('playerStatsTable').classList.remove('mobile-edit-mode');

    // Refresh the table to remove inputs and display updated stats
    const sortedPlayers = sortByVictoryPoints(players); // Sort players by Victory Points
    displayPlayerStatsTable(sortedPlayers); // Re-render the table with updated stats

    // Revert the "Save Stats" button back to "Edit Player Stats"
    const editStatsButton = document.getElementById('editPlayerStatsBtn');
    editStatsButton.textContent = 'Edit Player Stats';
    editStatsButton.onclick = enablePlayerStatsEditing;

    // Reset Close Button functionality
    const closeButton = document.getElementById('closePodiumBtn');
    closeButton.onclick = closePodium;

    alert('Player stats updated successfully!');
    autoSave();
}

function cancelPlayerStatsEditing() {
    const confirmCancel = confirm('Are you sure you want to exit without saving? Unsaved changes will be lost.');
    if (!confirmCancel) {
        return;
    }

    // Remove mobile-edit class from the table
    document.getElementById('playerStatsTable').classList.remove('mobile-edit-mode');

    // Restore original data
    players.length = 0;
    players.push(...originalPlayerData);

    // Refresh the table to reflect the original data
    const sortedPlayers = sortByVictoryPoints(players);
    displayPlayerStatsTable(sortedPlayers);

    // Revert button to "Edit Player Stats"
    const editStatsButton = document.getElementById('editPlayerStatsBtn');
    editStatsButton.textContent = 'Edit Player Stats';
    editStatsButton.onclick = enablePlayerStatsEditing;

    // Reset Close Button functionality
    const closeButton = document.getElementById('closePodiumBtn');
    closeButton.onclick = closePodium;

    alert('Edits canceled. Original stats restored.');
}


function autoSave() {
    const state = {
        players: players.map(player => ({
            ...player, // Spread to ensure all properties, including manualSitOut and eligible, are saved
        })),
        matches,
        currentRound,
        isFirstRound,
        pairHistory,
        previousRoundPairs: Array.from(previousRoundPairs),
        matchHistory: Array.from(matchHistory),
        recentPairHistory: recentPairHistory.map(set => Array.from(set)), // Convert Sets to arrays for saving
        extendedPairHistory,
        globalPairHistory: Array.from(globalPairHistory),
        matchPlayCounter,
    };

    localStorage.setItem('pickleballCompetitionState', JSON.stringify(state));

    console.log("Game state saved. Player statuses and selectors:");
    players.forEach(player => {
        const selectorValue = player.manualSitOut ? "Sit Out" : "Stay In";
        console.log(`Player: ${player.name}, Eligible: ${player.eligible}, Manual Sit-Out: ${player.manualSitOut}, Sat Out Last Round: ${player.satOutLastRound}, Selector: ${selectorValue}`);
    });
}



function restoreState() {
    const savedState = JSON.parse(localStorage.getItem('pickleballCompetitionState'));
    if (savedState) {
        try {
            // Restore players
            players.length = 0;
            players.push(...(savedState.players || []).map(player => ({
                ...player, // Ensure all properties, including manualSitOut and eligible, are restored
            })));

            // Restore other data
            matches.length = 0;
            matches.push(...(savedState.matches || []));
            currentRound = savedState.currentRound || 1;
            isFirstRound = savedState.isFirstRound !== undefined ? savedState.isFirstRound : true;

            Object.keys(pairHistory).forEach(key => delete pairHistory[key]);
            Object.assign(pairHistory, savedState.pairHistory || {});

            previousRoundPairs.clear();
            (savedState.previousRoundPairs || []).forEach(item => previousRoundPairs.add(item));

            matchHistory.clear();
            (savedState.matchHistory || []).forEach(item => matchHistory.add(item));

            recentPairHistory.length = 0;
            (savedState.recentPairHistory || []).forEach(savedSet => {
                recentPairHistory.push(new Set(savedSet)); // Convert arrays back to Sets
            });

            Object.keys(extendedPairHistory).forEach(key => delete extendedPairHistory[key]);
            Object.assign(extendedPairHistory, savedState.extendedPairHistory || {});

            globalPairHistory.clear();
            (savedState.globalPairHistory || []).forEach(item => globalPairHistory.add(item));

            Object.keys(matchPlayCounter).forEach(key => delete matchPlayCounter[key]);
            Object.assign(matchPlayCounter, savedState.matchPlayCounter || {});

            console.log("Players after adding:", players); // Debugging step
            
            // Ensure player data is valid
            players.forEach(player => {
                if (!player.teammates || typeof player.teammates !== 'object') {
                    console.error(`Invalid teammates for player: ${player.name}`);
                    player.teammates = {}; // Fix if invalid
                }
                if (!player.versus || typeof player.versus !== 'object') {
                    console.error(`Invalid versus for player: ${player.name}`);
                    player.versus = {}; // Fix if invalid
                }
                // Ensure numeric values are actually numbers
                player.gamesPlayed = Number(player.gamesPlayed) || 0;
                player.victoryPoints = Number(player.victoryPoints) || 0;
                player.picklePoints = Number(player.picklePoints) || 0;
                player.pickleDifferential = Number(player.pickleDifferential) || 0;
            });
            
            // Update the player list in the UI
            updatePlayerList();
            
            // Check and regenerate the match display if there are matches
            if (matches && matches.length > 0) {
                // Update player stats table
                const sortedPlayers = sortByVictoryPoints(players);
                displayPodium(sortedPlayers);
                displayPlayerStatsTable(sortedPlayers);
            }

            console.log("Competition state restored. Player statuses and selectors:");
            players.forEach(player => {
                const selectorValue = player.manualSitOut ? "Sit Out" : "Stay In";
                console.log(`Player: ${player.name}, Eligible: ${player.eligible}, Manual Sit-Out: ${player.manualSitOut}, Sat Out Last Round: ${player.satOutLastRound}, Selector: ${selectorValue}`);
            });

            console.log("Competition state restored successfully.");
        } catch (error) {
            console.error("Error restoring state:", error);
            alert("There was an error restoring your previous session. Some data may be missing or corrupted.");
        }
    } else {
        console.log("No saved state found.");
    }
}


function clearState() {
    const confirmClear = confirm("Are you sure you want to clear the current competition data? This action cannot be undone.");
    if (!confirmClear) {
        return; // Exit if the user cancels
    }

    // Clear players array without reassigning
    players.length = 0;

    // Clear matches array without reassigning
    matches.length = 0;

    currentRound = 1;
    isFirstRound = true;

    // Clear pairHistory without reassigning
    Object.keys(pairHistory).forEach(key => delete pairHistory[key]);

    // Clear previousRoundPairs without reassigning
    previousRoundPairs.clear();

    // Clear matchHistory without reassigning
    matchHistory.clear();

    // Clear recentPairHistory without reassigning
    recentPairHistory.length = 0;

    // Clear extendedPairHistory without reassigning
    Object.keys(extendedPairHistory).forEach(key => delete extendedPairHistory[key]);

    // Clear globalPairHistory without reassigning
    globalPairHistory.clear();

    // Clear matchPlayCounter without reassigning
    Object.keys(matchPlayCounter).forEach(key => delete matchPlayCounter[key]);

    // Clear UI
    document.getElementById('matchDisplay').innerHTML = '';
    document.getElementById('playerList').innerHTML = '';
    document.getElementById('podiumDisplay').innerHTML = '';
    document.getElementById('playerCount').textContent = 'Player Count: 0';

    // Clear localStorage
    localStorage.removeItem('pickleballCompetitionState');

    console.log("Competition data cleared successfully.");
    alert("All competition data has been cleared.");
    location.reload();
}


function addMatch(roundContainer, sitOutPlayers) {
    // Add debug logging
    logDebugMessage("=== START ADD MATCH ===");
    logDebugMessage(`Current sit-out players before processing: ${sitOutPlayers.map(p => p.name).join(', ')}`);
    
    // Log player eligibility status before making changes
    logPlayersEligibilityStatus();
    
    // Log pair history for debugging
    logPairHistory();
    
    // Reset eligibility for players not already in a match
    const playersInMatches = new Set();
    roundContainer.querySelectorAll('.match:not([data-skipped="true"])').forEach(matchDiv => {
        matchDiv.querySelectorAll('.team1-player, .team2-player').forEach(playerSpan => {
            const playerName = playerSpan.textContent.trim();
            const player = players.find(p => p.name === playerName);
            if (player) {
                playersInMatches.add(player);
                logDebugMessage(`Player ${player.name} is already in a match`);
            }
        });
    });

    // Mark remaining players as eligible if not manually set to sit out
    players.forEach(player => {
        const wasEligible = player.eligible;
        if (!playersInMatches.has(player) && !player.manualSitOut) {
            player.eligible = true;
            if (!wasEligible) {
                logDebugMessage(`Player ${player.name} eligibility changed from ${wasEligible} to ${player.eligible}`);
            }
        }
    });

    // Get eligible players and calculate available courts
    const eligiblePlayers = players.filter(player => player.eligible && !playersInMatches.has(player));
    logDebugMessage(`Eligible players for new match: ${eligiblePlayers.map(p => p.name).join(', ')}`);
    
    const courtCount = parseInt(document.getElementById('courtSelect').value, 10) || 1;
    const maxMatches = courtCount;

    // Ensure we do not count skipped matches as active courts
    const activeMatches = roundContainer.querySelectorAll('.match:not([data-skipped="true"])').length;
    logDebugMessage(`Active matches: ${activeMatches}, Max matches: ${maxMatches}`);

    if (activeMatches >= maxMatches) {
        alert("No more matches can be added; all courts are in use.");
        logDebugMessage("Cannot add match: all courts in use");
        return;
    }

    if (eligiblePlayers.length < 4) {
        alert("Not enough players to form another match.");
        logDebugMessage(`Cannot add match: only ${eligiblePlayers.length} eligible players`);
        return;
    }

    // Generate a new match
    logDebugMessage("Attempting to create match with players: " + eligiblePlayers.map(p => p.name).join(', '));
    
    // Debug player relationship status
    logDebugMessage("=== ELIGIBLE PLAYERS RELATIONSHIP STATUS ===");
    for (const player of eligiblePlayers) {
        logDebugMessage(`Player ${player.name}:`);
        
        // Log teammate relationships
        if (player.teammates && Object.keys(player.teammates).length > 0) {
            const teammateStr = Object.entries(player.teammates)
                .map(([name, count]) => `${name} (${count})`)
                .join(', ');
            logDebugMessage(`  Teammates: ${teammateStr}`);
        } else {
            logDebugMessage(`  No teammate history`);
        }
        
        // Log versus relationships
        if (player.versus && Object.keys(player.versus).length > 0) {
            const versusStr = Object.entries(player.versus)
                .map(([name, count]) => `${name} (${count})`)
                .join(', ');
            logDebugMessage(`  Versus: ${versusStr}`);
        } else {
            logDebugMessage(`  No versus history`);
        }
    }
    logDebugMessage("========================================");
    
    const newMatches = createMatchesForRound(eligiblePlayers, 1); // Create only one match

    if (newMatches.length === 0) {
        alert("Unable to form a valid match. Please adjust player settings or reset history.");
        logDebugMessage("Failed to create valid match with eligible players");
        return;
    }

    // Add the new match to the round
    newMatches.forEach(match => {
        logDebugMessage(`Created match - Team 1: ${match.team1.map(p => p.name).join(' & ')}, Team 2: ${match.team2.map(p => p.name).join(' & ')}`);
        
        const matchKey = generateMatchKey(match.team1, match.team2);
        
        // Store the round number
        const roundNum = parseInt(roundContainer.getAttribute('data-round')) || currentRound;
        
        // Add to match history tracking
        if (!matchHistory.has(matchKey)) {
            matchHistory.add(matchKey);
            updateMatchPlayCounter(matchKey);
            logDebugMessage(`Added match ${matchKey} to match history`);
        }
        
        // Add pairs to tracking
        const team1PairKey = generatePairKey(match.team1[0], match.team1[1]);
        const team2PairKey = generatePairKey(match.team2[0], match.team2[1]);
        
        // Add pairs to extended history
        if (!previousRoundPairs.has(team1PairKey)) {
            previousRoundPairs.add(team1PairKey);
            addPairToRecentHistory(team1PairKey);
            logDebugMessage(`Added team 1 pair ${team1PairKey} to recent history`);
        }
        
        if (!previousRoundPairs.has(team2PairKey)) {
            previousRoundPairs.add(team2PairKey);
            addPairToRecentHistory(team2PairKey);
            logDebugMessage(`Added team 2 pair ${team2PairKey} to recent history`);
        }

        const matchDiv = document.createElement('div');
        matchDiv.classList.add('match');
        matchDiv.setAttribute('data-match', activeMatches);

        matchDiv.innerHTML = `
            <p>Match ${activeMatches + 1}:</p>
            <div class="team" data-team="1">
                <p>Team 1: ${match.team1.map(p => `<span class="team1-player">${p.name}</span>`).join(' & ')}</p>
                <label>Score: <input type="text" inputmode="numeric" pattern="[0-9]*" min="0" class="team-score" data-team="1" data-match="${activeMatches}"></label>
            </div>
            <div class="team" data-team="2">
                <p>Team 2: ${match.team2.map(p => `<span class="team2-player">${p.name}</span>`).join(' & ')}</p>
                <label>Score: <input type="text" inputmode="numeric" pattern="[0-9]*" min="0" class="team-score" data-team="2" data-match="${activeMatches}"></label>
            </div>
            <button class="skip-match-btn" data-match="${activeMatches}">Skip Match</button>
        `;

        // Add skip button logic
        const skipButton = matchDiv.querySelector('.skip-match-btn');
        skipButton.addEventListener('click', () => {
            const confirmation = confirm("Are you sure you want to skip this match? This action cannot be undone.");
            if (!confirmation) {
                logDebugMessage("Match skip canceled.");
                return; // Exit if the user cancels
            }

            logDebugMessage("=== START SKIP MATCH ===");
            
            // Get team players from the matchDiv
            const team1Players = Array.from(matchDiv.querySelectorAll('.team1-player')).map(el =>
                players.find(player => player.name === el.textContent.trim())
            );
            const team2Players = Array.from(matchDiv.querySelectorAll('.team2-player')).map(el =>
                players.find(player => player.name === el.textContent.trim())
            );

            logDebugMessage(`Skipping match with Team 1: ${team1Players.map(p => p.name).join(' & ')}, Team 2: ${team2Players.map(p => p.name).join(' & ')}`);

            if (!team1Players || !team2Players) {
                console.error("Unable to retrieve team players for skipping the match.");
                return;
            }

            // Proceed to skip the match
            matchDiv.style.display = 'none';
            matchDiv.setAttribute('data-skipped', 'true');
            
            // Create a temporary match object to roll back any relationships that might have been set
            const roundNum = parseInt(roundContainer.getAttribute('data-round')) || currentRound;
            const tempMatch = {
                round: roundNum,
                team1: team1Players,
                team2: team2Players,
                team1Score: 0,
                team2Score: 0
            };
            
            // If teammates and versus relationships were already established, roll them back
            team1Players.forEach(player => {
                // Remove teammate relationships
                team1Players.filter(teammate => teammate !== player).forEach(teammate => {
                    if (player.teammates && player.teammates[teammate.name]) {
                        logDebugMessage(`Rolling back teammate relationship: ${player.name} → ${teammate.name} (${player.teammates[teammate.name]} → ${player.teammates[teammate.name] - 1})`);
                        player.teammates[teammate.name] -= 1;
                        if (player.teammates[teammate.name] <= 0) {
                            delete player.teammates[teammate.name];
                        }
                    }
                });
                
                // Remove versus relationships
                team2Players.forEach(opponent => {
                    if (player.versus && player.versus[opponent.name]) {
                        logDebugMessage(`Rolling back versus relationship: ${player.name} vs ${opponent.name} (${player.versus[opponent.name]} → ${player.versus[opponent.name] - 1})`);
                        player.versus[opponent.name] -= 1;
                        if (player.versus[opponent.name] <= 0) {
                            delete player.versus[opponent.name];
                        }
                    }
                });
            });
            
            // Do the same for team 2
            team2Players.forEach(player => {
                // Remove teammate relationships
                team2Players.filter(teammate => teammate !== player).forEach(teammate => {
                    if (player.teammates && player.teammates[teammate.name]) {
                        logDebugMessage(`Rolling back teammate relationship: ${player.name} → ${teammate.name} (${player.teammates[teammate.name]} → ${player.teammates[teammate.name] - 1})`);
                        player.teammates[teammate.name] -= 1;
                        if (player.teammates[teammate.name] <= 0) {
                            delete player.teammates[teammate.name];
                        }
                    }
                });
                
                // Remove versus relationships
                team1Players.forEach(opponent => {
                    if (player.versus && player.versus[opponent.name]) {
                        logDebugMessage(`Rolling back versus relationship: ${player.name} vs ${opponent.name} (${player.versus[opponent.name]} → ${player.versus[opponent.name] - 1})`);
                        player.versus[opponent.name] -= 1;
                        if (player.versus[opponent.name] <= 0) {
                            delete player.versus[opponent.name];
                        }
                    }
                });
            });

            // Remove from match relationships and tracking
            const matchKey = generateMatchKey(team1Players, team2Players);
            if (matchHistory.has(matchKey)) {
                matchHistory.delete(matchKey);
                logDebugMessage(`Removed match ${matchKey} from match history.`);
            }

            const pair1Key = generatePairKey(team1Players[0], team1Players[1]);
            if (previousRoundPairs.has(pair1Key)) {
                previousRoundPairs.delete(pair1Key);
                logDebugMessage(`Removed Team 1 pair from previous round pairs.`);
            }
            // Also remove from recent history
            removePairFromRecentHistory(pair1Key);
            
            const pair2Key = generatePairKey(team2Players[0], team2Players[1]);
            if (previousRoundPairs.has(pair2Key)) {
                previousRoundPairs.delete(pair2Key);
                logDebugMessage(`Removed Team 2 pair from previous round pairs.`);
            }
            // Also remove from recent history
            removePairFromRecentHistory(pair2Key);

            // Update player eligibility
            logDebugMessage("Updating player eligibility and sit-out status for skipped match");
            [...team1Players, ...team2Players].forEach(player => {
                logDebugMessage(`Player ${player.name}: eligibility ${player.eligible} → false, satOutLastRound → true`);
                player.eligible = false;
                player.satOutLastRound = true;
                
                // Make sure player is in sit-out list
                if (!sitOutPlayers.some(p => p.name === player.name)) {
                    sitOutPlayers.push(player);
                    logDebugMessage(`Added ${player.name} to sit-out players list`);
                }
            });

            // Check if all matches in the round are skipped
            const matchesInRound = roundContainer.querySelectorAll('.match');
            const allSkipped = Array.from(matchesInRound).every(
                match => match.getAttribute('data-skipped') === 'true'
            );
            logDebugMessage(`All matches skipped: ${allSkipped}`);

            // If all matches are skipped, reset recent pair history
            if (allSkipped) {
                logDebugMessage("All matches in round are now skipped, but we've already removed the specific pairs from history");
                // We don't need to reset all recent pair history as we've already removed these specific pairs
                // resetRecentPairHistory();
            }

            // Update the Submit Scores button text if all matches are skipped
            const submitScoresButton = roundContainer.querySelector('.submit-scores-btn');
            if (submitScoresButton) {
                submitScoresButton.textContent = allSkipped ? 'Next Round' : 'Submit Scores';
            }

            // Update the sit-out display
            updateSitOutDisplayForRound(roundContainer, sitOutPlayers);
            reorderMatchNumbers(roundContainer);

            logDebugMessage(`Updated sit-out players: ${sitOutPlayers.map(p => p.name).join(', ')}`);
            logDebugMessage(`Match skipped. Players moved to sitting out.`);
            logDebugMessage("=== END SKIP MATCH ===");
            
            // Save changes
            autoSave();
        });

        // Append the match to the round container
        const submitScoresButton = roundContainer.querySelector('.submit-scores-btn');
        const sitOutDiv = roundContainer.querySelector('.sit-out-players');
        if (submitScoresButton || sitOutDiv) {
            roundContainer.insertBefore(matchDiv, submitScoresButton || sitOutDiv);
        } else {
            roundContainer.appendChild(matchDiv);
        }
        
        // Update sit-out players list by removing players who are now in a match
        const matchPlayers = [...match.team1, ...match.team2];
        
        // Log before state
        logDebugMessage(`Sit-out players before update: ${sitOutPlayers.map(p => p.name).join(', ')}`);
        
        // Update sitOutPlayers array by removing players who are now in the match
        for (let i = sitOutPlayers.length - 1; i >= 0; i--) {
            const sitOutPlayer = sitOutPlayers[i];
            if (matchPlayers.some(p => p.name === sitOutPlayer.name)) {
                logDebugMessage(`Removing ${sitOutPlayer.name} from sit-out players`);
                sitOutPlayers.splice(i, 1);
            }
        }
        
        // Log after state
        logDebugMessage(`Sit-out players after update: ${sitOutPlayers.map(p => p.name).join(', ')}`);
    });

    // Update the sit-out display
    updateSitOutDisplayForRound(roundContainer, sitOutPlayers);
    reorderMatchNumbers(roundContainer);

    const submitScoresButton = roundContainer.querySelector('.submit-scores-btn');
    if (submitScoresButton) {
        submitScoresButton.textContent = 'Submit Scores';
    }
    logDebugMessage("Submit Scores button reverted after adding a match.");
    logDebugMessage("=== END ADD MATCH ===");
    logDebugMessage("New match added successfully.");
    
    // Attach numeric keypad to new input fields
    if (window.attachKeypadToInputs) {
        window.attachKeypadToInputs();
    }
}


function updateSitOutDisplayForRound(roundContainer, sitOutPlayers) {
    logDebugMessage(`=== UPDATE SIT-OUT DISPLAY FOR ROUND ===`);
    logDebugMessage(`Updating sit-out display with ${sitOutPlayers ? sitOutPlayers.length : 0} players: ${sitOutPlayers ? sitOutPlayers.map(p => p.name).join(', ') : 'none'}`);
    
    // Check if all matches in the round are skipped
    const matchesInRound = roundContainer.querySelectorAll('.match');
    const allSkipped = Array.from(matchesInRound).every(
        match => match.getAttribute('data-skipped') === 'true'
    );
    
    // If all matches were skipped, consider resetting recent pair history to allow creating new matches
    // NOTE: We no longer automatically reset all history, as we've already removed specific pairs
    if (allSkipped && matchesInRound.length > 0) {
        logDebugMessage("All matches in round are skipped, but we've already removed the specific pairs from history");
    }
    
    let sitOutDiv = roundContainer.querySelector('.sit-out-players');
    if (!sitOutDiv) {
        sitOutDiv = document.createElement('div');
        sitOutDiv.classList.add('sit-out-players');
        roundContainer.appendChild(sitOutDiv);
        logDebugMessage(`Created new sit-out display div`);
    }

    // Update player statuses
    players.forEach(player => {
        const isSittingOut = sitOutPlayers && sitOutPlayers.some(p => p.name === player.name);
        if (player.satOutLastRound !== isSittingOut) {
            logDebugMessage(`Updating player ${player.name}: satOutLastRound ${player.satOutLastRound} → ${isSittingOut}`);
        }
        player.satOutLastRound = isSittingOut; // Mark players in sitOutPlayers as sat out
    });

    // Display updated sit-out players
    if (!sitOutPlayers || sitOutPlayers.length === 0) {
        sitOutDiv.innerHTML = '<strong>🎉 Everyone is playing! 🎉</strong>';
        sitOutDiv.classList.add('all-playing');
        logDebugMessage(`Set display: Everyone is playing`);
    } else {
        const sitOutPlayerNames = sitOutPlayers.map(player => 
            `<span class="sitting-player">${player.name}</span>`
        ).join(' ');
        sitOutDiv.innerHTML = `<strong>Sitting out:</strong> ${sitOutPlayerNames}`;
        sitOutDiv.classList.remove('all-playing');
        logDebugMessage(`Set display: Players sitting out - ${sitOutPlayers.map(p => p.name).join(', ')}`);
    }
    
    logDebugMessage(`=== END UPDATE SIT-OUT DISPLAY ===`);
}

function toggleEditRound(roundContainer, editRoundButton) {
    const isEditing = editRoundButton.textContent === 'Edit Round';
    const matches = roundContainer.querySelectorAll('.match');

    if (isEditing) {
        // Save the current state
        const originalState = Array.from(matches).map(matchDiv => ({
            team1: Array.from(matchDiv.querySelectorAll('.team1-player')).map(el => el.textContent.trim()),
            team2: Array.from(matchDiv.querySelectorAll('.team2-player')).map(el => el.textContent.trim()),
            team1Score: matchDiv.querySelector('.team-score[data-team="1"]').value,
            team2Score: matchDiv.querySelector('.team-score[data-team="2"]').value
        }));
        roundContainer.dataset.originalState = JSON.stringify(originalState);

        // Enter Edit Mode
        editRoundButton.textContent = 'Save Changes';

        // Add Cancel Button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.classList.add('cancel-round-btn');
        cancelButton.addEventListener('click', () => cancelRoundEdits(roundContainer, editRoundButton, cancelButton));
        editRoundButton.after(cancelButton);

        // Enable editing for teams and scores
        matches.forEach((matchDiv, index) => {
            const team1Players = Array.from(matchDiv.querySelectorAll('.team1-player')).map(el => el.textContent.trim());
            const team2Players = Array.from(matchDiv.querySelectorAll('.team2-player')).map(el => el.textContent.trim());

            const team1Inputs = team1Players.map(playerName => `
                <select class="player-selector" data-match="${index}" data-team="1">
                    ${players.map(player => `
                        <option value="${player.name}" ${player.name === playerName ? 'selected' : ''}>
                            ${player.name}
                        </option>`).join('')}
                </select>
            `).join('');

            const team2Inputs = team2Players.map(playerName => `
                <select class="player-selector" data-match="${index}" data-team="2">
                    ${players.map(player => `
                        <option value="${player.name}" ${player.name === playerName ? 'selected' : ''}>
                            ${player.name}
                        </option>`).join('')}
                </select>
            `).join('');

            // Replace team displays with editable inputs
            matchDiv.querySelector('[data-team="1"] p').innerHTML = `Team 1: ${team1Inputs}`;
            matchDiv.querySelector('[data-team="2"] p').innerHTML = `Team 2: ${team2Inputs}`;

            // Enable score inputs
            matchDiv.querySelectorAll('.team-score').forEach(input => (input.disabled = false));
        });
    } else {
        saveRoundEdits(roundContainer, editRoundButton);
    }
    
    // Attach numeric keypad to new or re-enabled input fields
    if (window.attachKeypadToInputs) {
        window.attachKeypadToInputs();
    }
}

function cancelRoundEdits(roundContainer, editRoundButton, cancelButton) {
    const originalState = JSON.parse(roundContainer.dataset.originalState || '[]');
    const matches = roundContainer.querySelectorAll('.match');

    // Restore the original state for each match
    originalState.forEach((matchData, index) => {
        const matchDiv = matches[index];
        matchDiv.querySelector('[data-team="1"] p').innerHTML =
            `Team 1: ${matchData.team1.map(player => `<span class="team1-player">${player}</span>`).join(' & ')}`;
        matchDiv.querySelector('[data-team="2"] p').innerHTML =
            `Team 2: ${matchData.team2.map(player => `<span class="team2-player">${player}</span>`).join(' & ')}`;
        matchDiv.querySelector('.team-score[data-team="1"]').value = matchData.team1Score;
        matchDiv.querySelector('.team-score[data-team="2"]').value = matchData.team2Score;

        // Disable score inputs to match normal mode
        matchDiv.querySelectorAll('.team-score').forEach(input => {
            input.disabled = false;
        });
    });

    // Exit edit mode
    editRoundButton.textContent = 'Edit Round';

    // Remove the cancel button
    if (cancelButton) cancelButton.remove();

    // Clear the stored original state from the round container
    delete roundContainer.dataset.originalState;

    alert('Edits canceled. Round reverted to the original state.');
}




function saveRoundEdits(roundContainer, editRoundButton) {
    const matches = roundContainer.querySelectorAll('.match');
    const allPlayersInRound = new Set(); // Track players to prevent duplicates
    let isValid = true;

    matches.forEach((matchDiv, index) => {
        const newTeam1 = Array.from(matchDiv.querySelectorAll('.player-selector[data-team="1"]'))
            .map(selector => players.find(p => p.name === selector.value));

        const newTeam2 = Array.from(matchDiv.querySelectorAll('.player-selector[data-team="2"]'))
            .map(selector => players.find(p => p.name === selector.value));

        if (!newTeam1.length || !newTeam2.length) {
            alert("Error: Teams must have valid players.");
            isValid = false;
            return;
        }

        const team1Names = newTeam1.map(player => player.name);
        const team2Names = newTeam2.map(player => player.name);

        // Check for duplicate players
        const allPlayersInMatch = [...team1Names, ...team2Names];
        for (const playerName of allPlayersInMatch) {
            if (allPlayersInRound.has(playerName)) {
                alert(`Error: Player "${playerName}" is listed in multiple teams for this round.`);
                isValid = false;
                return;
            }
            allPlayersInRound.add(playerName);
        }

        // Update match data
        matches[index].team1 = newTeam1;
        matches[index].team2 = newTeam2;
        matches[index].team1Score = parseInt(matchDiv.querySelector('.team-score[data-team="1"]').value, 10) || 0;
        matches[index].team2Score = parseInt(matchDiv.querySelector('.team-score[data-team="2"]').value, 10) || 0;
    });

    if (!isValid) return;

    // Update sitting-out players
    const allPlayers = players.map(p => p.name);
    const playersInRound = Array.from(allPlayersInRound);
    const sitOutPlayers = players.filter(player => !playersInRound.includes(player.name));
    updateSitOutDisplayForRound(roundContainer, sitOutPlayers);

    // Exit Edit Mode
    editRoundButton.textContent = 'Edit Round';
    const cancelButton = roundContainer.querySelector('.cancel-round-btn');
    if (cancelButton) cancelButton.remove();

    // Ensure score inputs remain editable
    matches.forEach(matchDiv => {
        matchDiv.querySelectorAll('.team-score').forEach(input => (input.disabled = false));
    });

    // Re-render round
    reRenderRound(roundContainer);
    alert('Round edits saved!');
}







function reRenderRound(roundContainer) {
    const matches = roundContainer.querySelectorAll('.match');

    matches.forEach((matchDiv, index) => {
        const match = matches[index];

        matchDiv.querySelector('[data-team="1"] p').innerHTML =
            `Team 1: ${match.team1.map(player => `<span class="team1-player">${player.name}</span>`).join(' & ')}`;
        matchDiv.querySelector('[data-team="2"] p').innerHTML =
            `Team 2: ${match.team2.map(player => `<span class="team2-player">${player.name}</span>`).join(' & ')}`;

        // Ensure score inputs remain editable
        matchDiv.querySelectorAll('.team-score').forEach(input => (input.disabled = false));
    });
}



function reorderMatchNumbers(roundContainer) {
    const matches = roundContainer.querySelectorAll('.match:not([data-skipped="true"])');
    matches.forEach((matchDiv, index) => {
        const matchNumber = index + 1;
        
        // Update the match display number
        const matchTitle = matchDiv.querySelector('p:first-child');
        if (matchTitle) {
            matchTitle.textContent = `Match ${matchNumber}:`;
        }

        // Update the data-match attribute for consistency
        matchDiv.setAttribute('data-match', index);

        // Update team score inputs to have the correct data-match attribute
        matchDiv.querySelectorAll('.team-score').forEach(input => {
            input.setAttribute('data-match', index);
        });

        // Update skip-match button to have the correct data-match attribute
        const skipButton = matchDiv.querySelector('.skip-match-btn');
        if (skipButton) {
            skipButton.setAttribute('data-match', index);
        }
    });
}


window.onload = restoreState;

// Add this near the beginning of the file with the other event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for buttons with new IDs
    document.getElementById('showPodiumBtn').addEventListener('click', showPodium);
    document.getElementById('floatingLeaderboardBtn').addEventListener('click', showPodium);
    document.getElementById('scrollToCurrentRound').addEventListener('click', scrollToCurrentRound);
    document.getElementById('clearBtn').addEventListener('click', clearState);
    // Commenting out duplicate event listener - already defined in HTML
    // document.getElementById('captureAllBtn').addEventListener('click', captureAllContent);
    
    // Set up scroll event handling
    window.addEventListener('scroll', handleScroll);
    
    initNumericKeypad();
});

// Function to handle scroll events
function handleScroll() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    const floatingLeaderboardBtn = document.getElementById('floatingLeaderboardBtn');
    const currentRoundBtn = document.getElementById('scrollToCurrentRound');
    const leaderboardOriginal = document.getElementById('showPodiumBtn');
    
    // Get scroll position
    const scrollPos = window.scrollY || document.documentElement.scrollTop;
    
    // Calculate when to show floating leaderboard button
    // Only show when the original is out of view
    if (leaderboardOriginal) {
        const leaderboardPos = leaderboardOriginal.getBoundingClientRect().top;
        if (leaderboardPos < 0) {
            floatingLeaderboardBtn.classList.add('visible');
        } else {
            floatingLeaderboardBtn.classList.remove('visible');
        }
    }
    
    // Show back to top button
    if (scrollPos > 200) {
        backToTopBtn.style.display = "flex";
    } else {
        backToTopBtn.style.display = "none";
    }
    
    // Show current round button
    if (scrollPos > 300) {
        currentRoundBtn.style.display = "flex";
    } else {
        currentRoundBtn.style.display = "none";
    }
}

// Function to scroll to the current round
function scrollToCurrentRound() {
    const roundContainers = document.querySelectorAll('.round-container');
    if (roundContainers.length > 0) {
        // Get the last round container (current round)
        const currentRoundContainer = roundContainers[roundContainers.length - 1];
        
        // Scroll to it with smooth animation
        currentRoundContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// Function to capture both leaderboard and match history as images
function captureAllContent() {
    // First capture the leaderboard (show it if not already visible)
    const podiumDiv = document.getElementById('podiumDisplay');
    if (!podiumDiv.classList.contains('active')) {
        showPodium(); // Show the podium first
    }
    
    // Capture leaderboard after a slight delay to ensure it's fully rendered
    setTimeout(() => {
        // Capture the leaderboard
        captureElementAsImage(podiumDiv, 'leaderboard');
        
        // Show match history
        const matchHistoryDisplay = document.getElementById('matchHistoryDisplay');
        if (!matchHistoryDisplay.classList.contains('active')) {
            showMatchHistory();
        }
        
        // Capture match history after a slight delay
        setTimeout(() => {
            captureElementAsImage(matchHistoryDisplay, 'match-history');
            
            // Optional: close both views after capture is complete
            setTimeout(() => {
                closePodium();
                document.getElementById('closeMatchHistoryBtn').click();
                alert('Leaderboard and Match History have been saved as images.');
            }, 500);
        }, 500);
    }, 500);
}

// Function to edit a match from the match history
function editMatch(matchIndex) {
    const match = matches[matchIndex];
    if (!match) {
        console.error("Match not found at index:", matchIndex);
        return;
    }

    // Store the original match data for reverting in case of cancellation
    const originalMatch = JSON.parse(JSON.stringify(match));
    
    // Debugging info about original match state
    console.log("Original match before editing:", JSON.stringify({
        team1Names: match.team1.map(p => p.name),
        team2Names: match.team2.map(p => p.name),
        team1Score: match.team1Score,
        team2Score: match.team2Score
    }));
    
    // Debug teammate and versus relationships before edit
    if (match.team1.length > 0 && match.team1[0].teammates) {
        console.log("Team 1 Player 1 teammates before:", JSON.stringify(match.team1[0].teammates));
        console.log("Team 1 Player 1 versus before:", JSON.stringify(match.team1[0].versus));
    }
    
    // Construct a list of player names for the select dropdown
    const playerOptions = players.map(player => 
        `<option value="${player.name}">${player.name}</option>`
    ).join('');

    // Create a dialog for editing the match
    const dialog = document.createElement('div');
    dialog.className = 'edit-match-dialog';
    dialog.innerHTML = `
        <div class="edit-match-content">
            <h3>Edit Match</h3>
            <div class="team-edit-section">
                <h4>Team 1</h4>
                <select id="team1-player1">
                    ${playerOptions}
                </select>
                <select id="team1-player2">
                    ${playerOptions}
                </select>
                <label>Score: 
                    <input type="text" inputmode="numeric" class="team-score" id="team1-score" min="0" value="${match.team1Score || 0}">
                </label>
            </div>
            <div class="team-edit-section">
                <h4>Team 2</h4>
                <select id="team2-player1">
                    ${playerOptions}
                </select>
                <select id="team2-player2">
                    ${playerOptions}
                </select>
                <label>Score: 
                    <input type="text" inputmode="numeric" class="team-score" id="team2-score" min="0" value="${match.team2Score || 0}">
                </label>
            </div>
            <div class="button-row">
                <button id="save-match-edit">Save</button>
                <button id="cancel-match-edit">Cancel</button>
            </div>
        </div>
    `;

    // Set current player selections
    document.body.appendChild(dialog);
    
    // Set current player values in dropdowns
    setTimeout(() => {
        document.getElementById('team1-player1').value = match.team1[0]?.name || '';
        document.getElementById('team1-player2').value = match.team1[1]?.name || '';
        document.getElementById('team2-player1').value = match.team2[0]?.name || '';
        document.getElementById('team2-player2').value = match.team2[1]?.name || '';
        
        // Attach numeric keypad to score inputs if available
        if (typeof window.attachKeypadToInputs === 'function') {
            window.attachKeypadToInputs();
        }
    }, 0);

    // Add event listeners for the buttons
    document.getElementById('save-match-edit').addEventListener('click', function() {
        // Get the new values
        const team1Player1Name = document.getElementById('team1-player1').value;
        const team1Player2Name = document.getElementById('team1-player2').value;
        const team2Player1Name = document.getElementById('team2-player1').value;
        const team2Player2Name = document.getElementById('team2-player2').value;
        const team1Score = parseInt(document.getElementById('team1-score').value) || 0;
        const team2Score = parseInt(document.getElementById('team2-score').value) || 0;

        // Find player objects from names
        const team1Player1 = players.find(p => p.name === team1Player1Name);
        const team1Player2 = players.find(p => p.name === team1Player2Name);
        const team2Player1 = players.find(p => p.name === team2Player1Name);
        const team2Player2 = players.find(p => p.name === team2Player2Name);

        // Validate players are valid and unique
        if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
            alert('Please select valid players for all positions');
            return;
        }

        if (team1Player1 === team1Player2 || team2Player1 === team2Player2 ||
            [team1Player1, team1Player2].includes(team2Player1) ||
            [team1Player1, team1Player2].includes(team2Player2)) {
            alert('Each player can only appear once in a match');
            return;
        }

        try {
            // Roll back the original match stats from player records
            rollbackMatchStats(match);
    
            // Update the match data
            match.team1 = [team1Player1, team1Player2];
            match.team2 = [team2Player1, team2Player2];
            match.team1Score = team1Score;
            match.team2Score = team2Score;
    
            // Apply the new match stats
            applyMatchStats(match);
    
            // Debug output after edit
            console.log("Match after editing:", JSON.stringify({
                team1Names: match.team1.map(p => p.name),
                team2Names: match.team2.map(p => p.name),
                team1Score: match.team1Score,
                team2Score: match.team2Score
            }));
            
            // Debug teammate and versus relationships after edit
            if (match.team1.length > 0 && match.team1[0].teammates) {
                console.log("Team 1 Player 1 teammates after:", JSON.stringify(match.team1[0].teammates));
                console.log("Team 1 Player 1 versus after:", JSON.stringify(match.team1[0].versus));
            }
    
            // Close the dialog
            dialog.remove();
            
            // Update all relevant displays
            // 1. Update match history display
            showMatchHistory();
            
            // 2. Update current round display if needed
            const currentRoundContainer = document.querySelector(`.round-container[data-round="${match.round}"]`);
            if (currentRoundContainer) {
                reRenderRound(currentRoundContainer);
            }
            
            // 3. Update player stats and leaderboard
            const activeSort = document.querySelector('.sort-btn.active');
            let sortFunction = sortByVictoryPoints; // Default sort
            
            // Determine which sort function to use based on active button
            if (activeSort) {
                const sortType = activeSort.getAttribute('data-sort');
                if (sortType === 'pickle-points') sortFunction = sortByPicklePoints;
                else if (sortType === 'win-percentage') sortFunction = sortByWinPercentage;
                else if (sortType === 'pickle-point-avg') sortFunction = sortByPicklePointAvg;
                else if (sortType === 'pickle-differential') sortFunction = sortByPickleDifferential;
            }
            
            const sortedPlayers = sortFunction(players);
            displayPodium(sortedPlayers);
            displayPlayerStatsTable(sortedPlayers);
            
            // 4. Save changes to local storage
            autoSave();
            
            console.log("Match updated successfully:", match);
            alert('Match updated successfully!');
        } catch (error) {
            console.error("Error updating match:", error);
            
            // Revert to original match data
            Object.assign(match, originalMatch);
            
            alert('An error occurred while updating the match. Changes were not saved.');
        }
    });

    document.getElementById('cancel-match-edit').addEventListener('click', function() {
        dialog.remove();
    });
}

// Helper function to roll back a match's stats from player records
function rollbackMatchStats(match) {
    logDebugMessage(`Rolling back stats for match: Team 1: ${match.team1.map(p => p.name).join(' & ')}, Team 2: ${match.team2.map(p => p.name).join(' & ')}`);
    
    // Update team 1 players
    match.team1.forEach(player => {
        player.gamesPlayed -= 1;
        player.picklePoints -= match.team1Score;
        
        // Adjust pickle differential
        player.pickleDifferential -= (match.team1Score - match.team2Score);
        
        // Adjust victory points
        if (match.team1Score > match.team2Score) {
            player.victoryPoints -= 1;
        }
        
        // Remove teammate relationships
        match.team1.filter(teammate => teammate !== player)
            .forEach(teammate => {
                if (player.teammates && player.teammates[teammate.name]) {
                    player.teammates[teammate.name] -= 1;
                    if (player.teammates[teammate.name] <= 0) {
                        delete player.teammates[teammate.name];
                    }
                }
            });
        
        // Remove versus relationships
        match.team2.forEach(opponent => {
            if (player.versus && player.versus[opponent.name]) {
                player.versus[opponent.name] -= 1;
                if (player.versus[opponent.name] <= 0) {
                    delete player.versus[opponent.name];
                }
            }
        });
    });
    
    // Update team 2 players
    match.team2.forEach(player => {
        player.gamesPlayed -= 1;
        player.picklePoints -= match.team2Score;
        
        // Adjust pickle differential
        player.pickleDifferential -= (match.team2Score - match.team1Score);
        
        // Adjust victory points
        if (match.team2Score > match.team1Score) {
            player.victoryPoints -= 1;
        }
        
        // Remove teammate relationships
        match.team2.filter(teammate => teammate !== player)
            .forEach(teammate => {
                if (player.teammates && player.teammates[teammate.name]) {
                    player.teammates[teammate.name] -= 1;
                    if (player.teammates[teammate.name] <= 0) {
                        delete player.teammates[teammate.name];
                    }
                }
            });
        
        // Remove versus relationships
        match.team1.forEach(opponent => {
            if (player.versus && player.versus[opponent.name]) {
                player.versus[opponent.name] -= 1;
                if (player.versus[opponent.name] <= 0) {
                    delete player.versus[opponent.name];
                }
            }
        });
    });
    
    // When rolling back match stats, also remove pairs from history tracking
    const pair1Key = generatePairKey(match.team1[0], match.team1[1]);
    const pair2Key = generatePairKey(match.team2[0], match.team2[1]);
    
    // Remove from previous round pairs
    if (previousRoundPairs.has(pair1Key)) {
        previousRoundPairs.delete(pair1Key);
        logDebugMessage(`Removed Team 1 pair ${pair1Key} from previous round pairs during rollback`);
    }
    
    if (previousRoundPairs.has(pair2Key)) {
        previousRoundPairs.delete(pair2Key);
        logDebugMessage(`Removed Team 2 pair ${pair2Key} from previous round pairs during rollback`);
    }
    
    // Remove from recent history
    removePairFromRecentHistory(pair1Key);
    removePairFromRecentHistory(pair2Key);
    
    // Update match history tracking
    const matchKey = generateMatchKey(match.team1, match.team2);
    if (matchHistory.has(matchKey)) {
        matchHistory.delete(matchKey);
        logDebugMessage(`Removed match ${matchKey} from match history during rollback`);
    }
}

// Helper function to apply a match's stats to player records
function applyMatchStats(match) {
    // Update team 1 players
    match.team1.forEach(player => {
        player.gamesPlayed += 1;
        player.picklePoints += match.team1Score;
        
        // Adjust pickle differential
        player.pickleDifferential = (player.pickleDifferential || 0) + (match.team1Score - match.team2Score);
        
        // Adjust victory points
        if (match.team1Score > match.team2Score) {
            player.victoryPoints += 1;
        }
        
        // Add teammate relationships
        match.team1.filter(teammate => teammate !== player)
            .forEach(teammate => updateTeammates(player, teammate));
        
        // Add versus relationships
        match.team2.forEach(opponent => updateVersus(player, opponent));
    });
    
    // Update team 2 players
    match.team2.forEach(player => {
        player.gamesPlayed += 1;
        player.picklePoints += match.team2Score;
        
        // Adjust pickle differential
        player.pickleDifferential = (player.pickleDifferential || 0) + (match.team2Score - match.team1Score);
        
        // Adjust victory points
        if (match.team2Score > match.team1Score) {
            player.victoryPoints += 1;
        }
        
        // Add teammate relationships
        match.team2.filter(teammate => teammate !== player)
            .forEach(teammate => updateTeammates(player, teammate));
        
        // Add versus relationships
        match.team1.forEach(opponent => updateVersus(player, opponent));
    });
}

// Document Ready Event
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded.");
    
    // Create Debug Area
    createDebugArea();
    
    // Attempt to restore saved state
    restoreState();
    
    // Set the default active sort button
    setDefaultActiveSortButton();
    
    // Display current date
    displayCurrentDate();
    
    // Update player count to ensure consistency
    document.getElementById('playerCount').textContent = `Player Count: ${players.length}`;
    
    // Update leaderboard if players exist
    if (players.length > 0) {
        const sortedPlayers = sortByVictoryPoints(players);
        displayPodium(sortedPlayers);
        displayPlayerStatsTable(sortedPlayers);
    }
    
    // Regenerate match display for all rounds
    if (matches.length > 0) {
        console.log("Restoring matches display for", matches.length, "matches");
        
        // Find all unique round numbers
        const roundNumbers = [...new Set(matches.map(match => match.round))];
        console.log("Found rounds:", roundNumbers);
        
        // Clear existing match display
        document.getElementById('matchDisplay').innerHTML = '';
        
        // Create containers for each round
        roundNumbers.forEach(roundNum => {
            // Create the round container
            const roundContainer = document.createElement('div');
            roundContainer.classList.add('round-container', roundNum % 2 === 0 ? 'even-round' : 'odd-round');
            roundContainer.setAttribute('data-round', roundNum);
            
            const roundHeader = document.createElement('h3');
            roundHeader.textContent = `Round ${roundNum}`;
            roundContainer.appendChild(roundHeader);
            
            // Find matches for this round
            const roundMatches = matches.filter(match => match.round === roundNum);
            
            // Group matches by unique teams (to handle the case of multiple matches with same teams)
            const matchGroups = {};
            roundMatches.forEach(match => {
                const key = generateMatchKey(match.team1, match.team2);
                if (!matchGroups[key]) {
                    matchGroups[key] = [];
                }
                matchGroups[key].push(match);
            });
            
            // Add each match to the round container
            Object.values(matchGroups).forEach((matchGroup, groupIndex) => {
                matchGroup.forEach((match, matchIndex) => {
                    const matchDiv = document.createElement('div');
                    matchDiv.classList.add('match');
                    matchDiv.setAttribute('data-match', groupIndex);
                    
                    // Determine if this match has been scored already
                    const isScored = typeof match.team1Score === 'number' && typeof match.team2Score === 'number';
                    
                    matchDiv.innerHTML = `
                        <p>Match ${groupIndex + 1}:</p>
                        <div class="team" data-team="1">
                            <p>Team 1: ${match.team1.map(p => `<span class="team1-player">${p.name}</span>`).join(' & ')}</p>
                            ${isScored 
                                ? `<p class="score-display">Score: ${match.team1Score}</p>` 
                                : `<label>Score: <input type="text" inputmode="numeric" pattern="[0-9]*" min="0" class="team-score" data-team="1" data-match="${groupIndex}"></label>`
                            }
                        </div>
                        <div class="team" data-team="2">
                            <p>Team 2: ${match.team2.map(p => `<span class="team2-player">${p.name}</span>`).join(' & ')}</p>
                            ${isScored 
                                ? `<p class="score-display">Score: ${match.team2Score}</p>` 
                                : `<label>Score: <input type="text" inputmode="numeric" pattern="[0-9]*" min="0" class="team-score" data-team="2" data-match="${groupIndex}"></label>`
                            }
                        </div>
                        ${!isScored ? `<button class="skip-match-btn" data-match="${groupIndex}">Skip Match</button>` : ''}
                    `;
                    
                    // Add winner highlight for scored matches
                    if (isScored) {
                        if (match.team1Score > match.team2Score) {
                            setTimeout(() => {
                                matchDiv.querySelector('.team[data-team="1"]').classList.add('winner-team');
                            }, 0);
                        } else if (match.team2Score > match.team1Score) {
                            setTimeout(() => {
                                matchDiv.querySelector('.team[data-team="2"]').classList.add('winner-team');
                            }, 0);
                        } else {
                            // It's a tie
                            setTimeout(() => {
                                matchDiv.querySelector('.team[data-team="1"]').classList.add('tie-team');
                                matchDiv.querySelector('.team[data-team="2"]').classList.add('tie-team');
                            }, 0);
                        }
                    }
                    
                    roundContainer.appendChild(matchDiv);
                    
                    // Add skip button functionality for unscored matches
                    if (!isScored) {
                        const skipButton = matchDiv.querySelector('.skip-match-btn');
                        if (skipButton) {
                            skipButton.addEventListener('click', function() {
                                const confirmation = confirm("Are you sure you want to skip this match? This action cannot be undone.");
                                if (!confirmation) {
                                    console.log("Match skip canceled.");
                                    return; // Exit if the user cancels
                                }

                                // Get team players from the matchDiv
                                const team1Players = Array.from(matchDiv.querySelectorAll('.team1-player')).map(el =>
                                    players.find(player => player.name === el.textContent.trim())
                                );
                                const team2Players = Array.from(matchDiv.querySelectorAll('.team2-player')).map(el =>
                                    players.find(player => player.name === el.textContent.trim())
                                );

                                if (!team1Players || !team2Players) {
                                    console.error("Unable to retrieve team players for skipping the match.");
                                    return;
                                }
                                // Proceed to skip the match
                                matchDiv.style.display = 'none';
                                matchDiv.setAttribute('data-skipped', 'true');

                                // Create a temporary match object to roll back any relationships that might have been set
                                const roundNum = parseInt(roundContainer.getAttribute('data-round')) || currentRound;
                                const tempMatch = {
                                    round: roundNum,
                                    team1: team1Players,
                                    team2: team2Players,
                                    team1Score: 0,
                                    team2Score: 0
                                };
                                
                                // If teammates and versus relationships were already established, roll them back
                                team1Players.forEach(player => {
                                    // Remove teammate relationships
                                    team1Players.filter(teammate => teammate !== player).forEach(teammate => {
                                        if (player.teammates && player.teammates[teammate.name]) {
                                            player.teammates[teammate.name] -= 1;
                                            if (player.teammates[teammate.name] <= 0) {
                                                delete player.teammates[teammate.name];
                                            }
                                        }
                                    });
                                    
                                    // Remove versus relationships
                                    team2Players.forEach(opponent => {
                                        if (player.versus && player.versus[opponent.name]) {
                                            player.versus[opponent.name] -= 1;
                                            if (player.versus[opponent.name] <= 0) {
                                                delete player.versus[opponent.name];
                                            }
                                        }
                                    });
                                });
                                
                                // Do the same for team 2
                                team2Players.forEach(player => {
                                    // Remove teammate relationships
                                    team2Players.filter(teammate => teammate !== player).forEach(teammate => {
                                        if (player.teammates && player.teammates[teammate.name]) {
                                            player.teammates[teammate.name] -= 1;
                                            if (player.teammates[teammate.name] <= 0) {
                                                delete player.teammates[teammate.name];
                                            }
                                        }
                                    });
                                    
                                    // Remove versus relationships
                                    team1Players.forEach(opponent => {
                                        if (player.versus && player.versus[opponent.name]) {
                                            player.versus[opponent.name] -= 1;
                                            if (player.versus[opponent.name] <= 0) {
                                                delete player.versus[opponent.name];
                                            }
                                        }
                                    });
                                });

                                // Remove from match relationships and tracking
                                const matchKey = generateMatchKey(team1Players, team2Players);
                                if (matchHistory.has(matchKey)) {
                                    matchHistory.delete(matchKey);
                                    logDebugMessage(`Removed match ${matchKey} from match history.`);
                                }

                                const pair1Key = generatePairKey(team1Players[0], team1Players[1]);
                                if (previousRoundPairs.has(pair1Key)) {
                                    previousRoundPairs.delete(pair1Key);
                                    logDebugMessage(`Removed Team 1 pair from previous round pairs.`);
                                }
                                // Also remove from recent history
                                removePairFromRecentHistory(pair1Key);
                                
                                const pair2Key = generatePairKey(team2Players[0], team2Players[1]);
                                if (previousRoundPairs.has(pair2Key)) {
                                    previousRoundPairs.delete(pair2Key);
                                    logDebugMessage(`Removed Team 2 pair from previous round pairs.`);
                                }
                                // Also remove from recent history
                                removePairFromRecentHistory(pair2Key);

                                [...team1Players, ...team2Players].forEach(player => {
                                    player.eligible = false;
                                    player.satOutLastRound = true;
                                    if (!sitOutPlayers.includes(player)) {
                                        sitOutPlayers.push(player);
                                    }
                                });

                                // Check if all matches in the round are skipped
                                const matchesInRound = roundContainer.querySelectorAll('.match');
                                const allSkipped = Array.from(matchesInRound).every(
                                    match => match.getAttribute('data-skipped') === 'true'
                                );

                                // If all matches are skipped, reset recent pair history
                                if (allSkipped) {
                                    logDebugMessage("All matches in round are now skipped, but we've already removed the specific pairs from history");
                                    // We don't need to reset all recent pair history as we've already removed these specific pairs
                                    // resetRecentPairHistory();
                                }

                                // Update the Submit Scores button text if all matches are skipped
                                const submitScoresButton = roundContainer.querySelector('.submit-scores-btn');
                                if (submitScoresButton) {
                                    submitScoresButton.textContent = allSkipped ? 'Next Round' : 'Submit Scores';
                                }

                                // Update the sit-out display
                                updateSitOutDisplayForRound(roundContainer, sitOutPlayers);
                                reorderMatchNumbers(roundContainer);

                                logDebugMessage(`Match skipped. Players moved to sitting out.`);
                                autoSave();
                            });
                        }
                    }
                });
            });
            
            // Add buttons if this is the current round and scores haven't been submitted
            const isCurrentRound = roundNum === currentRound;
            const hasUnsubmittedScores = roundMatches.some(match => 
                typeof match.team1Score !== 'number' || typeof match.team2Score !== 'number'
            );
            
            if (isCurrentRound && hasUnsubmittedScores) {
                // Add the Submit Scores button
                const submitBtn = document.createElement('button');
                submitBtn.textContent = 'Submit Scores';
                submitBtn.classList.add('submit-scores-btn', 'btn-success');
                submitBtn.addEventListener('click', submitScores);
                roundContainer.appendChild(submitBtn);
                
                // Add the Add Match button if needed
                const courtCount = parseInt(document.getElementById('courtSelect').value, 10) || 1;
                if (roundContainer.querySelectorAll('.match:not([data-skipped="true"])').length < courtCount) {
                    const addMatchBtn = document.createElement('button');
                    addMatchBtn.textContent = 'Add Match';
                    addMatchBtn.classList.add('add-match-btn');
                    addMatchBtn.addEventListener('click', () => {
                        // Find sitting out players for this round
                        const sitOutPlayers = [];
                        const playingPlayers = new Set();
                        
                        // Collect all players in current matches
                        roundContainer.querySelectorAll('.team1-player, .team2-player').forEach(playerSpan => {
                            const playerName = playerSpan.textContent.trim();
                            const player = players.find(p => p.name === playerName);
                            if (player) {
                                playingPlayers.add(player);
                            }
                        });
                        
                        // Find players who are sitting out
                        players.forEach(player => {
                            if (!playingPlayers.has(player)) {
                                sitOutPlayers.push(player);
                            }
                        });
                        
                        addMatch(roundContainer, sitOutPlayers);
                    });
                    roundContainer.appendChild(addMatchBtn);
                }
            }
            
            // Add sitting out player display - create a dedicated section at the top of each round
            const playersInRound = new Set();
            roundMatches.forEach(match => {
                match.team1.forEach(player => playersInRound.add(player));
                match.team2.forEach(player => playersInRound.add(player));
            });
            
            const sittingOutPlayers = players.filter(player => !playersInRound.has(player));
            
            // Create a prominent sitting out display at the top of the round
            const sitOutDisplay = document.createElement('div');
            sitOutDisplay.classList.add('sit-out-players');
            
            if (sittingOutPlayers.length > 0) {
                const sitOutPlayerNames = sittingOutPlayers.map(player => 
                    `<span class="sitting-player">${player.name}</span>`
                ).join(' ');
                sitOutDisplay.innerHTML = `<strong>Sitting out this round:</strong> ${sitOutPlayerNames}`;
            } else {
                sitOutDisplay.innerHTML = '<strong>🎉 Everyone is playing in this round! 🎉</strong>';
                sitOutDisplay.classList.add('all-playing');
            }
            
            // Insert at the beginning of the round, right after the header
            roundContainer.insertBefore(sitOutDisplay, roundContainer.querySelector('h3').nextSibling);
            
            // Add the round container to the match display
            document.getElementById('matchDisplay').appendChild(roundContainer);
        });
        
        // Update Start Tournament button text if matches exist
        const startTournamentBtn = document.getElementById('startTournament');
        if (startTournamentBtn) {
            startTournamentBtn.textContent = 'Continue Tournament';
        }
    }
    
    // Setup event listener for the Start Tournament button that checks if matches already exist
    const startTournamentBtn = document.getElementById('startTournament');
    if (startTournamentBtn) {
        // Remove existing listeners
        const newBtn = startTournamentBtn.cloneNode(true);
        startTournamentBtn.parentNode.replaceChild(newBtn, startTournamentBtn);
        
        // Add new listener that handles both start and continue
        newBtn.addEventListener('click', function() {
            if (players.length < 4) {
                alert("You need at least 4 players to start a tournament.");
                return;
            }
            
            if (matches.length > 0) {
                // Continue tournament
                generateNextRound();
            } else {
                // Start new tournament
                currentRound = 1;
                generatePairsAndMatches();
            }
        });
    }
    
    // Setup scroll event handler for the back-to-top button
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    
    // Check if leaderboard button should be visible based on player count
    if (players.length > 0) {
        document.getElementById('floatingLeaderboardBtn').classList.add('visible');
    }
    
    console.log("Initialization complete.");
});

// Utility function to log the eligibility status of all players
function logPlayersEligibilityStatus() {
    logDebugMessage("=== PLAYER ELIGIBILITY STATUS ===");
    players.forEach(player => {
        logDebugMessage(`Player: ${player.name}, Eligible: ${player.eligible}, SatOutLastRound: ${player.satOutLastRound}, ManualSitOut: ${player.manualSitOut || false}`);
    });
    logDebugMessage("===============================");
}

// Utility function to log the pair history for debugging
function logPairHistory() {
    logDebugMessage("=== PAIR HISTORY ===");
    logDebugMessage(`Previous Round Pairs (${previousRoundPairs.size} pairs): ${Array.from(previousRoundPairs).join(', ')}`);
    
    logDebugMessage("Recent Pair History:");
    recentPairHistory.forEach((set, idx) => {
        logDebugMessage(`Round ${idx+1}: ${Array.from(set).join(', ')}`);
    });
    
    logDebugMessage("Extended Pair History:");
    const entries = Object.entries(extendedPairHistory);
    entries.sort((a, b) => b[1] - a[1]); // Sort by count, descending
    entries.forEach(([key, count]) => {
        if (count > 0) {
            logDebugMessage(`${key}: ${count} times`);
        }
    });
    logDebugMessage("===================");
}

// Function to remove a pair from recent history
function removePairFromRecentHistory(pairKey) {
    logDebugMessage(`Attempting to remove pair ${pairKey} from recent history`);
    
    // Ensure we have a valid recentPairHistory array
    if (!recentPairHistory || recentPairHistory.length === 0) {
        logDebugMessage(`No recent pair history exists.`);
        return false;
    }
    
    // Check each round's set and remove the pair if found
    let removed = false;
    recentPairHistory.forEach((set, index) => {
        if (set && set.has(pairKey)) {
            set.delete(pairKey);
            removed = true;
            logDebugMessage(`Removed pair ${pairKey} from round ${index + 1} history`);
        }
    });
    
    // Clean up empty sets in the history without reassigning the array
    const nonEmptySets = [];
    for (let i = 0; i < recentPairHistory.length; i++) {
        if (recentPairHistory[i] && recentPairHistory[i].size > 0) {
            nonEmptySets.push(recentPairHistory[i]);
        }
    }
    
    // Clear the array without reassigning it
    recentPairHistory.length = 0;
    
    // Add back non-empty sets
    for (const set of nonEmptySets) {
        recentPairHistory.push(set);
    }
    
    if (recentPairHistory.length === 0) {
        logDebugMessage("All recent pair history has been cleared");
    }
    
    // Log the current state of recent pair history
    logDebugMessage("Recent pair history after removal:");
    recentPairHistory.forEach((set, idx) => {
        logDebugMessage(`  Round ${idx+1}: ${Array.from(set).join(', ')}`);
    });
    
    return removed;
}

function createNumericKeypad() {
    // Check if keypad already exists
    if (document.getElementById('numericKeypad')) return;
    
    // Create the keypad container
    const keypad = document.createElement('div');
    keypad.id = 'numericKeypad';
    keypad.classList.add('numeric-keypad');
    
    // Create a display area to show the current input
    const display = document.createElement('div');
    display.classList.add('keypad-display');
    display.id = 'keypadDisplay';
    keypad.appendChild(display);
    
    // Create number buttons starting from 13 down to 0 (most common scores first)
    const numbers = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    
    numbers.forEach(num => {
        const button = document.createElement('button');
        button.textContent = num;
        button.classList.add('keypad-btn');
        
        // Add special class for the winning score (11)
        if (num === 11) {
            button.classList.add('keypad-winning-btn');
        }
        
        button.setAttribute('data-value', num);
        keypad.appendChild(button);
    });
    
    // Add action buttons container for confirm and close (positioned together)
    const actionBtnsContainer = document.createElement('div');
    actionBtnsContainer.classList.add('keypad-action-buttons');
    keypad.appendChild(actionBtnsContainer);
    
    // Add a confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.innerHTML = '✓';  // Checkmark symbol
    confirmBtn.classList.add('keypad-confirm-btn');
    confirmBtn.setAttribute('data-confirm', 'true');
    actionBtnsContainer.appendChild(confirmBtn);
    
    // Add a close button next to confirm
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.classList.add('keypad-close-btn');
    actionBtnsContainer.appendChild(closeBtn);
    
    // Append keypad to body but keep it hidden initially
    keypad.style.display = 'none';
    document.body.appendChild(keypad);
    
    // Current active input field and state
    let activeInput = null;
    let currentValue = '';
    
    // Add event listeners to numeric input fields
    function attachKeypadToInputs() {
        const scoreInputs = document.querySelectorAll('input[type="text"][inputmode="numeric"].team-score');
        
        scoreInputs.forEach(input => {
            // Skip if already attached
            if (input.hasAttribute('data-keypad-attached')) return;
            
            input.setAttribute('data-keypad-attached', 'true');
            input.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Set current active input
                activeInput = this;
                
                // Reset the keypad state
                currentValue = this.value || '';
                updateDisplay();
                
                // Show the keypad
                keypad.style.display = 'flex';
            });
        });
    }
    
    // Update the display with the current value
    function updateDisplay() {
        display.textContent = currentValue;
    }
    
    // Handle keypad button clicks
    keypad.addEventListener('click', function(e) {
        const target = e.target;
        
        // Close button clicked
        if (target.classList.contains('keypad-close-btn')) {
            keypad.style.display = 'none';
            return;
        }
        
        // Confirm button clicked
        if (target.classList.contains('keypad-confirm-btn') && activeInput) {
            // Apply current value to input field
            activeInput.value = currentValue;
            // Close the keypad
            keypad.style.display = 'none';
            return;
        }
        
        // Number button clicked
        if (target.classList.contains('keypad-btn') && activeInput) {
            const value = target.getAttribute('data-value');
            
            // Set new value
            currentValue = value;
            updateDisplay();
            
            // Don't close the keypad - require confirmation
        }
    });
    
    // Close keypad when clicking outside
    document.addEventListener('click', function(e) {
        if (!keypad.contains(e.target) && 
            !e.target.classList.contains('team-score')) {
            keypad.style.display = 'none';
        }
    });
    
    // Initial attachment
    attachKeypadToInputs();
    
    // Make the function accessible to call when new inputs are added
    window.attachKeypadToInputs = attachKeypadToInputs;
    
    // Return the created keypad
    return keypad;
}

// Initialize the numeric keypad
function initNumericKeypad() {
    const keypad = createNumericKeypad();
    
    // Monitor DOM changes to attach keypad to new inputs
    const observer = new MutationObserver(function(mutations) {
        window.attachKeypadToInputs();
    });
    
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
}
