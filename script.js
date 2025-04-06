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





// Get the modal
var modal = document.getElementById("debug-log-modal");

// Get the button that opens the modal
var btn = document.getElementById("open-modal");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
btn.onclick = function() {
    document.getElementById('modal-debug-log').value = document.getElementById('debug-log').value;
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Submit the log data from the modal
document.getElementById('submit-modal-log').addEventListener('click', function() {
    const debugLog = document.getElementById('modal-debug-log').value;
    const comment = document.getElementById('modal-comment').value;
    const name = document.getElementById('modal-name').value;
    const contact = document.getElementById('modal-contact').value;
    const timestamp = new Date().toISOString();

    const title = encodeURIComponent('Bug Report');
    const body = encodeURIComponent(
        `**Timestamp:** ${timestamp}\n\n` +
        `**Debug Log:**\n\`\`\`\n${debugLog}\n\`\`\`\n\n` +
        `**Comment:** ${comment}\n\n` +
        `**Name:** ${name}\n\n` +
        `**Contact:** ${contact}`
    );

    const issueLink = `https://github.com/dudeitsharrison/PickleballCompTool/issues/new?title=${title}&body=${body}`;
    window.open(issueLink, '_blank');

    // Close the modal after submission
    modal.style.display = "none";
});









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
    document.getElementById('playerCount').textContent = `Player Count: ${playerNames.length}`;
    updatePlayerList();
    togglePlayerList();
    autoSave();
}

function updatePlayerList() {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = ''; // Clear list

    players.forEach(player => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = player.name;

        const eligibilityCell = document.createElement('td');
        const select = document.createElement('select');

        // Ensure dropdown reflects the restored manualSitOut status
        select.innerHTML = `
            <option value="true" ${!player.manualSitOut ? 'selected' : ''}>Stay In</option>
            <option value="false" ${player.manualSitOut ? 'selected' : ''}>Sit Out</option>
        `;

        // Add status indicator
        const statusIndicator = document.createElement('span');
        statusIndicator.classList.add('player-status');
        
        if (player.manualSitOut) {
            statusIndicator.classList.add('status-inactive');
            statusIndicator.textContent = 'Sitting Out';
        } else {
            statusIndicator.classList.add('status-active');
            statusIndicator.textContent = 'Active';
        }
        
        // Listen for changes in the dropdown
        select.addEventListener('change', () => {
            player.manualSitOut = select.value === "false";
            player.eligible = !player.manualSitOut;
            
            // Update status indicator when selection changes
            if (player.manualSitOut) {
                statusIndicator.classList.remove('status-active');
                statusIndicator.classList.add('status-inactive');
                statusIndicator.textContent = 'Sitting Out';
            } else {
                statusIndicator.classList.remove('status-inactive');
                statusIndicator.classList.add('status-active');
                statusIndicator.textContent = 'Active';
            }
            
            console.log(`Selector changed: Player ${player.name}, Manual Sit-Out: ${player.manualSitOut}, Eligible: ${player.eligible}`);
        });

        eligibilityCell.appendChild(select);
        eligibilityCell.appendChild(statusIndicator);
        row.appendChild(nameCell);
        row.appendChild(eligibilityCell);
        playerList.appendChild(row);
    });
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

    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const player1 = players[i];
            const player2 = players[j];

            const pairKey = generatePairKey(player1, player2);
            const pairCount = extendedPairHistory[pairKey] || 0;
            const isRecentlyPaired = isPairInRecentHistory(pairKey);

            // Step 3: Determine whether the pair can be added
            // - If all pairs have been used, allow repeats but avoid recent pairings
            // - Otherwise, avoid repeats altogether
            if ((allPairsUsed && !isRecentlyPaired) || pairCount === 0) {
                pairs.push({
                    player1,
                    player2,
                    pairKey,
                    pairCount, // Include pair count for sorting
                });
            }
        }
    }

    // Step 4: Sort pairs by fewest pairings and prioritize those not recently paired
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
    previousRoundPairs.clear(); // Clear only pairs from the immediate previous round
}

// Helper function to check if a pair is in recent history
function isPairInRecentHistory(pairKey) {
    return recentPairHistory.some(set => set.has(pairKey));
}

// Helper function to add a pair to recent history
function addPairToRecentHistory(pairKey) {
    if (recentPairHistory.length >= players.length) {
        recentPairHistory.shift(); // Remove the oldest round to maintain the limit
    }
    if (!recentPairHistory[recentPairHistory.length - 1]) {
        recentPairHistory.push(new Set());
    }
    recentPairHistory[recentPairHistory.length - 1].add(pairKey);
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

            // Remove the match from match history and relevant tracking
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

            const pair2Key = generatePairKey(team2Players[0], team2Players[1]);
            if (previousRoundPairs.has(pair2Key)) {
                previousRoundPairs.delete(pair2Key);
                logDebugMessage(`Removed Team 2 pair from previous round pairs.`);
            }

            // Check if all matches in the round are skipped
            const roundContainer = matchDiv.closest('.round-container');
            const matchesInRound = roundContainer.querySelectorAll('.match');
            const allSkipped = Array.from(matchesInRound).every(
                match => match.getAttribute('data-skipped') === 'true'
            );

            // Update the Submit Scores button text if all matches are skipped
            const submitScoresButton = roundContainer.querySelector('.submit-scores-btn');
            if (submitScoresButton) {
                submitScoresButton.textContent = allSkipped ? 'Next Round' : 'Submit Scores';
            }

            // Update the sit-out display
            updateSitOutDisplayForRound(roundContainer, sitOutPlayers);
            reorderMatchNumbers(roundContainer);

            logDebugMessage(`Match skipped. Players moved to sitting out.`);
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
    }





    function submitScores() {
        
        const roundContainer = document.querySelector('.round-container:last-child');
        const isEditing = roundContainer.querySelector('.edit-round-btn').textContent === 'Save Changes';

        if (isEditing) {
            alert("You must save or cancel edits before submitting the round.");
            return;
        }

        
        const currentMatches = document.querySelectorAll('.round-container:last-child .match');

        let allScoresValid = true;

        // Validate and collect scores
        currentMatches.forEach((matchDiv, matchIndex) => {
            if (matchDiv.getAttribute('data-skipped') === 'true') {
                console.log(`Skipping Match ${matchIndex + 1}`);
                return; // Skip this match
            }

            const team1ScoreInput = matchDiv.querySelector(`input[data-team="1"]`);
            const team2ScoreInput = matchDiv.querySelector(`input[data-team="2"]`);
            const team1Score = parseInt(team1ScoreInput.value);
            const team2Score = parseInt(team2ScoreInput.value);

            if (isNaN(team1Score) || isNaN(team2Score)) {
                allScoresValid = false;
                console.log(`Invalid scores in Match ${matchIndex + 1}`);
            } else {
                console.log(`Match ${matchIndex + 1}: Team 1 Score: ${team1Score}, Team 2 Score: ${team2Score}`);
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


// Sorting functions
function sortByVictoryPoints(players) {
    return players.slice().sort((a, b) =>
        b.victoryPoints - a.victoryPoints ||
        b.picklePoints - a.picklePoints ||
        b.gamesPlayed - a.gamesPlayed
    );
}

function sortByPicklePoints(players) {
    return players.slice().sort((a, b) =>
        b.picklePoints - a.picklePoints ||
        b.victoryPoints - a.victoryPoints ||
        b.gamesPlayed - a.gamesPlayed
    );
}

function sortByWinPercentage(players) {
    return players.slice().sort((a, b) => {
        const winPercentA = a.gamesPlayed ? a.victoryPoints / a.gamesPlayed : 0;
        const winPercentB = b.gamesPlayed ? b.victoryPoints / b.gamesPlayed : 0;
        return winPercentB - winPercentA ||
            b.gamesPlayed - a.gamesPlayed ||
            b.picklePoints - a.picklePoints;
    });
}

function sortByPicklePointAvg(players) {
    return players.slice().sort((a, b) => {
        const avgA = a.gamesPlayed ? a.picklePoints / a.gamesPlayed : 0;
        const avgB = b.gamesPlayed ? b.picklePoints / b.gamesPlayed : 0;
        return avgB - avgA || 
            b.picklePoints - a.picklePoints || 
            b.gamesPlayed - a.gamesPlayed; // Fallback sorting criteria
    });
}

function sortByPickleDifferential(players) {
    return players.slice().sort((a, b) =>
        (b.pickleDifferential || 0) - (a.pickleDifferential || 0) ||
        b.victoryPoints - a.victoryPoints ||
        b.gamesPlayed - a.gamesPlayed
    );
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
    const data = JSON.stringify(players);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pickleball_competition.json';
    a.click();
}

function importData(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
        players.length = 0; // Clear current players
        const importedData = JSON.parse(reader.result);
        players.push(...importedData);
        updatePlayerList();
    };

    reader.readAsText(file);
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
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tableBody = table.querySelector('tbody');

        // Group matches by round and track match occurrences
        const matchColors = {}; // To store a unique color for each repeated match
        const matchKeyMap = {}; // To count occurrences of each match key

        matches.forEach((match) => {
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

        // Iterate through matches and display them
        matches.forEach((match, index) => {
            const matchKey = generateMatchKey(match.team1, match.team2);
            const row = document.createElement('tr');

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

            row.innerHTML = `
                <td>${match.round - 1}</td>
                <td>Match ${index + 1}</td>
                <td class="team-cell">${match.team1.map(player => 
                    `<span class="team1-badge">${player.name}</span>`).join(' & ')}
                </td>
                <td class="team-cell">${match.team2.map(player => 
                    `<span class="team2-badge">${player.name}</span>`).join(' & ')}
                </td>
                <td><strong>${match.team1Score || 0} - ${match.team2Score || 0}</strong></td>
                <td>${winner}</td>
            `;
            tableBody.appendChild(row);
        });

        matchHistoryContent.appendChild(table);
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
        // Restore players
        players.length = 0;
        players.push(...(savedState.players || []).map(player => ({
            ...player, // Ensure all properties, including manualSitOut and eligible, are restored
        })));

        // Restore other data
        matches.length = 0;
        matches.push(...(savedState.matches || []));
        currentRound = savedState.currentRound || 1;
        isFirstRound = savedState.isFirstRound || true;

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
        players.forEach(player => {
            if (!player.teammates || typeof player.teammates !== 'object') {
                console.error(`Invalid teammates for player: ${player.name}`);
                player.teammates = {}; // Fix if invalid
            }
        });
        // Update the player list in the UI
        updatePlayerList();

        console.log("Competition state restored. Player statuses and selectors:");
        players.forEach(player => {
            const selectorValue = player.manualSitOut ? "Sit Out" : "Stay In";
            console.log(`Player: ${player.name}, Eligible: ${player.eligible}, Manual Sit-Out: ${player.manualSitOut}, Sat Out Last Round: ${player.satOutLastRound}, Selector: ${selectorValue}`);
        });

        console.log("Competition state restored successfully.");
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
    // Reset eligibility for players not already in a match
    const playersInMatches = new Set();
    roundContainer.querySelectorAll('.match:not([data-skipped="true"])').forEach(matchDiv => {
        matchDiv.querySelectorAll('.team1-player, .team2-player').forEach(playerSpan => {
            const playerName = playerSpan.textContent.trim();
            const player = players.find(p => p.name === playerName);
            if (player) {
                playersInMatches.add(player);
            }
        });
    });

    // Mark remaining players as eligible if not manually set to sit out
    players.forEach(player => {
        if (!playersInMatches.has(player) && !player.manualSitOut) {
            player.eligible = true;
        }
    });

    // Get eligible players and calculate available courts
    const eligiblePlayers = players.filter(player => player.eligible && !playersInMatches.has(player));
    const courtCount = parseInt(document.getElementById('courtSelect').value, 10) || 1;
    const maxMatches = courtCount;

    // Ensure we do not count skipped matches as active courts
    const activeMatches = roundContainer.querySelectorAll('.match:not([data-skipped="true"])').length;

    if (activeMatches >= maxMatches) {
        alert("No more matches can be added; all courts are in use.");
        return;
    }

    if (eligiblePlayers.length < 4) {
        alert("Not enough players to form another match.");
        return;
    }

    // Generate a new match
    const newMatches = createMatchesForRound(eligiblePlayers, 1); // Create only one match

    if (newMatches.length === 0) {
        alert("Unable to form a valid match. Please adjust player settings or reset history.");
        return;
    }

    // Add the new match to the round
    newMatches.forEach(match => {
        const matchKey = generateMatchKey(match.team1, match.team2);
        if (!matchHistory.has(matchKey)) {
            matchHistory.add(matchKey);
            updateMatchPlayCounter(matchKey);
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

        updateSitOutDisplayForRound(roundContainer, sitOutPlayers);
        reorderMatchNumbers(roundContainer);
        logDebugMessage(`Match skipped. Players moved to sitting out.`);
     });

        // Append the match to the round container
        const submitScoresButton = roundContainer.querySelector('.submit-scores-btn');
        const sitOutDiv = roundContainer.querySelector('.sit-out-players');
        if (submitScoresButton || sitOutDiv) {
            roundContainer.insertBefore(matchDiv, submitScoresButton || sitOutDiv);
        } else {
            roundContainer.appendChild(matchDiv);
        }
    });

    // Update the sit-out display
    updateSitOutDisplayForRound(roundContainer, sitOutPlayers);
        reorderMatchNumbers(roundContainer);

        const submitScoresButton = roundContainer.querySelector('.submit-scores-btn');
        if (submitScoresButton) {
            submitScoresButton.textContent = 'Submit Scores';
        }
        logDebugMessage("Submit Scores button reverted after adding a match.");


    logDebugMessage("New match added successfully.");
}


function updateSitOutDisplayForRound(roundContainer, sitOutPlayers) {
    let sitOutDiv = roundContainer.querySelector('.sit-out-players');
    if (!sitOutDiv) {
        sitOutDiv = document.createElement('div');
        sitOutDiv.classList.add('sit-out-players');
        roundContainer.appendChild(sitOutDiv);
    }

    // Update player statuses
    players.forEach(player => {
        player.satOutLastRound = sitOutPlayers.includes(player); // Mark players in sitOutPlayers as sat out
    });

    // Display updated sit-out players
    if (!sitOutPlayers || sitOutPlayers.length === 0) {
        sitOutDiv.innerHTML = '<strong>🎉 Everyone is playing! 🎉</strong>';
        sitOutDiv.classList.add('all-playing');
    } else {
        const sitOutPlayerNames = sitOutPlayers.map(player => 
            `<span class="sitting-player">${player.name}</span>`
        ).join(' ');
        sitOutDiv.innerHTML = `<strong>Sitting out:</strong> ${sitOutPlayerNames}`;
        sitOutDiv.classList.remove('all-playing');
    }
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
