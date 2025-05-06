/**
 * Improved toast notification system with progress bar timer
 * This implementation handles both the script.js and index.html toast styles
 */
function showToast(message, type = 'info', duration = 4000) {
    console.group('Toast Notification Debug');
    console.log(`📣 showToast called with:`, { message, type, duration });
    
    // Get or create toast container
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        console.log('🏗️ Toast container not found, creating new one');
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    } else {
        console.log('✓ Using existing toast container');
        console.log('Current toasts:', toastContainer.childNodes.length);
    }
    
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
            iconName = 'info';
    }
    console.log(`🎨 Using icon: ${iconName} for type: ${type}`);
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Create toast content with progress bar
    toast.innerHTML = `
        <span class="toast-icon material-symbols-rounded">${iconName}</span>
        <div class="toast-message">${message}</div>
        <button class="toast-close">
            <span class="material-symbols-rounded">close</span>
        </button>
        <div class="toast-progress-bar"></div>
    `;
    console.log('🧩 Toast element created with HTML structure');
    
    // Add to container
    toastContainer.appendChild(toast);
    console.log('➕ Toast added to container');
    
    // Start animation
    setTimeout(() => {
        console.log('🎬 Starting animation by adding active class');
        toast.classList.add('active');
        
        // Animate progress bar
        const progressBar = toast.querySelector('.toast-progress-bar');
        if (progressBar) {
            console.log(`⏱️ Setting up progress bar with duration: ${duration}ms`);
            progressBar.style.transition = `width ${duration}ms linear`;
            progressBar.style.width = '0%';
        } else {
            console.warn('⚠️ Progress bar element not found!');
        }
    }, 10);
    
    // Add event listener to close button
    const closeButton = toast.querySelector('.toast-close');
    if (closeButton) {
        console.log('🔘 Adding click listener to close button');
        closeButton.addEventListener('click', () => {
            console.log('👆 Close button clicked');
            dismissToast(toast);
        });
    } else {
        console.warn('⚠️ Close button not found!');
    }
    
    // Auto-remove after duration
    const timeoutId = setTimeout(() => {
        console.log(`⏰ Auto-dismiss timeout triggered after ${duration}ms`);
        dismissToast(toast);
    }, duration);
    
    // Store timeout ID for possible early dismissal
    toast.dataset.timeoutId = timeoutId;
    console.log(`🔢 Timeout ID ${timeoutId} stored on toast element`);
    
    // Function to dismiss toast
    function dismissToast(toastElement) {
        console.log('🗑️ Dismissing toast');
        
        // Clear timeout if it exists
        const storedTimeoutId = toastElement.dataset.timeoutId;
        if (storedTimeoutId) {
            console.log(`🛑 Clearing timeout ID ${storedTimeoutId}`);
            clearTimeout(parseInt(storedTimeoutId));
        }
        
        // Remove active class to trigger exit animation
        console.log('🔄 Removing active class to trigger exit animation');
        toastElement.classList.remove('active');
        
        // Remove after animation completes
        setTimeout(() => {
            if (toastElement.parentNode) {
                console.log('❌ Removing toast from DOM');
                toastElement.remove();
            } else {
                console.warn('⚠️ Toast already removed from DOM');
            }
        }, 300);
    }
    
    console.log('✅ Toast notification setup complete');
    console.groupEnd();
    return toast;
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

    if (playerNames.length === 0) return;
    
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

    // Show toast notification about added players
    showToast(`Added ${playerNames.length} ${playerNames.length === 1 ? 'player' : 'players'} to the roster`, 'success', 3000);

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
    
    // Explicitly hide the Add Players button after adding players
    updateAddPlayersButtonState();
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
        
        // Create a cell for the player status and toggle
        const statusCell = document.createElement('td');
        statusCell.className = 'status-cell';
        
        // Create status indicator text
        const statusIndicator = document.createElement('span');
        statusIndicator.className = `player-status ${player.manualSitOut ? 'status-inactive' : 'status-active'}`;
        statusIndicator.textContent = player.manualSitOut ? 'Sitting Out' : 'Active';
        
        // Create toggle switch instead of dropdown
        const statusToggleLabel = document.createElement('label');
        statusToggleLabel.className = 'status-toggle';
        
        const statusToggleInput = document.createElement('input');
        statusToggleInput.type = 'checkbox';
        statusToggleInput.checked = !player.manualSitOut; // Checked = active, unchecked = sitting out
        statusToggleInput.setAttribute('data-player-index', index);
        
        const statusToggleSlider = document.createElement('span');
        statusToggleSlider.className = 'status-toggle-slider';
        
        statusToggleLabel.appendChild(statusToggleInput);
        statusToggleLabel.appendChild(statusToggleSlider);
        
        // Add event listener to toggle input
        statusToggleInput.addEventListener('change', function() {
            const playerIndex = parseInt(this.getAttribute('data-player-index'));
            const sitOut = !this.checked; // If toggle is off (unchecked), player sits out
            players[playerIndex].manualSitOut = sitOut;
            
            // Update status indicator text when toggled
            const statusIndicator = this.closest('td').querySelector('.player-status');
            if (statusIndicator) {
                statusIndicator.textContent = sitOut ? 'Sitting Out' : 'Active';
                statusIndicator.className = `player-status ${sitOut ? 'status-inactive' : 'status-active'}`;
            }
            
            // Show toast notification for status change
            showToast(`Player "${players[playerIndex].name}" ${sitOut ? 'will sit out' : 'is now active'} for next round`, 'info', 2000);
            
            console.log(`Player ${players[playerIndex].name} ${sitOut ? 'will sit out' : 'will play'} next round.`);
            autoSave();
        });
        
        // Create button group for edit and delete buttons
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';
        
        // Add edit button
        const editButton = document.createElement('button');
        editButton.className = 'small-btn edit-btn';
        editButton.innerHTML = '<span class="material-symbols-rounded">edit</span>';
        editButton.addEventListener('click', () => editPlayer(index));
        buttonGroup.appendChild(editButton);
        
        // Add remove button
        const removeButton = document.createElement('button');
        removeButton.className = 'small-btn remove-btn';
        removeButton.innerHTML = '<span class="material-symbols-rounded">delete</span>';
        removeButton.addEventListener('click', () => removePlayer(index));
        buttonGroup.appendChild(removeButton);
        
        // Add toggle, status text, and button group to the cell
        statusCell.appendChild(statusToggleLabel);
        statusCell.appendChild(statusIndicator);
        statusCell.appendChild(buttonGroup);
        
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
            
            // Show toast notification for successful edit
            showToast(`Player "${oldName}" renamed to "${newName}"`, 'success', 3000);
            
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
            const removedName = player.name;
            
            // Permanently remove the player from the list
            players.splice(index, 1);
            
            // Show success toast notification
            showToast(`Player "${removedName}" removed from roster`, 'success', 3000);
            return true;
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
        
        // Ensure button is always visible within viewport when panel is open
        const buttonWidth = 50; // Width of the toggle button in pixels
        const safetyMargin = window.innerWidth * 0.05; // 5vh safety margin
        const maxLeftPosition = window.innerWidth - buttonWidth - safetyMargin;
        
        // Get the current left position from CSS (either 450px or 90% + 10px from media query)
        const floatingPanelWidth = playerListContainer.offsetWidth;
        let desiredPosition = floatingPanelWidth;
        
        // Apply the minimum of desired position or maximum safe position
        toggleButton.style.left = Math.min(desiredPosition, maxLeftPosition) + 'px';
    } else {
        toggleButton.innerHTML = '<span class="material-symbols-rounded">people</span>';
        toggleButton.setAttribute('aria-label', 'Show player list');
        // Reset position when panel is closed
        toggleButton.style.removeProperty('left');
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

// Helper function to prioritize players with least partner variety
function prioritizeByPartnerVariety(players) {
    // Create a map of players to the count of unique partners they've had
    const uniquePartnerCounts = {};
    
    for (const player of players) {
        // Count unique partners from teammates object
        const uniquePartners = player.teammates ? Object.keys(player.teammates).length : 0;
        uniquePartnerCounts[player.name] = uniquePartners;
        
        logDebugMessage(`Player ${player.name} has had ${uniquePartners} unique partners`);
    }
    
    // Sort players by their unique partner count (ascending)
    return [...players].sort((a, b) => {
        return uniquePartnerCounts[a.name] - uniquePartnerCounts[b.name];
    });
}

// Function to find optimal pairings for the critical n-2 round
function findOptimalRemainingPairings(players, maxMatches) {
    logDebugMessage("=== STARTING OPTIMAL REMAINING PAIRS ALGORITHM ===");
    
    // 1. Create a map of each player and their potential remaining partners
    const remainingPartners = {};
    players.forEach(player => {
        remainingPartners[player.name] = [];
        players.forEach(potentialPartner => {
            if (player !== potentialPartner && 
                pairTracker.getPairCount(player, potentialPartner) === 0) {
                remainingPartners[player.name].push(potentialPartner);
            }
        });
        logDebugMessage(`Player ${player.name} has ${remainingPartners[player.name].length} remaining potential partners`);
    });
    
    // 2. Find players with fewest remaining partner options
    const playersByConstraint = [...players].sort((a, b) => 
        remainingPartners[a.name].length - remainingPartners[b.name].length);
    
    logDebugMessage(`Most constrained player: ${playersByConstraint[0].name} with ${remainingPartners[playersByConstraint[0].name].length} options`);
    
    // 3. Use backtracking to find optimal pairings
    const matches = [];
    const usedPlayers = new Set();
    
    // Recursive backtracking function
    function findValidPairings() {
        if (matches.length >= maxMatches || usedPlayers.size >= players.length) {
            return true; // Found enough matches
        }
        
        // Get available players not yet used in this round
        const availablePlayers = players.filter(p => !usedPlayers.has(p.name));
        if (availablePlayers.length < 4) {
            return matches.length > 0; // Can't form more complete matches
        }
        
        // Sort by fewest remaining partner options first
        availablePlayers.sort((a, b) => {
            const aOptions = remainingPartners[a.name].filter(p => !usedPlayers.has(p.name)).length;
            const bOptions = remainingPartners[b.name].filter(p => !usedPlayers.has(p.name)).length;
            return aOptions - bOptions;
        });
        
        // Start with the most constrained player
        const currentPlayer = availablePlayers[0];
        usedPlayers.add(currentPlayer.name);
        
        // Try each available partner
        const availablePartners = remainingPartners[currentPlayer.name]
            .filter(p => !usedPlayers.has(p.name));
            
        for (const partner of availablePartners) {
            usedPlayers.add(partner.name);
            
            // Formed team 1
            const team1 = [currentPlayer, partner];
            const team1Key = generatePairKey(currentPlayer, partner);
            
            // Find players for team 2 (also prioritizing most constrained)
            const remainingForTeam2 = availablePlayers.filter(
                p => p !== currentPlayer && p !== partner && !usedPlayers.has(p.name)
            );
            
            if (remainingForTeam2.length >= 2) {
                // Sort remaining players by constraint level
                remainingForTeam2.sort((a, b) => {
                    const aOptions = remainingPartners[a.name].filter(
                        p => remainingForTeam2.includes(p) && p !== a
                    ).length;
                    const bOptions = remainingPartners[b.name].filter(
                        p => remainingForTeam2.includes(p) && p !== b
                    ).length;
                    return aOptions - bOptions;
                });
                
                // Try to pair the most constrained remaining player
                const team2Player1 = remainingForTeam2[0];
                
                // Find potential partners for team2Player1
                const team2Options = remainingPartners[team2Player1.name]
                    .filter(p => remainingForTeam2.includes(p) && p !== team2Player1);
                    
                for (const team2Player2 of team2Options) {
                    // Check if this is a valid match
                    const team2 = [team2Player1, team2Player2];
                    const team2Key = generatePairKey(team2Player1, team2Player2);
                    
                    const matchKey = generateMatchKey(team1, team2);
                    
                    // Validate this match doesn't violate any constraints
                    if (previousRoundMatches && previousRoundMatches.has(matchKey)) {
                        continue; // Skip if this exact match was played in the previous round
                    }
                    
                    // Mark these players as used
                    usedPlayers.add(team2Player1.name);
                    usedPlayers.add(team2Player2.name);
                    
                    // Create the match
                    matches.push({ team1, team2 });
                    
                    // Continue with remaining players
                    if (findValidPairings()) {
                        return true;
                    }
                    
                    // Backtrack if this doesn't lead to a solution
                    matches.pop();
                    usedPlayers.delete(team2Player1.name);
                    usedPlayers.delete(team2Player2.name);
                }
            }
            
            // Backtrack team 1
            usedPlayers.delete(partner.name);
        }
        
        // Backtrack current player
        usedPlayers.delete(currentPlayer.name);
        return false;
    }
    
    // Start the backtracking search
    const foundSolution = findValidPairings();
    
    if (foundSolution) {
        logDebugMessage(`Found optimal solution with ${matches.length} matches for critical round`);
        
        // Update tracking for these pairs
        matches.forEach(match => {
            updatePairEncounter(match.team1[0], match.team1[1]);
            updatePairEncounter(match.team2[0], match.team2[1]);
        });
        
        return matches;
    }
    
    logDebugMessage("Could not find optimal solution, falling back to standard algorithm");
    return null;
}

function createMatchesForRound(eligiblePlayers, maxMatches) {
    logDebugMessage("=== START CREATE MATCHES FOR ROUND ===");
    logDebugMessage(`Creating matches with ${eligiblePlayers.length} eligible players: ${eligiblePlayers.map(p => p.name).join(', ')}`);
    logDebugMessage(`Maximum matches to create: ${maxMatches}`);
    
    // Check if we're at the critical round (n-2)
    const totalRounds = document.querySelectorAll('.round-container').length;
    const currentRound = totalRounds + 1; // Adding 1 because we're creating the next round
    
    // Only optimize at the critical round n-2
    if (currentRound === eligiblePlayers.length - 2) {
        logDebugMessage(`At critical round ${currentRound} (n-2), using special optimization`);
        const optimizedMatches = findOptimalRemainingPairings(eligiblePlayers, maxMatches);
        if (optimizedMatches && optimizedMatches.length > 0) {
            logDebugMessage(`Using optimized pairings for round ${currentRound}`);
            return optimizedMatches;
        }
    }
    
    // Sort players to prioritize those with least partner variety first
    const prioritizedPlayers = prioritizeByPartnerVariety(eligiblePlayers);
    logDebugMessage(`Players prioritized by partner variety: ${prioritizedPlayers.map(p => p.name).join(', ')}`);
    
    // Then shuffle among those with the same counts for some variety
    let shuffledPlayers = shuffleArray([...prioritizedPlayers]);
    const matches = [];
    const usedPlayers = new Set(); // Track used players for this round
    const attemptedMatches = new Set(); // Track attempted match keys
    let relaxOpponentLogic = false; // Temporary variable to relax logic if needed

function isValidMatch(team1, team2, relaxationLevel = 0) {
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

    // Get pair counts for all players involved
    const team1PairKey = generatePairKey(team1[0], team1[1]);
    const team2PairKey = generatePairKey(team2[0], team2[1]);
    const team1PairCount = pairTracker.getPairCount(team1[0], team1[1]);
    const team2PairCount = pairTracker.getPairCount(team2[0], team2[1]);

    // STEP 1: Check opponent history using the new sorted approach
    // Calculate how many times each player has played against the opposing team players
    const opponentCounts = [];
    for (const t1Player of team1) {
        for (const t2Player of team2) {
            const t1VsT2Count = t1Player.versus?.[t2Player.name] || 0;
            const t2VsT1Count = t2Player.versus?.[t1Player.name] || 0;
            // These should be the same, but just in case there's inconsistency
            const count = Math.max(t1VsT2Count, t2VsT1Count);
            opponentCounts.push({
                player1: t1Player.name,
                player2: t2Player.name,
                count: count
            });
        }
    }
    
    // Get maximum opponent count in this potential match
    const matchMaxOpponentCount = Math.max(...opponentCounts.map(o => o.count), 0);
    
    // Get all eligible players
    const allEligiblePlayers = Array.from(eligiblePlayers);
    
    // Get all possible opponent pairs across all eligible players
    const allPossibleOpponentPairs = [];
    for (let i = 0; i < allEligiblePlayers.length; i++) {
        for (let j = i + 1; j < allEligiblePlayers.length; j++) {
            const count1 = allEligiblePlayers[i].versus?.[allEligiblePlayers[j].name] || 0;
            const count2 = allEligiblePlayers[j].versus?.[allEligiblePlayers[i].name] || 0;
            const count = Math.max(count1, count2);
            
            allPossibleOpponentPairs.push({
                player1: allEligiblePlayers[i],
                player2: allEligiblePlayers[j],
                count: count
            });
        }
    }
    
    // Group opponent pairs by count (NEW APPROACH)
    const opponentPairsByCount = {};
    for (const pair of allPossibleOpponentPairs) {
        if (!opponentPairsByCount[pair.count]) {
            opponentPairsByCount[pair.count] = [];
        }
        opponentPairsByCount[pair.count].push(pair);
    }
    
    // Get all unique counts and sort them
    const allCounts = Object.keys(opponentPairsByCount).map(Number).sort((a, b) => a - b);
    
    // Find the minimum available opponent count
    const minOpponentCount = allCounts.length > 0 ? allCounts[0] : 0;
    
    // Find the priority level based on relaxation for opponent selection
    let priorityLevel;
    if (relaxationLevel === 0) {
        // Strictly use minimum opponent count
        priorityLevel = minOpponentCount;
    } else if (relaxationLevel === 1) {
        // Can use minimum or one level above if available
        const nextLevel = allCounts.length > 1 ? allCounts[1] : minOpponentCount;
        priorityLevel = nextLevel;
    } else {
        // At level 2+, can use any opponent count
        priorityLevel = Math.max(...allCounts, 0);
    }
    
    // Check if the current match's opponent counts exceed the allowed priority level
    if (matchMaxOpponentCount > priorityLevel) {
        logDebugMessage(`Match ${matchKey} rejected: Maximum opponent count ${matchMaxOpponentCount} exceeds priority level ${priorityLevel} for relaxation level ${relaxationLevel}`);
        return false;
    }
    
    // For strict level 0, require using only minimum count opponents
    if (relaxationLevel === 0 && matchMaxOpponentCount > minOpponentCount) {
        logDebugMessage(`Match ${matchKey} rejected: Contains opponents with count ${matchMaxOpponentCount} when minimum available is ${minOpponentCount}`);
        return false;
    }

    // STEP 2: Check for unused partnerships (this is still important)
    if (relaxationLevel === 0) {
        // Check if these are repeat partnerships
        if (team1PairCount > 0 || team2PairCount > 0) {
            // Check if ANY unused partnerships exist in the pool
            const allPairs = getAllPossiblePairs(allEligiblePlayers);
            const unusedPairsExist = allPairs.some(p => 
                pairTracker.getPairCount(p.player1, p.player2) === 0
            );
            
            if (unusedPairsExist) {
                logDebugMessage(`Match ${matchKey} rejected at level 0: Contains repeat pairs while unused pairs exist`);
                return false;
            }
        }
    }
    
    // Level 1: Allow pairs that have played together but not recently
    if (relaxationLevel === 1) {
        if (pairTracker.isPairRecent(team1[0], team1[1]) || pairTracker.isPairRecent(team2[0], team2[1])) {
            logDebugMessage(`Match ${matchKey} rejected at level 1: Contains recent pairs`);
            return false;
        }
        
        // Find pairs with lowest usage count
        const allPairs = getAllPossiblePairs(allEligiblePlayers);
        const minPairCount = Math.min(...allPairs.map(p => pairTracker.getPairCount(p.player1, p.player2)));
        
        // Only allow repeat pairs if we've exhausted all pairs with lower counts
        if ((team1PairCount > minPairCount + 1) || (team2PairCount > minPairCount + 1)) {
            logDebugMessage(`Match ${matchKey} rejected at level 1: Better unused or less-used pairs available`);
            return false;
        }
    }
    // Level 2: Allow any pairs that haven't played together recently
    else if (relaxationLevel === 2) {
        if (pairTracker.isPairRecent(team1[0], team1[1]) || pairTracker.isPairRecent(team2[0], team2[1])) {
            logDebugMessage(`Match ${matchKey} rejected at level 2: Contains recent pairs`);
            return false;
        }
    }

    logDebugMessage(`Match ${matchKey} is valid at relaxation level ${relaxationLevel}`);
    return true;
}

// Helper function to get all possible player pairs
function getAllPossiblePairs(players) {
    const pairs = [];
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            pairs.push({
                player1: players[i],
                player2: players[j]
            });
        }
    }
    return pairs;
}

   function tryFormMatches(players, maxMatches, relaxationLevel = 0, depth = 0) {
    if (matches.length >= maxMatches || players.length < 4) return true; // Base case

    // First, check if any unused partnerships exist
    let unusedPairsExist = false;
    if (relaxationLevel === 0) {
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                const pairCount = pairTracker.getPairCount(players[i], players[j]);
                if (pairCount === 0) {
                    unusedPairsExist = true;
                    break;
                }
            }
            if (unusedPairsExist) break;
        }
        logDebugMessage(`Checking for unused pairs: ${unusedPairsExist ? 'Found' : 'None found'}`);
    }

    // Generate all possible team pairings
    const currentPairs = generatePairs(players);
    logDebugMessage(`Generated ${currentPairs.length} possible pairs at depth ${depth}`);
    
    // If we're at depth 0, we'll evaluate multiple possible match configurations
    if (depth === 0) {
        // Store all valid match configurations to compare them
        const possibleConfigurations = [];
        
        // Generate and evaluate all possible configurations
        findOptimalMatchConfigurations(players, currentPairs, unusedPairsExist, relaxationLevel, possibleConfigurations, maxMatches);
        
        // If we found valid configurations, select the best one
        if (possibleConfigurations.length > 0) {
            logDebugMessage(`Found ${possibleConfigurations.length} valid match configurations. Selecting the optimal one.`);
            
            // Sort configurations by their "versus balance" score (lower is better)
            possibleConfigurations.sort((a, b) => a.score - b.score);
            
            // Use the best configuration (lowest score = most balanced)
            const bestConfig = possibleConfigurations[0];
            logDebugMessage(`Selected best configuration with score ${bestConfig.score}`);
            
            // Apply the best configuration
            bestConfig.matches.forEach(match => {
                matches.push(match);
                
                // Add pairs to tracking
                addPairToRecentHistory(generatePairKey(match.team1[0], match.team1[1]));
                addPairToRecentHistory(generatePairKey(match.team2[0], match.team2[1]));
                
                // Update attempted matches
                attemptedMatches.add(generateMatchKey(match.team1, match.team2));
                
                // Update used players
                [...match.team1, ...match.team2].forEach(player => usedPlayers.add(player));
            });
            
            return true;
        }
    } else {
        // At deeper recursion levels, just use the original algorithm
        for (let i = 0; i < currentPairs.length; i++) {
            const pair1 = currentPairs[i];
            
            // Skip pairs that have played together before if unused pairs exist
            if (relaxationLevel === 0 && unusedPairsExist && pair1.pairCount > 0) {
                continue;
            }
            
            const remainingForOpponents = players.filter(
                p => p !== pair1.player1 && p !== pair1.player2
            );

            const opponentPairs = generatePairs(remainingForOpponents);
            for (let j = 0; j < opponentPairs.length; j++) {
                const pair2 = opponentPairs[j];
                
                // Skip pairs that have played together before if unused pairs exist
                if (relaxationLevel === 0 && unusedPairsExist && pair2.pairCount > 0) {
                    continue;
                }
                
                const team1 = [pair1.player1, pair1.player2];
                const team2 = [pair2.player1, pair2.player2];

                if (isValidMatch(team1, team2, relaxationLevel)) {
                    const matchKey = generateMatchKey(team1, team2);
                    logDebugMessage(`Valid match found: ${matchKey} at relaxation level ${relaxationLevel}`);

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
                    removePairFromRecentHistory(pair1.pairKey);
                    removePairFromRecentHistory(pair2.pairKey);
                }
            }
        }
    }

    // If no valid matches can be formed at current level, try next level
    if (depth === 0) {
        if (relaxationLevel === 0) {
            logDebugMessage(`No valid matches found at level 0, trying level 1 (allow non-recent repeats)`);
            return tryFormMatches(players, maxMatches, 1, depth);
        } else if (relaxationLevel === 1) {
            logDebugMessage(`No valid matches found at level 1, trying level 2 (ignore opponent conflicts)`);
            return tryFormMatches(players, maxMatches, 2, depth);
        } else {
            logDebugMessage(`Failed to form matches even at max relaxation level ${relaxationLevel}`);
        }
    }
    
    return false; // Unable to form matches with current constraints
}

// New helper function to find optimal match configurations
function findOptimalMatchConfigurations(players, currentPairs, unusedPairsExist, relaxationLevel, possibleConfigurations, maxMatches) {
    // If there are fewer than 4 players or we've reached our max matches, this is a valid configuration
    if (players.length < 4 || possibleConfigurations.length >= 15) { // Increased from 10 to 15
        return;
    }
    
    // We'll generate multiple possible configurations by trying different starting pairs
    // We don't need to try all possible pairs, just a reasonable number of variations
    // If we're using unused pairs, we'll only consider those
    const pairsToTry = relaxationLevel === 0 && unusedPairsExist
        ? currentPairs.filter(pair => pair.pairCount === 0)
        : currentPairs;
    
    // Sort pairs to prioritize those containing players with the least partner variety first
    const sortedPairs = [...pairsToTry].sort((a, b) => {
        // Get unique partner counts for each player
        const a1Partners = a.player1.teammates ? Object.keys(a.player1.teammates).length : 0;
        const a2Partners = a.player2.teammates ? Object.keys(a.player2.teammates).length : 0;
        const b1Partners = b.player1.teammates ? Object.keys(b.player1.teammates).length : 0;
        const b2Partners = b.player2.teammates ? Object.keys(b.player2.teammates).length : 0;
        
        // Sort by the minimum partner count in each pair (prioritize pairs with players who have fewer partners)
        const aMinPartners = Math.min(a1Partners, a2Partners);
        const bMinPartners = Math.min(b1Partners, b2Partners);
        
        // If minimum counts are equal, sort by the sum of partner counts
        if (aMinPartners === bMinPartners) {
            return (a1Partners + a2Partners) - (b1Partners + b2Partners);
        }
        
        return aMinPartners - bMinPartners;
    });
    
    logDebugMessage(`Sorted pairs to prioritize players with least partner variety first`);
    
    // Use the sorted pairs instead of taking the first 6 from the original array
    for (let i = 0; i < Math.min(sortedPairs.length, 6); i++) {
        const pair1 = sortedPairs[i];
        
        const remainingForOpponents = players.filter(
            p => p !== pair1.player1 && p !== pair1.player2
        );
        
        const opponentPairs = generatePairs(remainingForOpponents);
        
        // Sort the opponent pairs by partner variety too
        const sortedOpponentPairs = [...opponentPairs].sort((a, b) => {
            // Get unique partner counts for each player
            const a1Partners = a.player1.teammates ? Object.keys(a.player1.teammates).length : 0;
            const a2Partners = a.player2.teammates ? Object.keys(a.player2.teammates).length : 0;
            const b1Partners = b.player1.teammates ? Object.keys(b.player1.teammates).length : 0;
            const b2Partners = b.player2.teammates ? Object.keys(b.player2.teammates).length : 0;
            
            // Sort by the minimum partner count in each pair
            const aMinPartners = Math.min(a1Partners, a2Partners);
            const bMinPartners = Math.min(b1Partners, b2Partners);
            
            // If minimum counts are equal, sort by the sum of partner counts
            if (aMinPartners === bMinPartners) {
                return (a1Partners + a2Partners) - (b1Partners + b2Partners);
            }
            
            return aMinPartners - bMinPartners;
        });
        
        // Try different opponent pairings for the current team
        for (let j = 0; j < Math.min(sortedOpponentPairs.length, 6); j++) {
            const pair2 = sortedOpponentPairs[j];
            
            // Skip pair2 if needed based on pair usage
            if (relaxationLevel === 0 && unusedPairsExist && pair2.pairCount > 0) {
                continue;
            }
            
            const team1 = [pair1.player1, pair1.player2];
            const team2 = [pair2.player1, pair2.player2];
            
            if (isValidMatch(team1, team2, relaxationLevel)) {
                // This is a valid first match, now recursively build the rest
                const potentialConfig = {
                    matches: [{ team1, team2 }],
                    usedPlayers: new Set([...team1, ...team2]),
                    score: 0 // Will calculate this later
                };
                
                // Continue with remaining players to build full config
                const remainingPlayers = players.filter(p => !potentialConfig.usedPlayers.has(p));
                
                // Try to form additional matches with remaining players
                if (remainingPlayers.length >= 4) {
                    const moreMatches = [];
                    const canFormRestOfMatches = buildRestOfConfig(
                        remainingPlayers, 
                        relaxationLevel,
                        unusedPairsExist,
                        moreMatches
                    );
                    
                    if (canFormRestOfMatches) {
                        // Add these matches to our configuration
                        potentialConfig.matches.push(...moreMatches);
                        
                        // Calculate the "versus balance" score for this configuration
                        potentialConfig.score = calculateVersusBalanceScore(potentialConfig.matches, players);
                        
                        // Add this configuration to our list
                        possibleConfigurations.push(potentialConfig);
                        
                        logDebugMessage(`Found valid configuration with ${potentialConfig.matches.length} matches and score ${potentialConfig.score}`);
                        
                        // If we have enough configurations, stop here to avoid too much computation
                        if (possibleConfigurations.length >= 15) {
                            return;
                        }
                    }
                } else if (potentialConfig.matches.length >= maxMatches || remainingPlayers.length < 4) {
                    // This is a valid configuration with no more matches possible
                    potentialConfig.score = calculateVersusBalanceScore(potentialConfig.matches, players);
                    possibleConfigurations.push(potentialConfig);
                    
                    logDebugMessage(`Found valid configuration with ${potentialConfig.matches.length} matches and score ${potentialConfig.score}`);
                }
            }
        }
    }
}

// Helper to build the rest of a configuration
function buildRestOfConfig(players, relaxationLevel, unusedPairsExist, resultMatches) {
    if (players.length < 4) return true; // Successfully formed all possible matches
    
    const pairs = generatePairs(players);
    
    // Sort pairs to prioritize those containing players with the least partner variety first
    const sortedPairs = [...pairs].sort((a, b) => {
        // Get unique partner counts for each player
        const a1Partners = a.player1.teammates ? Object.keys(a.player1.teammates).length : 0;
        const a2Partners = a.player2.teammates ? Object.keys(a.player2.teammates).length : 0;
        const b1Partners = b.player1.teammates ? Object.keys(b.player1.teammates).length : 0;
        const b2Partners = b.player2.teammates ? Object.keys(b.player2.teammates).length : 0;
        
        // Sort by the minimum partner count in each pair (prioritize pairs with players who have fewer partners)
        const aMinPartners = Math.min(a1Partners, a2Partners);
        const bMinPartners = Math.min(b1Partners, b2Partners);
        
        // If minimum counts are equal, sort by the sum of partner counts
        if (aMinPartners === bMinPartners) {
            return (a1Partners + a2Partners) - (b1Partners + b2Partners);
        }
        
        return aMinPartners - bMinPartners;
    });
    
    for (let i = 0; i < sortedPairs.length; i++) {
        const pair1 = sortedPairs[i];
        
        // Skip pairs based on usage if necessary
        if (relaxationLevel === 0 && unusedPairsExist && pair1.pairCount > 0) {
            continue;
        }
        
        const remainingForOpponents = players.filter(
            p => p !== pair1.player1 && p !== pair1.player2
        );
        
        const opponentPairs = generatePairs(remainingForOpponents);
        
        // Sort opponent pairs by partner variety too
        const sortedOpponentPairs = [...opponentPairs].sort((a, b) => {
            // Get unique partner counts for each player
            const a1Partners = a.player1.teammates ? Object.keys(a.player1.teammates).length : 0;
            const a2Partners = a.player2.teammates ? Object.keys(a.player2.teammates).length : 0;
            const b1Partners = b.player1.teammates ? Object.keys(b.player1.teammates).length : 0;
            const b2Partners = b.player2.teammates ? Object.keys(b.player2.teammates).length : 0;
            
            // Sort by the minimum partner count in each pair
            const aMinPartners = Math.min(a1Partners, a2Partners);
            const bMinPartners = Math.min(b1Partners, b2Partners);
            
            // If minimum counts are equal, sort by the sum of partner counts
            if (aMinPartners === bMinPartners) {
                return (a1Partners + a2Partners) - (b1Partners + b2Partners);
            }
            
            return aMinPartners - bMinPartners;
        });
        
        for (let j = 0; j < sortedOpponentPairs.length; j++) {
            const pair2 = sortedOpponentPairs[j];
            
            // Skip pairs based on usage if necessary
            if (relaxationLevel === 0 && unusedPairsExist && pair2.pairCount > 0) {
                continue;
            }
            
            const team1 = [pair1.player1, pair1.player2];
            const team2 = [pair2.player1, pair2.player2];
            
            if (isValidMatch(team1, team2, relaxationLevel)) {
                // Add this match to our results
                resultMatches.push({ team1, team2 });
                
                // Continue with remaining players
                const usedPlayers = [...team1, ...team2];
                const remainingPlayers = players.filter(p => !usedPlayers.includes(p));
                
                // Try to form additional matches
                if (buildRestOfConfig(remainingPlayers, relaxationLevel, unusedPairsExist, resultMatches)) {
                    return true; // Success
                }
                
                // Backtrack
                resultMatches.pop();
            }
        }
    }
    
    return players.length < 4; // Success only if we've used all players that can form a match
}

// Calculate a score representing how balanced the "versus" relationships are
// Lower score = better balance
function calculateVersusBalanceScore(matches, allPlayers) {
    // Create a versus matrix simulation
    const versusMatrix = {};
    
    // Initialize the matrix with current versus counts
    for (const player of allPlayers) {
        versusMatrix[player.name] = {};
        
        for (const otherPlayer of allPlayers) {
            if (player.name !== otherPlayer.name) {
                // Start with current versus count
                const currentCount = player.versus?.[otherPlayer.name] || 0;
                versusMatrix[player.name][otherPlayer.name] = currentCount;
            }
        }
    }
    
    // Create a set to track unique pair keys in this configuration
    const configPairs = new Set();
    
    // Add the new matches to our simulation
    for (const match of matches) {
        // Track team pairs
        const team1Key = generatePairKey(match.team1[0], match.team1[1]);
        const team2Key = generatePairKey(match.team2[0], match.team2[1]);
        configPairs.add(team1Key);
        configPairs.add(team2Key);
        
        // Update versus relationships
        for (const team1Player of match.team1) {
            for (const team2Player of match.team2) {
                versusMatrix[team1Player.name][team2Player.name] = (versusMatrix[team1Player.name][team2Player.name] || 0) + 1;
                versusMatrix[team2Player.name][team1Player.name] = (versusMatrix[team2Player.name][team1Player.name] || 0) + 1;
            }
        }
    }
    
    // Calculate our balance metrics
    let maxDiff = 0;  // Maximum difference between any two versus counts
    let variance = 0; // Variance in versus counts
    let maxCount = 0; // Maximum versus count between any two players
    
    // Get all unique versus counts
    const allCounts = [];
    
    for (const playerName in versusMatrix) {
        for (const opponentName in versusMatrix[playerName]) {
            const count = versusMatrix[playerName][opponentName];
            allCounts.push(count);
            
            if (count > maxCount) {
                maxCount = count;
            }
        }
    }
    
    // Calculate the standard deviation/variance of the counts
    const sum = allCounts.reduce((a, b) => a + b, 0);
    const mean = sum / allCounts.length;
    variance = allCounts.reduce((s, c) => s + Math.pow(c - mean, 2), 0) / allCounts.length;
    
    // Calculate max difference between counts
    for (let i = 0; i < allCounts.length; i++) {
        for (let j = i + 1; j < allCounts.length; j++) {
            const diff = Math.abs(allCounts[i] - allCounts[j]);
            if (diff > maxDiff) {
                maxDiff = diff;
            }
        }
    }
    
    // Count how many repeat pairs we have in this configuration
    const repeatPairPenalty = calculateRepeatPairPenalty(configPairs, allPlayers);
    
    // Combine the metrics into a single score
    // We weight the max count most heavily, then max difference, then variance, plus penalty for repeat pairs
    return maxCount * 100 + maxDiff * 10 + variance + repeatPairPenalty * 1000; // Heavy penalty for repeat pairs
}

// Helper function to calculate a penalty for repeat pairs
function calculateRepeatPairPenalty(configPairs, allPlayers) {
    let repeatPairCount = 0;
    
    // For each pair in the configuration, check if they've played together before
    for (const pairKey of configPairs) {
        const [name1, name2] = pairKey.split('-');
        const player1 = allPlayers.find(p => p.name === name1);
        const player2 = allPlayers.find(p => p.name === name2);
        
        if (player1 && player2) {
            // Check if these players have been teammates before
            if (player1.teammates && player1.teammates[player2.name]) {
                repeatPairCount++;
            }
        }
    }
    
    return repeatPairCount;
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

    // Step 2: Check if ALL possible pairs have been used at least once
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
            
            // Calculate average opponent count for each player in the pair against all others
            const player1OpponentCounts = [];
            const player2OpponentCounts = [];
            
            // Get all opponents for player1
            for (const otherPlayer of players) {
                if (otherPlayer !== player1 && otherPlayer !== player2) {
                    const count = player1.versus?.[otherPlayer.name] || 0;
                    player1OpponentCounts.push(count);
                }
            }
            
            // Get all opponents for player2
            for (const otherPlayer of players) {
                if (otherPlayer !== player1 && otherPlayer !== player2) {
                    const count = player2.versus?.[otherPlayer.name] || 0;
                    player2OpponentCounts.push(count);
                }
            }
            
            // Get opponent count between the players in this potential pair
            const pairOpponentCount = player1.versus?.[player2.name] || 0;
            
            potentialPairs.push({
                player1,
                player2,
                pairKey,
                pairCount,
                isRecentPair,
                pairOpponentCount
            });
        }
    }
    
    // Step 3: Prioritize unused pairs FIRST, before any other consideration
    const unusedPairs = potentialPairs.filter(pair => pair.pairCount === 0);
    
    // If we have any unused pairs, ONLY use those
    if (unusedPairs.length > 0) {
        logDebugMessage(`Found ${unusedPairs.length} pairs at relaxation level 0 (never paired before)`);
        // Sort them by their opponent count (preferring lowest first)
        const sortedUnusedPairs = unusedPairs.sort((a, b) => a.pairOpponentCount - b.pairOpponentCount);
        pairs.push(...sortedUnusedPairs);
        return pairs; // Only return never-paired combinations
    }
    
    // Group potential pairs by their opponent count
    const pairsByOpponentCount = {};
    for (const pair of potentialPairs) {
        if (!pairsByOpponentCount[pair.pairOpponentCount]) {
            pairsByOpponentCount[pair.pairOpponentCount] = [];
        }
        pairsByOpponentCount[pair.pairOpponentCount].push(pair);
    }
    
    // Get sorted counts of opponent pairs (from lowest to highest)
    const sortedOpponentCounts = Object.keys(pairsByOpponentCount)
                                   .map(Number)
                                   .sort((a, b) => a - b);
                                   
    logDebugMessage(`Found opponent count groups: ${sortedOpponentCounts.join(', ')}`);
    
    // We'll collect pairs in order of their opponent count
    const orderedPairs = [];
    
    // First collect all pairs that aren't recent
    for (const count of sortedOpponentCounts) {
        const pairsWithThisCount = pairsByOpponentCount[count];
        // Filter for not recent pairs and sort by pairCount (least paired)
        const notRecentPairs = pairsWithThisCount
            .filter(pair => !pair.isRecentPair)
            .sort((a, b) => a.pairCount - b.pairCount);
            
        if (notRecentPairs.length > 0) {
            logDebugMessage(`Found ${notRecentPairs.length} non-recent pairs with opponent count ${count}`);
            orderedPairs.push(...notRecentPairs);
        }
    }
    
    // If we have any valid pairs that aren't recent, use them
    if (orderedPairs.length > 0) {
        logDebugMessage(`Using ${orderedPairs.length} pairs sorted by opponent count`);
        pairs.push(...orderedPairs);
        return pairs;
    }
    
    // Fall back: if all pairs are recent, just use the ones with lowest opponent count
    // and lowest pairCount
    for (const count of sortedOpponentCounts) {
        const pairsWithThisCount = pairsByOpponentCount[count]
            .sort((a, b) => a.pairCount - b.pairCount);
            
        if (pairsWithThisCount.length > 0) {
            logDebugMessage(`Fallback: Using ${pairsWithThisCount.length} pairs with opponent count ${count}`);
            pairs.push(...pairsWithThisCount);
            break; // Just take the lowest count group
        }
    }

    logDebugMessage(`Generated ${pairs.length} valid pairs using sorted opponent counts`);
    return pairs;
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
        console.error("No matches to display");
        
        // Try to create an empty round container with a message
        const matchDisplay = document.getElementById('matchDisplay');
        currentRound++; // Still increment the round counter
        
        // Create a container for this round
        const roundContainer = document.createElement('div');
        roundContainer.classList.add('round-container');
        roundContainer.setAttribute('data-round', currentRound);
        
        // Create a header for the round
        const roundHeader = document.createElement('h3');
        roundHeader.textContent = `Round ${currentRound}`;
        roundContainer.appendChild(roundHeader);
        
        // Add a message
        const noMatchesMessage = document.createElement('div');
        noMatchesMessage.classList.add('no-matches-message');
        noMatchesMessage.textContent = "Could not generate any valid matches. Consider adding more players or resetting match history.";
        roundContainer.appendChild(noMatchesMessage);
        
        // Still add "Add Match" button
        const addMatchButton = document.createElement('button');
        addMatchButton.textContent = 'Add Match';
        addMatchButton.classList.add('add-match-btn');
        addMatchButton.addEventListener('click', () => {
            addMatch(roundContainer, sitOutPlayers);
        });
        roundContainer.appendChild(addMatchButton);
        
        // Add the round container to the display
        matchDisplay.appendChild(roundContainer);
        
        // Show a toast notification
        showToast("No valid matches could be created. Consider adding more players or resetting the pairing history.", "warning", 5000);
        
        return;
    }

    const matchDisplay = document.getElementById('matchDisplay');
    currentRound++; // Increment the round counter

    // Create a container for this round
    const roundContainer = document.createElement('div');
    roundContainer.classList.add('round-container');
    roundContainer.setAttribute('data-round', currentRound);

    // Create a header for the round
    const roundHeader = document.createElement('h3');
    roundHeader.textContent = `Round ${currentRound}`;
    roundContainer.appendChild(roundHeader);

    // Add Edit Round button
    const editRoundButton = document.createElement('button');
    editRoundButton.textContent = 'Edit Round';
    editRoundButton.classList.add('edit-round-btn');
    editRoundButton.addEventListener('click', () => {
        toggleEditRound(roundContainer, editRoundButton);
    });
    roundContainer.appendChild(editRoundButton);

    // Add "Add Match" button
    const addMatchButton = document.createElement('button');
    addMatchButton.textContent = 'Add Match';
    addMatchButton.classList.add('add-match-btn');
    addMatchButton.addEventListener('click', () => {
        addMatch(roundContainer, sitOutPlayers);
    });
    roundContainer.appendChild(addMatchButton);

    // Check if this round has scores already (for restored rounds)
    const hasScoresSubmitted = matches.some(match => 
        (typeof match.team1Score !== 'undefined' && match.team1Score !== null) || 
        (typeof match.team2Score !== 'undefined' && match.team2Score !== null)
    );

    // Hide the Add Match button if scores have been submitted
    if (hasScoresSubmitted) {
        addMatchButton.style.display = 'none';
    }

    // Display sitOutPlayers
    updateSitOutDisplayForRound(roundContainer, sitOutPlayers);

    // Add the round container to display before adding matches
    matchDisplay.appendChild(roundContainer);

    // Loop through matches and create UI for each
    matches.forEach((match, index) => {
        // Validate match structure
        if (!match.team1 || !match.team2 || !Array.isArray(match.team1) || !Array.isArray(match.team2) ||
            match.team1.length !== 2 || match.team2.length !== 2) {
            console.error("Invalid match structure:", match);
            return;
        }
        
        const matchDiv = document.createElement('div');
        matchDiv.classList.add('match');
        matchDiv.setAttribute('data-match', index);
        
        // Add match title with match-title class
        const matchTitle = document.createElement('p');
        matchTitle.innerHTML = `<span class="match-title">Match ${index + 1}</span>`;
        matchDiv.appendChild(matchTitle);

        // Add team 1
        const team1Div = document.createElement('div');
        team1Div.classList.add('team');
        team1Div.setAttribute('data-team', '1');

        // Add team 1 players
        const team1Players = document.createElement('p');

        const team1Key = generatePairKey(match.team1[0], match.team1[1]);
        
        // Add to tracking
        if (team1Key) pairTracker.globalPairs.add(team1Key);
        addPairToRecentHistory(team1Key);
        
        // Team 1 inner HTML
        team1Players.innerHTML = `Team 1: ${match.team1.map(player => 
            `<span class="team1-player">${player.name}</span>`
        ).join(' & ')}`;
        
        team1Div.appendChild(team1Players);

        // Add scores for team 1
        const team1Score = document.createElement('label');
        team1Score.textContent = 'Score: ';
        
        // If scores exist (for restored rounds), use them
        let team1ScoreValue = '';
        let team2ScoreValue = '';
        
        if (hasScoresSubmitted && match.team1Score !== undefined) {
            team1ScoreValue = match.team1Score;
        }
        
        if (hasScoresSubmitted && match.team2Score !== undefined) {
            team2ScoreValue = match.team2Score;
        }
        
        // For restored rounds with scores, display score as read-only
        if (hasScoresSubmitted && (match.team1Score !== undefined || match.team2Score !== undefined)) {
            const team1ScoreDisplay = document.createElement('p');
            team1ScoreDisplay.className = 'score-display';
            team1ScoreDisplay.textContent = `Score: ${team1ScoreValue}`;
            team1Div.appendChild(team1ScoreDisplay);
        } else {
            // Regular input for new rounds or rounds without scores
            const team1ScoreInput = document.createElement('input');
            team1ScoreInput.type = 'text';
            team1ScoreInput.inputMode = 'numeric';
            team1ScoreInput.pattern = '[0-9]*';
            team1ScoreInput.className = 'team-score';
            team1ScoreInput.setAttribute('data-team', '1');
            team1ScoreInput.value = team1ScoreValue;
            team1Score.appendChild(team1ScoreInput);
            team1Div.appendChild(team1Score);
        }
        
        matchDiv.appendChild(team1Div);

        // Add team 2
        const team2Div = document.createElement('div');
        team2Div.classList.add('team');
        team2Div.setAttribute('data-team', '2');

        // Add team 2 players
        const team2Players = document.createElement('p');
        
        const team2Key = generatePairKey(match.team2[0], match.team2[1]);
        
        // Add to tracking
        if (team2Key) pairTracker.globalPairs.add(team2Key);
        addPairToRecentHistory(team2Key);
        
        // Team 2 inner HTML
        team2Players.innerHTML = `Team 2: ${match.team2.map(player => 
            `<span class="team2-player">${player.name}</span>`
        ).join(' & ')}`;
        
        team2Div.appendChild(team2Players);

        // Add scores for team 2
        if (hasScoresSubmitted && (match.team1Score !== undefined || match.team2Score !== undefined)) {
            const team2ScoreDisplay = document.createElement('p');
            team2ScoreDisplay.className = 'score-display';
            team2ScoreDisplay.textContent = `Score: ${team2ScoreValue}`;
            team2Div.appendChild(team2ScoreDisplay);
        } else {
            const team2Score = document.createElement('label');
            team2Score.textContent = 'Score: ';
            
            const team2ScoreInput = document.createElement('input');
            team2ScoreInput.type = 'text';
            team2ScoreInput.inputMode = 'numeric';
            team2ScoreInput.pattern = '[0-9]*';
            team2ScoreInput.className = 'team-score';
            team2ScoreInput.setAttribute('data-team', '2');
            team2ScoreInput.value = team2ScoreValue;
            team2Score.appendChild(team2ScoreInput);
            team2Div.appendChild(team2Score);
        }
        
        matchDiv.appendChild(team2Div);

        // Add the match key to track this match combo
        const matchKey = generateMatchKey(match.team1, match.team2);
        if (matchKey) {
            matchHistory.add(matchKey);
            updateMatchPlayCounter(matchKey);
            // For previous matches we also need to track to avoid immediate repeats
            previousRoundMatches.add(matchKey);
        }

        // Add skip match button for rounds that don't have scores yet
        if (!hasScoresSubmitted) {
            const skipButton = document.createElement('button');
            skipButton.textContent = 'Skip Match';
            skipButton.classList.add('skip-match-btn');
            skipButton.addEventListener('click', function() {
                showConfirm(
                    'ARE YOU SURE YOU WANT TO SKIP THIS MATCH? PLAYERS WILL BE ELIGIBLE FOR OTHER MATCHES THIS ROUND.',
                    'SKIP',
                    'Cancel',
                    'warning'
                ).then(confirmation => {
                    if (!confirmation) return;

                    // Mark match as skipped
                    skipButton.parentNode.parentNode.setAttribute('data-skipped', 'true');
                    skipButton.parentNode.parentNode.classList.add('skipped-match');
                    
                    // Hide the match div
                    skipButton.parentNode.parentNode.style.display = 'none';

                    // Get all players involved in this match
                    const skipPlayers = [...match.team1, ...match.team2];
                    
                    // Update player eligibility status - mark them as ineligible and sitting out
                    skipPlayers.forEach(player => {
                        player.eligible = false;
                        player.satOutLastRound = true;
                        
                        // Remove player if already in sitOutPlayers to prevent duplicates
                        const existingIndex = sitOutPlayers.findIndex(p => p.name === player.name);
                        if (existingIndex >= 0) {
                            sitOutPlayers.splice(existingIndex, 1);
                        }
                        
                        // Add player to sitOutPlayers
                        sitOutPlayers.push(player);
                        logDebugMessage(`Player ${player.name} marked ineligible and sitting out after match skip`);
                    });
                    
                    // Remove from match tracking
                    const matchKey = generateMatchKey(match.team1, match.team2);
                    if (matchHistory.has(matchKey)) {
                        matchHistory.delete(matchKey);
                        logDebugMessage(`Removed match ${matchKey} from match history.`);
                    }
                    
                    // Remove from previousRoundMatches to allow this match in future rounds
                    if (previousRoundMatches.has(matchKey)) {
                        previousRoundMatches.delete(matchKey);
                        logDebugMessage(`Removed match ${matchKey} from previous round matches.`);
                    }
                    
                    // Remove from recent history
                    removePairFromRecentHistory(team1Key);
                    removePairFromRecentHistory(team2Key);
                    
                    // Also directly remove from previousRoundPairs in pairTracker
                    if (pairTracker.previousRoundPairs.has(team1Key)) {
                        pairTracker.previousRoundPairs.delete(team1Key);
                        logDebugMessage(`Directly removed Team 1 pair ${team1Key} from previous round pairs.`);
                    }
                    
                    if (pairTracker.previousRoundPairs.has(team2Key)) {
                        pairTracker.previousRoundPairs.delete(team2Key);
                        logDebugMessage(`Directly removed Team 2 pair ${team2Key} from previous round pairs.`);
                    }
                    
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
            
            // Add the skip button to the match title instead of to the matchDiv directly
            matchTitle.appendChild(skipButton);
        }

        roundContainer.appendChild(matchDiv);
    });

    // Only add "Submit Scores" button if the round doesn't have scores submitted yet
    if (!hasScoresSubmitted) {
        const addSubmitScoresButton = document.createElement('button');
        addSubmitScoresButton.textContent = 'Submit Scores';
        addSubmitScoresButton.classList.add('submit-scores-btn');
        addSubmitScoresButton.addEventListener('click', () => submitScores());
        roundContainer.appendChild(addSubmitScoresButton);
    }

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
        
        // Check if the round is in edit mode - either by selector or by class
        const isInEditMode = roundContainer.querySelector('.player-selector') !== null || roundContainer.classList.contains('edit-mode');
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
            } else {
                // If we're in edit mode but can't automatically save, prevent submission
                showToast("Please save or cancel your edits before submitting scores.", "warning");
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
            if (skipButton) {
                // The skip button is now in the match title
                skipButton.remove();
            }
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
        
        // Update button text
        updateStartTournamentButtonText();
        
        // Always hide bottom continue button after submitting scores
        const bottomContinueContainer = document.getElementById('bottomContinueContainer');
        if (bottomContinueContainer) {
            bottomContinueContainer.style.display = 'none';
        }
        
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
    
    // Update button text
    updateStartTournamentButtonText();
    
    // Add a slight delay to ensure the new round is fully rendered before scrolling
    setTimeout(() => {
        scrollToCurrentRound();
    }, 300);
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
        showToast("Need at least 4 eligible players to create a match", "error");
        return;
    }

    const sitOutPlayers = determineSitOuts();
    const playingPlayers = eligiblePlayers.filter(player => !sitOutPlayers.includes(player));
    const usableCourts = Math.floor(playingPlayers.length / 4); // Determine actual court usage
    
    if (usableCourts === 0) {
        logDebugMessage("Not enough players available after determining sit-outs");
        showToast("Not enough eligible players after determining sit-outs", "error");
        return;
    }

    // First attempt at creating matches
    let teams = createMatchesForRound(playingPlayers, Math.min(usableCourts, maxMatches));
    
    // If no matches were generated on first try, reset history and try again with more relaxed constraints
    if (teams.length === 0) {
        logDebugMessage("No matches generated on first attempt. Resetting history and retrying.");
        
        // Clear previous round matches to enable match formation
        previousRoundMatches.clear();
        
        // Reset pair history to allow more flexibility
        resetPairAndMatchHistory();
        
        // Try again with the same eligible players
        teams = createMatchesForRound(playingPlayers, Math.min(usableCourts, maxMatches));
        
        // If still no matches, try with even more aggressive reset
        if (teams.length === 0) {
            logDebugMessage("Still no matches generated. Using emergency reset and retry.");
            
            // Reset extended history to allow any pairing
            pairTracker.resetAll();
            
            // One last attempt
            teams = createMatchesForRound(playingPlayers, Math.min(usableCourts, maxMatches));
        }
    }
    
    // Even if teams is still empty, appendMatchDisplay will handle this case
    appendMatchDisplay(teams, sitOutPlayers);
    autoSave();
}


function playRound() {
    // Check if there are any unsubmitted rounds
    const lastRoundContainer = document.querySelector('.round-container:last-child');
    
    if (lastRoundContainer) {
        const hasSubmitButton = lastRoundContainer.querySelector('.submit-scores-btn');
        
        if (hasSubmitButton) {
            // If there's a submit button, we need to handle this round first
            showToast("Please submit scores for the current round before starting a new one.", "warning");
            // Scroll to the unsubmitted round
            lastRoundContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        // If there's no submit button, it means all rounds are completed
        // We should generate a new round
    }

    // Begin a new round
    // Reset currentRound if this is a start of a tournament
    if (currentRound === 0 || isFirstRound) {
        isFirstRound = false;
    } else {
        // This is a continuation of an existing tournament
        // We don't reset currentRound here as appendMatchDisplay will increment it
    }
    
    // Initialize pair tracking for the new round
    pairTracker.startNewRound();
    
    // Reset previous round pairs to ensure matches can be formed
    // This is important when we've loaded existing data
    resetPreviousRoundPairs();
    
    // Clear previous round matches - crucial for enabling new match generation
    previousRoundMatches.clear();
    
    // Hide bottom continue button when creating a new round
    const bottomContinueContainer = document.getElementById('bottomContinueContainer');
    if (bottomContinueContainer) {
        bottomContinueContainer.style.display = 'none';
    }
    
    generatePairsAndMatches();
    autoSave();
    
    // Add a slight delay to ensure the round is fully rendered before scrolling
    setTimeout(() => {
        scrollToCurrentRound();
    }, 300);
}

function updateVersus(player, opponent) {
    // Ensure the player and opponent are valid objects
    if (!player || !opponent || typeof player !== 'object' || typeof opponent !== 'object') {
        console.error("Invalid player or opponent in updateVersus:", { player, opponent });
        return;
    }
    
    // Ensure player name exists
    if (!player.name || !opponent.name) {
        console.error("Player or opponent missing name in updateVersus:", { 
            playerName: player.name, 
            opponentName: opponent.name 
        });
        return;
    }
    
    // Initialize versus object if undefined
    if (!player.versus) {
        player.versus = {}; 
    }
    
    const name = opponent.name;
    player.versus[name] = (player.versus[name] || 0) + 1; // Increment count or initialize
    
    // Log for debugging
    logDebugMessage(`Updated versus relationship: ${player.name} vs ${opponent.name} (count: ${player.versus[name]})`);
}


// Update teammates count without resetting and move the most recent addition to the end
function updateTeammates(player, teammate) {
    // Ensure the player and teammate are valid objects
    if (!player || !teammate || typeof player !== 'object' || typeof teammate !== 'object') {
        console.error("Invalid player or teammate in updateTeammates:", { player, teammate });
        return;
    }
    
    // Ensure player name exists
    if (!player.name || !teammate.name) {
        console.error("Player or teammate missing name in updateTeammates:", { 
            playerName: player.name, 
            teammateName: teammate.name 
        });
        return;
    }
    
    // Initialize teammates object if undefined
    if (!player.teammates) {
        player.teammates = {}; 
    }
    
    const name = teammate.name;
    player.teammates[name] = (player.teammates[name] || 0) + 1; // Increment count or initialize
    
    // Log for debugging
    logDebugMessage(`Updated teammate relationship: ${player.name} with ${teammate.name} (count: ${player.teammates[name]})`);
}


function showPodium() {
    console.log("showPodium function called");
    
    displayCurrentDate();
    
    const podiumDisplay = document.getElementById('podiumDisplay');
    console.log("podiumDisplay element found:", !!podiumDisplay);
    
    if (podiumDisplay) {
        // Make sure display style is set first before adding active class
        podiumDisplay.style.display = 'flex'; // Use flex for better layout
        podiumDisplay.style.visibility = 'visible';
        podiumDisplay.style.opacity = '1';
        podiumDisplay.style.zIndex = '2000'; // Ensure it's above other content
        
        // Then add active class
        podiumDisplay.classList.add('active');
        console.log("Added 'active' class to podiumDisplay");
        
        // Ensure the table element exists
        const playerStatsTable = document.getElementById('playerStatsTable');
        if (!playerStatsTable) {
            console.error("playerStatsTable element not found");
            
            // Create the table if it doesn't exist
            const tableWrapper = document.createElement('div');
            tableWrapper.className = 'table-wrapper';
            
            const table = document.createElement('table');
            table.id = 'playerStatsTable';
            
            tableWrapper.appendChild(table);
            podiumDisplay.appendChild(tableWrapper);
            
            console.log("Created missing playerStatsTable element");
        } else {
            // Reset and ensure proper table styles even if table exists

            
            // Also ensure the wrapper has proper styles
            const tableWrapper = playerStatsTable.closest('.table-wrapper');
           
        }
        
        // Set default active sort button
        setDefaultActiveSortButton();
    
        // Sort and display by Victory Points - with error handling
        try {
            // Create a defensive copy of players array
            const playersCopy = Array.isArray(players) ? [...players] : [];
            
            
            // Ensure we have a valid array to sort
            if (playersCopy.length === 0) {
                console.warn("No players found to display on podium");
            }
            
            // Sort the players safely
            const sortedPlayers = sortByVictoryPoints(playersCopy);
            
            // Display the podium and stats table
            displayPodium(sortedPlayers);
            displayPlayerStatsTable(sortedPlayers);
            
            // Ensure that any photo-capture-mode class is removed
            podiumDisplay.classList.remove('photo-capture-mode');
        } catch (error) {
            console.error("Error displaying podium:", error);
        }
    } else {
        console.error("podiumDisplay element not found");
    }
    
    console.log("Podium display should now be visible");
}

// Display the top 3 players on the podium
function displayPodium(sortedPlayers) {
    // Add safety checks for all elements
    const goldElement = document.getElementById('gold');
    const silverElement = document.getElementById('silver');
    const bronzeElement = document.getElementById('bronze');
    
    // Only set content if elements exist
    if (goldElement) {
        goldElement.textContent = sortedPlayers[0]?.name || '';
    }
    if (silverElement) {
        silverElement.textContent = sortedPlayers[1]?.name || '';
    }
    if (bronzeElement) {
        bronzeElement.textContent = sortedPlayers[2]?.name || '';
    }
    
    console.log(`Podium displayed with ${sortedPlayers.length} players. Gold: ${sortedPlayers[0]?.name || 'N/A'}`);
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
    // Safety check for players array
    if (!Array.isArray(players)) {
        console.error("sortPlayers received non-array input:", players);
        return [];
    }
    
    // Make a defensive copy of the array
    const playersCopy = [...players];
    
    // Get sort configuration
    const config = sortConfigs[sortMethod];
    if (!config) {
        console.warn(`sortPlayers: Unknown sort method '${sortMethod}', using default sort.`);
        return playersCopy;
    }
    
    try {
        return playersCopy.sort((a, b) => {
            // Safety checks for player objects
            if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
                console.warn("sortPlayers encountered invalid player objects", {a, b});
                return 0; // Keep relative order unchanged
            }
            
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
    } catch (error) {
        console.error("Error during player sorting:", error);
        return playersCopy; // Return unsorted copy in case of error
    }
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
    // Make sure we're working with a valid array
    if (!Array.isArray(players)) {
        console.error('sortByVictoryPoints received invalid input:', players);
        return [];
    }
    
    try {
        return sortPlayers(players, 'victoryPoints');
    } catch (error) {
        console.error('Error in sortByVictoryPoints:', error);
        // Return a copy of the original array as fallback
        return [...players];
    }
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
    // Use the exact same code from autoSave to create the state object
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

    // Save to file instead of localStorage
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
    
    // Log export information
    console.log("Tournament data exported. Player statuses:");
    players.forEach(player => {
        const statusValue = player.manualSitOut ? "Sitting Out" : "Active";
        console.log(`Player: ${player.name}, Eligible: ${player.eligible}, Manual Sit-Out: ${player.manualSitOut}, Sat Out Last Round: ${player.satOutLastRound}, Status: ${statusValue}`);
    });
    
    // Add success toast
    showToast('Tournament data exported successfully', 'success', 3000);
}

function importData() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                console.log("===== IMPORT DATA BEGIN =====", new Date().toISOString());
                console.time('Import data duration');
                
                // Use the exact same restoration logic as restoreState but with file data
                const fileData = e.target.result;
                if (fileData) {
                    try {
                        const parsedState = JSON.parse(fileData);
                        console.log(`Found imported data with ${parsedState.matches ? parsedState.matches.length : 0} matches`);
                        
                        // Restore players
                        players.length = 0;
                        players.push(...(parsedState.players || []).map(player => ({
                            ...player, // Ensure all properties are restored
                        })));
                        console.log(`Restored ${players.length} players`);

                        // Restore other data
                        matches.length = 0;
                        matches.push(...(parsedState.matches || []));
                        console.log(`Restored ${matches.length} matches`);
                        
                        // Get the highest round number from matches to set currentRound correctly
                        currentRound = parsedState.currentRound || 0;
                        if (matches.length > 0) {
                            const maxRoundInMatches = Math.max(...matches.map(m => m.round || 0));
                            // Set currentRound to at least the highest round number in matches
                            currentRound = Math.max(currentRound, maxRoundInMatches);
                        }
                        console.log(`Current round set to: ${currentRound}`);
                        
                        isFirstRound = parsedState.isFirstRound !== undefined ? parsedState.isFirstRound : true;

                        // Reset and restore pair tracker data
                        pairTracker.resetAll();
                        
                        // Restore pair tracking data
                        if (parsedState.pairCounts) {
                            // Reset and assign fresh object
                            pairTracker.pairCounts = {};
                            Object.assign(pairTracker.pairCounts, parsedState.pairCounts);
                        }
                        
                        if (parsedState.previousRoundPairs) {
                            pairTracker.previousRoundPairs = new Set(parsedState.previousRoundPairs);
                        }
                        
                        if (parsedState.recentRounds) {
                            pairTracker.recentRounds = parsedState.recentRounds.map(roundArray => 
                                new Set(roundArray)
                            );
                        }
                        
                        if (parsedState.globalPairs) {
                            pairTracker.globalPairs = new Set(parsedState.globalPairs);
                        }
                        
                        // Support for legacy format
                        if (parsedState.extendedPairHistory && !parsedState.pairCounts) {
                            pairTracker.pairCounts = {};
                            Object.assign(pairTracker.pairCounts, parsedState.extendedPairHistory);
                        }
                        
                        if (parsedState.globalPairHistory && !parsedState.globalPairs) {
                            pairTracker.globalPairs = new Set(parsedState.globalPairHistory);
                        }
                        
                        if (parsedState.recentPairHistory && !parsedState.recentRounds) {
                            pairTracker.recentRounds = parsedState.recentPairHistory.map(roundArray => 
                                new Set(roundArray)
                            );
                        }
                        
                        // Restore previous round matches
                        previousRoundMatches.clear();
                        if (parsedState.previousRoundMatches) {
                            parsedState.previousRoundMatches.forEach(match => previousRoundMatches.add(match));
                            logDebugMessage(`Restored ${previousRoundMatches.size} previous round matches`);
                        }
                        
                        // Ensure the pair tracking has a current round initialized
                        if (pairTracker.recentRounds.length === 0) {
                            pairTracker.startNewRound();
                            logDebugMessage("Initialized round tracking after restore");
                        }

                        // Restore match history and counter
                        matchHistory.clear();
                        (parsedState.matchHistory || []).forEach(item => matchHistory.add(item));

                        Object.keys(matchPlayCounter).forEach(key => delete matchPlayCounter[key]);
                        Object.assign(matchPlayCounter, parsedState.matchPlayCounter || {});

                        console.log("Players after adding:", players);
                        
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
                        
                        // Update bottom continue button visibility
                        updateBottomContinueButton();
                        
                        // Update the button text based on restored state
                        updateStartTournamentButtonText();
                        
                        // Check if matches have been played and show podium
                        if (matches && matches.length > 0) {
                            showPodium();
                        }
                        
                        // Save to localStorage
                        autoSave();
                        
                        // Log success message
                        logDebugMessage("File data imported successfully");
                        showToast("Tournament data imported successfully", "success");
                    } catch (error) {
                        console.error("Error restoring state from file:", error);
                        showToast("There was an error importing your data. The file may be corrupted.", "error", 6000);
                        localStorage.removeItem('hasReloaded');
                        return;
                    }
                } else {
                    console.error("No data found in the imported file");
                    showToast("The imported file contains no valid data", "error", 4000);
                    localStorage.removeItem('hasReloaded');
                    return;
                }

                console.timeEnd('Import data duration');
                console.log("===== IMPORT DATA END =====");
                
                // Reload the page to ensure proper display
                console.log("Setting hasReloaded flag to true and reloading for proper match display");
                localStorage.setItem('hasReloaded', 'true');
                setTimeout(() => {
                    window.location.reload();
                }, 500);
                
            } catch (error) {
                console.error("Error importing data:", error);
                showToast(`Error importing data: ${error.message}`, "error", 5000);
                // Ensure hasReloaded flag is cleared on error
                localStorage.removeItem('hasReloaded');
            }
        };

        reader.readAsText(file);
    } else {
        showToast("Please select a file to import", "error", 3000);
        // Ensure hasReloaded flag is cleared if no file
        localStorage.removeItem('hasReloaded');
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

// Extract the match history table building code into a separate function
function buildMatchHistoryTable(matchHistoryContent) {
    console.log("Building match history table");
    
    // Create a scrollable wrapper for the table
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'match-history-table-wrapper';
    
    // Create a table to display match history
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>
                    <span class="header-text">Round</span>
                    <span class="header-icon" title="Round"><span class="material-symbols-rounded">filter_1</span></span>
                </th>
                <th>
                    <span class="header-text">Match</span>
                    <span class="header-icon" title="Match"><span class="material-symbols-rounded">sports_tennis</span></span>
                </th>
                <th>
                    <span class="header-text">Team 1</span>
                    <span class="header-icon" title="Team 1"><span class="material-symbols-rounded">group</span><span class="team-number">1</span></span>
                </th>
                <th>
                    <span class="header-text">Team 2</span>
                    <span class="header-icon" title="Team 2"><span class="material-symbols-rounded">group</span><span class="team-number">2</span></span>
                </th>
                <th>
                    <span class="header-text">Score</span>
                    <span class="header-icon" title="Score"><span class="material-symbols-rounded">scoreboard</span></span>
                </th>
                <th class="action-column">
                    <span class="header-text">Actions</span>
                    <span class="header-icon" title="Actions"><span class="material-symbols-rounded">edit</span></span>
                </th>
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
        
        // Format team players with better structure for responsive layout
        const formatTeamPlayers = (team) => {
            return team.map(player => 
                `<span class="team-player-badge">${player.name}</span>`
            ).join('');
        };
        
        // Display the actual round number - DO NOT adjust it
        row.innerHTML = `
            <td>${match.round}</td>
            <td>${displayIndex + 1}</td>
            <td class="team-cell ${match.team1Score > match.team2Score ? 'history-winner-team' : (match.team1Score === match.team2Score && match.team1Score > 0 ? 'history-tie-team' : '')}">
                <div class="team-players team1-players">
                    ${match.team1.map(player => 
                        `<span class="team1-badge">${player.name}</span>`).join('')}
                </div>
            </td>
            <td class="team-cell ${match.team2Score > match.team1Score ? 'history-winner-team' : (match.team1Score === match.team2Score && match.team2Score > 0 ? 'history-tie-team' : '')}">
                <div class="team-players team2-players">
                    ${match.team2.map(player => 
                        `<span class="team2-badge">${player.name}</span>`).join('')}
                </div>
            </td>
            <td><strong>${match.team1Score || 0} - ${match.team2Score || 0}</strong></td>
            <td class="action-cell"><button class="edit-match-btn" data-match-index="${originalIndex}">
                <span class="material-symbols-rounded">edit</span>
            </button></td>
        `;
        tableBody.appendChild(row);
    });

    // Add the table to the wrapper and the wrapper to the content
    tableWrapper.appendChild(table);
    matchHistoryContent.appendChild(tableWrapper);

    // Add event listeners to edit buttons
    const editButtons = table.querySelectorAll('.edit-match-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const matchIndex = parseInt(this.getAttribute('data-match-index'));
            editMatch(matchIndex);
        });
    });
    
    console.log(`Built match history table with ${sortedMatches.length} matches`);
    return table;
}

// Update the showMatchHistory function to use the new function
function showMatchHistory() {
    console.log("showMatchHistory function called");
    const matchHistoryDisplay = document.getElementById('matchHistoryDisplay');
    const matchHistoryContent = document.getElementById('matchHistoryContent');

    // Make sure the element exists
    if (!matchHistoryDisplay) {
        console.error("Match history display element not found!");
        return;
    }

    console.log(`Match History initial state - active: ${matchHistoryDisplay.classList.contains('active')}, visibility: ${matchHistoryDisplay.style.visibility}, display: ${matchHistoryDisplay.style.display}`);

    // Clear previous history
    matchHistoryContent.innerHTML = '';
    console.log("Cleared previous match history content");

    // Add direct style manipulation in addition to class
    matchHistoryDisplay.style.visibility = 'visible';
    matchHistoryDisplay.style.opacity = '1';
    matchHistoryDisplay.style.display = 'flex';
    
    // Add active class for CSS transitions
    matchHistoryDisplay.classList.add('active');
    console.log(`Match History after activation - active: ${matchHistoryDisplay.classList.contains('active')}, visibility: ${matchHistoryDisplay.style.visibility}, display: ${matchHistoryDisplay.style.display}`);
    
    // Add the date display - use the same function as podium display
    const dateElement = document.createElement('div');
    dateElement.id = 'dateDisplay';
    matchHistoryContent.appendChild(dateElement);
    
    // Update the date display specifically for this element
    displayCurrentDate(dateElement);

    if (matches.length === 0) {
        matchHistoryContent.innerHTML += '<div class="empty-state">No matches have been played yet.</div>';
    } else {
        // Use the buildMatchHistoryTable function
        buildMatchHistoryTable(matchHistoryContent);
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

function displayCurrentDate(specificDateElement = null) {
    // Format the date as desired, e.g., "November 20, 2024"
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    if (specificDateElement) {
        // Update only the specific element
        specificDateElement.textContent = `${formattedDate}`;
    } else {
        // Update all dateDisplay elements
        const dateDivs = document.querySelectorAll('#dateDisplay');
        dateDivs.forEach(dateDiv => {
            dateDiv.textContent = `${formattedDate}`;
        });
    }
}



let originalPlayerData = []; // Store original data for reverting changes




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
        const statusValue = player.manualSitOut ? "Sitting Out" : "Active";
        console.log(`Player: ${player.name}, Eligible: ${player.eligible}, Manual Sit-Out: ${player.manualSitOut}, Sat Out Last Round: ${player.satOutLastRound}, Status: ${statusValue}`);
    });
}

// Add a flag at the top of the file to prevent infinite reloads
let hasReloaded = localStorage.getItem('hasReloaded') === 'true';

// Add a state restoration guard flag at the top
let stateRestorationInProgress = false;

function restoreState() {
    // Prevent multiple simultaneous calls
    if (stateRestorationInProgress) {
        console.log("State restoration already in progress, skipping duplicate call");
        return;
    }
    
    stateRestorationInProgress = true;
    
    try {
        console.timeEnd('From DOM load to restoreState');
        console.timeEnd('From keypad init to restore state');
        console.time('State restoration duration');
        console.log("===== RESTORE STATE BEGIN =====", new Date().toISOString());
        
        // Save the current scroll position to restore after loading
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;

        const savedState = localStorage.getItem('pickleballCompetitionState');
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                console.log(`Found saved state with ${parsedState.matches ? parsedState.matches.length : 0} matches`);
                
                // Show the bottom continue button only on initial load with existing data
                const bottomContinueContainer = document.getElementById('bottomContinueContainer');
                if (bottomContinueContainer && parsedState.matches && parsedState.matches.length > 0) {
                    bottomContinueContainer.style.display = 'block';
                    
                    // Add a one-time event listener to hide the button after it's used
                    const bottomContinueBtn = document.getElementById('bottomContinueBtn');
                    if (bottomContinueBtn) {
                        const hideButtonAfterUse = () => {
                            bottomContinueContainer.style.display = 'none';
                            bottomContinueBtn.removeEventListener('click', hideButtonAfterUse);
                        };
                        bottomContinueBtn.addEventListener('click', hideButtonAfterUse);
                    }
                }
                
                // Restore players
                players.length = 0;
                players.push(...(parsedState.players || []).map(player => ({
                    ...player, // Ensure all properties, including manualSitOut and eligible, are restored
                })));
                console.log(`Restored ${players.length} players`);

                // Restore other data
                matches.length = 0;
                matches.push(...(parsedState.matches || []));
                console.log(`Restored ${matches.length} matches`);
                
                // Get the highest round number from matches to set currentRound correctly
                currentRound = parsedState.currentRound || 0;
                if (matches.length > 0) {
                    const maxRoundInMatches = Math.max(...matches.map(m => m.round || 0));
                    // Set currentRound to at least the highest round number in matches
                    currentRound = Math.max(currentRound, maxRoundInMatches);
                }
                console.log(`Current round set to: ${currentRound}`);
                
                isFirstRound = parsedState.isFirstRound !== undefined ? parsedState.isFirstRound : true;

                // Reset and restore pair tracker data
                pairTracker.resetAll();
                
                // Restore pair tracking data from new format
                if (parsedState.pairCounts) {
                    Object.assign(pairTracker.pairCounts, parsedState.pairCounts);
                }
                
                if (parsedState.previousRoundPairs) {
                    pairTracker.previousRoundPairs = new Set(parsedState.previousRoundPairs);
                }
                
                if (parsedState.recentRounds) {
                    pairTracker.recentRounds = parsedState.recentRounds.map(roundArray => 
                        new Set(roundArray)
                    );
                }
                
                if (parsedState.globalPairs) {
                    pairTracker.globalPairs = new Set(parsedState.globalPairs);
                }
                
                // Support for legacy format
                if (parsedState.extendedPairHistory && !parsedState.pairCounts) {
                    Object.assign(pairTracker.pairCounts, parsedState.extendedPairHistory);
                }
                
                if (parsedState.globalPairHistory && !parsedState.globalPairs) {
                    pairTracker.globalPairs = new Set(parsedState.globalPairHistory);
                }
                
                if (parsedState.recentPairHistory && !parsedState.recentRounds) {
                    pairTracker.recentRounds = parsedState.recentPairHistory.map(roundArray => 
                        new Set(roundArray)
                    );
                }
                
                // Restore previous round matches to prevent consecutive repeat matches
                previousRoundMatches.clear();
                if (parsedState.previousRoundMatches) {
                    parsedState.previousRoundMatches.forEach(match => previousRoundMatches.add(match));
                    logDebugMessage(`Restored ${previousRoundMatches.size} previous round matches`);
                }
                
                // Ensure the pair tracking has a current round initialized
                if (pairTracker.recentRounds.length === 0) {
                    pairTracker.startNewRound();
                    logDebugMessage("Initialized round tracking after restore");
                }

                // Restore match history and counter
                matchHistory.clear();
                (parsedState.matchHistory || []).forEach(item => matchHistory.add(item));

                Object.keys(matchPlayCounter).forEach(key => delete matchPlayCounter[key]);
                Object.assign(matchPlayCounter, parsedState.matchPlayCounter || {});

                console.log("Players after adding:", players);
                
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
                    console.log(`Processing ${matches.length} matches for display`);
                    
                    // Group matches by round for debugging
                    const matchesByRound = {};
                    matches.forEach(match => {
                        if (!match.round) {
                            console.error("Match missing round number:", match);
                            return;
                        }
                        const round = match.round;
                        if (!matchesByRound[round]) {
                            matchesByRound[round] = [];
                        }
                        matchesByRound[round].push(match);
                    });
                    
                    const rounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));
                    console.log(`Found matches in rounds: ${rounds.join(', ')}`);
                    
                    // Update player stats table
                    const sortedPlayers = sortByVictoryPoints(players);
                    displayPodium(sortedPlayers);
                    displayPlayerStatsTable(sortedPlayers);
                    
                    // Let's try using appendMatchDisplay
                    for (const round in matchesByRound) {
                        console.log(`Found data for round ${round} with ${matchesByRound[round].length} matches`);
                    }
                    
                    // Always rebuild the match display - no reload needed
                    const matchDisplay = document.getElementById('matchDisplay');
                    console.log(`matchDisplay element exists: ${!!matchDisplay}`);
                    if (matchDisplay) {
                        console.log(`matchDisplay HTML content length: ${matchDisplay.innerHTML.length}`);
                        console.log(`matchDisplay children count: ${matchDisplay.children.length}`);
                        
                        // Clear the match display
                        matchDisplay.innerHTML = '';
                        
                        // Rebuild all rounds and matches
                        for (let i = 1; i <= Math.max(...rounds.map(r => parseInt(r))); i++) {
                            if (matchesByRound[i]) {
                                // Since appendMatchDisplay increments currentRound, set it to the previous round
                                currentRound = i - 1;
                                
                                // Get sit-out players for this round
                                const sitOutPlayersForRound = [];
                                players.forEach(player => {
                                    // Logic to determine who sat out in this round
                                    const playedInRound = matchesByRound[i].some(match => 
                                        match.team1.some(p => p.name === player.name) || 
                                        match.team2.some(p => p.name === player.name)
                                    );
                                    if (!playedInRound) {
                                        sitOutPlayersForRound.push(player);
                                    }
                                });
                                
                                // Ensure match objects have their scores before appending
                                const matchesWithScores = matchesByRound[i].map(match => {
                                    // Ensure original match object is not modified
                                    return {
                                        ...match,
                                        team1Score: match.team1Score,
                                        team2Score: match.team2Score
                                    };
                                });
                                
                                // Rebuild this round with proper score data
                                console.log(`Rebuilding round ${i} display with ${matchesWithScores.length} matches`);
                                appendMatchDisplay(matchesWithScores, sitOutPlayersForRound);
                            }
                        }
                        console.log(`Rebuilt display with ${matchDisplay.children.length} rounds`);
                    }
                }

                console.log("Competition state restored. Player statuses and selectors:");
                players.forEach(player => {
                    const statusValue = player.manualSitOut ? "Sitting Out" : "Active";
                    console.log(`Player: ${player.name}, Eligible: ${player.eligible}, Manual Sit-Out: ${player.manualSitOut}, Sat Out Last Round: ${player.satOutLastRound}, Status: ${statusValue}`);
                });

                console.log("Competition state restored successfully.");
            } catch (error) {
                console.error("Error restoring state:", error);
                showToast("There was an error restoring your previous session. Some data may be missing or corrupted.", "error", 6000);
            }
        } else {
            console.log("No saved state found.");
        }

        // Restore the original scroll position to prevent unwanted scrolling
        setTimeout(() => {
            window.scrollTo(0, 0);
            console.log("Scrolled back to top");
        }, 100);
        
        // After all state is restored
        
        // Update UI elements
        updatePlayerList();
        
        // Update the button text based on restored state
        updateStartTournamentButtonText();
        
        // Update bottom continue button visibility
        updateBottomContinueButton();
        
        // Log success message
        logDebugMessage("State restored successfully");
        showToast("Tournament data loaded", "success");
        console.timeEnd('State restoration duration');
        console.log("===== RESTORE STATE END =====");
    } catch (error) {
        console.error("Unexpected error in restoreState:", error);
    } finally {
        // Always release the lock when done
        setTimeout(() => {
            stateRestorationInProgress = false;
        }, 500); // Keep the lock for a short time after completion
    }
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

        // Save settings before clearing localStorage
        const isMainAudioMuted = localStorage.getItem('isMainAudioMuted');
        const isLeaderboardAudioMuted = localStorage.getItem('isLeaderboardAudioMuted');
        const skipIntro = localStorage.getItem('skipIntro');
        const muteAllSounds = localStorage.getItem('muteAllSounds');
        const previousMainAudioState = localStorage.getItem('previousMainAudioState');
        const previousLeaderboardAudioState = localStorage.getItem('previousLeaderboardAudioState');

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

        // Restore all settings
        if (isMainAudioMuted) {
            localStorage.setItem('isMainAudioMuted', isMainAudioMuted);
        }
        if (isLeaderboardAudioMuted) {
            localStorage.setItem('isLeaderboardAudioMuted', isLeaderboardAudioMuted);
        }
        if (skipIntro) {
            localStorage.setItem('skipIntro', skipIntro);
        }
        if (muteAllSounds) {
            localStorage.setItem('muteAllSounds', muteAllSounds);
        }
        if (previousMainAudioState) {
            localStorage.setItem('previousMainAudioState', previousMainAudioState);
        }
        if (previousLeaderboardAudioState) {
            localStorage.setItem('previousLeaderboardAudioState', previousLeaderboardAudioState);
        }

        console.log("Competition data cleared successfully. Settings preserved:", {
            isMainAudioMuted,
            isLeaderboardAudioMuted,
            skipIntro,
            muteAllSounds
        });
        
        // Update the start tournament button text before reload
        updateStartTournamentButtonText();
        
        showToast("All competition data has been cleared. Settings preserved.", "success");
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
        showToast("No more matches can be added; all courts are in use.", "warning", 4000);
        logDebugMessage("Cannot add match: all courts in use");
        return;
    }

    if (eligiblePlayers.length < 4) {
        showToast("Not enough players to form another match.", "warning", 4000);
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
        showToast("Unable to form a valid match. Please adjust player settings or reset history.", "error", 5000);
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
            <p><span class="match-title">Match ${activeMatches + 1}</span> <button class="skip-match-btn" data-match="${activeMatches}">Skip Match</button></p>
            <div class="team" data-team="1">
                <p>Team 1: ${match.team1.map(p => `<span class="team1-player">${p.name}</span>`).join(' & ')}</p>
                <label>Score: <input type="text" inputmode="${window.settings.useCustomKeypad ? 'none' : 'numeric'}" pattern="[0-9]*" min="0" class="team-score" data-team="1" data-match="${activeMatches}" ${window.settings.useCustomKeypad ? 'readonly' : ''}></label>
            </div>
            <div class="team" data-team="2">
                <p>Team 2: ${match.team2.map(p => `<span class="team2-player">${p.name}</span>`).join(' & ')}</p>
                <label>Score: <input type="text" inputmode="${window.settings.useCustomKeypad ? 'none' : 'numeric'}" pattern="[0-9]*" min="0" class="team-score" data-team="2" data-match="${activeMatches}" ${window.settings.useCustomKeypad ? 'readonly' : ''}></label>
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
            matchDiv.classList.add('skipped-match');

            // Get all players involved in this match
            const skipPlayers = [...match.team1, ...match.team2];
            
            // Update player eligibility status - mark them as ineligible and sitting out
            skipPlayers.forEach(player => {
                player.eligible = false;
                player.satOutLastRound = true;
                
                // Remove player if already in sitOutPlayers to prevent duplicates
                const existingIndex = sitOutPlayers.findIndex(p => p.name === player.name);
                if (existingIndex >= 0) {
                    sitOutPlayers.splice(existingIndex, 1);
                }
                
                // Add player to sitOutPlayers
                sitOutPlayers.push(player);
                logDebugMessage(`Player ${player.name} marked ineligible and sitting out after match skip`);
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

    // Ensure sitOutPlayers array is accurate by checking skipped matches
    let actualSitOutPlayers = [...(sitOutPlayers || [])];
    
    // Collect all players from skipped matches
    const skippedMatches = roundContainer.querySelectorAll('.match[data-skipped="true"]');
    skippedMatches.forEach(matchDiv => {
        // Get all players from this skipped match
        const team1Players = Array.from(matchDiv.querySelectorAll('.team1-player')).map(el => {
            const playerName = el.textContent.trim();
            return players.find(p => p.name === playerName);
        }).filter(Boolean);
        
        const team2Players = Array.from(matchDiv.querySelectorAll('.team2-player')).map(el => {
            const playerName = el.textContent.trim();
            return players.find(p => p.name === playerName);
        }).filter(Boolean);
        
        // Add these players to sitOutPlayers if not already there
        [...team1Players, ...team2Players].forEach(player => {
            if (player && !actualSitOutPlayers.some(p => p.name === player.name)) {
                actualSitOutPlayers.push(player);
                logDebugMessage(`Added player ${player.name} from skipped match to sit-out list`);
            }
        });
    });
    
    // Get players in active matches
    const activeMatchPlayers = new Set();
    roundContainer.querySelectorAll('.match:not([data-skipped="true"])').forEach(matchDiv => {
        matchDiv.querySelectorAll('.team1-player, .team2-player').forEach(playerSpan => {
            activeMatchPlayers.add(playerSpan.textContent.trim());
        });
    });
    
    // Remove any players who are actually in active matches from the sit-out list
    actualSitOutPlayers = actualSitOutPlayers.filter(player => {
        if (activeMatchPlayers.has(player.name)) {
            logDebugMessage(`Removing player ${player.name} from sit-out list because they are in an active match`);
            return false;
        }
        return true;
    });

    // Update player statuses
    players.forEach(player => {
        const isSittingOut = actualSitOutPlayers.some(p => p.name === player.name);
        if (player.satOutLastRound !== isSittingOut) {
            logDebugMessage(`Updating player ${player.name}: satOutLastRound ${player.satOutLastRound} → ${isSittingOut}`);
        }
        player.satOutLastRound = isSittingOut; // Mark players in actualSitOutPlayers as sat out
    });

    // Display updated sit-out players
    if (actualSitOutPlayers.length === 0) {
        sitOutDiv.innerHTML = '<strong>🎉 Everyone is playing! 🎉</strong>';
        sitOutDiv.classList.add('all-playing');
        logDebugMessage(`Set display: Everyone is playing`);
    } else {
        const sitOutPlayerNames = actualSitOutPlayers.map(player => 
            `<span class="sitting-player">${player.name}</span>`
        ).join(' ');
        sitOutDiv.innerHTML = `<strong>Sitting out:</strong> ${sitOutPlayerNames}`;
        sitOutDiv.classList.remove('all-playing');
        logDebugMessage(`Set display: Players sitting out - ${actualSitOutPlayers.map(p => p.name).join(', ')}`);
    }
    
    // Update the sitOutPlayers reference to match our corrected list
    if (sitOutPlayers) {
        sitOutPlayers.length = 0;
        actualSitOutPlayers.forEach(player => sitOutPlayers.push(player));
    }
    
    logDebugMessage(`=== END UPDATE SIT-OUT DISPLAY ===`);
}

function toggleEditRound(roundContainer, editRoundButton) {
    const isEditing = editRoundButton.textContent === 'Edit Round';
    
    // If we're already editing, save the changes
    if (!isEditing) {
        saveRoundEdits(roundContainer, editRoundButton);
        roundContainer.classList.remove('edit-mode');
        return;
    }
    
    // Mark the round container as being in edit mode
    roundContainer.classList.add('edit-mode');
    
    // Save the current state
    const originalState = Array.from(roundContainer.querySelectorAll('.match')).map(matchDiv => ({
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
    roundContainer.querySelectorAll('.match').forEach((matchDiv, index) => {
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

    // Show a toast to inform the user
    showToast("You're now in Edit Mode. Save changes when done or Cancel to revert.", "info");

    // Attach numeric keypad to new or re-enabled input fields if available
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

    showToast('Edits canceled. Round reverted to the original state.', "info", 4000);
    
    // Reset the round container state
    roundContainer.classList.remove('edit-mode');
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
            .map(selector => {
                const playerName = selector.value;
                return players.find(p => p.name === playerName);
            })
            .filter(Boolean); // Filter out any undefined players

        const newTeam2 = Array.from(matchDiv.querySelectorAll('.player-selector[data-team="2"]'))
            .map(selector => {
                const playerName = selector.value;
                return players.find(p => p.name === playerName);
            })
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
            // Use player.name as the key for cross-browser compatibility
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
            .map(selector => {
                const playerName = selector.value;
                return players.find(p => p.name === playerName);
            })
            .filter(Boolean); // Filter out any undefined players

        const newTeam2 = Array.from(matchDiv.querySelectorAll('.player-selector[data-team="2"]'))
            .map(selector => {
                const playerName = selector.value;
                return players.find(p => p.name === playerName);
            })
            .filter(Boolean); // Filter out any undefined players

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
    
    // Reset the round container editing state
    roundContainer.classList.remove('edit-mode');
    editRoundButton.textContent = 'Edit Round';
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
                matchTitle.innerHTML = `<span class="match-title">Match ${matchNumber}</span> <button class="skip-match-btn" data-match="${index}">Skip Match</button>`;
                
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
                matchTitle.innerHTML = `<span class="match-title">Match ${matchNumber}</span>`;
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



// DOMContentLoaded event listeners have been consolidated in index.html

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
        
       
    }, 500);
}

/**
 * Closes the currently open dialog
 */
function closeDialog() {
    // Find any open dialogs and remove them
    const dialogs = document.querySelectorAll('.edit-match-dialog');
    dialogs.forEach(dialog => {
        dialog.remove();
    });
    
    // Hide the keypad if it's visible
    const keypad = document.getElementById('numericKeypad');
    if (keypad) {
        keypad.style.display = 'none';
    }
}

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
                    <input type="text" inputmode="${window.settings.useCustomKeypad ? 'none' : 'numeric'}" class="team-score" id="team1-score" min="0" value="${match.team1Score || 0}" placeholder="Click to enter score">
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
                    <input type="text" inputmode="${window.settings.useCustomKeypad ? 'none' : 'numeric'}" class="team-score" id="team2-score" min="0" value="${match.team2Score || 0}" placeholder="Click to enter score">
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
        
        // Get score inputs in the edit dialog
        const scoreInputs = dialog.querySelectorAll('input.team-score');
        
        // Check if custom keypad is enabled
        const useCustomKeypad = localStorage.getItem('useCustomKeypad') !== 'false';
        
        // Apply appropriate readonly setting based on the toggle
        scoreInputs.forEach(input => {
            if (useCustomKeypad) {
                // Make input readonly to prevent mobile keyboard when custom keypad is enabled
                input.setAttribute('readonly', 'readonly');
            } else {
                // Allow direct input when custom keypad is disabled
                input.removeAttribute('readonly');
            }
            
            // Make sure the custom keypad is initialized if it doesn't exist
            if (!document.getElementById('numericKeypad')) {
                createNumericKeypad();
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
            showToast('Please select valid players for all positions', 'error', 4000);
            return;
        }

        // Check for duplicate players within the same team
        if (team1Player1 === team1Player2 || team2Player1 === team2Player2) {
            showToast('Players cannot be on the same team with themselves', 'error', 4000);
            return;
        }

        // Check for duplicate players across teams
        const allPlayers = [team1Player1, team1Player2, team2Player1, team2Player2];
        const uniquePlayers = [...new Set(allPlayers)];
        if (uniquePlayers.length !== 4) {
            showToast('Each player can only appear once in a match', 'error', 4000);
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
            
            console.log("Match updated successfully:", match);
            showToast('Match updated successfully!', 'success', 3000);
            
            // Close the edit dialog
            closeDialog();
        } catch (error) {
            console.error("Error updating match:", error);
            
            // Revert to original match data
            Object.assign(match, originalMatch);
            
            showToast('An error occurred while updating the match. Changes were not saved.', 'error', 5000);
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
    
    try {
        // Log player stats before updates for debugging
        logDebugMessage("Player stats before display update:");
        players.forEach(player => {
            logDebugMessage(`${player.name}: Games=${player.gamesPlayed}, VP=${player.victoryPoints}, PP=${player.picklePoints}, PD=${player.pickleDifferential}`);
            if (player.teammates) {
                logDebugMessage(`  Teammates: ${JSON.stringify(player.teammates)}`);
            }
            if (player.versus) {
                logDebugMessage(`  Versus: ${JSON.stringify(player.versus)}`);
            }
        });
        
        // Use the forceUpdateAllRounds function to ensure all displays are updated
        forceUpdateAllRounds();
        
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
        
        // Rebuild the match history display to reflect the edited match
        const matchHistoryContainer = document.getElementById('matchHistoryContent');
        if (matchHistoryContainer && matchHistoryContainer.style.display !== 'none') {
            showMatchHistory(); // Refresh the match history display
        }
        
        // Log confirmation of successful update
        logDebugMessage("Match display successfully updated");
        
    } catch (error) {
        console.error("Error updating main display:", error);
        logDebugMessage(`Error updating display: ${error.message}`);
    }
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
        
        // Remove teammate relationships from team1 players
        match.team1.filter(teammate => teammate !== player)
            .forEach(teammate => {
                if (player.teammates && player.teammates[teammate.name]) {
                    player.teammates[teammate.name] -= 1;
                    if (player.teammates[teammate.name] <= 0) {
                        delete player.teammates[teammate.name];
                    }
                }
                
                // Also remove the reverse relationship
                if (teammate.teammates && teammate.teammates[player.name]) {
                    teammate.teammates[player.name] -= 1;
                    if (teammate.teammates[player.name] <= 0) {
                        delete teammate.teammates[player.name];
                    }
                }
            });
        
        // Remove versus relationships from team1 vs team2
        match.team2.forEach(opponent => {
            // Remove relationship from player to opponent
            if (player.versus && player.versus[opponent.name]) {
                player.versus[opponent.name] -= 1;
                if (player.versus[opponent.name] <= 0) {
                    delete player.versus[opponent.name];
                }
            }
            
            // Also remove the reverse relationship
            if (opponent.versus && opponent.versus[player.name]) {
                opponent.versus[player.name] -= 1;
                if (opponent.versus[player.name] <= 0) {
                    delete opponent.versus[player.name];
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
        
        // Remove teammate relationships from team2 players
        match.team2.filter(teammate => teammate !== player)
            .forEach(teammate => {
                if (player.teammates && player.teammates[teammate.name]) {
                    player.teammates[teammate.name] -= 1;
                    if (player.teammates[teammate.name] <= 0) {
                        delete player.teammates[teammate.name];
                    }
                }
                
                // The reverse relationship is already handled in the team1 loop
            });
        
        // Versus relationships are already handled in the team1 loop
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
        // Ensure player stats fields are initialized
        player.gamesPlayed = player.gamesPlayed || 0;
        player.picklePoints = player.picklePoints || 0;
        player.pickleDifferential = player.pickleDifferential || 0;
        player.victoryPoints = player.victoryPoints || 0;
        player.teammates = player.teammates || {};
        player.versus = player.versus || {};
        
        player.gamesPlayed += 1;
        player.picklePoints += match.team1Score;
        
        // Adjust pickle differential
        player.pickleDifferential += (match.team1Score - match.team2Score);
        
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
        // Ensure player stats fields are initialized
        player.gamesPlayed = player.gamesPlayed || 0;
        player.picklePoints = player.picklePoints || 0;
        player.pickleDifferential = player.pickleDifferential || 0;
        player.victoryPoints = player.victoryPoints || 0;
        player.teammates = player.teammates || {};
        player.versus = player.versus || {};
        
        player.gamesPlayed += 1;
        player.picklePoints += match.team2Score;
        
        // Adjust pickle differential
        player.pickleDifferential += (match.team2Score - match.team1Score);
        
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
    // Update match title if needed
    const matchTitle = matchDiv.querySelector('p:first-child');
    if (matchTitle) {
        const matchNumber = parseInt(matchDiv.getAttribute('data-match')) + 1;
        // Keep the existing structure but ensure it has the match-title span
        if (!matchTitle.querySelector('.match-title')) {
            // Check if there's a skip button
            const skipButton = matchTitle.querySelector('.skip-match-btn');
            if (skipButton) {
                const skipButtonHTML = skipButton.outerHTML;
                matchTitle.innerHTML = `<span class="match-title">Match ${matchNumber}</span> ${skipButtonHTML}`;
            } else {
                matchTitle.innerHTML = `<span class="match-title">Match ${matchNumber}</span>`;
            }
        }
    }
    
    // Update team displays
    const team1Container = matchDiv.querySelector('.team[data-team="1"]');
    const team2Container = matchDiv.querySelector('.team[data-team="2"]');
    
    if (team1Container && team2Container) {
        // Update player names
        team1Container.querySelector('p').innerHTML = 
            `Team 1: ${match.team1.map(player => `<span class="team1-player">${player.name}</span>`).join(' & ')}`;
        team2Container.querySelector('p').innerHTML = 
            `Team 2: ${match.team2.map(player => `<span class="team2-player">${player.name}</span>`).join(' & ')}`;
        
        // Update scores
        const team1ScoreInput = team1Container.querySelector('input.team-score');
        const team2ScoreInput = team2Container.querySelector('input.team-score');
        const team1ScoreDisplay = team1Container.querySelector('.score-display');
        const team2ScoreDisplay = team2Container.querySelector('.score-display');
        
        // Update input values if present
        if (team1ScoreInput) team1ScoreInput.value = match.team1Score;
        if (team2ScoreInput) team2ScoreInput.value = match.team2Score;
        
        // Update score display if present
        if (team1ScoreDisplay) team1ScoreDisplay.textContent = `Score: ${match.team1Score}`;
        if (team2ScoreDisplay) team2ScoreDisplay.textContent = `Score: ${match.team2Score}`;
        
        // Update winner highlighting
        team1Container.classList.remove('winner-team', 'tie-team');
        team2Container.classList.remove('winner-team', 'tie-team');
        
        if (match.team1Score > match.team2Score) {
            team1Container.classList.add('winner-team');
        } else if (match.team2Score > match.team1Score) {
            team2Container.classList.add('winner-team');
        } else if (match.team1Score === match.team2Score && (match.team1Score > 0 || match.team2Score > 0)) {
            team1Container.classList.add('tie-team');
            team2Container.classList.add('tie-team');
        }
    }
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
                // Skip matches that have been marked as skipped
                if (matchDiv.getAttribute('data-skipped') === 'true') {
                    return;
                }
                
                const matchIndex = parseInt(matchDiv.getAttribute('data-match'));
                
                // Try to find a matching match by index
                const matchingMatch = roundMatches.find(m => 
                    (m.originalIndex !== undefined && m.originalIndex === matchIndex) || 
                    (roundMatches.indexOf(m) === i)
                );
                
                // If we found a match, update the display
                if (matchingMatch) {
                    updateMatchDisplay(matchDiv, matchingMatch);
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
        });
    });
}

// NOTE: All DOMContentLoaded event listeners have been consolidated in index.html
// The original Document Ready Event listener that was here has been moved to the consolidated listener in index.html

// Function to log current players eligibility status
function logPlayersEligibilityStatus() {
    console.log("Current players' eligibility status:");
    players.forEach(player => {
        console.log(`Player: ${player.name}, Eligible: ${player.eligible}, Manual Sit-Out: ${player.manualSitOut}, Sat Out Last Round: ${player.satOutLastRound}`);
    });
}

/**
 * Creates a numeric keypad for score input
 * @returns {HTMLElement} The created keypad element
 */
function createNumericKeypad() {
    // Check if keypad already exists
    if (document.getElementById('numericKeypad')) return document.getElementById('numericKeypad');
    
    // Create the keypad container
    const keypad = document.createElement('div');
    keypad.id = 'numericKeypad';
    keypad.classList.add('numeric-keypad');
    
    // Create a display area to show the current input
    const display = document.createElement('div');
    display.classList.add('keypad-display');
    display.id = 'keypadDisplay';
    keypad.appendChild(display);
    
    // Create number buttons starting from 15 down to 0 (most common scores first)
    const commonScores = [15, 14, 13, 12, 11, 10];
    const singleDigits = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    
    // Add the common score buttons first (these are special and replace the current value)
    commonScores.forEach(num => {
        const button = document.createElement('button');
        button.textContent = num;
        button.classList.add('keypad-btn', 'common-score-btn');
        
        // Add special class for the winning score (11) and 15
        if (num === 11 || num === 15) {
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
    let hasStartedWithOneOrTwo = false;
    let isFirstPress = true;
    
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
            // Reset the flag if backspace makes the value empty
            if (currentValue === '') {
                hasStartedWithOneOrTwo = false;
                isFirstPress = true;
            }
            updateDisplay();
            return;
        }
        
        // Common score button clicked (10, 11, 12, 13, 14, 15) - replace entire value
        if (target.classList.contains('common-score-btn') && activeInput) {
            const value = target.getAttribute('data-value');
            currentValue = value;
            hasStartedWithOneOrTwo = false; // Reset the flag
            isFirstPress = false; // No longer first press
            updateDisplay();
            
            // Auto-submit for two-digit numbers
            activeInput.value = currentValue;
            keypad.style.display = 'none';
            return;
        }
        
        // Regular digit button clicked
        if (target.classList.contains('digit-btn') && activeInput) {
            const digit = target.getAttribute('data-value');
            
            // If it's the first press after opening keypad, replace current value
            if (isFirstPress) {
                currentValue = digit;
                isFirstPress = false;
                
                // If digit is 1 or 2, mark for special handling
                hasStartedWithOneOrTwo = (digit === '1' || digit === '2');
                
                // If digit is > 2, auto-submit it
                if (parseInt(digit) > 2) {
                    activeInput.value = digit;
                    keypad.style.display = 'none';
                    return;
                }
            }
            // Auto-append next digit if started with 1 or 2
            else if (hasStartedWithOneOrTwo && currentValue.length === 1) {
                currentValue = currentValue + digit;
                hasStartedWithOneOrTwo = false; // Reset after forming a two-digit number
                
                // Auto-submit after forming a two-digit number from 1 or 2
                activeInput.value = currentValue;
                keypad.style.display = 'none';
                return;
            }
            // Normal append case
            else {
                currentValue = (currentValue.toString() + digit).replace(/^0+/, '');
            }
            
            // If empty (only had zeros), set to the clicked digit
            if (currentValue === '') currentValue = digit;
            updateDisplay();
            return;
        }
    });
    
    // Use event delegation for score inputs - more efficient approach
    document.addEventListener('click', function(e) {
        // If it's a score input being clicked
        if (e.target.classList && e.target.classList.contains('team-score')) {
            // Check if the user preference is to use custom keypad (at click time, not affecting all inputs)
            const useCustomKeypad = localStorage.getItem('useCustomKeypad') !== 'false';
            
            // If custom keypad is disabled, do nothing
            if (!useCustomKeypad) {
                // Make sure input is not readonly
                if (e.target.hasAttribute('readonly')) {
                    e.target.removeAttribute('readonly');
                }
                // Ensure inputmode is set to numeric
                e.target.setAttribute('inputmode', 'numeric');
                return;
            }
            
            // Prevent default behavior and make readonly
            e.preventDefault();
            e.target.setAttribute('readonly', 'readonly');
            e.target.setAttribute('inputmode', 'none'); // Prevent mobile keyboard
            
            // Set current active input
            activeInput = e.target;
            
            // Reset the keypad state
            currentValue = activeInput.value || '';
            hasStartedWithOneOrTwo = (currentValue === '1' || currentValue === '2');
            isFirstPress = true; // Reset first press flag when opening keypad
            updateDisplay();
            
            // Show the keypad
            keypad.style.display = 'flex';
        } else if (document.getElementById('numericKeypad') && 
                  !document.getElementById('numericKeypad').contains(e.target)) {
            // If clicking outside the keypad and not on a score input, close the keypad
            document.getElementById('numericKeypad').style.display = 'none';
        }
    });
    
    // Return the created keypad
    return keypad;
}

/**
 * Initialize the numeric keypad
 */
function initNumericKeypad() {
    console.time('From keypad init to restore state');
    console.log("Keypad initialization started", new Date().toISOString());
    
    // Create numeric keypad if it doesn't exist
    if (!document.getElementById('numericKeypad')) {
        const keypad = createNumericKeypad();
        document.body.appendChild(keypad);
    }
    
    // Set up global delegated event listeners to attach keypad to inputs
    window.attachKeypadToInputs = function() {
        console.log('Attaching keypad to inputs at', new Date().toISOString());
        const scoreInputs = document.querySelectorAll('.team-score');
        
        scoreInputs.forEach(input => {
            // Skip if already initialized
            if (input.dataset.keypadInitialized) return;
            
            // We're handling readonly a different way now
            input.removeAttribute('readonly');
            
            // Mark as initialized
            input.dataset.keypadInitialized = 'true';
            
            input.addEventListener('focus', function(e) {
                if (!window.settings.useCustomKeypad) return;
                
                // Prevent the default mobile keyboard
                e.preventDefault();
                
                const keypad = document.getElementById('numericKeypad');
                if (!keypad) return;
                
                // Position keypad near the input
                const rect = this.getBoundingClientRect();
                keypad.style.top = (rect.bottom + window.scrollY + 10) + 'px';
                keypad.style.left = (rect.left + window.scrollX) + 'px';
                
                // Show keypad and associate it with this input
                keypad.style.display = 'grid';
                keypad.dataset.targetInputId = this.id || Math.random().toString(36).substring(2, 9);
                
                if (!this.id) {
                    this.id = keypad.dataset.targetInputId;
                }
                
                // Update display with current value
                const displayElement = keypad.querySelector('.keypad-display');
                if (displayElement) {
                    displayElement.textContent = this.value || '0';
                }
            });
        });
    };
    
    console.log("Keypad initialization completed", new Date().toISOString());
    return true;
}


/**
 * Update the readonly attribute on score inputs based on the keypad setting
 * This is more efficient as it only affects inputs when the setting changes
 * @param {boolean} useCustomKeypad - Whether to use the custom keypad
 */
window.updateScoreInputsReadonly = function(useCustomKeypad) {
    // This function is needed for the settings toggle to work
    // It sets readonly state for all existing score inputs when the toggle changes
    const scoreInputs = document.querySelectorAll('input[type="text"][inputmode="numeric"].team-score, input[type="text"][inputmode="none"].team-score');
    scoreInputs.forEach(input => {
        if (useCustomKeypad) {
            input.setAttribute('readonly', 'readonly');
            input.setAttribute('inputmode', 'none'); // Prevent mobile keyboard from showing
        } else {
            input.removeAttribute('readonly');
            input.setAttribute('inputmode', 'numeric'); // Restore numeric keyboard
        }
    });
};

// Add event listeners for the leaderboard buttons
document.addEventListener('DOMContentLoaded', function() {
    console.log("Setting up leaderboard button event listeners");
    
    // Add event listener for the podium button in the top nav
    const showPodiumBtn = document.getElementById('showPodiumBtn');
    if (showPodiumBtn) {
        showPodiumBtn.addEventListener('click', function() {
            console.log("showPodiumBtn clicked, calling showPodium()");
            showPodium();
        });
    } else {
        console.error("showPodiumBtn element not found");
    }
    
    // Add event listener for the floating leaderboard button
    const floatingLeaderboardBtn = document.getElementById('floatingLeaderboardBtn');
    if (floatingLeaderboardBtn) {
        floatingLeaderboardBtn.addEventListener('click', function() {
            console.log("floatingLeaderboardBtn clicked, calling showPodium()");
            showPodium();
        });
    } else {
        console.error("floatingLeaderboardBtn element not found");
    }
});

// Add event listeners for the leaderboard buttons
document.addEventListener('DOMContentLoaded', function() {
    console.log("Setting up additional script.js initialization");
    
    // Make sure our showPodium function is available globally
    if (typeof window.showPodium === 'undefined') {
        window.showPodium = showPodium;
        console.log("Made showPodium function globally available");
    }
});

// Add this function to update the start tournament button text
function updateStartTournamentButtonText() {
    const startTournamentBtn = document.getElementById('startTournament');
    if (!startTournamentBtn) return;
    
    const hasExistingRounds = document.querySelector('.round-container') !== null;
    
    if (hasExistingRounds) {
        startTournamentBtn.innerHTML = '<span class="material-symbols-rounded">sports_tennis</span> CONTINUE PLAYING';
    } else {
        startTournamentBtn.innerHTML = '<span class="material-symbols-rounded">sports_tennis</span> START PLAYING';
    }
}

// Function to handle the bottom continue button visibility and functionality
function updateBottomContinueButton() {
    const bottomContinueContainer = document.getElementById('bottomContinueContainer');
    const bottomContinueBtn = document.getElementById('bottomContinueBtn');
    const hasExistingRounds = document.querySelector('.round-container') !== null;
    
    if (!bottomContinueContainer || !bottomContinueBtn) return;
    
    // NOTE: The button should only be visible on initial page load with existing data
    // The display property is controlled manually in restoreState() and hidden after use
    // or in submitScores() and playRound()
    
    // This function just ensures the event listener is attached properly
    // Remove any existing event listeners to avoid duplicates
    bottomContinueBtn.removeEventListener('click', playRound);
    
    // Add event listener
    bottomContinueBtn.addEventListener('click', playRound);
}

// Store reference to original functions we'll modify
const originalUpdateStartTournamentButtonText = updateStartTournamentButtonText;
const originalGenerateNextRound = generateNextRound;

// Override updateStartTournamentButtonText to also update bottom button
updateStartTournamentButtonText = function() {
    // Call original function
    originalUpdateStartTournamentButtonText();
    
    // Also update bottom button
    updateBottomContinueButton();
};

// Override generateNextRound to hide bottom button
generateNextRound = function() {
    // Hide the bottom continue button when creating a new round
    const bottomContinueContainer = document.getElementById('bottomContinueContainer');
    if (bottomContinueContainer) {
        bottomContinueContainer.style.display = 'none';
    }
    
    // Call the original function
    originalGenerateNextRound();
};

document.addEventListener('DOMContentLoaded', function() {
    // Update the start tournament button text on page load
    updateStartTournamentButtonText();
});

// Events and initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.time('From DOM load to restoreState');
    console.log("DOM content loaded at", new Date().toISOString());
    
    // Initialize settings before accessing them
    window.settings = {
        isMainAudioMuted: localStorage.getItem('isMainAudioMuted') === 'true',
        isLeaderboardMuted: localStorage.getItem('isLeaderboardMuted') === 'true',
        skipIntro: localStorage.getItem('skipIntro') === 'true',
        muteAllSounds: localStorage.getItem('muteAllSounds') === 'true',
        useCustomKeypad: localStorage.getItem('useCustomKeypad') === 'true'
    };
    
    console.log("Initial settings values:", window.settings);
    
    // Check if there's a saved state and restore it - this is now handled in index.html
    // to prevent duplicate restoration calls
    if (localStorage.getItem('pickleballCompetitionState')) {
        console.log("Saved state found in script.js, but deferring to index.html for restoration");
        // No longer call restoreState() here
    }
    
    // Guide arrow animation for new users
    const guideArrow = document.getElementById('guideArrow');
    const hasVisibleTournament = document.getElementById('matchDisplay').innerHTML.trim() !== '';
    const hasStoredData = localStorage.getItem('pickleballCompetitionState') !== null;
    
    console.log(`Guide arrow check - visible tournament: ${hasVisibleTournament} stored data: ${hasStoredData}`);
    if (guideArrow && !hasVisibleTournament && !hasStoredData) {
        guideArrow.style.display = 'block';
    } else if (guideArrow) {
        guideArrow.style.display = 'none';
    }
    
    // Initialize time display
    displayCurrentDate();
    
    // Initialize the debug area if it exists
    createDebugArea();
    
    // Display the current date in other parts of the UI if needed
    displayCurrentDate(document.getElementById('currentDateDisplay'));
    
    // Set up leaderboard button event listeners
    console.log("Setting up leaderboard button event listeners");
    const toggleLeaderboardBtn = document.getElementById('toggleLeaderboard');
    if (toggleLeaderboardBtn) {
        toggleLeaderboardBtn.addEventListener('click', function() {
            const leaderboard = document.getElementById('leaderboard');
            if (leaderboard.style.display === 'none' || !leaderboard.style.display) {
                showPodium();
            } else {
                closePodium();
            }
        });
    }
    
    // Setup player input field to hide/show Add Players button
    const playerInput = document.getElementById('playerInput');
    const addPlayersBtn = document.getElementById('addPlayersBtn');
    if (playerInput && addPlayersBtn) {
        // Initially hide button if input is empty
        updateAddPlayersButtonState();
        
        // Add input event listener to toggle button visibility
        playerInput.addEventListener('input', updateAddPlayersButtonState);
    }
    
    console.log("Setting up additional script.js initialization");
    
    // Update the button text based on current state
    updateStartTournamentButtonText();
    
    // Initialize the bottom continue button
    updateBottomContinueButton();
    });

// Function to toggle Add Players button state based on input
function updateAddPlayersButtonState() {
    const playerInput = document.getElementById('playerInput');
    const addPlayersBtn = document.getElementById('addPlayersBtn');
    
    if (!playerInput || !addPlayersBtn) {
        console.error("Could not find playerInput or addPlayersBtn elements");
        return;
    }
    
    // Debug output to help diagnose issues
    console.log(`Input value: "${playerInput.value}", trimmed length: ${playerInput.value.trim().length}`);
    
    // Hide button if input is empty, show if it has content
    if (playerInput.value.trim().length > 0) {
        console.log("Showing Add Players button");
        addPlayersBtn.style.display = 'inline-block';
    } else {
        console.log("Hiding Add Players button");
        addPlayersBtn.style.display = 'none';
    }
}

// Self-executing function to set up player input listeners immediately
(function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlayerInputHandler);
    } else {
        // DOM is already ready
        initPlayerInputHandler();
    }
    
    function initPlayerInputHandler() {
        const playerInput = document.getElementById('playerInput');
        const addPlayersBtn = document.getElementById('addPlayersBtn');
        
        if (!playerInput || !addPlayersBtn) {
            console.error("Could not find playerInput or addPlayersBtn elements in initPlayerInputHandler");
            return;
        }
        
        console.log("Setting up player input handlers");
        
        // Set initial state
        updateAddPlayersButtonState();
        
        // Add input event listener
        playerInput.removeEventListener('input', updateAddPlayersButtonState); // Remove any existing listeners
        playerInput.addEventListener('input', updateAddPlayersButtonState);
        
        // Also listen for keyup events to catch all changes
        playerInput.removeEventListener('keyup', updateAddPlayersButtonState);
        playerInput.addEventListener('keyup', updateAddPlayersButtonState);
        
        console.log("Player input handlers successfully set up");
    }
})();

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



// Support panel toggle function
function toggleSupportPanel() {
    const supportPanel = document.getElementById('support-panel');
    supportPanel.classList.toggle('open');
}

// Add event listener for support button
document.addEventListener('DOMContentLoaded', function() {
    // Support button event listener
    document.getElementById('supportButton').addEventListener('click', toggleSupportPanel);
    
    // Other existing event listeners
});

