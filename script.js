/**
 * Toast notification system
 */
function showToast(message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toastContainer');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Determine icon based on type
    let iconName;
    switch(type) {
        case 'success':
            iconName = 'check_circle';
            break;
        case 'error':
            iconName = 'error';
            break;
        default:
            iconName = 'info';
    }
    
    // Create toast content
    toast.innerHTML = `
        <span class="toast-icon material-symbols-rounded">${iconName}</span>
        <div class="toast-message">${message}</div>
        <button class="toast-close">
            <span class="material-symbols-rounded">close</span>
        </button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Add event listener to close button
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        toast.style.animation = 'toast-out 0.3s ease forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Auto-remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'toast-out 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, duration);
}

/**
 * Custom confirm dialog
 * @param {string} message - The message to display
 * @param {string} [confirmText='OK'] - Text for the confirm button
 * @param {string} [cancelText='Cancel'] - Text for the cancel button
 * @param {string} [type='warning'] - The type of dialog (warning, info, success, error)
 * @returns {Promise} - Resolves to true if confirmed, false if canceled
 */
function showConfirm(message, confirmText = 'OK', cancelText = 'Cancel', type = 'warning') {
    return new Promise((resolve) => {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'modal confirm-modal';
        modal.setAttribute('data-type', type); // Set data-type attribute for styling
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Determine icon based on type
        let iconName;
        switch(type) {
            case 'success':
                iconName = 'check_circle';
                break;
            case 'error':
                iconName = 'error';
                break;
            case 'warning':
                iconName = 'warning';
                break;
            default:
                iconName = 'help';
        }
        
        // Create modal content
        modalContent.innerHTML = `
            <div class="confirm-header">
                <span class="confirm-icon material-symbols-rounded">${iconName}</span>
                <div class="confirm-message">${message}</div>
            </div>
            <div class="confirm-buttons">
                <button class="confirm-cancel-btn">${cancelText}</button>
                <button class="confirm-ok-btn">${confirmText}</button>
            </div>
        `;
        
        // Add modal to body
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Add event listeners to buttons
        const confirmBtn = modal.querySelector('.confirm-ok-btn');
        const cancelBtn = modal.querySelector('.confirm-cancel-btn');
        
        // Function to close the modal
        const closeModal = (result) => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                resolve(result);
            }, 300);
        };
        
        // Add click event to confirm button
        confirmBtn.addEventListener('click', () => closeModal(true));
        
        // Add click event to cancel button
        cancelBtn.addEventListener('click', () => closeModal(false));
        
        // Add keyboard support (Enter for confirm, Escape for cancel)
        const handleKeydown = (e) => {
            if (e.key === 'Enter') {
                closeModal(true);
                document.removeEventListener('keydown', handleKeydown);
            } else if (e.key === 'Escape') {
                closeModal(false);
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        
        document.addEventListener('keydown', handleKeydown);
    });
}

// Override the native confirm to use our custom confirm dialog
const originalConfirm = window.confirm;
window.confirm = function(message) {
    // Return the Promise resolution directly
    return showConfirm(message);
};

// Override the native alert to use our toast system
const originalAlert = window.alert;
window.alert = function(message) {
    // Determine if it's an error message by checking keywords
    const errorKeywords = ['error', 'invalid', 'failed', 'unable', 'not enough', 'cannot'];
    const successKeywords = ['success', 'updated', 'saved', 'submitted'];
    
    let messageType = 'info';
    
    // Check if the message contains any error keywords
    if (errorKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
        messageType = 'error';
    } 
    // Check if it contains success keywords
    else if (successKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
        messageType = 'success';
    }
    
    showToast(message, messageType);
    
    // Optionally, you can still log to console
    console.log(`Toast (${messageType}): ${message}`);
};

const players = [];
let currentRound = 0; // Will be incremented when first round is displayed
let matches = []; // Store matches here for reference in scoring
let isFirstRound = true; // Track if it's the first round
// Unified pair tracking class
class PairTracker {
    constructor() {
        this.pairCounts = {}; // Tracks how many times each pair has played together (extendedPairHistory)
        this.recentRounds = []; // Array of Sets, one for each recent round (recentPairHistory)
        this.previousRoundPairs = new Set(); // Store previous round's pairs
        this.globalPairs = new Set(); // All pairs ever created (globalPairHistory)
        this.maxRecentRounds = 3; // Number of most recent rounds to track
    }

    // Generate a unique key for a player pair
    generateKey(player1, player2) {
        // Double-check player validity
        if (!player1 || !player2 || typeof player1 !== 'object' || typeof player2 !== 'object' ||
            !player1.name || !player2.name) {
            console.error("Invalid players provided to PairTracker.generateKey:", player1, player2);
            return null;  // Return null to indicate an invalid pair key
        }
        return [player1.name, player2.name].sort().join('-');
    }

    // Add a pair to history and update all tracking data
    addPair(player1, player2) {
        const pairKey = this.generateKey(player1, player2);
        
        // Update pair counts
        this.pairCounts[pairKey] = (this.pairCounts[pairKey] || 0) + 1;
        
        // Add to global pairs
        this.globalPairs.add(pairKey);
        
        // Add to recent rounds history
        this.addToRecentRounds(pairKey);
        
        return pairKey;
    }

    // Add a pair to recent rounds history
    addToRecentRounds(pairKey) {
        // Ensure we have at least one round
        if (this.recentRounds.length === 0) {
            this.recentRounds.push(new Set());
        }
        
        // Add to the current round
        const currentRoundSet = this.recentRounds[0];
        currentRoundSet.add(pairKey);
        
        logDebugMessage(`Added pair ${pairKey} to current round, now has ${currentRoundSet.size} pairs`);
    }

    // Start a new round - shift all tracking data
    startNewRound() {
        // Move current pairs to previousRoundPairs
        this.previousRoundPairs = this.recentRounds.length > 0 ? 
            new Set(this.recentRounds[0]) : new Set();
        
        // Add a new empty set for the current round
        this.recentRounds.unshift(new Set());
        
        // Limit the history size
        if (this.recentRounds.length > this.maxRecentRounds) {
            this.recentRounds.pop();
        }
        
        logDebugMessage(`Started new round, tracking ${this.recentRounds.length} recent rounds`);
    }

    // Check if a pair exists in recent rounds
    isPairRecent(player1, player2) {
        const pairKey = this.generateKey(player1, player2);
        
        for (const roundSet of this.recentRounds) {
            if (roundSet.has(pairKey)) {
                return true;
            }
        }
        
        return false;
    }

    // Get the count of times a pair has played together
    getPairCount(player1, player2) {
        const pairKey = this.generateKey(player1, player2);
        return this.pairCounts[pairKey] || 0;
    }

    // Remove a pair from recent rounds
    removePair(player1, player2) {
        const pairKey = this.generateKey(player1, player2);
        
        // Remove from each round's history
        let removed = false;
        this.recentRounds.forEach((set, index) => {
            if (set.has(pairKey)) {
                set.delete(pairKey);
                removed = true;
                logDebugMessage(`Removed pair ${pairKey} from round ${index + 1} history`);
            }
        });
        
        // Remove from previous round pairs if present
        if (this.previousRoundPairs.has(pairKey)) {
            this.previousRoundPairs.delete(pairKey);
            removed = true;
            logDebugMessage(`Removed pair ${pairKey} from previous round pairs`);
        }
        
        // Clean up empty sets
        this.recentRounds = this.recentRounds.filter(set => set.size > 0);
        
        return removed;
    }

    // Reset all pair history
    resetAll() {
        this.pairCounts = {};
        this.recentRounds = [];
        this.previousRoundPairs.clear();
        this.globalPairs.clear();
        logDebugMessage("Reset all pair history tracking");
    }

    // Reset recent history but keep previous round pairs
    resetRecent() {
        // Keep the pair counts but start fresh with recent rounds
        this.recentRounds = [];
        this.startNewRound();
        logDebugMessage("Reset recent pair history tracking");
    }

    // Log the pair history for debugging
    logHistory() {
        logDebugMessage("=== Pair History ===");
        logDebugMessage(`Recent rounds tracked: ${this.recentRounds.length}`);
        this.recentRounds.forEach((set, idx) => {
            logDebugMessage(`  Round ${idx+1}: ${Array.from(set).join(', ')}`);
        });
        
        logDebugMessage("Previous round pairs:");
        Array.from(this.previousRoundPairs).forEach(pair => {
            logDebugMessage(`  ${pair}`);
        });
        
        logDebugMessage("Pair counts (played together):");
        Object.entries(this.pairCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by count (descending)
            .forEach(([key, count]) => {
                if (count > 0) {
                    logDebugMessage(`  ${key}: ${count} times`);
                }
            });
        
        logDebugMessage("===================");
    }
}

// Create a global instance of the pair tracker
const pairTracker = new PairTracker();

// Match tracking
const matchHistory = new Set(); // Track all matches that have been played

let previousRoundOpponents = []; // Store previous round's opponents for comparison
let previousRoundMatches = new Set();
const matchCounter = {}; // Object to store match counts
const matchPlayCounter = {}; // Tracks unique matches across rounds

// Add at the top with other global variables
let currentSortingMethod = 'victoryPoints'; // Default sorting method

// Add to the global variables section
let customSortConfig = {
    primaryStat: 'victoryPoints',
    tiebreakers: ['winPercentage', 'pickleDifferential', 'picklePoints', 'picklePointAvg']
};

document.getElementById('addPlayersBtn').addEventListener('click', addPlayers);
document.getElementById('startTournament').addEventListener('click', playRound);
document.getElementById('togglePlayerList').addEventListener('click', togglePlayerList);
document.getElementById('exportBtn').addEventListener('click', exportData);
document.getElementById('importFile').addEventListener('change', importData);
document.getElementById('clearBtn').addEventListener('click', clearState);

// Consolidated event listeners for sorting buttons
const sortButtons = [
    { id: 'sortVictoryPoints', method: 'victoryPoints' },
    { id: 'sortPicklePoints', method: 'picklePoints' },
    { id: 'sortWinPercentage', method: 'winPercentage' },
    { id: 'sortPicklePointAvg', method: 'picklePointAvg' },
    { id: 'sortPickleDifferential', method: 'pickleDifferential' }
];

// Add event listeners to all sort buttons
sortButtons.forEach(button => {
    document.getElementById(button.id).addEventListener('click', () => {
        clearActiveSortingButtons();
        document.getElementById(button.id).classList.add('active');
        
        currentSortingMethod = button.method;
        const sortedPlayers = sortPlayers(players, currentSortingMethod);
        displayPodium(sortedPlayers);
        displayPlayerStatsTable(sortedPlayers);
    });
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
    currentSortingMethod = 'victoryPoints';
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
        document.getElementById('floatingLeaderboardBtn').classList.remove('hidden');
    } else {
        document.getElementById('floatingLeaderboardBtn').classList.add('hidden');
    }
}

/**
 * Helper function to handle common player update operations
 * @param {Function} updateAction - The function to perform the actual update
 */
function handlePlayerUpdate(updateAction) {
    if (updateAction()) {
        updatePlayerList();
        autoSave();
        return true;
    }
    return false;
}

/**
 * Updates all references to a player's name throughout the application
 * @param {string} oldName - The player's original name
 * @param {string} newName - The player's new name
 */
function updatePlayerNameReferences(oldName, newName) {
    logDebugMessage(`Updating references from "${oldName}" to "${newName}"`);
    
    // Update pair tracker's pairCounts
    Object.keys(pairTracker.pairCounts).forEach(pairKey => {
        if (pairKey.includes(oldName)) {
            const count = pairTracker.pairCounts[pairKey];
            const names = pairKey.split('-');
            const newPairKey = names.map(name => name === oldName ? newName : name).sort().join('-');
            
            // Create new key with updated name
            pairTracker.pairCounts[newPairKey] = count;
            // Delete the old key
            delete pairTracker.pairCounts[pairKey];
            logDebugMessage(`Updated pair history: ${pairKey} -> ${newPairKey}`);
        }
    });
    
    // Update versus stats in all players
    players.forEach(player => {
        if (player.versus && player.versus[oldName]) {
            // Create entry with new name
            player.versus[newName] = player.versus[oldName];
            // Delete entry with old name
            delete player.versus[oldName];
            logDebugMessage(`Updated versus stats for ${player.name}: ${oldName} -> ${newName}`);
        }
        
        // Update teammate references
        if (player.teammates && player.teammates[oldName]) {
            // Create entry with new name
            player.teammates[newName] = player.teammates[oldName];
            // Delete entry with old name
            delete player.teammates[oldName];
            logDebugMessage(`Updated teammate stats for ${player.name}: ${oldName} -> ${newName}`);
        }
    });
    
    // Update stored matches
    matches.forEach(match => {
        // Update team1 player names
        match.team1.forEach(player => {
            if (player.name === oldName) {
                player.name = newName;
            }
        });
        
        // Update team2 player names
        match.team2.forEach(player => {
            if (player.name === oldName) {
                player.name = newName;
            }
        });
    });
    
    // Update other data structures like recent pair history and global pairs
    function updateSetKeys(setObj) {
        if (setObj && setObj instanceof Set) {
                // Convert set to array, update relevant pairs, and convert back to set
            const pairsArray = Array.from(setObj);
            setObj.clear();
                
                pairsArray.forEach(pairKey => {
                    if (pairKey.includes(oldName)) {
                        const names = pairKey.split('-');
                        const newPairKey = names.map(name => name === oldName ? newName : name).sort().join('-');
                    setObj.add(newPairKey);
                    logDebugMessage(`Updated pair key: ${pairKey} -> ${newPairKey}`);
                    } else {
                    setObj.add(pairKey);
                    }
                });
            }
    }
    
    // Update recent rounds sets
    pairTracker.recentRounds.forEach(roundSet => {
        updateSetKeys(roundSet);
    });
    
    // Update global pairs set
    updateSetKeys(pairTracker.globalPairs);
    
    // Update previous round pairs set
    updateSetKeys(pairTracker.previousRoundPairs);
    
    // Update match history
    updateSetKeys(matchHistory);
    
    // Update the displayed rounds on the page
    updateDisplayedPlayerNames(oldName, newName);
}

/**
 * Updates player names in the currently displayed rounds and matches on the page
 * @param {string} oldName - The player's original name
 * @param {string} newName - The player's new name
 */
function updateDisplayedPlayerNames(oldName, newName) {
    // Update all player name references in the DOM
    const playerElements = document.querySelectorAll('.team1-player, .team2-player');
    
    playerElements.forEach(element => {
        if (element.textContent.trim() === oldName) {
            element.textContent = newName;
            logDebugMessage(`Updated displayed player name: ${oldName} -> ${newName}`);
        }
    });
    
    // Update sit-out player displays
    const sitOutDivs = document.querySelectorAll('.sit-out-players');
    sitOutDivs.forEach(div => {
        if (div.textContent.includes(oldName)) {
            div.textContent = div.textContent.replace(oldName, newName);
            logDebugMessage(`Updated sit-out display: ${oldName} -> ${newName}`);
        }
    });
    
    // If match history modal is open, update it as well
    const matchHistoryContent = document.getElementById('matchHistoryContent');
    if (matchHistoryContent) {
        const historyPlayerElements = matchHistoryContent.querySelectorAll('.player-name');
        historyPlayerElements.forEach(element => {
            if (element.textContent.trim() === oldName) {
                element.textContent = newName;
            }
        });
    }
}

function editPlayer(index) {
    return handlePlayerUpdate(() => {
        const player = players[index];
        const oldName = player.name;
        const newName = prompt("Edit player name:", oldName);
        
        if (newName && newName !== oldName) {
            // Update the player's name
            player.name = newName;
            
            // Update all references to this player throughout the application
            updatePlayerNameReferences(oldName, newName);
            
            return true;
        }
        return false;
    });
}

function removePlayer(index) {
    return handlePlayerUpdate(() => {
        // Use custom confirm for player removal
        return showConfirm(
            "Are you sure you want to remove this player?",
            "Remove", 
            "Cancel",
            "warning"
        ).then(confirmed => {
            if (!confirmed) {
                return false;
            }
            
            const player = players[index];
            // Use another custom confirm for stat retention
            return showConfirm(
                "Do you want to keep the player's stats?",
                "Keep Stats", 
                "Remove All Data",
                "info"
            ).then(keepStats => {
                if (keepStats) {
                    player.eligible = false;
                } else {
                    players.splice(index, 1);
                }
                return true;
            });
        });
    });
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

document.getElementById('startTournament').addEventListener('click', playRound);


// Function to create teams while minimizing repetitive pairing




// Generate a unique key for a player pair
function generatePairKey(player1, player2) {
    // Validate players before calling generateKey
    if (!player1 || !player2 || typeof player1 !== 'object' || typeof player2 !== 'object' || 
        !player1.name || !player2.name) {
        console.error("Invalid players provided to generatePairKey:", player1, player2);
        return null;  // Return null to indicate an invalid pair key
    }
    return pairTracker.generateKey(player1, player2);
}



// Function to generate match key (team1 vs team2)
function generateMatchKey(team1, team2) {
    // Validate teams and team members
    if (!Array.isArray(team1) || !Array.isArray(team2) || 
        team1.length !== 2 || team2.length !== 2) {
        console.error("Invalid teams provided to generateMatchKey:", team1, team2);
        return null;
    }
    
    // Make sure all team members have valid name properties
    for (const player of [...team1, ...team2]) {
        if (!player || typeof player !== 'object' || !player.name) {
            console.error("Invalid player in generateMatchKey:", player);
            return null;
        }
    }

    const team1Names = team1.map(player => player.name).sort().join("-");
    const team2Names = team2.map(player => player.name).sort().join("-");
    return [team1Names, team2Names].sort().join(" vs ");
}

// Track pair encounters globally
function updatePairEncounter(player1, player2) {
    pairTracker.addPair(player1, player2);
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

    // Debug the state of previousRoundMatches
    logDebugMessage(`Checking match ${matchKey}, previousRoundMatches has ${previousRoundMatches.size} items: ${Array.from(previousRoundMatches).join(', ')}`);

    // Check if match was already attempted
    if (attemptedMatches.has(matchKey)) {
        logDebugMessage(`Match ${matchKey} already attempted.`);
        return false;
    }

    // Check if this match was played in the previous round
    if (previousRoundMatches.has(matchKey)) {
        logDebugMessage(`Match ${matchKey} was played in the previous round, avoiding immediate repeat.`);
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
    const allPairsUsed = Array.from(allPossiblePairKeys).every(pairKey => {
        const names = pairKey.split('-');
        const player1 = players.find(p => p.name === names[0]);
        const player2 = players.find(p => p.name === names[1]);
        return player1 && player2 && pairTracker.getPairCount(player1, player2) > 0;
    });
    logDebugMessage(`All possible pairs used at least once: ${allPairsUsed}`);

    // Create a list of all potential pairs with their history info
    const potentialPairs = [];
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const player1 = players[i];
            const player2 = players[j];
            const pairKey = generatePairKey(player1, player2);
            const pairCount = pairTracker.getPairCount(player1, player2);
            const isRecentPair = pairTracker.isPairRecent(player1, player2);
            
            potentialPairs.push({
                player1,
                player2,
                pairKey,
                pairCount,
                isRecentPair
            });
        }
    }
    
    // Step 3: First, add pairs that meet the ideal criteria
    for (const pair of potentialPairs) {
        if ((allPairsUsed && !pair.isRecentPair) || pair.pairCount === 0) {
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
            if (a.isRecentPair !== b.isRecentPair) {
                return a.isRecentPair ? 1 : -1;
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


// Utility function to log errors or invalid cases clearly
function logErrorIf(condition, message) {
    if (condition) {
        logDebugMessage(message);
    }
}



function resetPreviousRoundPairs() {
    // Just clear the previous round pairs without affecting the round history structure
    pairTracker.previousRoundPairs.clear();
    logDebugMessage("Reset previous round pairs");
}

// Function to reset recent pair history when needed
function resetRecentPairHistory() {
    pairTracker.resetRecent();
}

// Helper function to check if a pair is in recent history
function isPairInRecentHistory(pairKey) {
    const names = pairKey.split('-');
    if (names.length !== 2) {
        logDebugMessage(`Invalid pair key format: ${pairKey}`);
        return false;
    }
    
    const player1 = players.find(p => p.name === names[0]);
    const player2 = players.find(p => p.name === names[1]);
    
    if (!player1 || !player2) {
        logDebugMessage(`Could not find players for pair key: ${pairKey}`);
    return false;
    }
    
    return pairTracker.isPairRecent(player1, player2);
}

// Helper function to add a pair to recent history
function addPairToRecentHistory(pairKey) {
    // Handle null/invalid pair keys
    if (!pairKey) {
        logDebugMessage(`Cannot add invalid pair key to recent history`);
        return;
    }
    
    const names = pairKey.split('-');
    if (names.length !== 2) {
        logDebugMessage(`Invalid pair key format: ${pairKey}`);
        return;
    }
    
    const player1 = players.find(p => p.name === names[0]);
    const player2 = players.find(p => p.name === names[1]);
    
    if (!player1 || !player2) {
        logDebugMessage(`Could not find players for pair key: ${pairKey}`);
        return;
    }
    
    pairTracker.addPair(player1, player2);
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
        console.error("No matches provided to display");
        return;
    }
    
    // Increment the round number before creating the round display
    currentRound++;
    
    // Get the match display container
    const matchDisplay = document.getElementById('matchDisplay');
    
    // Create a container for this round
    const roundNum = currentRound;
    const roundContainer = document.createElement('div');
    roundContainer.classList.add('round-container');
    roundContainer.setAttribute('data-round', roundNum);
    
    // Create round header with controls
    const roundHeader = document.createElement('div');
    roundHeader.classList.add('round-header');
    
    // Round title and edit button
    const headerContent = document.createElement('div');
    headerContent.classList.add('round-header-content');
    
    const roundTitle = document.createElement('h3');
    roundTitle.textContent = `Round ${roundNum}`;
    headerContent.appendChild(roundTitle);
    
    // Edit round button
    const editRoundBtn = document.createElement('button');
    editRoundBtn.classList.add('edit-round-btn');
    editRoundBtn.textContent = 'Edit Round';
    editRoundBtn.addEventListener('click', () => toggleEditRound(roundContainer, editRoundBtn));
    headerContent.appendChild(editRoundBtn);
    
    // Add "Add Match" button in the header content
    const addMatchButton = document.createElement('button');
    addMatchButton.textContent = 'Add Match';
    addMatchButton.classList.add('add-match-btn');
    addMatchButton.addEventListener('click', () => {
        addMatch(roundContainer, sitOutPlayers); // Pass the sit-out players list
    });
    headerContent.appendChild(addMatchButton);
    
    roundHeader.appendChild(headerContent);
    roundContainer.appendChild(roundHeader);
    
    // Display players sitting out this round
    updateSitOutDisplayForRound(roundContainer, sitOutPlayers);
    
    // Create match divs for each match
    matches.forEach((match, index) => {
        const matchDiv = document.createElement('div');
        matchDiv.classList.add('match');
        matchDiv.setAttribute('data-match', index);

        matchDiv.innerHTML = `
            <p>Match ${index + 1} <button class="skip-match-btn" data-match="${index}">Skip Match</button></p>
            <div class="team" data-team="1">
                <p>Team 1: ${match.team1.map(p => `<span class="team1-player">${p.name}</span>`).join(' & ')}</p>
                <label>Score: <input type="text" inputmode="numeric" pattern="[0-9]*" min="0" class="team-score" data-team="1" data-match="${index}" readonly></label>
            </div>
            <div class="team" data-team="2">
                <p>Team 2: ${match.team2.map(p => `<span class="team2-player">${p.name}</span>`).join(' & ')}</p>
                <label>Score: <input type="text" inputmode="numeric" pattern="[0-9]*" min="0" class="team-score" data-team="2" data-match="${index}" readonly></label>
            </div>
        `;
        
        // Add skip button event listener
        const skipButton = matchDiv.querySelector('.skip-match-btn');
        skipButton.addEventListener('click', function() {
            // Use custom confirm for match skipping
            showConfirm(
                "Are you sure you want to skip this match? This action cannot be undone.",
                "Skip Match",
                "Cancel", 
                "warning"
            ).then(confirmation => {
                if (!confirmation) return;
                
                matchDiv.style.display = 'none';
                matchDiv.setAttribute('data-skipped', 'true');
                
                // Get the players from the match
                const team1Players = match.team1;
                const team2Players = match.team2;
                
                // Mark players as ineligible and sitting out
                [...team1Players, ...team2Players].forEach(player => {
                    player.eligible = false;
                    player.satOutLastRound = true;
                    if (!sitOutPlayers.includes(player)) {
                        sitOutPlayers.push(player);
                    }
                });
                
                // Remove from match tracking
                const matchKey = generateMatchKey(team1Players, team2Players);
                if (matchHistory && matchHistory.has(matchKey)) {
                    matchHistory.delete(matchKey);
                }
                
                // Handle pair tracking
                const team1Key = generatePairKey(team1Players[0], team1Players[1]);
                const team2Key = generatePairKey(team2Players[0], team2Players[1]);
                
                if (pairTracker && pairTracker.previousRoundPairs) {
                    if (pairTracker.previousRoundPairs.has(team1Key)) {
                        pairTracker.previousRoundPairs.delete(team1Key);
                    }
                    if (pairTracker.previousRoundPairs.has(team2Key)) {
                        pairTracker.previousRoundPairs.delete(team2Key);
                    }
                }
                
                // Remove from recent history
                removePairFromRecentHistory(team1Key);
                removePairFromRecentHistory(team2Key);
                
                // Update the display
                updateSitOutDisplayForRound(roundContainer, sitOutPlayers);
                
                // Check if all matches are skipped to update button text
                const allSkipped = Array.from(roundContainer.querySelectorAll('.match')).every(m => 
                    m.getAttribute('data-skipped') === 'true');
                
                const submitBtn = roundContainer.querySelector('.submit-scores-btn');
                if (submitBtn && allSkipped) {
                    submitBtn.textContent = 'Next Round';
                }
                
                // Save changes
                autoSave();
            });
        });

        roundContainer.appendChild(matchDiv);
    });

    // Add "Submit Scores" button
    const addSubmitScoresButton = document.createElement('button');
    addSubmitScoresButton.textContent = 'Submit Scores';
    addSubmitScoresButton.classList.add('submit-scores-btn');
    addSubmitScoresButton.addEventListener('click', () => { submitScores(); });
    roundContainer.appendChild(addSubmitScoresButton);

    matchDisplay.appendChild(roundContainer);
    logDebugMessage(`Round ${currentRound} displayed successfully.`);
    
    // After all match displays are appended
    if (window.attachKeypadToInputs) {
        window.attachKeypadToInputs();
    }
}





    function submitScores() {
        const roundContainer = document.querySelector('.round-container:last-child');
        if (!roundContainer) {
            console.error("No round container found for submitting scores");
            return;
        }
        
        // Check if the round is in edit mode
        const isInEditMode = roundContainer.querySelector('.player-selector') !== null;
        if (isInEditMode) {
            // If in edit mode, first save the edits to convert selectors to proper player spans
            const editRoundButton = roundContainer.querySelector('.edit-round-btn');
            if (editRoundButton && editRoundButton.textContent === 'Save Changes') {
                // Call saveRoundEdits to convert the selectors to player spans
                saveRoundEdits(roundContainer, editRoundButton);
                
                // Allow time for the round to re-render before proceeding
                setTimeout(() => {
                    submitScores(); // Call submitScores again once edit mode is saved
                }, 300);
                return;
            }
        }
        
        const currentMatches = Array.from(roundContainer.querySelectorAll('.match:not([data-skipped="true"])'));
        
        // Get the actual round number from the data attribute or header
        const roundNumber = parseInt(roundContainer.getAttribute('data-round')) || 
                           (roundContainer.querySelector('h3') ? 
                            parseInt(roundContainer.querySelector('h3').textContent.replace('Round ', '')) : 
                            currentRound);
        
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
            showToast("Please enter valid scores for all matches.", "error");
            return;
        }
        
        // Clear the previous round's matches
        previousRoundMatches.clear();
        
        // Update players' stats and match history
        let processedMatches = 0; // Track successfully processed matches
        
        currentMatches.forEach((matchDiv, index) => {
            if (matchDiv.getAttribute('data-skipped') === 'true') return;
            
            // Get player elements based on whether we have span elements or selectors
            let team1PlayerElements, team2PlayerElements;
            
            // Using querySelectorAll to find all team1-player or team2-player spans
            team1PlayerElements = matchDiv.querySelectorAll('.team1-player');
            team2PlayerElements = matchDiv.querySelectorAll('.team2-player');
            
            // If no spans found, look for the team players from the matchDiv object
            if (!team1PlayerElements.length || !team2PlayerElements.length) {
                if (matchDiv.team1 && matchDiv.team2) {
                    // Use the teams stored on the matchDiv (from edit mode)
                    const team1Players = matchDiv.team1;
                    const team2Players = matchDiv.team2;
                    const team1Score = parseInt(matchDiv.querySelector(`input[data-team="1"]`).value) || 0;
                    const team2Score = parseInt(matchDiv.querySelector(`input[data-team="2"]`).value) || 0;
                    
                    processMatch(team1Players, team2Players, team1Score, team2Score, matchDiv, index);
                    processedMatches++;
                    return;
                }
                
                console.error(`Could not find player elements for match ${index + 1}. Is the round in edit mode?`);
                return;
            }
            
            // Convert player elements to player objects
            const team1Players = Array.from(team1PlayerElements).map(el => players.find(p => p.name === el.textContent.trim()));
            const team2Players = Array.from(team2PlayerElements).map(el => players.find(p => p.name === el.textContent.trim()));
            
            if (team1Players.some(p => !p) || team2Players.some(p => !p)) {
                console.error(`Some players could not be found for match ${index + 1}: ` +
                              `Team 1: ${Array.from(team1PlayerElements).map(el => el.textContent.trim()).join(', ')}, ` +
                              `Team 2: ${Array.from(team2PlayerElements).map(el => el.textContent.trim()).join(', ')}`);
                return;
            }
            
            const team1Score = parseInt(matchDiv.querySelector(`input[data-team="1"]`).value) || 0;
            const team2Score = parseInt(matchDiv.querySelector(`input[data-team="2"]`).value) || 0;
            
            processMatch(team1Players, team2Players, team1Score, team2Score, matchDiv, index);
            processedMatches++;
        });
        
        // Helper function to process a match
        function processMatch(team1Players, team2Players, team1Score, team2Score, matchDiv, index) {
            // Log for debugging
            console.log(`Saving match for Round ${roundNumber}, Match ${index + 1}: ${team1Players.map(p => p.name).join(' & ')} vs ${team2Players.map(p => p.name).join(' & ')}`);
            
            // Validate teams
            if (team1Players.length !== 2 || team2Players.length !== 2) {
                console.error(`Invalid team composition for Round ${roundNumber}, Match ${index + 1}`);
                return;
            }
            
            // Store the match key for this round to avoid immediate repeats
            const matchKey = generateMatchKey(team1Players, team2Players);
            if (matchKey) {
                previousRoundMatches.add(matchKey);
                logDebugMessage(`Added match ${matchKey} to previous round matches`);
            } else {
                console.error(`Could not generate match key for Round ${roundNumber}, Match ${index + 1}`);
                return;
            }
            
            // Update match history - use the exact round number from the container
            matches.push({
                round: roundNumber,
                team1: team1Players,
                team2: team2Players,
                team1Score,
                team2Score
            });
            
            // Update player stats
            team1Players.forEach(player => {
                player.gamesPlayed = (player.gamesPlayed || 0) + 1;
                player.picklePoints = (player.picklePoints || 0) + team1Score;
                player.pickleDifferential = (player.pickleDifferential || 0) + (team1Score - team2Score);
                
                if (team1Score > team2Score) {
                    player.victoryPoints = (player.victoryPoints || 0) + 1;
                }
                
                // Update teammates count
                team1Players
                    .filter(teammate => teammate !== player)
                    .forEach(teammate => updateTeammates(player, teammate));
                
                // Update versus count
                team2Players.forEach(opponent => updateVersus(player, opponent));
            });
            
            team2Players.forEach(player => {
                player.gamesPlayed = (player.gamesPlayed || 0) + 1;
                player.picklePoints = (player.picklePoints || 0) + team2Score;
                player.pickleDifferential = (player.pickleDifferential || 0) + (team2Score - team1Score);
                
                if (team2Score > team1Score) {
                    player.victoryPoints = (player.victoryPoints || 0) + 1;
                }
                
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
            
            if (team1Container && team2Container) {
                const team1ScoreInput = team1Container.querySelector('input.team-score');
                const team2ScoreInput = team2Container.querySelector('input.team-score');
                
                if (team1ScoreInput && team2ScoreInput) {
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
                    
                    if (team1Label && team2Label) {
                        team1Container.replaceChild(team1ScoreDisplay, team1Label);
                        team2Container.replaceChild(team2ScoreDisplay, team2Label);
                    }
        
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
                }
            }
            
            // Remove skip button if present
            const skipButton = matchDiv.querySelector('.skip-match-btn');
            if (skipButton) skipButton.remove();
        }
        
        // Check if we processed any matches
        if (processedMatches === 0) {
            showToast("No valid matches found to process. Please check team compositions.", "error");
            return;
        }
        
        // Update podium and stats table
        const sortedPlayers = sortByVictoryPoints(players);
        displayPodium(sortedPlayers);
        displayPlayerStatsTable(sortedPlayers);
        
        // Remove buttons from the completed round
        const submitScoresButton = roundContainer.querySelector('.submit-scores-btn');
        if (submitScoresButton) {
            submitScoresButton.remove();
        }
        
        const addMatchButton = roundContainer.querySelector('.add-match-btn');
        if (addMatchButton) {
            addMatchButton.remove();
        }
        
        const skipMatchButtons = roundContainer.querySelectorAll('.skip-match-btn');
        if (skipMatchButtons.length > 0) {
            skipMatchButtons.forEach(button => button.remove());
        }
        
        const editRoundButtons = roundContainer.querySelectorAll('.edit-round-btn');
        if (editRoundButtons.length > 0) {
            editRoundButtons.forEach(button => button.remove());
        }
        
        const cancelRoundButtons = roundContainer.querySelectorAll('.cancel-round-btn');
        if (cancelRoundButtons.length > 0) {
            cancelRoundButtons.forEach(button => button.remove());
        }
        
        showToast("Scores submitted! Starting the next round...", "success");
        generateNextRound();
        autoSave();
    }


// Function to generate the next round after submitting scores
function generateNextRound() {
    // Call startNewRound to properly shift history before clearing previous round pairs
    pairTracker.startNewRound();
    resetPreviousRoundPairs();
    
    // Call generatePairsAndMatches function which generates teams internally
    generatePairsAndMatches();
    
    autoSave();
}




// Reset history and enable rematches while keeping the last round's pairs
function resetPairAndMatchHistory() {
    pairTracker.resetAll();
    matchHistory.clear();
    // Clear matchPlayCounter without reassigning (it's a const)
    Object.keys(matchPlayCounter).forEach(key => delete matchPlayCounter[key]);
    // We intentionally don't clear previousRoundMatches to avoid immediate repeat matches
    logDebugMessage("Reset all pair and match history while preserving previous round matches");
}


// Utility function to generate or update match counter
function updateMatchPlayCounter(matchKey) {
    matchPlayCounter[matchKey] = (matchPlayCounter[matchKey] || 0) + 1;
    logDebugMessage(`Match ${matchKey} played ${matchPlayCounter[matchKey]} times.`);
}


function updateSitOutDisplay(sitOutPlayers) {
    // Don't create a global sitting out display at the top of the page
    // Let each round handle its own sitting out display section
    
    // This function is now deprecated as each round manages its own sitting out display
    // We keep it for compatibility with existing code, but it doesn't do anything
    
    // Old code removed to prevent creating global sitting out display
}



// Update main function to generate pairs and display matches
function generatePairsAndMatches() {
    clearDebugArea();
    logDebugMessage(`Starting pair generation for Round ${currentRound + 1}...`);

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
    currentRound = 0; // Set to 0 since appendMatchDisplay will increment it to 1
    // Initialize pair tracking for the first round
    pairTracker.startNewRound();
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
    
    // Define column order based on current sorting method
    const getColumnOrder = () => {
        // These columns are always first/last
        const fixedFirstColumns = ['Rank', 'Name', 'Games Played'];
        const fixedLastColumns = ['Teammates', 'Versus'];
        
        // These are the columns that can be rearranged
        let statColumns = [];
        
        // Order the stat columns based on the current sorting method (primary stat first)
        switch(currentSortingMethod) {
            case 'victoryPoints':
                statColumns = ['Victory Points', 'Win Percentage', 'Pickle Differential', 'Pickle Points', 'Pickle Point Avg'];
                break;
            case 'picklePoints':
                statColumns = ['Pickle Points', 'Victory Points', 'Pickle Differential', 'Win Percentage', 'Pickle Point Avg'];
                break;
            case 'winPercentage':
                statColumns = ['Win Percentage', 'Victory Points', 'Pickle Differential', 'Pickle Points', 'Pickle Point Avg'];
                break;
            case 'picklePointAvg':
                statColumns = ['Pickle Point Avg', 'Pickle Points', 'Victory Points', 'Win Percentage', 'Pickle Differential'];
                break;
            case 'pickleDifferential':
                statColumns = ['Pickle Differential', 'Victory Points', 'Pickle Points', 'Win Percentage', 'Pickle Point Avg'];
                break;
            case 'custom':
                // For custom sort, put primary stat first, then tiebreakers in their order
                const statMapping = {
                    'victoryPoints': 'Victory Points',
                    'winPercentage': 'Win Percentage',
                    'picklePoints': 'Pickle Points',
                    'pickleDifferential': 'Pickle Differential',
                    'picklePointAvg': 'Pickle Point Avg'
                };
                
                // Add primary stat first
                statColumns.push(statMapping[customSortConfig.primaryStat]);
                
                // Add tiebreakers in their order
                customSortConfig.tiebreakers.forEach(tiebreaker => {
                    if (tiebreaker !== customSortConfig.primaryStat) { // Skip primary stat if it's in tiebreakers
                        statColumns.push(statMapping[tiebreaker]);
                    }
                });
                break;
            default:
                statColumns = ['Victory Points', 'Win Percentage', 'Pickle Points', 'Pickle Differential', 'Pickle Point Avg'];
        }
        
        return [...fixedFirstColumns, ...statColumns, ...fixedLastColumns];
    };
    
    // Get the column order based on current sorting method
    const columnOrder = getColumnOrder();
    
    // Create table header with ordered columns
    let headerHTML = '<tr>';
    columnOrder.forEach(column => {
        headerHTML += `<th>${column}</th>`;
    });
    headerHTML += '</tr>';
    
    playerStatsTable.innerHTML = headerHTML;
    
    // Create the rows with data in the correct order
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
            
        // Create an object with all possible columns and their values
        const cellValues = {
            'Rank': index + 1,
            'Name': player.name,
            'Games Played': player.gamesPlayed,
            'Victory Points': player.victoryPoints,
            'Win Percentage': `${winPercentage.toFixed(2)}%`,
            'Pickle Points': player.picklePoints,
            'Pickle Differential': player.pickleDifferential,
            'Pickle Point Avg': picklePointAvg.toFixed(2),
            'Teammates': teammatesDisplay,
            'Versus': versusDisplay
        };

        // Create table row in the correct order
        const row = document.createElement('tr');
        columnOrder.forEach(column => {
            const cell = document.createElement('td');
            
            // Use innerHTML for columns that may contain HTML (like teammates and versus)
            if (column === 'Teammates' || column === 'Versus') {
                cell.innerHTML = cellValues[column];
            } else {
                // Apply special styling to primary sort column and tiebreakers
                const statColumnMapping = {
                    'victoryPoints': 'Victory Points',
                    'winPercentage': 'Win Percentage',
                    'picklePoints': 'Pickle Points',
                    'pickleDifferential': 'Pickle Differential',
                    'picklePointAvg': 'Pickle Point Avg'
                };
                
                // Apply special styling to the primary sort column
                if ((currentSortingMethod === 'victoryPoints' && column === 'Victory Points') ||
                    (currentSortingMethod === 'picklePoints' && column === 'Pickle Points') ||
                    (currentSortingMethod === 'winPercentage' && column === 'Win Percentage') ||
                    (currentSortingMethod === 'pickleDifferential' && column === 'Pickle Differential') ||
                    (currentSortingMethod === 'picklePointAvg' && column === 'Pickle Point Avg') ||
                    (currentSortingMethod === 'custom' && column === statColumnMapping[customSortConfig.primaryStat])) {
                    cell.classList.add('primary-sort-column');
                }
                
                // Add highlighting for custom sort tiebreakers
                if (currentSortingMethod === 'custom') {
                    // Highlight tiebreakers with decreasing intensity
                    customSortConfig.tiebreakers.forEach((tiebreaker, index) => {
                        if (column === statColumnMapping[tiebreaker] && tiebreaker !== customSortConfig.primaryStat) {
                            // Add tiebreaker class with index for styling
                            cell.classList.add('tiebreaker-column');
                            cell.dataset.tiebreakerIndex = index + 1; // +1 because index starts at 0
                        }
                    });
                }
                
                cell.textContent = cellValues[column];
            }
            row.appendChild(cell);
        });
        
        playerStatsTable.appendChild(row);
    });
}


// Helper function to calculate win percentage
function getWinPercentage(player) {
    return player.gamesPlayed ? player.victoryPoints / player.gamesPlayed : 0;
}

// Helper function to calculate pickle point average
function getPicklePointAvg(player) {
    return player.gamesPlayed ? player.picklePoints / player.gamesPlayed : 0;
}

// Helper function for win percentage with minimum games threshold
function getQualifiedWinPercentage(player, minGames = 2) {
    if (player.gamesPlayed < minGames) {
        return -1; // Rank players with fewer than minimum games lower
    }
    return player.gamesPlayed ? player.victoryPoints / player.gamesPlayed : 0;
}

// Helper function to get the appropriate value function for a stat type
function getSortValueFn(statType) {
    switch(statType) {
        case 'winPercentage': return player => getQualifiedWinPercentage(player, 2);
        case 'picklePointAvg': return getPicklePointAvg;
        default: return null;
    }
}

// Define sorting configurations
const sortConfigs = {
    victoryPoints: {
        primaryStat: 'victoryPoints',
        tiebreakers: ['winPercentage', 'pickleDifferential', 'picklePoints', 'picklePointAvg']
    },
    picklePoints: {
        primaryStat: 'picklePoints',
        tiebreakers: ['picklePointAvg', 'winPercentage', 'pickleDifferential']
    },
    winPercentage: {
        primaryStat: 'winPercentage',
        tiebreakers: ['victoryPoints', 'pickleDifferential', 'picklePoints']
    },
    picklePointAvg: {
        primaryStat: 'picklePointAvg',
        tiebreakers: ['picklePoints', 'winPercentage', 'pickleDifferential']
    },
    pickleDifferential: {
        primaryStat: 'pickleDifferential',
        tiebreakers: ['victoryPoints', 'winPercentage', 'picklePoints']
    }
};

// Unified function to sort players by any method
function sortPlayers(players, sortMethod) {
    const config = sortConfigs[sortMethod];
    if (!config) return players.slice();
    
    return players.slice().sort((a, b) => {
        // Primary sort
        const primaryValueA = a[config.primaryStat] || 0;
        const primaryValueB = b[config.primaryStat] || 0;
        if (primaryValueB !== primaryValueA) {
            return primaryValueB - primaryValueA;
        }
        
        // Tiebreakers
        for (const tiebreaker of config.tiebreakers) {
            const tieValueA = a[tiebreaker] || 0;
            const tieValueB = b[tiebreaker] || 0;
            if (tieValueB !== tieValueA) {
                return tieValueB - tieValueA;
            }
        }
        
        return 0;
    });
}

// Generic sort function that takes a primary sort property and custom value getter function
function sortPlayersByProperty(players, primaryProperty, getValueFn = null) {
    return players.slice().sort((a, b) => {
        // Primary sort based on the provided property or custom function
        if (getValueFn) {
            const valueA = getValueFn(a);
            const valueB = getValueFn(b);
            if (valueB !== valueA) {
                return valueB - valueA;
            }
        } else if (b[primaryProperty] !== a[primaryProperty]) {
            // Handle null or undefined values with || 0
            return (b[primaryProperty] || 0) - (a[primaryProperty] || 0);
        }
        
        // Handle custom sorting configuration
        if (currentSortingMethod === 'custom') {
            // Apply the custom tiebreakers in the order specified
            for (const tiebreaker of customSortConfig.tiebreakers) {
                // Skip if this is the same as the primary property
                if (tiebreaker === primaryProperty) continue;
                
                if (tiebreaker === 'winPercentage') {
                    const winPercentA = getWinPercentage(a);
                    const winPercentB = getWinPercentage(b);
                    if (winPercentB !== winPercentA) {
                        return winPercentB - winPercentA;
                    }
                } else if (tiebreaker === 'picklePointAvg') {
                    const avgA = getPicklePointAvg(a);
                    const avgB = getPicklePointAvg(b);
                    if (avgB !== avgA) {
                        return avgB - avgA;
                    }
                } else if (tiebreaker === 'pickleDifferential') {
                    if ((b.pickleDifferential || 0) !== (a.pickleDifferential || 0)) {
                        return (b.pickleDifferential || 0) - (a.pickleDifferential || 0);
                    }
                } else if (tiebreaker === 'picklePoints') {
                    if (b.picklePoints !== a.picklePoints) {
                        return b.picklePoints - a.picklePoints;
                    }
                } else if (tiebreaker === 'victoryPoints') {
                    if (b.victoryPoints !== a.victoryPoints) {
                        return b.victoryPoints - a.victoryPoints;
                    }
                }
            }
            
            // Games played as final tiebreaker for custom sort
            if (b.gamesPlayed !== a.gamesPlayed) {
                return b.gamesPlayed - a.gamesPlayed;
            }
        }
        // Apply different tiebreaker sequences based on primary sort
        else if (primaryProperty === 'victoryPoints' || getValueFn === getWinPercentage || getValueFn === getQualifiedWinPercentage) {
            // Victory Points and Win Percentage sorts use similar tiebreaker sequences
            
            // Skip primary property check if it's the main sort criteria
            if (primaryProperty !== 'victoryPoints' && b.victoryPoints !== a.victoryPoints) {
                return b.victoryPoints - a.victoryPoints;
            }
            
            // Skip win percentage check if it's the main sort criteria
            if (getValueFn !== getWinPercentage && getValueFn !== getQualifiedWinPercentage) {
                const winPercentA = getWinPercentage(a);
                const winPercentB = getWinPercentage(b);
                if (winPercentB !== winPercentA) {
                    return winPercentB - winPercentA;
                }
            }
            
            // Pickle Differential
            if ((b.pickleDifferential || 0) !== (a.pickleDifferential || 0)) {
                return (b.pickleDifferential || 0) - (a.pickleDifferential || 0);
            }
            
            // Pickle Points
            if (b.picklePoints !== a.picklePoints) {
                return b.picklePoints - a.picklePoints;
            }
            
            // Pickle Point Average
            const avgA = getPicklePointAvg(a);
            const avgB = getPicklePointAvg(b);
            if (avgB !== avgA) {
                return avgB - avgA;
            }
        } 
        else if (primaryProperty === 'picklePoints' || primaryProperty === 'picklePointAvg') {
            // Pickle Points and Pickle Point Avg sorts use similar tiebreaker sequences
            
            // Skip pickle points check if it's the main sort criteria
            if (primaryProperty !== 'picklePoints' && b.picklePoints !== a.picklePoints) {
                return b.picklePoints - a.picklePoints;
            }
            
            // Skip pickle point average check if it's the main sort criteria
            if (primaryProperty !== 'picklePointAvg' && getValueFn !== getPicklePointAvg) {
                const avgA = getPicklePointAvg(a);
                const avgB = getPicklePointAvg(b);
                if (avgB !== avgA) {
                    return avgB - avgA;
                }
            }
            
            // Victory Points
            if (b.victoryPoints !== a.victoryPoints) {
                return b.victoryPoints - a.victoryPoints;
            }
            
            // Win Percentage
            const winPercentA = getWinPercentage(a);
            const winPercentB = getWinPercentage(b);
            if (winPercentB !== winPercentA) {
                return winPercentB - winPercentA;
            }
            
            // Pickle Differential
            if ((b.pickleDifferential || 0) !== (a.pickleDifferential || 0)) {
                return (b.pickleDifferential || 0) - (a.pickleDifferential || 0);
            }
        }
        else if (primaryProperty === 'pickleDifferential') {
            // For pickle differential sort, put pickle points before win percentage
            
            // Victory Points
            if (b.victoryPoints !== a.victoryPoints) {
                return b.victoryPoints - a.victoryPoints;
            }
            
            // Pickle Points (more directly related to differential)
            if (b.picklePoints !== a.picklePoints) {
                return b.picklePoints - a.picklePoints;
            }
            
            // Win Percentage
            const winPercentA = getWinPercentage(a);
            const winPercentB = getWinPercentage(b);
            if (winPercentB !== winPercentA) {
                return winPercentB - winPercentA;
            }
            
            // Pickle Point Average
            const avgA = getPicklePointAvg(a);
            const avgB = getPicklePointAvg(b);
            if (avgB !== avgA) {
                return avgB - avgA;
            }
        }
        
        // Games Played tiebreaker - depends on sort type
        if (b.gamesPlayed !== a.gamesPlayed) {
            // For win percentage and pickle point average sorts, more games is more meaningful
            if (primaryProperty === 'winPercentage' || primaryProperty === 'picklePointAvg' || 
                getValueFn === getWinPercentage || getValueFn === getQualifiedWinPercentage || 
                getValueFn === getPicklePointAvg) {
                return b.gamesPlayed - a.gamesPlayed; // More games = higher rank for percentage stats
            }
            // For counting stats (raw numbers), more games can be an advantage, so consider equal
            // or even rank fewer games higher as it's more efficient
            return b.gamesPlayed - a.gamesPlayed; // Still default to more games = higher rank
        }
        
        // Final tie-breaker: Alphabetical by name (if all stats are identical)
        return a.name.localeCompare(b.name);
    });
}

// Preserve backward compatibility with existing code
function sortByVictoryPoints(players) {
    return sortPlayers(players, 'victoryPoints');
}

function sortByPicklePoints(players) {
    return sortPlayers(players, 'picklePoints');
}

function sortByWinPercentage(players) {
    return sortPlayers(players, 'winPercentage');
}

function sortByPicklePointAvg(players) {
    return sortPlayers(players, 'picklePointAvg');
}

function sortByPickleDifferential(players) {
    return sortPlayers(players, 'pickleDifferential');
}

// Add this function to sort by custom configuration
function sortByCustomConfig(players) {
    currentSortingMethod = 'custom';
    return sortPlayers(players, customSortConfig.primaryStat);
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

    // Step 10: No need to update a global UI element here - each round has its own sit-out display
    // Individual round UI will be updated elsewhere

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
        // Pair tracking data from pairTracker
        pairCounts: pairTracker.pairCounts,
        previousRoundPairs: Array.from(pairTracker.previousRoundPairs),
        recentRounds: pairTracker.recentRounds.map(set => Array.from(set)), // Convert Sets to arrays
        globalPairs: Array.from(pairTracker.globalPairs),
        // Match tracking
        matchHistory: Array.from(matchHistory),
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

function importData() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (file) {
    const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!importedData.players || !importedData.matches) {
                    throw new Error("Invalid data format: missing players or matches.");
                }
                
                // Clear existing state
                players = []; // Clear players array
                matches = []; // Clear matches array
                
                // Import players with their properties
                importedData.players.forEach(playerData => {
                    // Create a new player with the imported data
                    const player = {
                        name: playerData.name,
                        eligible: playerData.eligible !== undefined ? playerData.eligible : true,
                        manualSitOut: playerData.manualSitOut !== undefined ? playerData.manualSitOut : false,
                        gamesPlayed: playerData.gamesPlayed || 0,
                        roundsSatOut: playerData.roundsSatOut || 0,
                        victoryPoints: playerData.victoryPoints || 0,
                        picklePoints: playerData.picklePoints || 0,
                        pickleDifferential: playerData.pickleDifferential || 0,
                        satOutLastRound: playerData.satOutLastRound || false
                    };
                    
                    // Ensure teammates and versus objects exist
                    player.teammates = playerData.teammates || {};
                    player.versus = playerData.versus || {};
                    
                    players.push(player);
                });
                
                // Import matches
                importedData.matches.forEach(matchData => {
                    // Recreate match objects with references to actual player objects
                    const team1 = matchData.team1.map(playerData => {
                        return players.find(p => p.name === playerData.name) || playerData;
                    });
                    
                    const team2 = matchData.team2.map(playerData => {
                        return players.find(p => p.name === playerData.name) || playerData;
                    });
                    
                    matches.push({
                        round: matchData.round,
                        team1,
                        team2,
                        team1Score: matchData.team1Score,
                        team2Score: matchData.team2Score
                    });
                });
                
                // Import round number and first round flag
                currentRound = importedData.currentRound || 0;
                isFirstRound = importedData.isFirstRound !== undefined ? importedData.isFirstRound : true;

                // Reset and import pair history data
                pairTracker.resetAll();
                
                // Import pair tracking data
                if (importedData.pairCounts) {
                    pairTracker.pairCounts = importedData.pairCounts;
                }
                
                if (importedData.previousRoundPairs) {
                    pairTracker.previousRoundPairs = new Set(importedData.previousRoundPairs);
                }
                
                if (importedData.recentRounds) {
                    // Convert arrays back to Sets
                    pairTracker.recentRounds = importedData.recentRounds.map(roundArray => 
                        new Set(roundArray)
                    );
                }
                
                if (importedData.globalPairs) {
                    pairTracker.globalPairs = new Set(importedData.globalPairs);
                }
                
                // Import match history data
                if (importedData.matchHistory) {
                    matchHistory = new Set(importedData.matchHistory);
                }
                
                // Import match play counter if it exists
                if (importedData.matchPlayCounter) {
                    Object.assign(matchPlayCounter, importedData.matchPlayCounter);
                }

                // Support for legacy format
                if (importedData.extendedPairHistory && !importedData.pairCounts) {
                    pairTracker.pairCounts = importedData.extendedPairHistory;
                }
                
                if (importedData.globalPairHistory && !importedData.globalPairs) {
                    pairTracker.globalPairs = new Set(importedData.globalPairHistory);
                }
                
                if (importedData.recentPairHistory && !importedData.recentRounds) {
                    pairTracker.recentRounds = importedData.recentPairHistory.map(roundArray => 
                        new Set(roundArray)
                    );
                }
                
                // Update UI
                updatePlayerList();
                
                // If matches have been played, show the podium
                if (matches.length > 0) {
                    showPodium();
                }
                
                alert("Data imported successfully!");
                
                // Reload the page to refresh the UI
                window.location.reload();
                
        } catch (error) {
            console.error("Error importing data:", error);
                alert(`Error importing data: ${error.message}`);
        }
    };

    reader.readAsText(file);
    }
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
            
            // Display the actual round number - DO NOT adjust it
            row.innerHTML = `
                <td>${match.round}</td>
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
        // Pair tracking data from pairTracker
        pairCounts: pairTracker.pairCounts,
        previousRoundPairs: Array.from(pairTracker.previousRoundPairs),
        recentRounds: pairTracker.recentRounds.map(set => Array.from(set)), // Convert Sets to arrays
        globalPairs: Array.from(pairTracker.globalPairs),
        // Match tracking
        matchHistory: Array.from(matchHistory),
        matchPlayCounter,
        // Previous round matches to prevent consecutive repeat matches
        previousRoundMatches: Array.from(previousRoundMatches),
    };

    localStorage.setItem('pickleballCompetitionState', JSON.stringify(state));

    console.log("Game state saved. Player statuses and selectors:");
    players.forEach(player => {
        const selectorValue = player.manualSitOut ? "Sit Out" : "Stay In";
        console.log(`Player: ${player.name}, Eligible: ${player.eligible}, Manual Sit-Out: ${player.manualSitOut}, Sat Out Last Round: ${player.satOutLastRound}, Selector: ${selectorValue}`);
    });
}



function restoreState() {
    // Save the current scroll position to restore after loading
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;

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
            
            // Get the highest round number from matches to set currentRound correctly
            currentRound = savedState.currentRound || 0;
            if (matches.length > 0) {
                const maxRoundInMatches = Math.max(...matches.map(m => m.round || 0));
                // Set currentRound to at least the highest round number in matches
                currentRound = Math.max(currentRound, maxRoundInMatches);
            }
            
            isFirstRound = savedState.isFirstRound !== undefined ? savedState.isFirstRound : true;

            // Reset and restore pair tracker data
            pairTracker.resetAll();
            
            // Restore pair tracking data from new format
            if (savedState.pairCounts) {
                pairTracker.pairCounts = savedState.pairCounts;
            }
            
            if (savedState.previousRoundPairs) {
                pairTracker.previousRoundPairs = new Set(savedState.previousRoundPairs);
            }
            
            if (savedState.recentRounds) {
                pairTracker.recentRounds = savedState.recentRounds.map(roundArray => 
                    new Set(roundArray)
                );
            }
            
            if (savedState.globalPairs) {
                pairTracker.globalPairs = new Set(savedState.globalPairs);
            }
            
            // Support for legacy format
            if (savedState.extendedPairHistory && !savedState.pairCounts) {
                pairTracker.pairCounts = savedState.extendedPairHistory;
            }
            
            if (savedState.globalPairHistory && !savedState.globalPairs) {
                pairTracker.globalPairs = new Set(savedState.globalPairHistory);
            }
            
            if (savedState.recentPairHistory && !savedState.recentRounds) {
                pairTracker.recentRounds = savedState.recentPairHistory.map(roundArray => 
                    new Set(roundArray)
                );
            }
            
            // Restore previous round matches to prevent consecutive repeat matches
            previousRoundMatches.clear();
            if (savedState.previousRoundMatches) {
                savedState.previousRoundMatches.forEach(match => previousRoundMatches.add(match));
                logDebugMessage(`Restored ${previousRoundMatches.size} previous round matches`);
            }
            
            // Ensure the pair tracking has a current round initialized
            if (pairTracker.recentRounds.length === 0) {
                pairTracker.startNewRound();
                logDebugMessage("Initialized round tracking after restore");
            }

            // Restore match history and counter
            matchHistory.clear();
            (savedState.matchHistory || []).forEach(item => matchHistory.add(item));

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

    // Restore the original scroll position to prevent unwanted scrolling
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 0);
}


function clearState() {
    // Use our custom confirm with specific text and type
    showConfirm(
        "Are you sure you want to clear the current competition data? This action cannot be undone.",
        "Yes, Clear Data", // confirmText
        "Cancel", // cancelText
        "error" // type for red warning
    ).then(confirmClear => {
        if (!confirmClear) {
            return; // Exit if the user cancels
        }

        // Save audio mute settings
        const isMainAudioMuted = localStorage.getItem('isMainAudioMuted');
        const isLeaderboardAudioMuted = localStorage.getItem('isLeaderboardAudioMuted');

        // Clear players array without reassigning
        players.length = 0;

        // Clear matches array without reassigning
        matches.length = 0;

        currentRound = 0; // Changed from 1 to 0
        isFirstRound = true;

        // Reset pair tracker
        pairTracker.resetAll();

        // Clear matchHistory without reassigning
        matchHistory.clear();

        // Clear matchPlayCounter without reassigning
        Object.keys(matchPlayCounter).forEach(key => delete matchPlayCounter[key]);

        // Clear UI
        document.getElementById('matchDisplay').innerHTML = '';
        document.getElementById('playerList').innerHTML = '';
        document.getElementById('podiumDisplay').innerHTML = '';
        document.getElementById('playerCount').textContent = 'Player Count: 0';

        // Clear localStorage
        localStorage.clear();

        // Restore audio mute settings
        if (isMainAudioMuted) {
            localStorage.setItem('isMainAudioMuted', isMainAudioMuted);
        }
        if (isLeaderboardAudioMuted) {
            localStorage.setItem('isLeaderboardAudioMuted', isLeaderboardAudioMuted);
        }

        console.log("Competition data cleared successfully.");
        showToast("All competition data has been cleared.", "success");
        location.reload();
    });
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
        if (!pairTracker.previousRoundPairs.has(team1PairKey)) {
            pairTracker.previousRoundPairs.add(team1PairKey);
            addPairToRecentHistory(team1PairKey);
            logDebugMessage(`Added team 1 pair ${team1PairKey} to recent history`);
        }
        
        if (!pairTracker.previousRoundPairs.has(team2PairKey)) {
            pairTracker.previousRoundPairs.add(team2PairKey);
            addPairToRecentHistory(team2PairKey);
            logDebugMessage(`Added team 2 pair ${team2PairKey} to recent history`);
        }

        const matchDiv = document.createElement('div');
        matchDiv.classList.add('match');
        matchDiv.setAttribute('data-match', activeMatches);

        matchDiv.innerHTML = `
            <p>Match ${activeMatches + 1} <button class="skip-match-btn" data-match="${activeMatches}">Skip Match</button></p>
            <div class="team" data-team="1">
                <p>Team 1: ${match.team1.map(p => `<span class="team1-player">${p.name}</span>`).join(' & ')}</p>
                <label>Score: <input type="text" inputmode="numeric" pattern="[0-9]*" min="0" class="team-score" data-team="1" data-match="${activeMatches}" readonly></label>
            </div>
            <div class="team" data-team="2">
                <p>Team 2: ${match.team2.map(p => `<span class="team2-player">${p.name}</span>`).join(' & ')}</p>
                <label>Score: <input type="text" inputmode="numeric" pattern="[0-9]*" min="0" class="team-score" data-team="2" data-match="${activeMatches}" readonly></label>
            </div>
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

            // Remove from match relationships and tracking
            const matchKey = generateMatchKey(team1Players, team2Players);
            if (matchHistory.has(matchKey)) {
                matchHistory.delete(matchKey);
                logDebugMessage(`Removed match ${matchKey} from match history.`);
            }

            const pair1Key = generatePairKey(team1Players[0], team1Players[1]);
            if (pairTracker.previousRoundPairs.has(pair1Key)) {
                pairTracker.previousRoundPairs.delete(pair1Key);
                logDebugMessage(`Removed Team 1 pair from previous round pairs.`);
            }
            // Also remove from recent history
            removePairFromRecentHistory(pair1Key);
            
            const pair2Key = generatePairKey(team2Players[0], team2Players[1]);
            if (pairTracker.previousRoundPairs.has(pair2Key)) {
                pairTracker.previousRoundPairs.delete(pair2Key);
                logDebugMessage(`Removed Team 2 pair from previous round pairs.`);
            }
            // Also remove from recent history
            removePairFromRecentHistory(pair2Key);

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
        // Restore team data with object structure for reRenderRound
        matchDiv.team1 = matchData.team1.map(name => ({ name }));
        matchDiv.team2 = matchData.team2.map(name => ({ name }));
        
        // Restore scores
        matchDiv.querySelector('.team-score[data-team="1"]').value = matchData.team1Score;
        matchDiv.querySelector('.team-score[data-team="2"]').value = matchData.team2Score;

        // Ensure score inputs are enabled
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
    
    // Use reRenderRound to update the display
    reRenderRound(roundContainer);

    alert('Edits canceled. Round reverted to the original state.');
}




function saveRoundEdits(roundContainer, editRoundButton) {
    const matches = roundContainer.querySelectorAll('.match');
    const allPlayersInRound = new Map(); // Track players and their match indices
    let isValid = true;
    
    // Get the round number
    const roundNumber = parseInt(roundContainer.getAttribute('data-round')) || currentRound;
    
    // Store original team data for rollback
    const originalMatchData = Array.from(matches).map(matchDiv => {
        // Get team players from spans, ensuring we have valid player objects
        const team1Players = Array.from(matchDiv.querySelectorAll('.team1-player'))
            .map(el => {
                const playerName = el.textContent.trim();
                const playerObj = players.find(p => p.name === playerName);
                if (!playerObj) {
                    console.warn(`Could not find player object for name: ${playerName} in team 1`);
                }
                return playerObj;
            })
            .filter(Boolean); // Filter out any undefined players
            
        const team2Players = Array.from(matchDiv.querySelectorAll('.team2-player'))
            .map(el => {
                const playerName = el.textContent.trim();
                const playerObj = players.find(p => p.name === playerName);
                if (!playerObj) {
                    console.warn(`Could not find player object for name: ${playerName} in team 2`);
                }
                return playerObj;
            })
            .filter(Boolean); // Filter out any undefined players
            
        // Only return if we have valid teams (2 players in each team)
        if (team1Players.length === 2 && team2Players.length === 2) {
            return {
                team1: team1Players,
                team2: team2Players,
                team1Score: parseInt(matchDiv.querySelector('.team-score[data-team="1"]').value, 10) || 0,
                team2Score: parseInt(matchDiv.querySelector('.team-score[data-team="2"]').value, 10) || 0
            };
        }
        console.warn('Invalid team composition detected, skipping rollback for this match');
        return null;
    }).filter(Boolean); // Filter out any null match data

    // First, validate all player selections before applying any changes
    for (let matchIndex = 0; matchIndex < matches.length; matchIndex++) {
        const matchDiv = matches[matchIndex];
        
        const newTeam1 = Array.from(matchDiv.querySelectorAll('.player-selector[data-team="1"]'))
            .map(selector => players.find(p => p.name === selector.value))
            .filter(Boolean); // Filter out any undefined players

        const newTeam2 = Array.from(matchDiv.querySelectorAll('.player-selector[data-team="2"]'))
            .map(selector => players.find(p => p.name === selector.value))
            .filter(Boolean); // Filter out any undefined players

        if (newTeam1.length !== 2 || newTeam2.length !== 2) {
            showToast("Error: Each team must have exactly 2 valid players.", "error");
            isValid = false;
            break;
        }

        // Check for duplicate players
        const allPlayersInMatch = [...newTeam1, ...newTeam2];
        
        // Check each player in this match for duplicates
        for (const player of allPlayersInMatch) {
            if (allPlayersInRound.has(player.name)) {
                const existingMatch = allPlayersInRound.get(player.name);
                showToast(`Error: Player "${player.name}" appears in both Match ${existingMatch + 1} and Match ${matchIndex + 1}.`, "error");
                console.error(`Player "${player.name}" is in two pairs at the same time: Match ${existingMatch + 1} and Match ${matchIndex + 1}`);
                isValid = false;
                break;
            }
            allPlayersInRound.set(player.name, matchIndex);
        }
        
        if (!isValid) break;
    }

    if (!isValid) return;
    
    // If validation passed, proceed with applying changes
    
    // Roll back the original match data from pair tracking
    originalMatchData.forEach(match => {
        if (!match || !match.team1 || !match.team2 || match.team1.length !== 2 || match.team2.length !== 2) {
            console.warn('Skipping invalid match data during rollback');
            return;
        }
        
        try {
            // Roll back pair tracking
            const pair1Key = generatePairKey(match.team1[0], match.team1[1]);
            const pair2Key = generatePairKey(match.team2[0], match.team2[1]);
            
            // Remove from previous round pairs
            if (pair1Key && pairTracker.previousRoundPairs.has(pair1Key)) {
                pairTracker.previousRoundPairs.delete(pair1Key);
                logDebugMessage(`Removed Team 1 pair ${pair1Key} from previous round pairs during round edit`);
            }
            
            if (pair2Key && pairTracker.previousRoundPairs.has(pair2Key)) {
                pairTracker.previousRoundPairs.delete(pair2Key);
                logDebugMessage(`Removed Team 2 pair ${pair2Key} from previous round pairs during round edit`);
            }
            
            // Remove from recent history
            if (pair1Key) removePairFromRecentHistory(pair1Key);
            if (pair2Key) removePairFromRecentHistory(pair2Key);
            
            // Update match history tracking
            const matchKey = generateMatchKey(match.team1, match.team2);
            if (matchKey && matchHistory.has(matchKey)) {
                matchHistory.delete(matchKey);
                logDebugMessage(`Removed match ${matchKey} from match history during round edit`);
            }
        } catch (err) {
            console.error('Error during rollback of match data:', err);
        }
    });
    
    // Now apply the new match data to each match div
    Array.from(matches).forEach((matchDiv, index) => {
        const newTeam1 = Array.from(matchDiv.querySelectorAll('.player-selector[data-team="1"]'))
            .map(selector => players.find(p => p.name === selector.value))
            .filter(Boolean);

        const newTeam2 = Array.from(matchDiv.querySelectorAll('.player-selector[data-team="2"]'))
            .map(selector => players.find(p => p.name === selector.value))
            .filter(Boolean);
        
        if (newTeam1.length !== 2 || newTeam2.length !== 2) {
            console.warn(`Skipping match ${index + 1} due to invalid team composition`);
            return;
        }
        
        // Store the new teams and scores on the match div for re-rendering
        matchDiv.team1 = newTeam1;
        matchDiv.team2 = newTeam2;
        matchDiv.team1Score = parseInt(matchDiv.querySelector('.team-score[data-team="1"]').value, 10) || 0;
        matchDiv.team2Score = parseInt(matchDiv.querySelector('.team-score[data-team="2"]').value, 10) || 0;
        
        try {
            const newMatch = {
                team1: newTeam1,
                team2: newTeam2,
                team1Score: matchDiv.team1Score,
                team2Score: matchDiv.team2Score,
                round: roundNumber
            };
            
            // Add pairs to tracking
            const pair1Key = generatePairKey(newMatch.team1[0], newMatch.team1[1]);
            const pair2Key = generatePairKey(newMatch.team2[0], newMatch.team2[1]);
            
            // Add to pair tracker history
            if (pair1Key) addPairToRecentHistory(pair1Key);
            if (pair2Key) addPairToRecentHistory(pair2Key);
            
            // Add to previous round pairs
            if (pair1Key) pairTracker.previousRoundPairs.add(pair1Key);
            if (pair2Key) pairTracker.previousRoundPairs.add(pair2Key);
            
            // Update match history tracking
            const matchKey = generateMatchKey(newMatch.team1, newMatch.team2);
            if (matchKey) {
                matchHistory.add(matchKey);
                updateMatchPlayCounter(matchKey);
            }
            
            logDebugMessage(`Applied new pairs for edited match: Team 1: ${newMatch.team1.map(p => p.name).join(' & ')}, Team 2: ${newMatch.team2.map(p => p.name).join(' & ')}`);
        } catch (err) {
            console.error('Error during apply of new match data:', err);
        }
    });

    // Update sitting-out players
    const allPlayers = players.map(p => p.name);
    const playersInRound = Array.from(allPlayersInRound.keys());
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
    
    // Save changes to local storage
    autoSave();
    
    // Log pair history for debugging
    logPairHistory();
    
    showToast('Round edits saved!', 'success');
}







function reRenderRound(roundContainer) {
    const roundMatches = roundContainer.querySelectorAll('.match');
    
    // Get the round number if available
    const roundNumber = parseInt(roundContainer.querySelector('h3')?.textContent.replace('Round ', '')) || null;
    
    roundMatches.forEach((matchDiv, index) => {
        let matchData;
        
        // First check if this is a match element with team1/team2 properties (during editing)
        if (matchDiv.team1 && matchDiv.team2) {
            matchData = matchDiv;
        } 
        // Otherwise look for the match in the main matches array by round and index
        else if (roundNumber) {
            // Get match from global matches array by round and index
            matchData = matches.find(m => 
                m.round === roundNumber && 
                parseInt(matchDiv.getAttribute('data-match')) === parseInt(m.originalIndex || index)
            );
        }
        
        // If no match data found, skip this match
        if (!matchData) {
            console.warn(`No match data found for round ${roundNumber}, match index ${index}`);
            return;
        }
        
        // Update the displayed match information
        matchDiv.querySelector('[data-team="1"] p').innerHTML =
            `Team 1: ${matchData.team1.map(player => `<span class="team1-player">${player.name}</span>`).join(' & ')}`;
        matchDiv.querySelector('[data-team="2"] p').innerHTML =
            `Team 2: ${matchData.team2.map(player => `<span class="team2-player">${player.name}</span>`).join(' & ')}`;
        
        // Update scores if they exist
        const team1ScoreInput = matchDiv.querySelector('.team-score[data-team="1"]');
        const team2ScoreInput = matchDiv.querySelector('.team-score[data-team="2"]');
        
        if (team1ScoreInput && matchData.team1Score !== undefined) {
            team1ScoreInput.value = matchData.team1Score;
        }
        
        if (team2ScoreInput && matchData.team2Score !== undefined) {
            team2ScoreInput.value = matchData.team2Score;
        }

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
        const skipButton = matchDiv.querySelector('.skip-match-btn');
        
        if (matchTitle) {
            // If there's a skip button, include it in the updated title
            if (skipButton) {
                // Save the old click handler
                const oldClickHandler = skipButton.onclick;
                
                // Update the HTML
                matchTitle.innerHTML = `Match ${matchNumber} <button class="skip-match-btn" data-match="${index}">Skip Match</button>`;
                
                // Get the new skip button and attach the saved event handler
                const newSkipButton = matchTitle.querySelector('.skip-match-btn');
                if (newSkipButton && oldClickHandler) {
                    newSkipButton.onclick = oldClickHandler;
                } else if (newSkipButton) {
                    // If no previous handler was found, create a new one
                    newSkipButton.addEventListener('click', function() {
                        const confirmation = confirm("Are you sure you want to skip this match? This action cannot be undone.");
                        if (!confirmation) return;
                        
                        matchDiv.style.display = 'none';
                        matchDiv.setAttribute('data-skipped', 'true');
                        
                        // Get team players from the match
                        const team1Players = Array.from(matchDiv.querySelectorAll('.team1-player')).map(el => 
                            players.find(p => p.name === el.textContent.trim())
                        );
                        const team2Players = Array.from(matchDiv.querySelectorAll('.team2-player')).map(el => 
                            players.find(p => p.name === el.textContent.trim())
                        );
                        
                        // Update player eligibility and sit-out status
                        [...team1Players, ...team2Players].forEach(player => {
                            if (player) {
                                player.eligible = false;
                                player.satOutLastRound = true;
                            }
                        });
                        
                        // Check if all matches are skipped to update button text
                        const allSkipped = Array.from(roundContainer.querySelectorAll('.match')).every(m => 
                            m.getAttribute('data-skipped') === 'true');
                        
                        const submitBtn = roundContainer.querySelector('.submit-scores-btn');
                        if (submitBtn && allSkipped) {
                            submitBtn.textContent = 'Next Round';
                        }
                        
                        // Save changes
                        autoSave();
                    });
                }
            } else {
                matchTitle.textContent = `Match ${matchNumber}`;
            }
        }

        // Update the data-match attribute for consistency
        matchDiv.setAttribute('data-match', index);

        // Update team score inputs to have the correct data-match attribute
        matchDiv.querySelectorAll('.team-score').forEach(input => {
            input.setAttribute('data-match', index);
        });
    });
}


window.onload = restoreState;

// Add this near the beginning of the file with the other event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Ensure page is at the top on initial load
    window.scrollTo(0, 0);
    
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
    
    // Load custom sort config if available
    loadCustomSortConfig();
    
    // Add custom sort button to the sorting buttons
    const sortingButtons = document.querySelector('.sorting-buttons');
    const customSortBtn = document.createElement('button');
    customSortBtn.id = 'sortCustom';
    customSortBtn.innerHTML = '<span class="material-symbols-rounded">tune</span> Custom Sort';
    sortingButtons.appendChild(customSortBtn);
    
    // Add event listener for custom sort button
    document.getElementById('sortCustom').addEventListener('click', () => {
        clearActiveSortingButtons();
        document.getElementById('sortCustom').classList.add('active');
        
        currentSortingMethod = 'custom';
        const sortedPlayers = sortByCustomConfig(players);
        displayPodium(sortedPlayers);
        displayPlayerStatsTable(sortedPlayers);
        
        // Show custom sort configuration modal
        showCustomSortModal();
    });
});

// Function to handle scroll events
function handleScroll() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    const floatingLeaderboardBtn = document.getElementById('floatingLeaderboardBtn');
    const currentRoundBtn = document.getElementById('scrollToCurrentRound');
    
    // Get scroll position
    const scrollPos = window.scrollY || document.documentElement.scrollTop;
    
    // Hide leaderboard button only at the very top
    if (scrollPos <= 50) {
        floatingLeaderboardBtn.classList.add('hidden');
    } else {
        floatingLeaderboardBtn.classList.remove('hidden');
    }
    
    // Show back to top button unless we're at the very top
    if (scrollPos > 50) {
        backToTopBtn.style.display = "flex";
    } else {
        backToTopBtn.style.display = "none";
    }
    
    // Check if current round is in view to determine whether to show the button
    const roundContainers = document.querySelectorAll('.round-container');
    if (roundContainers.length > 0) {
        // Get the last round container (current round)
        const currentRoundContainer = roundContainers[roundContainers.length - 1];
        const containerRect = currentRoundContainer.getBoundingClientRect();
        
        // Only hide the button if the current round is at or near the top of the viewport
        // Show the button if the top of the round is below the viewport or far down
        if (containerRect.top >= 0 && containerRect.top <= 100) {
            currentRoundBtn.style.display = "none";
        } else {
            currentRoundBtn.style.display = "flex";
        }
    } else {
        // No rounds yet, hide the button
        currentRoundBtn.style.display = "none";
    }
}

// Function to scroll to the current round
function scrollToCurrentRound() {
    const roundContainers = document.querySelectorAll('.round-container');
    if (roundContainers.length > 0) {
        // Get the last round container (current round)
        const currentRoundContainer = roundContainers[roundContainers.length - 1];
        
        // Calculate optimal scroll position to place the round near the top
        const yOffset = 50; // Padding from top of viewport
        const y = currentRoundContainer.getBoundingClientRect().top + window.pageYOffset - yOffset;
        
        // Perform the scroll - the permanent padding ensures there's always enough space
        window.scrollTo({
            top: y,
            behavior: 'smooth'
        });
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
    
    // Store original index to help with re-rendering
    if (match.originalIndex === undefined) {
        match.originalIndex = matchIndex;
    }
    
    // Debugging info about original match state
    console.log("Original match before editing:", JSON.stringify({
        round: match.round,
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
            <h3>Edit Match (Round ${match.round})</h3>
            <div class="team-edit-section">
                <h4>Team 1</h4>
                <select id="team1-player1">
                    ${playerOptions}
                </select>
                <select id="team1-player2">
                    ${playerOptions}
                </select>
                <label>Score: 
                    <input type="text" inputmode="numeric" class="team-score" id="team1-score" min="0" value="${match.team1Score || 0}" placeholder="Click to enter score">
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
                    <input type="text" inputmode="numeric" class="team-score" id="team2-score" min="0" value="${match.team2Score || 0}" placeholder="Click to enter score">
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
        
        // Attach numeric keypad to score inputs
        const scoreInputs = dialog.querySelectorAll('input.team-score');
        scoreInputs.forEach(input => {
            // Make input readonly to prevent mobile keyboard
            input.setAttribute('readonly', 'readonly');
            
            // Make sure the custom keypad is initialized if it doesn't exist
            if (!document.getElementById('numericKeypad')) {
                createNumericKeypad();
            }
            
            // Use the window.attachKeypadToInputs function if available
            if (typeof window.attachKeypadToInputs === 'function') {
                window.attachKeypadToInputs();
            }
        });
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

        // Only check for duplicates within the same team
        if (team1Player1 === team1Player2 || team2Player1 === team2Player2) {
            alert('Players cannot be on the same team with themselves');
            return;
        }

        // Check if a player appears in both teams
        const allPlayers = new Set([team1Player1.name, team1Player2.name, team2Player1.name, team2Player2.name]);
        if (allPlayers.size !== 4) {
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
            // Hide the keypad if it's visible
            const keypad = document.getElementById('numericKeypad');
            if (keypad) keypad.style.display = 'none';
            
            // Update all relevant displays
            // 1. Update match history display
            showMatchHistory();
            
            // 2. Update the main round displays
            updateMainDisplayFromMatchEdit(match);
            
            // 3. Save changes to local storage
            autoSave();
            
            // 4. Force a complete re-render of all match rounds to ensure synchronization
            forceUpdateAllRounds();
            
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
        // Hide the keypad before removing the dialog
        const keypad = document.getElementById('numericKeypad');
        if (keypad) {
            keypad.style.display = 'none';
        }
        
        // Remove the dialog
        dialog.remove();
    });
}

/**
 * Updates the main display when a match is edited in the match history
 * @param {Object} match - The edited match
 */
function updateMainDisplayFromMatchEdit(match) {
    console.log(`Updating main display for match in round ${match.round}, originalIndex: ${match.originalIndex}`);
    
    // Instead of trying to find and update specific matches which might fail,
    // let's use the forceUpdateAllRounds function to ensure all displays are updated
    forceUpdateAllRounds();
    
    // Additionally ensure that all specific score displays are updated
    // This targets any standalone score displays that might not be caught by forceUpdateAllRounds
    document.querySelectorAll('.score-display, .score-text, .team-score').forEach(element => {
        const matchId = element.getAttribute('data-match');
        const teamId = element.getAttribute('data-team');
        const roundNum = element.closest('.round-container')?.getAttribute('data-round');
        
        // Try to match by match ID if available
        if (matchId && teamId) {
            const matchIndex = parseInt(matchId);
            
            // If this element references the match we're updating
            if (match.originalIndex === matchIndex || 
                (roundNum && parseInt(roundNum) === match.round && matchIndex === match.originalIndex % 10)) {
                
                // Update the score display
                if (teamId === '1') {
                    if (element.tagName === 'INPUT') {
                        element.value = match.team1Score;
                    } else {
                        element.textContent = `Score: ${match.team1Score}`;
                    }
                } else if (teamId === '2') {
                    if (element.tagName === 'INPUT') {
                        element.value = match.team2Score;
                    } else {
                        element.textContent = `Score: ${match.team2Score}`;
                    }
                }
            }
        }
    });
    
    // Update winner highlighting in all rounds
    document.querySelectorAll('.round-container').forEach(container => {
        const roundNum = parseInt(container.getAttribute('data-round'));
        
        // Only process the container for the round containing our edited match
        if (roundNum === match.round) {
            // Find matches that might be our edited match
            container.querySelectorAll('.match').forEach(matchDiv => {
                const matchIndex = parseInt(matchDiv.getAttribute('data-match'));
                
                // Check if this could be our match by index or by team overlap
                    const team1Names = Array.from(matchDiv.querySelectorAll('.team1-player'))
                        .map(el => el.textContent.trim());
                    const team2Names = Array.from(matchDiv.querySelectorAll('.team2-player'))
                        .map(el => el.textContent.trim());
                    
                    const editedTeam1Names = match.team1.map(p => p.name);
                    const editedTeam2Names = match.team2.map(p => p.name);
                    
                // Check for team overlap
                const hasTeam1Overlap = team1Names.some(name => editedTeam1Names.includes(name));
                const hasTeam2Overlap = team2Names.some(name => editedTeam2Names.includes(name));
                
                if (matchIndex === match.originalIndex || (hasTeam1Overlap && hasTeam2Overlap)) {
                    // This is likely our match - update the winner highlighting
                    const team1Container = matchDiv.querySelector(`.team[data-team="1"]`);
                    const team2Container = matchDiv.querySelector(`.team[data-team="2"]`);
                    
                    if (team1Container && team2Container) {
                        // Update score displays if they're in a different format
                        const scoreEl1 = team1Container.querySelector('.score-display');
                        const scoreEl2 = team2Container.querySelector('.score-display');
                        
                        if (scoreEl1) scoreEl1.textContent = `Score: ${match.team1Score}`;
                        if (scoreEl2) scoreEl2.textContent = `Score: ${match.team2Score}`;
                        
                        // Remove all winner/tie classes
                        team1Container.classList.remove('winner-team', 'tie-team');
                        team2Container.classList.remove('winner-team', 'tie-team');
                        
                        // Add classes based on new scores
                        if (match.team1Score > match.team2Score) {
                            team1Container.classList.add('winner-team');
                        } else if (match.team2Score > match.team1Score) {
                            team2Container.classList.add('winner-team');
                        } else {
                            team1Container.classList.add('tie-team');
                            team2Container.classList.add('tie-team');
                        }
                    }
                }
            });
        }
    });
    
    // Update leaderboard with latest player stats
    const activeSort = document.querySelector('.sorting-buttons button.active');
    let sortFunction = sortByVictoryPoints; // Default sort
    
    // Determine which sort function to use based on active button
    if (activeSort) {
        if (activeSort.id === 'sortPicklePoints') sortFunction = sortByPicklePoints;
        else if (activeSort.id === 'sortWinPercentage') sortFunction = sortByWinPercentage;
        else if (activeSort.id === 'sortPicklePointAvg') sortFunction = sortByPicklePointAvg;
        else if (activeSort.id === 'sortPickleDifferential') sortFunction = sortByPickleDifferential;
        else if (activeSort.id === 'sortCustom') sortFunction = sortByCustomConfig;
    }
    
    // Update the podium and player stats table with the latest data
    const sortedPlayers = sortFunction(players);
    displayPodium(sortedPlayers);
    displayPlayerStatsTable(sortedPlayers);
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
    if (pairTracker.previousRoundPairs.has(pair1Key)) {
        pairTracker.previousRoundPairs.delete(pair1Key);
        logDebugMessage(`Removed Team 1 pair ${pair1Key} from previous round pairs during rollback`);
    }
    
    if (pairTracker.previousRoundPairs.has(pair2Key)) {
        pairTracker.previousRoundPairs.delete(pair2Key);
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
    
    // Add pairs to tracking
    const pair1Key = generatePairKey(match.team1[0], match.team1[1]);
    const pair2Key = generatePairKey(match.team2[0], match.team2[1]);
    
    // Add to pair tracker history
    addPairToRecentHistory(pair1Key);
    addPairToRecentHistory(pair2Key);
    
    // Add to previous round pairs
    pairTracker.previousRoundPairs.add(pair1Key);
    pairTracker.previousRoundPairs.add(pair2Key);
    
    // Update match history tracking
    const matchKey = generateMatchKey(match.team1, match.team2);
    matchHistory.add(matchKey);
    updateMatchPlayCounter(matchKey);
    
    logDebugMessage(`Applied stats for match: Team 1: ${match.team1.map(p => p.name).join(' & ')}, Team 2: ${match.team2.map(p => p.name).join(' & ')}`);
}

// Helper function to update a match display element
function updateMatchDisplay(matchDiv, match) {
    // Update team 1 display
    const team1Element = matchDiv.querySelector('[data-team="1"] p');
    if (team1Element) {
        team1Element.innerHTML = `Team 1: ${match.team1.map(p => 
            `<span class="team1-player">${p.name}</span>`).join(' & ')}`;
    }
    
    // Update team 2 display
    const team2Element = matchDiv.querySelector('[data-team="2"] p');
    if (team2Element) {
        team2Element.innerHTML = `Team 2: ${match.team2.map(p => 
            `<span class="team2-player">${p.name}</span>`).join(' & ')}`;
    }
    
    // Update scores - make sure we're updating the value property
    const team1ScoreInput = matchDiv.querySelector('.team-score[data-team="1"]');
    const team2ScoreInput = matchDiv.querySelector('.team-score[data-team="2"]');
    
    if (team1ScoreInput) {
        team1ScoreInput.value = match.team1Score;
    }
    
    if (team2ScoreInput) {
        team2ScoreInput.value = match.team2Score;
    }
    
    // Update score displays
    const team1ScoreDisplay = matchDiv.querySelector('.score-display[data-team="1"]');
    if (team1ScoreDisplay) {
        team1ScoreDisplay.textContent = `Score: ${match.team1Score}`;
    }
    
    const team2ScoreDisplay = matchDiv.querySelector('.score-display[data-team="2"]');
    if (team2ScoreDisplay) {
        team2ScoreDisplay.textContent = `Score: ${match.team2Score}`;
    }
    
    // Update any other score elements
    const scoreElements = matchDiv.querySelectorAll('.score, .score-value');
    scoreElements.forEach(element => {
        const team = element.getAttribute('data-team');
        if (team === '1') {
            element.textContent = match.team1Score;
        } else if (team === '2') {
            element.textContent = match.team2Score;
        }
    });
    
    // Update combined score displays if any (like "10 - 11")
    const combinedScoreElement = matchDiv.querySelector('.combined-score');
    if (combinedScoreElement) {
        combinedScoreElement.textContent = `${match.team1Score} - ${match.team2Score}`;
    }
    
    // Update winner highlighting
    const team1Container = matchDiv.querySelector(`.team[data-team="1"]`);
    const team2Container = matchDiv.querySelector(`.team[data-team="2"]`);
    
    if (team1Container && team2Container) {
        // Remove all winner/tie classes
        team1Container.classList.remove('winner-team', 'tie-team');
        team2Container.classList.remove('winner-team', 'tie-team');
        
        // Add classes based on new scores
        if (match.team1Score > match.team2Score) {
            team1Container.classList.add('winner-team');
        } else if (match.team2Score > match.team1Score) {
            team2Container.classList.add('winner-team');
        } else {
            team1Container.classList.add('tie-team');
            team2Container.classList.add('tie-team');
        }
    }
    
    console.log(`Updated match display for Round ${match.round}: Score Team 1: ${match.team1Score}, Team 2: ${match.team2Score}`);
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
                        <p>Match ${groupIndex + 1} ${!isScored ? `<button class="skip-match-btn" data-match="${groupIndex}">Skip Match</button>` : ''}</p>
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
            
            // Add sitting out player display - this will be handled by the updateSitOutDisplayForRound function
            // so we don't need to create a duplicate display here
            
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
                // Check the last round container to get the actual last round number
                const lastRoundContainer = document.querySelector('.round-container:last-child');
                if (lastRoundContainer) {
                    const lastRoundNumber = parseInt(lastRoundContainer.getAttribute('data-round')) || 0;
                    
                    // Ensure currentRound matches the last displayed round
                    // This ensures the next round gets the correct number (lastRoundNumber + 1)
                    currentRound = lastRoundNumber;
                    logDebugMessage(`Adjusted currentRound to ${currentRound} to match last displayed round`);
                }
                generateNextRound();
            } else {
                // Start new tournament
                currentRound = 0; // Changed from 1 to 0
                generatePairsAndMatches();
            }
        });
    }
    
    // Setup scroll event handler for the back-to-top button
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    
    // Check if leaderboard button should be visible based on player count
    if (players.length > 0) {
        document.getElementById('floatingLeaderboardBtn').classList.remove('hidden');
    } else {
        document.getElementById('floatingLeaderboardBtn').classList.add('hidden');
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
    pairTracker.logHistory();
    
    // Additional debug information about recentRounds structure
    console.log("=== PAIR TRACKING STRUCTURE ===");
    console.log("Recent rounds (most recent first):");
    pairTracker.recentRounds.forEach((roundSet, index) => {
        console.log(`Round set ${index}: ${Array.from(roundSet).join(', ')}`);
        console.log("Contains pairs:", Array.from(roundSet).map(pair => {
            const [p1, p2] = pair.split('-');
            return `${p1} & ${p2}`;
        }).join(', '));
    });
    
    console.log("Previous round pairs:", Array.from(pairTracker.previousRoundPairs));
    console.log("Previous round pairs decoded:", Array.from(pairTracker.previousRoundPairs).map(pair => {
        const [p1, p2] = pair.split('-');
        return `${p1} & ${p2}`;
    }).join(', '));
    
    console.log("===========================");
}

// Function to remove a pair from recent history
function removePairFromRecentHistory(pairKey) {
    // Handle null/invalid pair keys
    if (!pairKey) {
        logDebugMessage(`Cannot remove invalid pair key from recent history`);
        return false;
    }
    
    const names = pairKey.split('-');
    if (names.length !== 2) {
        logDebugMessage(`Invalid pair key format: ${pairKey}`);
        return false;
    }
    
    const player1 = players.find(p => p.name === names[0]);
    const player2 = players.find(p => p.name === names[1]);
    
    if (!player1 || !player2) {
        logDebugMessage(`Could not find players for pair key: ${pairKey}`);
        return false;
    }
    
    return pairTracker.removePair(player1, player2);
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
    const commonScores = [13, 12, 11, 10];
    const singleDigits = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    
    // Add the common score buttons first (these are special and replace the current value)
    commonScores.forEach(num => {
        const button = document.createElement('button');
        button.textContent = num;
        button.classList.add('keypad-btn', 'common-score-btn');
        
        // Add special class for the winning score (11)
        if (num === 11) {
            button.classList.add('keypad-winning-btn');
        }
        
        button.setAttribute('data-value', num);
        keypad.appendChild(button);
    });
    
    // Add single digit buttons
    singleDigits.forEach(num => {
        const button = document.createElement('button');
        button.textContent = num;
        button.classList.add('keypad-btn', 'digit-btn');
        button.setAttribute('data-value', num);
        keypad.appendChild(button);
    });
    
    // Add a backspace button
    const backspaceBtn = document.createElement('button');
    backspaceBtn.innerHTML = '⌫'; // Backspace symbol
    backspaceBtn.classList.add('keypad-btn', 'backspace-btn');
    keypad.appendChild(backspaceBtn);
    
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
            
            // Make input readonly to prevent mobile keyboard from appearing
            input.setAttribute('readonly', 'readonly');
            
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
        
        // Backspace button clicked
        if (target.classList.contains('backspace-btn') && activeInput) {
            // Remove the last character
            currentValue = currentValue.toString().slice(0, -1);
            updateDisplay();
            return;
        }
        
        // Common score button clicked (10, 11, 12, 13) - replace entire value
        if (target.classList.contains('common-score-btn') && activeInput) {
            const value = target.getAttribute('data-value');
            currentValue = value;
            updateDisplay();
            return;
        }
        
        // Regular digit button clicked - append to current value
        if (target.classList.contains('digit-btn') && activeInput) {
            const digit = target.getAttribute('data-value');
            // Append the new digit to the current value
            currentValue = (currentValue.toString() + digit).replace(/^0+/, ''); // Remove leading zeros
            // If empty (only had zeros), set to the clicked digit
            if (currentValue === '') currentValue = digit;
            updateDisplay();
            return;
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

// Add function to save custom sort config to localStorage
function saveCustomSortConfig() {
    localStorage.setItem('pickleballCustomSortConfig', JSON.stringify(customSortConfig));
}

// Add function to load custom sort config from localStorage
function loadCustomSortConfig() {
    const savedConfig = localStorage.getItem('pickleballCustomSortConfig');
    if (savedConfig) {
        try {
            customSortConfig = JSON.parse(savedConfig);
        } catch (e) {
            console.error('Error parsing custom sort config:', e);
        }
    }
}

// Add this function to sort by custom configuration
function sortByCustomConfig(players) {
    currentSortingMethod = 'custom';
    return sortPlayers(players, customSortConfig.primaryStat);
}

// Function to show custom sort configuration modal
function showCustomSortModal() {
    // First, check if modal already exists
    let modal = document.getElementById('customSortModal');
    
    // If not, create it
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'customSortModal';
        modal.className = 'modal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Create header
        const header = document.createElement('h3');
        header.textContent = 'Custom Sort Configuration';
        
        // Create form
        const form = document.createElement('div');
        form.className = 'custom-sort-form';
        
        // Create explanation text
        const explanation = document.createElement('p');
        explanation.className = 'sort-explanation';
        explanation.textContent = 'Select your primary stat for sorting and choose the order of tiebreakers (1 = first tiebreaker, 5 = last tiebreaker)';
        
        // Primary stat selection
        const primaryStatSection = document.createElement('div');
        primaryStatSection.className = 'form-section';
        
        const primaryStatLabel = document.createElement('label');
        primaryStatLabel.textContent = 'Primary Sorting Stat:';
        primaryStatLabel.htmlFor = 'primaryStat';
        
        const primaryStatSelect = document.createElement('select');
        primaryStatSelect.id = 'primaryStat';
        primaryStatSelect.name = 'primaryStat';
        
        const statOptions = [
            { value: 'victoryPoints', text: 'Victory Points' },
            { value: 'winPercentage', text: 'Win Percentage' },
            { value: 'picklePoints', text: 'Pickle Points' },
            { value: 'pickleDifferential', text: 'Pickle Differential' },
            { value: 'picklePointAvg', text: 'Pickle Point Avg' }
        ];
        
        statOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.text;
            if (option.value === customSortConfig.primaryStat) {
                opt.selected = true;
            }
            primaryStatSelect.appendChild(opt);
        });
        
        primaryStatSection.appendChild(primaryStatLabel);
        primaryStatSection.appendChild(primaryStatSelect);
        
        // Tiebreaker section - new numbered approach
        const tiebreakerSection = document.createElement('div');
        tiebreakerSection.className = 'form-section';
        
        const tiebreakerLabel = document.createElement('div');
        tiebreakerLabel.className = 'tiebreaker-section-label';
        tiebreakerLabel.textContent = 'Tiebreaker Order:';
        
        tiebreakerSection.appendChild(tiebreakerLabel);
        
        // Create a table for better mobile layout
        const tiebreakerTable = document.createElement('table');
        tiebreakerTable.className = 'tiebreaker-table';
        
        // Add header row
        const headerRow = document.createElement('tr');
        const statHeader = document.createElement('th');
        statHeader.textContent = 'Statistic';
        const orderHeader = document.createElement('th');
        orderHeader.textContent = 'Order';
        headerRow.appendChild(statHeader);
        headerRow.appendChild(orderHeader);
        tiebreakerTable.appendChild(headerRow);
        
        // Get current tiebreaker order as a map
        const tiebreakOrderMap = {};
        customSortConfig.tiebreakers.forEach((tiebreaker, index) => {
            tiebreakOrderMap[tiebreaker] = index + 1;
        });
        
        // Create dropdown rows for each stat except primary
        statOptions.forEach(option => {
            // Skip the primary stat in tiebreakers
            if (option.value === customSortConfig.primaryStat) {
                return;
            }
            
            const row = document.createElement('tr');
            
            // Stat name cell
            const statCell = document.createElement('td');
            statCell.textContent = option.text;
            
            // Order dropdown cell
            const orderCell = document.createElement('td');
            const orderSelect = document.createElement('select');
            orderSelect.className = 'tiebreaker-order';
            orderSelect.dataset.stat = option.value;
            
            // Create 1-4 options
            for (let i = 1; i <= 4; i++) {
                const orderOpt = document.createElement('option');
                orderOpt.value = i;
                orderOpt.textContent = i;
                
                // Select current position
                if (tiebreakOrderMap[option.value] === i) {
                    orderOpt.selected = true;
                }
                
                orderSelect.appendChild(orderOpt);
            }
            
            orderCell.appendChild(orderSelect);
            
            row.appendChild(statCell);
            row.appendChild(orderCell);
            tiebreakerTable.appendChild(row);
        });
        
        tiebreakerSection.appendChild(tiebreakerTable);
        
        // Add button section
        const buttonSection = document.createElement('div');
        buttonSection.className = 'button-section';
        
        const saveButton = document.createElement('button');
        saveButton.id = 'saveCustomSort';
        saveButton.className = 'btn-success';
        saveButton.textContent = 'Save & Apply';
        
        const cancelButton = document.createElement('button');
        cancelButton.id = 'cancelCustomSort';
        cancelButton.textContent = 'Cancel';
        
        buttonSection.appendChild(saveButton);
        buttonSection.appendChild(cancelButton);
        
        // Assemble modal
        form.appendChild(explanation);
        form.appendChild(primaryStatSection);
        form.appendChild(tiebreakerSection);
        
        modalContent.appendChild(header);
        modalContent.appendChild(form);
        modalContent.appendChild(buttonSection);
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('saveCustomSort').addEventListener('click', () => {
            // Update primary stat
            customSortConfig.primaryStat = document.getElementById('primaryStat').value;
            
            // Get all stats except primary
            const availableStats = statOptions.map(opt => opt.value).filter(val => val !== customSortConfig.primaryStat);
            
            // Create a map of stat -> order
            const orderMap = {};
            document.querySelectorAll('.tiebreaker-order').forEach(select => {
                orderMap[select.dataset.stat] = parseInt(select.value);
            });
            
            // Sort stats by their order
            availableStats.sort((a, b) => orderMap[a] - orderMap[b]);
            
            // Set as tiebreakers
            customSortConfig.tiebreakers = availableStats;
            
            // Save to localStorage
            saveCustomSortConfig();
            
            // Apply sorting
            const sortedPlayers = sortByCustomConfig(players);
            displayPodium(sortedPlayers);
            displayPlayerStatsTable(sortedPlayers);
            
            // Close modal
            modal.classList.remove('active');
            
            // Add notice to inform user the custom sort was saved
            const notice = document.createElement('div');
            notice.className = 'custom-sort-notice';
            notice.textContent = 'Custom sort saved! It will be available across sessions.';
            document.body.appendChild(notice);
            
            // Remove notice after 3 seconds
            setTimeout(() => {
                notice.classList.add('fade-out');
                setTimeout(() => {
                    document.body.removeChild(notice);
                }, 500);
            }, 3000);
        });
        
        document.getElementById('cancelCustomSort').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        // Update primary select change behavior
        document.getElementById('primaryStat').addEventListener('change', function() {
            // When primary stat changes, rebuild the tiebreaker table
            const primaryValue = this.value;
            
            // Remove existing rows
            const table = document.querySelector('.tiebreaker-table');
            while (table.rows.length > 1) {
                table.deleteRow(1);
            }
            
            // Add new rows, skipping the new primary
            statOptions.forEach(option => {
                if (option.value === primaryValue) {
                    return;
                }
                
                const row = document.createElement('tr');
                
                // Stat name cell
                const statCell = document.createElement('td');
                statCell.textContent = option.text;
                
                // Order dropdown cell
                const orderCell = document.createElement('td');
                const orderSelect = document.createElement('select');
                orderSelect.className = 'tiebreaker-order';
                orderSelect.dataset.stat = option.value;
                
                // Create 1-4 options
                for (let i = 1; i <= 4; i++) {
                    const orderOpt = document.createElement('option');
                    orderOpt.value = i;
                    orderOpt.textContent = i;
                    orderSelect.appendChild(orderOpt);
                }
                
                orderCell.appendChild(orderSelect);
                
                row.appendChild(statCell);
                row.appendChild(orderCell);
                table.appendChild(row);
            });
        });
    }
    
    // Show the modal
    modal.classList.add('active');
}

// Helper function to force update all round displays
function forceUpdateAllRounds() {
    console.log("Forcing update of all round displays");
    
    // Get all round containers
    const roundContainers = document.querySelectorAll('.round-container');
    
    // For each round container, re-render all matches
    roundContainers.forEach((container) => {
        const roundNumber = parseInt(container.getAttribute('data-round'));
        
        // Find all matches for this round
        const roundMatches = matches.filter(match => match.round === roundNumber);
        
        // If we have matches for this round, update all match displays
        if (roundMatches.length > 0) {
            const matchDivs = container.querySelectorAll('.match');
            
            // Match up the round matches with the match divs as best we can
            matchDivs.forEach((matchDiv, i) => {
                // If we have a match for this position, update it
                if (i < roundMatches.length) {
                    updateMatchDisplay(matchDiv, roundMatches[i]);
                }
            });
        }
    });
    
    // If any scores display elements are still out of sync, update them
    matches.forEach((match, index) => {
        document.querySelectorAll(`[data-match="${index}"]`).forEach(element => {
            const teamId = element.getAttribute('data-team');
            
            // Update score value if this is a score element
            if (element.classList.contains('score-display') || 
                element.classList.contains('score-text') ||
                element.classList.contains('team-score')) {
                
                if (teamId === '1') {
                    if (element.tagName === 'INPUT') {
                        element.value = match.team1Score;
                    } else {
                        element.textContent = match.team1Score;
                    }
                } else if (teamId === '2') {
                    if (element.tagName === 'INPUT') {
                        element.value = match.team2Score;
                    } else {
                        element.textContent = match.team2Score;
                    }
                }
            }
        });
    });
}
