/**
 * Pickle Pairs Tournament Simulator
 * This script automates testing of all features in the Pickle Pairs web app
 * without modifying the original app code.
 */

// Main simulator class
class PicklePairsSimulator {
    constructor() {
        this.iframe = document.getElementById('appIframe');
        this.iframeDoc = null;
        this.iframeWin = null;
        
        // Simulation state
        this.isRunning = false;
        this.isPaused = false;
        this.currentRound = 0;
        this.actionQueue = [];
        this.playerNames = [];
        this.activePlayers = [];
        this.sittingOutPlayers = [];
        this.manualSitOutPlayers = new Set(); // Track players who sit out manually
        this.autoTimeLimitSitOut = new Set(); // Track players who are auto-sat-out due to time limit
        this.playerManualSitOutRounds = {}; // Track manual sit out duration for each player
        
        // Player statistics
        this.playerStats = {}; // Track player statistics
        this.playerData = {};  // Cache for player data from webapp
        this.roundStats = {}; // Track round statistics including timing
        this.playerStatusHistory = {}; // Track player status changes
        
        this.autoRunInterval = null;
        this.speedMap = {
            slow: 5000,
            medium: 2500,
            fast: 1000
        };
        
        // UI elements - safely initialize with null if not found
        this.startBtn = document.getElementById('startSimulationBtn') || this.createPlaceholderElement('button');
        this.pauseBtn = document.getElementById('pauseSimulationBtn') || this.createPlaceholderElement('button');
        this.resetBtn = document.getElementById('resetSimulationBtn') || this.createPlaceholderElement('button');
        this.nextActionBtn = document.getElementById('nextActionBtn') || this.createPlaceholderElement('button');
        this.autoRunBtn = document.getElementById('autoRunBtn') || this.createPlaceholderElement('button');
        this.actionStatus = document.getElementById('actionStatus') || this.createPlaceholderElement('span');
        this.simulationLog = document.getElementById('simulationLog') || this.createPlaceholderElement('div');
        this.statsBtn = document.getElementById('showStatsBtn') || this.createPlaceholderElement('button');
        this.roundStatsBtn = document.getElementById('showRoundStatsBtn') || this.createPlaceholderElement('button');
        
        // Status elements - safely initialize
        this.currentRoundEl = document.getElementById('currentRound') || this.createPlaceholderElement('span');
        this.totalPlayersEl = document.getElementById('totalPlayers') || this.createPlaceholderElement('span');
        this.activePlayersEl = document.getElementById('activePlayers') || this.createPlaceholderElement('span');
        this.sittingOutPlayersEl = document.getElementById('sittingOutPlayers') || this.createPlaceholderElement('span');
        
        // Settings - initialize with null if not found
        this.courtCountInput = document.getElementById('courtCount');
        this.initialPlayerCountInput = document.getElementById('initialPlayerCount');
        this.maxRoundsInput = document.getElementById('maxRounds');
        this.maxPlayersInput = document.getElementById('maxPlayers');
        this.simulationSpeedSelect = document.getElementById('simulationSpeed');
        
        // Feature toggle settings
        this.enableAddPlayersToggle = document.getElementById('enableAddPlayers');
        this.enableSitOutToggle = document.getElementById('enableSitOut');
        this.enableEditRoundsToggle = document.getElementById('enableEditRounds');
        this.enableEditHistoryToggle = document.getElementById('enableEditHistory');
        this.enableSkipMatchesToggle = document.getElementById('enableSkipMatches');
        this.enableAddMatchesToggle = document.getElementById('enableAddMatches');
        this.enableTimeLimitsToggle = document.getElementById('enableTimeLimits');
        
        // Popup control panel reference
        this.popupWindow = null;
        this.popupOrigin = window.location.origin;
        
        // Create toggle panel button
        this.createTogglePanelButton();
        
        this.setupEventListeners();
        
        // Check overlay state from localStorage
        this.checkOverlayState();
        
        // Ensure iframe is properly loaded
        this.ensureIframeLoaded();
        
        // Initialize available time inputs safely
        this.initAvailableTimeInputs();
        
        // Initialize manual sit out rounds tracking
        this.playerManualSitOutRounds = {};
        
        // Make sure the reset button is enabled from the start
        if (this.resetBtn) {
            this.resetBtn.disabled = false;
        }
        
        // Add a global cache for player statistics from the webapp
        this.webappPlayerCache = {};
        this.lastWebappSync = 0; // Timestamp of last sync
    }
    
    // Initialize available time inputs safely
    initAvailableTimeInputs() {
        try {
            // Try to find existing inputs first
            const minInput = document.getElementById('minAvailableTime');
            const maxInput = document.getElementById('maxAvailableTime');
            
            // Use existing inputs if found, otherwise create new ones
            this.minAvailableTimeInput = minInput || this.createAvailableTimeInput('min');
            this.maxAvailableTimeInput = maxInput || this.createAvailableTimeInput('max');
            
            // Do the same for sit out rounds inputs
            const minSitOutInput = document.getElementById('minSitOutRounds');
            const maxSitOutInput = document.getElementById('maxSitOutRounds');
            
            this.minSitOutRoundsInput = minSitOutInput || this.createSitOutRoundsInput('min');
            this.maxSitOutRoundsInput = maxSitOutInput || this.createSitOutRoundsInput('max');
            
            this.log('Available time and sit out round inputs initialized successfully');
        } catch (error) {
            this.log(`Error initializing settings inputs: ${error.message}`);
            // Set default values as fallbacks
            this.minAvailableTimeInput = { value: '30' };
            this.maxAvailableTimeInput = { value: '240' };
            this.minSitOutRoundsInput = { value: '1' };
            this.maxSitOutRoundsInput = { value: '4' };
        }
    }
    
    // Create available time input if it doesn't exist
    createAvailableTimeInput(type) {
        const container = document.querySelector('.settings-panel');
        if (!container) return null;
        
        // Create a div for the setting
        const settingDiv = document.createElement('div');
        settingDiv.className = 'setting';
        
        // Create a label
        const label = document.createElement('label');
        label.htmlFor = `${type}AvailableTime`;
        label.textContent = `${type === 'min' ? 'Minimum' : 'Maximum'} Available Time (minutes):`;
        
        // Create the input
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `${type}AvailableTime`;
        input.className = 'setting-input';
        input.min = type === 'min' ? '10' : '30';
        input.max = '480'; // 8 hours max
        input.value = type === 'min' ? '30' : '240'; // Default values: 30 min to 4 hours
        
        // Add the elements to the container
        settingDiv.appendChild(label);
        settingDiv.appendChild(input);
        
        // Find the place to insert (before the toggles section)
        const togglesSection = container.querySelector('.toggles-section') || container.lastChild;
        container.insertBefore(settingDiv, togglesSection);
        
        return input;
    }
    
    // Create sit out rounds input if it doesn't exist
    createSitOutRoundsInput(type) {
        const container = document.querySelector('.settings-panel');
        if (!container) return null;
        
        // Create a div for the setting
        const settingDiv = document.createElement('div');
        settingDiv.className = 'setting';
        
        // Create a label
        const label = document.createElement('label');
        label.htmlFor = `${type}SitOutRounds`;
        label.textContent = `${type === 'min' ? 'Minimum' : 'Maximum'} Sit Out Rounds:`;
        
        // Create the input
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `${type}SitOutRounds`;
        input.className = 'setting-input';
        input.min = '1';
        input.max = '10'; 
        input.value = type === 'min' ? '1' : '4'; // Default values: 1 to 4 rounds
        
        // Add the elements to the container
        settingDiv.appendChild(label);
        settingDiv.appendChild(input);
        
        // Find the place to insert (before the toggles section)
        const togglesSection = container.querySelector('.toggles-section') || container.lastChild;
        container.insertBefore(settingDiv, togglesSection);
        
        return input;
    }
    
    // Ensure iframe is properly loaded
    ensureIframeLoaded() {
        if (!this.iframe) {
            this.log('ERROR: App iframe element not found!');
            return;
        }
        
        try {
            // Try to access the iframe's document
            this.iframeWin = this.iframe.contentWindow;
            this.iframeDoc = this.iframe.contentDocument || (this.iframeWin ? this.iframeWin.document : null);
            
            if (this.iframeDoc && this.iframeWin) {
                this.log('App iframe already loaded on initialization.');
            } else {
                this.log('Iframe not fully loaded yet, waiting for load event.');
                
                // If iframe is not loaded yet, we need to wait for the load event
                this.iframe.addEventListener('load', () => {
                    this.onIframeLoaded();
                });
            }
        } catch (error) {
            this.log(`Error accessing iframe content: ${error.message}. This is likely due to cross-origin restrictions.`);
            this.showToast(`Error accessing iframe: ${error.message}. Please ensure you're running from a web server, not directly from the file system.`, 'error');
        }
    }
    
    // Called when iframe is loaded
    onIframeLoaded() {
        try {
            this.iframeWin = this.iframe.contentWindow;
            this.iframeDoc = this.iframe.contentDocument || (this.iframeWin ? this.iframeWin.document : null);
            
            if (this.iframeDoc && this.iframeWin) {
                this.log('App iframe loaded successfully.');
                
                // Make the simulator directly accessible from the iframe window
                try {
                    // Directly set simulator in the window object of the iframe
                    this.iframeWin.simulator = this;
                    this.log('Made simulator accessible from webapp window with direct window.simulator reference');
                    
                    // Store reference to updatePlayerList function so we can call it when needed
                    if (typeof this.iframeWin.updatePlayerList === 'function') {
                        this.updatePlayerListFn = this.iframeWin.updatePlayerList;
                        this.log('Successfully stored reference to updatePlayerList function');
                    } else {
                        this.log('Could not find updatePlayerList function in the webapp yet, will try later');
                        
                        // Set up a polling mechanism to find updatePlayerList if not immediately available
                        let attempts = 0;
                        const checkInterval = setInterval(() => {
                            attempts++;
                            if (typeof this.iframeWin.updatePlayerList === 'function') {
                                this.updatePlayerListFn = this.iframeWin.updatePlayerList;
                                this.log('Successfully stored reference to updatePlayerList function after polling');
                                clearInterval(checkInterval);
                            } else if (attempts >= 10) {
                                this.log('Failed to find updatePlayerList function after 10 attempts');
                                clearInterval(checkInterval);
                            }
                        }, 500);
                    }
                } catch (error) {
                    this.log(`Error setting up cross-window communication: ${error.message}`);
                }
                
                // Try to check iframe properties for debugging
                setTimeout(() => {
                    try {
                        // Check for CORS issues
                        try {
                            // Try to access a simple property on the window to test permissions
                            const testAccess = this.iframeWin.location.href;
                            this.log(`Can access iframe location: ${testAccess}`);
                            
                            // Try again to get updatePlayerList if we didn't get it earlier
                            if (!this.updatePlayerListFn && typeof this.iframeWin.updatePlayerList === 'function') {
                                this.updatePlayerListFn = this.iframeWin.updatePlayerList;
                                this.log('Successfully stored reference to updatePlayerList function (delayed)');
                            }
                        } catch (corsError) {
                            this.log(`CORS issue detected: ${corsError.message}`);
                            this.showToast('CORS restrictions detected.', 'warning');
                        }
                    } catch (debugError) {
                        this.log(`Error during iframe debug: ${debugError.message}`);
                    }
                }, 2000); // Give the iframe content time to initialize
                
                this.showToast('App loaded successfully', 'success');
            } else {
                this.log('Warning: iframe loaded but document or window is null. This may indicate a cross-origin issue.');
                this.showToast('App loaded with limited access', 'warning');
            }
        } catch (error) {
            this.log(`Error during iframe load: ${error.message}`);
            this.showToast(`Iframe load error: ${error.message}`, 'error');
        }
    }
    
    // Set up event listeners for simulator controls
    setupEventListeners() {
        // ... existing code ...
        
        // Add a new reset settings button
        const resetSettingsBtn = document.createElement('button');
        resetSettingsBtn.id = 'resetSettingsBtn';
        resetSettingsBtn.className = 'warning-btn';
        resetSettingsBtn.textContent = 'Reset Settings';
        resetSettingsBtn.addEventListener('click', () => this.resetSimulatorSettings());
        
        // Add it to the simulator controls
        const controlsContainer = document.querySelector('.simulator-controls');
        if (controlsContainer) {
            controlsContainer.appendChild(resetSettingsBtn);
            
            // Add pop-out control panel button
            const popoutBtn = document.createElement('button');
            popoutBtn.id = 'popoutControlsBtn';
            popoutBtn.className = 'popout-btn';
            popoutBtn.innerHTML = '<span class="material-symbols-rounded">open_in_new</span> Pop-out Controls';
            popoutBtn.addEventListener('click', () => this.createPopupControlPanel());
            
            // Add it to the same controls container
            controlsContainer.appendChild(popoutBtn);
        }

        this.startBtn.addEventListener('click', () => this.startSimulation());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resetBtn.addEventListener('click', () => this.resetSimulation());
        this.nextActionBtn.addEventListener('click', () => this.executeNextAction());
        this.autoRunBtn.addEventListener('click', () => this.toggleAutoRun());
        
        // Ensure stats button exists and has event listener
        if (this.statsBtn) {
            // Remove any existing click listeners to avoid duplicates
            this.statsBtn.replaceWith(this.statsBtn.cloneNode(true));
            // Get the fresh reference
            this.statsBtn = document.getElementById('showStatsBtn') || this.createPlaceholderElement('button');
            // Add listener
            this.statsBtn.addEventListener('click', () => {
                this.log('Stats button clicked');
                this.showPlayerStats();
            });
            // Apply initial styling
            this.updateStatsButtonStyle();
        }
        
        this.roundStatsBtn.addEventListener('click', () => this.showRoundStats());

        // Toggle overlay visibility
        document.getElementById('toggleOverlayBtn').addEventListener('click', () => this.toggleOverlay());
        
        // Wait for iframe to load
        this.iframe.addEventListener('load', () => {
            this.onIframeLoaded();
        });
        
        this.iframe.addEventListener('error', (error) => {
            this.log(`Iframe failed to load: ${error}`);
            this.showToast('Iframe failed to load', 'error');
        });
        
        // Load settings from localStorage
        this.loadSimulatorSettings();
        
        // Save settings when they change
        const saveSettingsOnChange = (element) => {
            element.addEventListener('change', () => this.saveSimulatorSettings());
        };
        
        // Add event listeners to all inputs and checkboxes
        document.querySelectorAll('input, select').forEach(saveSettingsOnChange);
    }
    
    // Toggle overlay visibility
    toggleOverlay() {
        const overlay = document.querySelector('.iframe-overlay');
        if (overlay) {
            overlay.classList.toggle('collapsed');
            
            // Update icon
            const icon = document.querySelector('#toggleOverlayBtn .material-symbols-rounded');
            if (icon) {
                if (overlay.classList.contains('collapsed')) {
                    icon.textContent = 'visibility';
                } else {
                    icon.textContent = 'visibility_off';
                }
            }
            
            // Store preference in localStorage
            const isCollapsed = overlay.classList.contains('collapsed');
            localStorage.setItem('overlayCollapsed', isCollapsed);
            
            this.log(`Overlay ${isCollapsed ? 'collapsed' : 'expanded'}`);
        }
    }
    
    // Check for saved overlay state
    checkOverlayState() {
        const overlay = document.querySelector('.iframe-overlay');
        const isCollapsed = localStorage.getItem('overlayCollapsed') === 'true';
        
        if (overlay && isCollapsed) {
            overlay.classList.add('collapsed');
            const icon = document.querySelector('#toggleOverlayBtn .material-symbols-rounded');
            if (icon) {
                icon.textContent = 'visibility';
            }
        }
    }
    
    // Start the simulation
    startSimulation() {
        if (this.isRunning) return;
        
        // Check if iframe is properly loaded
        if (!this.iframeDoc || !this.iframeWin) {
            this.log('ERROR: App iframe not loaded properly. Reloading iframe...');
            this.showToast('App iframe not loaded. Reloading...', 'error');
            
            // Reload the iframe and retry
            this.iframe.src = this.iframe.src;
            return;
        }
        
        // Get and validate settings - safely check if elements exist
        let courtCount = 2; // Default value
        let initialPlayerCount = 4; // Default value
        
        // Safely get court count
        if (this.courtCountInput && this.courtCountInput.value) {
            courtCount = parseInt(this.courtCountInput.value);
            if (isNaN(courtCount) || courtCount < 1 || courtCount > 10) {
                this.showToast('Court count must be between 1 and 10', 'error');
                courtCount = 2; // Set to default
            }
        }
        
        // Safely get player count
        if (this.initialPlayerCountInput && this.initialPlayerCountInput.value) {
            initialPlayerCount = parseInt(this.initialPlayerCountInput.value);
            if (isNaN(initialPlayerCount) || initialPlayerCount < 4 || initialPlayerCount > 9) {
                this.showToast('Initial player count must be between 4 and 9', 'error');
                initialPlayerCount = 4; // Set to default
            }
        }
        
        // Update UI
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.resetBtn.disabled = false;
        this.nextActionBtn.disabled = false;
        this.autoRunBtn.disabled = false;
        this.statsBtn.disabled = false; // Enable the stats button
        this.roundStatsBtn.disabled = false; // Enable the round stats button
        
        // Disable settings
        this.disableSettings(true);
        
        // Reset state
        this.currentRound = 0;
        this.actionQueue = [];
        this.playerNames = [];
        this.activePlayers = [];
        this.sittingOutPlayers = [];
        this.roundStats = {}; // Reset round stats
        
        // Build initial action queue
        this.buildInitialActionQueue();
        
        this.log('Simulation started.');
        this.showToast('Simulation started successfully', 'success');
        this.updateStatusDisplay();
        
        this.updatePopupStatus();
    }
    
    // Toggle pause state
    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        
        if (this.isPaused) {
            this.stopAutoRun();
            this.actionStatus.textContent = 'Simulation paused';
            this.log('Simulation paused.');
        } else {
            this.actionStatus.textContent = 'Simulation resumed';
            this.log('Simulation resumed.');
            
            // Resume auto run if it was active
            if (this.autoRunBtn.textContent === 'Stop Auto') {
                this.startAutoRun();
            }
        }
        
        this.updatePopupStatus();
    }
    
    // Reset the simulation
    resetSimulation() {
        this.stopAutoRun();
        this.isRunning = false;
        this.isPaused = false;
        
        // Update UI
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = 'Pause';
        // Do not disable the reset button
        // this.resetBtn.disabled = true;
        this.nextActionBtn.disabled = true;
        this.autoRunBtn.disabled = true;
        this.autoRunBtn.textContent = 'Auto Run';
        this.statsBtn.disabled = true; // Disable the stats button
        this.roundStatsBtn.disabled = true; // Disable the round stats button
        
        // Re-enable settings
        this.disableSettings(false);
        
        // Try to click the clear data button in the app first before resetting the iframe
        try {
            if (this.iframeDoc) {
                // Find the clear data button
                const clearBtn = this.iframeDoc.getElementById('clearBtn');
                if (clearBtn) {
                    this.log('Clicking Clear Data button in the app');
                    clearBtn.click();
                    
                    // Try to find and click the confirm button in the confirmation dialog
                    // Give it a moment to appear - increase delay to ensure dialog appears
                    setTimeout(() => {
                        try {
                            // Store this as simulator for reference inside the setTimeout
                            const simulator = this;
                            
                            // Updated selector to find the correct confirmation button
                            const confirmBtn = simulator.iframeDoc.querySelector('.confirm-ok-btn, .confirm-btn, .modal button.confirm-ok-btn');
                            if (confirmBtn) {
                                simulator.log(`Confirming data clear - clicking button with text: "${confirmBtn.textContent.trim()}"`);
                                confirmBtn.click();
                                
                                // Wait a bit longer before resetting the iframe
                                setTimeout(() => {
                                    // Reset iframe
                                    simulator.iframe.src = simulator.iframe.src;
                                }, 500);
                                return;
                            } else {
                                // Try alternative selectors if the specific button wasn't found
                                const modalButtons = simulator.iframeDoc.querySelectorAll('.modal button, .confirm-modal button');
                                simulator.log(`Found ${modalButtons.length} potential confirmation buttons`);
                                
                                // Find button with confirm/yes text
                                const alternateBtn = Array.from(modalButtons).find(btn => {
                                    const text = btn.textContent.toLowerCase().trim();
                                    return text.includes('yes') || text.includes('clear') || text.includes('confirm') || text.includes('ok');
                                });
                                
                                if (alternateBtn) {
                                    simulator.log(`Found alternate confirmation button with text: "${alternateBtn.textContent.trim()}"`);
                                    alternateBtn.click();
                                    
                                    // Wait a bit longer before resetting the iframe
                                    setTimeout(() => {
                                        // Reset iframe
                                        simulator.iframe.src = simulator.iframe.src;
                                    }, 500);
                                    return;
                                }
                            }
                        } catch (error) {
                            simulator.log(`Error confirming data clear: ${error.message}`);
                        }
                        
                        // Reset iframe if we couldn't find the confirm button
                        simulator.iframe.src = simulator.iframe.src;
                    }, 1000); // Increased from 500ms to 1000ms
                    
                    // Don't immediately reset the iframe, wait for the setTimeout
                    return;
                }
            }
            
            // If we couldn't find the clearBtn, reset the iframe
            this.iframe.src = this.iframe.src;
        } catch (error) {
            this.log(`Error clearing app data: ${error.message}`);
            // Still reset iframe on error
            this.iframe.src = this.iframe.src;
        }
        
        // Reset state
        this.currentRound = 0;
        this.actionQueue = [];
        this.playerNames = [];
        this.activePlayers = [];
        this.sittingOutPlayers = [];
        this.manualSitOutPlayers = new Set(); // Reset manual sit out tracking
        this.playerManualSitOutRounds = {}; // Reset manual sit out rounds tracking
        this.autoTimeLimitSitOut = new Set(); // Reset auto time limit sit out tracking
        this.playerStats = {}; // Reset player stats
        this.roundStats = {}; // Reset round stats
        this.playerStatusHistory = {}; // Reset status history
        
        this.actionStatus.textContent = 'Waiting to start...';
        this.log('Simulation reset.');
        this.showToast('Simulation reset successfully', 'info');
        this.updateStatusDisplay();
        
        this.updatePopupStatus();
    }
    
    // Execute the next action in the queue
    async executeNextAction() {
        // If paused, do nothing
        if (this.isPaused) return;

        // If there are no actions in the queue, try to generate more
        if (this.actionQueue.length === 0) {
            this.log('No more actions in queue, generating next actions...');
            this.generateNextActions();
            
            // If still no actions after generating, try to force a next round action
            if (this.actionQueue.length === 0) {
                this.log('No actions generated - forcing a GenerateNextRoundAction to continue simulation');
                this.actionQueue.push(new GenerateNextRoundAction());
            }
        }

        // Execute the next action if we have one
        if (this.actionQueue.length > 0) {
            // Get the next action from the queue
            const action = this.actionQueue.shift();
            
            try {
                // Log the action we're executing
                this.log(`Executing action: ${action.description}`);
                
                // Execute the action
                await action.execute(this);
                
                // Sync player data after action execution to keep stats updated
                if (action instanceof SubmitScoresAction) {
                    // We need to sync after submitting scores to update games played counts
                    // Wait a bit to ensure webapp has updated its state
                    this.log('Waiting for webapp to update player stats...');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    try {
                        // Force reset the cache timestamp to ensure a fresh sync
                        this.lastWebappSync = 0;
                        await this.syncPlayerDataFromWebapp();
                        
                        // Additional log to verify data
                        this.log('Player games played after score submission:');
                        Object.keys(this.webappPlayerCache).forEach(name => {
                            this.log(`  ${name}: ${this.webappPlayerCache[name].gamesPlayed || 0} games`);
                        });
                    } catch (syncError) {
                        this.log(`Error syncing player data after score submission: ${syncError.message}`);
                    }
                }
                
                // Update the action counter
                this.actionsExecuted++;
                this.updateStatusDisplay();
            } catch (error) {
                this.log(`Error executing action: ${error.message}`);
                this.log(`Error in auto run: ${error.message}`);
                
                // If in auto-run mode, stop on error
                if (this.isAutoRunning) {
                    this.stopAutoRun();
                }
            }
        } else {
            this.log('No actions in queue, simulation complete.');
        }
    }
    
    // Check for players whose manual sit-out period has ended
    checkManualSitOutPlayers() {
        // If sit outs are disabled, activate all sitting out players immediately
        if (this.enableSitOutToggle && !this.enableSitOutToggle.checked && this.sittingOutPlayers.length > 0) {
            this.log(`Sit outs are disabled but there are ${this.sittingOutPlayers.length} players sitting out. Activating all of them.`);
            
            // Create and execute an action to activate all sitting out players
            const activateAction = new ActivateSpecificPlayersAction([...this.sittingOutPlayers]);
            this.actionQueue.unshift(activateAction); // Add at the beginning to execute immediately
            
            // Clear all manual sit-out tracking
            this.manualSitOutPlayers.clear();
            this.playerManualSitOutRounds = {};
            
            return;
        }
        
        // Build a list of players who should be activated
        const playersToActivate = [];
        
        // Loop through all players with manual sit-out periods
        for (const [playerName, sitOutInfo] of Object.entries(this.playerManualSitOutRounds)) {
            // Skip players who have left the tournament
            if (this.playerStats[playerName] && this.playerStats[playerName].hasLeftTournament) {
                this.log(`Player ${playerName} has left the tournament, will not be activated`);
                continue;
            }
            
            // Special handling for players with exactly 1 round sit-out
            if (sitOutInfo.forceSingleRound && this.currentRound > sitOutInfo.startRound) {
                this.log(`Player ${playerName} has a forced 1-round sit-out and current round ${this.currentRound} > start round ${sitOutInfo.startRound}`);
                
                // Check if player is still in manualSitOutPlayers and sittingOutPlayers
                if (this.manualSitOutPlayers.has(playerName) && this.sittingOutPlayers.includes(playerName)) {
                    playersToActivate.push(playerName);
                    this.log(`Player ${playerName} 1-round sit-out period has ended, will be activated immediately`);
                    
                    // Remove player from manual sit-out tracking
                    this.manualSitOutPlayers.delete(playerName);
                    
                    // Clear the manual sit-out rounds record to prevent any stale data
                    delete this.playerManualSitOutRounds[playerName];
                    
                    // Record this for history tracking
                    if (!this.playerStatusHistory[playerName]) {
                        this.playerStatusHistory[playerName] = [];
                    }
                    this.playerStatusHistory[playerName].push({
                        round: this.currentRound,
                        status: 'Active',
                        reason: 'Single-round sit-out period ended'
                    });
                    
                    continue;
                }
            }
            
            // Standard handling for other sit-out durations
            // If current round has reached or exceeded the end round, player should be activated
            if (this.currentRound >= sitOutInfo.endRound) {
                // Check if player is still in manualSitOutPlayers and sittingOutPlayers
                if (this.manualSitOutPlayers.has(playerName) && this.sittingOutPlayers.includes(playerName)) {
                    playersToActivate.push(playerName);
                    this.log(`Player ${playerName} sit-out period (${sitOutInfo.duration} rounds) has ended at round ${this.currentRound}`);
                    
                    // Remove player from manual sit-out tracking
                    this.manualSitOutPlayers.delete(playerName);
                    
                    // Clear the manual sit-out rounds record to prevent any stale data
                    delete this.playerManualSitOutRounds[playerName];
                    
                    // Record this for history tracking but don't remove player from sittingOutPlayers yet
                    // The action will handle the actual activation
                    if (!this.playerStatusHistory[playerName]) {
                        this.playerStatusHistory[playerName] = [];
                    }
                    this.playerStatusHistory[playerName].push({
                        round: this.currentRound,
                        status: 'Active',
                        reason: 'Manual sit-out period ended'
                    });
                }
            }
        }
        
        if (playersToActivate.length > 0) {
            this.log(`Will activate ${playersToActivate.length} players: ${playersToActivate.join(', ')}`);
            this.showToast(`Activating ${playersToActivate.length} players whose sit-out period ended`, 'info');
            
            // Create and execute an action to properly activate these players in the UI
            const activateAction = new ActivateSpecificPlayersAction(playersToActivate);
            this.actionQueue.unshift(activateAction); // Add at the beginning to execute immediately
        }
    }
    
    // Toggle auto run mode
    toggleAutoRun() {
        if (this.autoRunBtn.textContent === 'Auto Run') {
            this.startAutoRun();
        } else {
            this.stopAutoRun();
        }
        
        this.updatePopupStatus();
    }
    
    // Start auto-running actions
    startAutoRun() {
        // Clear any existing interval first to avoid duplicates
        if (this.autoRunInterval) {
            clearInterval(this.autoRunInterval);
            this.autoRunInterval = null;
        }
        
        // Get the selected speed
        const speedSelect = document.getElementById('simulationSpeed');
        const speedValue = speedSelect ? speedSelect.value : 'medium';
        const delay = this.speedMap[speedValue] || 2500; // Default to medium speed
        
        this.log('Auto run started.');
        
        // Create a more robust auto-run function with better error handling
        const runNextAction = async () => {
            try {
                if (!this.isRunning) {
                    this.log('Simulation not running, stopping auto run.');
                    this.stopAutoRun();
                    return;
                }
                
                if (this.isPaused) {
                    this.log('Auto run paused, waiting for resume.');
                    return;
                }
                
                if (this.actionQueue.length === 0) {
                    this.log('No more actions in queue, generating next actions...');
                    this.generateNextActions();
                    
                    // If still no actions, we might be done
                    if (this.actionQueue.length === 0) {
                        this.log('No more actions generated, stopping auto run.');
                        this.stopAutoRun();
                        return;
                    }
                }
                
                // Execute the next action with error handling
                await this.executeNextAction().catch(err => {
                    this.log(`Error in auto run: ${err.message}`);
                    // Continue with next action despite errors
                });
                
                // Update the status after each action
                this.updateStatusDisplay();
                
            } catch (error) {
                this.log(`Auto run error: ${error.message}`);
            }
        };
        
        // Initial run
        runNextAction();
        
        // Set interval to continue running
        this.autoRunInterval = setInterval(runNextAction, delay);
        
        // Update button text
        if (this.autoRunBtn) {
            this.autoRunBtn.textContent = 'Stop Auto';
        }
        
        // Update popup status
        this.updatePopupStatus();
    }
    
    // Stop auto execution
    stopAutoRun() {
        clearInterval(this.autoRunInterval);
        this.autoRunInterval = null;
        this.autoRunBtn.textContent = 'Auto Run';
        this.log('Auto run stopped.');
    }
    
    // Build the initial queue of actions
    buildInitialActionQueue() {
        // Clear any existing queue
        this.actionQueue = [];
        
        try {
            // Get configuration values, with defaults if elements don't exist
            const courtCount = this.courtCountInput && this.courtCountInput.value ? 
                parseInt(this.courtCountInput.value) : 2;
                
            const initialPlayerCount = this.initialPlayerCountInput && this.initialPlayerCountInput.value ? 
                parseInt(this.initialPlayerCountInput.value) : 4;
            
            // First, set court count
            this.actionQueue.push(new SetCourtCountAction(courtCount));
            
            // Then add initial players
            this.actionQueue.push(new AddPlayersAction(initialPlayerCount));
            
            // Start tournament
            this.actionQueue.push(new StartTournamentAction());
            
            this.log(`Initial action queue built with ${courtCount} courts and ${initialPlayerCount} players.`);
        } catch (error) {
            this.log(`Error building initial action queue: ${error.message}`);
            // Set to default actions if there's an error
            this.actionQueue = [
                new SetCourtCountAction(2),
                new AddPlayersAction(4),
                new StartTournamentAction()
            ];
        }
        
        this.updateStatusDisplay();
    }
    
    // Generate next actions based on simulation state
    generateNextActions() {
        try {
            // Safely get the max rounds and max players with defaults
            const maxRounds = this.maxRoundsInput && this.maxRoundsInput.value ? parseInt(this.maxRoundsInput.value) : 25;
            const maxPlayers = this.maxPlayersInput && this.maxPlayersInput.value ? parseInt(this.maxPlayersInput.value) : 50;
            
            // Check if we've reached max rounds or players
            if (this.currentRound >= maxRounds || this.playerNames.length >= maxPlayers) {
                this.log('Simulation completed: reached maximum rounds or players.');
                this.showToast('Simulation completed!', 'success');
                this.stopAutoRun();
                return;
            }
            
            // Initialize round stats for next round (will be incremented in GenerateNextRoundAction)
            const nextRound = this.currentRound + 1;
            this.roundStats[nextRound] = {
                totalDuration: 0,
                matches: [],
                longestMatchDuration: 0
            };
            
            // Determine what actions to take next based on current state and random chance
            const actions = [];
            
            // Determine the current game state to decide which actions to add
            const roundContainers = this.iframeDoc ? this.iframeDoc.querySelectorAll('.round-container, .round') : [];
            const currentRoundContainer = roundContainers.length > 0 ? roundContainers[roundContainers.length - 1] : null;
            
            // Check if the current round has matches with scores or has a submit button
            const hasUnsubmittedScores = currentRoundContainer ? 
                (currentRoundContainer.querySelector('.match:not(.completed):not(.skipped)') !== null) : false;
            const hasSubmitButton = currentRoundContainer ? 
                (currentRoundContainer.querySelector('.submit-scores-btn') !== null) : false;
            
            // Add appropriate actions based on the current state
            if (hasUnsubmittedScores || hasSubmitButton) {
                // If we have matches that need scores, add the submit scores action
                this.log('Current round has unsubmitted scores, adding SubmitScoresAction');
                actions.push(new SubmitScoresAction());
            } else {
                // If scores are submitted, generate next round
                this.log('Scores are already submitted, adding GenerateNextRoundAction');
                actions.push(new GenerateNextRoundAction());
            }
            
            // Safely check feature toggles - default to enabled if not accessible
            const isAddPlayersEnabled = this.enableAddPlayersToggle ? this.enableAddPlayersToggle.checked : true;
            const isSitOutEnabled = this.enableSitOutToggle ? this.enableSitOutToggle.checked : true;
            const isEditRoundsEnabled = this.enableEditRoundsToggle ? this.enableEditRoundsToggle.checked : true;
            const isEditHistoryEnabled = this.enableEditHistoryToggle ? this.enableEditHistoryToggle.checked : true;
            const isSkipMatchesEnabled = this.enableSkipMatchesToggle ? this.enableSkipMatchesToggle.checked : true;
            const isAddMatchesEnabled = this.enableAddMatchesToggle ? this.enableAddMatchesToggle.checked : true;
            
            // Randomly determine if we should add players
            if (isAddPlayersEnabled && 
                this.playerNames.length < maxPlayers && 
                Math.random() < 0.3) {
                const playersToAdd = Math.floor(Math.random() * 5) + 1; // 1-5 players
                actions.push(new AddPlayersAction(playersToAdd));
            }
            
            // Randomly determine if we should toggle sit out status
            if (isSitOutEnabled && this.playerNames.length > 6 && Math.random() < 0.3) {
                if (this.activePlayers.length > 6) {
                    // Sit out some random players
                    const numToSitOut = Math.min(
                        Math.floor(Math.random() * 3) + 1, // 1-3 players
                        this.activePlayers.length - 4 // Ensure at least 4 active players remain
                    );
                    actions.push(new SitOutPlayersAction(numToSitOut));
                    this.log('Added sit out players action because manual sit outs are enabled');
                } else if (this.sittingOutPlayers.length > 0) {
                    // Activate some sitting out players
                    const numToActivate = Math.min(
                        Math.floor(Math.random() * 2) + 1, // 1-2 players
                        this.sittingOutPlayers.length
                    );
                    actions.push(new ActivatePlayersAction(numToActivate));
                }
            } else if (!isSitOutEnabled && this.sittingOutPlayers.length > 0) {
                // If sit outs are disabled but we have sitting out players, activate all of them
                actions.push(new ActivatePlayersAction(this.sittingOutPlayers.length));
                this.log('Adding action to activate all sitting out players because manual sit outs are disabled');
            }
            
            // Randomly determine if we should edit a round
            if (isEditRoundsEnabled && Math.random() < 0.15) {
                actions.push(new EditRoundAction());
            }
            
            // Randomly determine if we should edit match history
            if (isEditHistoryEnabled && this.currentRound > 2 && Math.random() < 0.1) {
                actions.push(new EditMatchHistoryAction());
            }
            
            // Generate next round
            actions.push(new GenerateNextRoundAction());
            
            // Randomly determine if we should add matches
            if (isAddMatchesEnabled && Math.random() < 0.2) {
                actions.push(new AddMatchAction());
            }
            
            // Randomly determine if we should skip matches
            if (isSkipMatchesEnabled && Math.random() < 0.15) {
                // Only add this action if skip matches is enabled
                actions.push(new SkipMatchAction());
                this.log('Added skip match action because skip matches is enabled');
            } else {
                this.log('Skip match action not added because skip matches is disabled');
            }
            
            // Add actions to queue
            this.actionQueue.push(...actions);
        } catch (error) {
            this.log(`Error generating next actions: ${error.message}`);
            
            // Still generate some basic actions to keep the simulation going
            this.actionQueue.push(new SubmitScoresAction());
            this.actionQueue.push(new GenerateNextRoundAction());
        }
    }
    
    // Update status display
    updateStatusDisplay() {
        try {
            // Safely update each element if it exists
            if (this.currentRoundEl) {
                this.currentRoundEl.textContent = this.currentRound;
            }
            
            if (this.totalPlayersEl) {
                this.totalPlayersEl.textContent = this.playerNames.length;
            }
            
            if (this.activePlayersEl) {
                this.activePlayersEl.textContent = this.activePlayers.length;
            }
            
            if (this.sittingOutPlayersEl) {
                this.sittingOutPlayersEl.textContent = this.sittingOutPlayers.length;
            }
            
            // Update popup if it exists
            this.updatePopupStatus();
        } catch (error) {
            console.log(`Error updating status display: ${error.message}`);
        }
    }
    
    // Disable or enable settings inputs
    disableSettings(disabled) {
        try {
            // Safely disable/enable each input if it exists
            const safelyToggleElement = (element, isDisabled) => {
                if (element) element.disabled = isDisabled;
            };
            
            // Court and player count
            safelyToggleElement(this.courtCountInput, disabled);
            safelyToggleElement(this.initialPlayerCountInput, disabled);
            safelyToggleElement(this.maxRoundsInput, disabled);
            safelyToggleElement(this.maxPlayersInput, disabled);
            safelyToggleElement(this.simulationSpeedSelect, disabled);
            
            // Available time range
            safelyToggleElement(this.minAvailableTimeInput, disabled);
            safelyToggleElement(this.maxAvailableTimeInput, disabled);
            
            // Sit out rounds
            safelyToggleElement(this.minSitOutRoundsInput, disabled);
            safelyToggleElement(this.maxSitOutRoundsInput, disabled);
            
            // Feature toggles
            safelyToggleElement(this.enableAddPlayersToggle, disabled);
            safelyToggleElement(this.enableSitOutToggle, disabled);
            safelyToggleElement(this.enableEditRoundsToggle, disabled);
            safelyToggleElement(this.enableEditHistoryToggle, disabled);
            safelyToggleElement(this.enableSkipMatchesToggle, disabled);
            safelyToggleElement(this.enableAddMatchesToggle, disabled);
            safelyToggleElement(this.enableTimeLimitsToggle, disabled);
            
            this.log(`Settings ${disabled ? 'disabled' : 'enabled'}`);
        } catch (error) {
            this.log(`Error toggling settings: ${error.message}`);
        }
    }
    
    // Log a message to the simulation log
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${timestamp}] ${message}`;
        this.simulationLog.appendChild(logEntry);
        this.simulationLog.scrollTop = this.simulationLog.scrollHeight;
    }
    
    // Show a toast notification
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Determine icon based on type
        let iconName;
        switch(type) {
            case 'success': iconName = 'check_circle'; break;
            case 'error': iconName = 'error'; break;
            case 'warning': iconName = 'warning'; break;
            default: iconName = 'info';
        }
        
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
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Start animation
        setTimeout(() => {
            toast.classList.add('active');
            
            // Animate progress bar
            const progressBar = toast.querySelector('.toast-progress-bar');
            if (progressBar) {
                progressBar.style.transition = `width 3000ms linear`;
                progressBar.style.width = '0%';
            }
        }, 10);
        
        // Add event listener to close button
        const closeButton = toast.querySelector('.toast-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                dismissToast(toast);
            });
        }
        
        // Auto-remove after duration
        const timeoutId = setTimeout(() => {
            dismissToast(toast);
        }, 3000);
        
        // Store timeout ID for possible early dismissal
        toast.dataset.timeoutId = timeoutId;
        
        // Function to dismiss toast
        function dismissToast(toastElement) {
            // Clear timeout if it exists
            const storedTimeoutId = toastElement.dataset.timeoutId;
            if (storedTimeoutId) {
                clearTimeout(parseInt(storedTimeoutId));
            }
            
            // Remove active class to trigger exit animation
            toastElement.classList.remove('active');
            
            // Remove after animation completes
            setTimeout(() => {
                if (toastElement.parentNode) {
                    toastElement.remove();
                }
            }, 300);
        }
        
        return toast;
    }
    
    // Helper to get a random player name
    getRandomPlayerName() {
        const firstNames = ['John', 'Amy', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Olivia', 
                           'Daniel', 'Sophia', 'Matthew', 'Isabella', 'Christopher', 'Mia', 'Andrew', 
                           'Charlotte', 'Ethan', 'Amelia', 'Joseph', 'Harper', 'William', 'Evelyn', 
                           'Alexander', 'Abigail', 'Nicholas', 'Emily', 'Ryan', 'Elizabeth', 'Anthony', 
                           'Sofia', 'Joshua', 'Avery', 'Tyler', 'Ella', 'Christian', 'Madison'];
                           
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 
                          'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 
                          'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 
                          'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 
                          'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter'];
        
        // Generate a random name
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        // Ensure uniqueness by adding a number if necessary
        let fullName = `${firstName} ${lastName}`;
        let counter = 1;
        
        while (this.playerNames.includes(fullName)) {
            fullName = `${firstName} ${lastName} ${counter}`;
            counter++;
        }
        
        return fullName;
    }
    
    // Get random players from a list
    getRandomPlayers(playerList, count) {
        const shuffled = [...playerList].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    // Generate random scores for a match
    generateRandomScores() {
        // Always winning by 2 points, maximum 11 unless winning by 2 forces higher
        const baseScore = Math.floor(Math.random() * 10) + 1; // 1-10
        const winningScore = Math.max(11, baseScore + 2);
        const losingScore = baseScore;
        
        // Randomly decide which team wins
        if (Math.random() < 0.5) {
            return [winningScore, losingScore];
        } else {
            return [losingScore, winningScore];
        }
    }
    
    // Show player statistics in a modal
    showPlayerStats() {
        this.log('Showing player stats');
        
        // Force a sync with webapp to get the latest data
        this.syncPlayerDataFromWebapp()
            .then(() => {
                // Check if player stats modal already exists
                let playerStatsModal = document.getElementById('playerStatsModal');
                
                if (playerStatsModal) {
                    document.body.removeChild(playerStatsModal);
                }
                
                // Create player stats modal
                playerStatsModal = document.createElement('div');
                playerStatsModal.id = 'playerStatsModal';
                playerStatsModal.className = 'stats-modal';
                    
                    // Create modal content
                    const modalContent = document.createElement('div');
                    modalContent.className = 'stats-modal-content';
                    
                    // Create close button
                    const closeBtn = document.createElement('span');
                    closeBtn.className = 'stats-close-btn';
                    closeBtn.innerHTML = '&times;';
                    closeBtn.onclick = function() {
                    playerStatsModal.style.display = 'none';
                    };
                    
                    // Create header
                    const header = document.createElement('h3');
                    header.textContent = 'Player Statistics';
                    
                    // Create table
                const table = document.createElement('table');
                table.className = 'stats-table';
                
                // Create table header
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                
                // Define columns
                const columns = ['Player', 'Games Played', 'Play Time', 'Wait Time', 'Total Time', 'Available Time', 'Status'];
                
                columns.forEach(col => {
                    const th = document.createElement('th');
                    th.textContent = col;
                    headerRow.appendChild(th);
                });
                
                thead.appendChild(headerRow);
                table.appendChild(thead);
                    
                    // Create table body
                    const tbody = document.createElement('tbody');
                
                // FIX: Add validation function to check and correct player times
                const validatePlayerStats = (name, stats, gamesPlayed) => {
                    if (gamesPlayed > 0) {
                        // Calculate expected play time based on games played (assuming 12 min average)
                        const avgMatchDuration = 12; 
                        const expectedPlayTime = gamesPlayed * avgMatchDuration;
                        const actualPlayTime = stats.playTime || 0;
                        
                        // If there's a significant discrepancy (more than 30%)
                        if (actualPlayTime < expectedPlayTime * 0.7 || actualPlayTime === 0) {
                            this.log(`FIXING in stats display: Player ${name} has ${gamesPlayed} games but only ${actualPlayTime} min play time`);
                            
                            // Update play time to match games played
                            stats.playTime = expectedPlayTime;
                            
                            // Also adjust wait time proportionally if very low
                            if (stats.waitTime < gamesPlayed * 2) {
                                const waitTimePerGame = 5; // Estimated wait time per game
                                stats.waitTime = Math.round(gamesPlayed * waitTimePerGame);
                            }
                            
                            // Update total time
                            stats.totalTime = stats.playTime + stats.waitTime;
                            
                            this.log(`Updated stats for ${name}: playTime=${stats.playTime}, waitTime=${stats.waitTime}, totalTime=${stats.totalTime}`);
                            return true; // Indicated changes were made
                        }
                    }
                    return false; // No changes made
                };
                
                // FIXED: Use Object.keys(this.playerStats) instead of this.playerNames
                this.log(`Found ${Object.keys(this.playerStats).length} players with statistics to display`);
                
                // Get all players from playerStats and sort them alphabetically
                const allPlayers = Object.keys(this.playerStats).sort();
                
                // Add rows for each player
                for (const name of allPlayers) {
                    const stats = this.playerStats[name];
                    
                    // Get games played from webapp
                    let gamesPlayed = 0;
                    const player = this.getPlayerFromWebapp(name);
                        if (player) {
                            gamesPlayed = player.gamesPlayed || 0;
                    }
                    
                    // Check and possibly correct the stats before displaying
                    const corrected = validatePlayerStats(name, stats, gamesPlayed);
                    if (corrected) {
                        this.log(`Player ${name} stats were corrected before display`);
                    }
                    
                    // Ensure the total time is correctly calculated
                    stats.totalTime = (stats.playTime || 0) + (stats.waitTime || 0);
                    
                    this.log(`  ${name}: playTime=${stats.playTime || 0}, waitTime=${stats.waitTime || 0}, totalTime=${stats.totalTime}, availableTime=${stats.availableTime || 0}, hasLeftTournament=${stats.hasLeftTournament || false}`);
                    
                    const row = document.createElement('tr');
                    
                    // Player name cell with click for details
                    const nameCell = document.createElement('td');
                    const nameLink = document.createElement('a');
                    nameLink.href = '#';
                    nameLink.textContent = name;
                    nameLink.className = 'player-name-link';
                    nameLink.onclick = (e) => {
                        e.preventDefault();
                        this.showPlayerDetailStats(name);
                    };
                    nameCell.appendChild(nameLink);

                    // Games played cell
                    const gamesPlayedCell = document.createElement('td');
                    gamesPlayedCell.textContent = gamesPlayed;

                    // Play time cell
                    const playTimeCell = document.createElement('td');
                    playTimeCell.textContent = `${stats.playTime || 0} min`;

                    // Wait time cell
                    const waitTimeCell = document.createElement('td');
                    waitTimeCell.textContent = `${stats.waitTime || 0} min`;

                    // Total time cell
                    const totalTimeCell = document.createElement('td');
                    totalTimeCell.textContent = `${stats.totalTime || 0} min`;

                    // Available time cell
                    const availableTimeCell = document.createElement('td');
                    availableTimeCell.textContent = `${stats.availableTime || 0} min`;

                    // Status cell
                    const statusCell = document.createElement('td');
                    statusCell.className = stats.hasLeftTournament ? 'status-left' : 'status-active';
                    statusCell.textContent = stats.hasLeftTournament ? 'Left Tournament' : 'Active';

                    // Add cells to row
                    row.appendChild(nameCell);
                    row.appendChild(gamesPlayedCell);
                    row.appendChild(playTimeCell);
                    row.appendChild(waitTimeCell);
                    row.appendChild(totalTimeCell);
                    row.appendChild(availableTimeCell);
                    row.appendChild(statusCell);

                    // Add row to table
                    tbody.appendChild(row);
                }
                
                // Add table body to table
                table.appendChild(tbody);
                
                // Add elements to modal
                modalContent.appendChild(closeBtn);
                modalContent.appendChild(header);
                modalContent.appendChild(table);
                playerStatsModal.appendChild(modalContent);
                
                // Add modal to document
                document.body.appendChild(playerStatsModal);
                
                // Show the modal
                playerStatsModal.style.display = 'block';
                
                // Close modal when clicking outside
                window.onclick = function(event) {
                    if (event.target === playerStatsModal) {
                        playerStatsModal.style.display = 'none';
                    }
                };
            })
            .catch(error => {
                this.log(`Error syncing player data before showing stats: ${error.message}`);
                // Still try to show stats with whatever data we have
                
                // Try to display the modal with existing data
                let playerStatsModal = document.getElementById('playerStatsModal');
                if (playerStatsModal) {
                    playerStatsModal.style.display = 'block';
                } else {
                    this.log('Could not show stats modal due to initialization error');
                    this.showToast('Error displaying player statistics', 'error');
                }
            });
    }
    
    // Update the visibility and style of the stats button
    updateStatsButtonStyle() {
        if (!this.statsBtn) return;
        
        // Make the stats button more visible
        this.statsBtn.style.display = 'inline-block';
        this.statsBtn.style.padding = '8px 16px';
        this.statsBtn.style.backgroundColor = 'var(--primary-color, #3498db)';
        this.statsBtn.style.color = 'white';
        this.statsBtn.style.border = 'none';
        this.statsBtn.style.borderRadius = '4px';
        this.statsBtn.style.cursor = 'pointer';
        this.statsBtn.style.fontWeight = 'bold';
        this.statsBtn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
        
        // Add a hover effect using the onmouseover and onmouseout events
        this.statsBtn.onmouseover = function() {
            this.style.backgroundColor = 'var(--primary-color-dark, #2980b9)';
        };
        
        this.statsBtn.onmouseout = function() {
            this.style.backgroundColor = 'var(--primary-color, #3498db)';
        };
    }
    
    // Helper method to synchronize player data from the webapp
    syncPlayerDataFromWebapp() {
        return new Promise((resolve, reject) => {
            try {
                // Don't sync too frequently (at most once every 500ms)
                const now = Date.now();
                if (now - this.lastWebappSync < 500 && Object.keys(this.webappPlayerCache).length > 0) {
                    this.log('Using cached player data (synced within last 500ms)');
                    resolve(this.webappPlayerCache);
                    return;
                }
                
                // If we have an iframe with the web app
                if (this.iframe && this.iframe.contentWindow) {
                    const iframeWindow = this.iframe.contentWindow;
                    
                    try {
                        // Attempt to execute code in the iframe context
                        const playersJson = iframeWindow.eval(`
                            (function() {
                                if (typeof players !== 'undefined' && Array.isArray(players)) {
                                    return JSON.stringify(players.map(p => ({
                                        name: p.name,
                                        gamesPlayed: p.gamesPlayed || 0,
                                        victoryPoints: p.victoryPoints || 0,
                                        picklePoints: p.picklePoints || 0,
                                        pickleDifferential: p.pickleDifferential || 0
                                    })));
                                }
                                return null;
                            })()
                        `);
                        
                        if (playersJson) {
                            const webappPlayers = JSON.parse(playersJson);
                            
                            // Cache all players from the webapp
                            this.webappPlayerCache = {}; // Reset cache
                            webappPlayers.forEach(player => {
                                if (player && player.name) {
                                    // Store in global cache
                                    this.webappPlayerCache[player.name] = player;
                                    
                                    // Also update the old playerData structure for backward compatibility
                                    this.playerData[player.name] = {
                                        ...player,
                                        gamesPlayed: player.gamesPlayed || 0
                                    };
                                    
                                    // If this player doesn't exist in our stats, initialize them
                                    if (!this.playerStats[player.name]) {
                                        this.playerStats[player.name] = {
                                            playTime: 0,
                                            waitTime: 0,
                                            totalTime: 0,
                                            availableTime: this.generateRandomAvailableTime(),
                                            hasLeftTournament: false
                                        };
                                        
                                        // Initialize processedMatches set
                                        this.playerStats[player.name].processedMatches = new Set();
                                        
                                        // FIX: If player has gamesPlayed from webapp but no play time in stats,
                                        // estimate their play time based on the average match duration
                                        if (player.gamesPlayed > 0) {
                                            // Use 10 minutes as default average match length if we don't have actual data
                                            const avgMatchDuration = 10;
                                            const avgWaitTime = 5; // Average wait time between matches
                                            
                                            // Set play time based on games played
                                            this.playerStats[player.name].playTime = player.gamesPlayed * avgMatchDuration;
                                            this.playerStats[player.name].waitTime = player.gamesPlayed * avgWaitTime;
                                            this.playerStats[player.name].totalTime = this.playerStats[player.name].playTime + this.playerStats[player.name].waitTime;
                                            
                                            this.log(`Initialized player ${player.name} with ${player.gamesPlayed} games played, estimated ${this.playerStats[player.name].playTime} min play time`);
                                        }
                                    }
                                    // If player exists but has games played in webapp and 0 play time, update them
                                    else if (player.gamesPlayed > 0 && this.playerStats[player.name].playTime === 0) {
                                        // Use 10 minutes as default average match length if we don't have actual data
                                        const avgMatchDuration = 10;
                                        const avgWaitTime = 5; // Average wait time between matches
                                        
                                        // Set play time based on games played
                                        this.playerStats[player.name].playTime = player.gamesPlayed * avgMatchDuration;
                                        this.playerStats[player.name].waitTime = player.gamesPlayed * avgWaitTime;
                                        this.playerStats[player.name].totalTime = this.playerStats[player.name].playTime + this.playerStats[player.name].waitTime;
                                        
                                        this.log(`Updated player ${player.name} with ${player.gamesPlayed} games played, estimated ${this.playerStats[player.name].playTime} min play time`);
                                    }
                                    // FIX: Check for significant discrepancies between games played and play time and correct them
                                    else if (player.gamesPlayed > 0) {
                                        // Calculate expected play time based on games played (assuming 12 min average)
                                        const avgMatchDuration = 12; 
                                        const expectedPlayTime = player.gamesPlayed * avgMatchDuration;
                                        const actualPlayTime = this.playerStats[player.name].playTime || 0;
                                        
                                        // If there's a significant discrepancy between expected and actual (more than 40%)
                                        if (Math.abs(expectedPlayTime - actualPlayTime) / expectedPlayTime > 0.4) {
                                            this.log(`FIXING: Player ${player.name} has ${player.gamesPlayed} games but only ${actualPlayTime} min play time. Updating to match games played.`);
                                            
                                            // Update play time to match games played
                                            this.playerStats[player.name].playTime = expectedPlayTime;
                                            
                                            // Also adjust wait time proportionally
                                            const waitTimePerGame = 5; // Estimated wait time per game
                                            this.playerStats[player.name].waitTime = Math.round(player.gamesPlayed * waitTimePerGame);
                                            
                                            // Update total time
                                            this.playerStats[player.name].totalTime = this.playerStats[player.name].playTime + this.playerStats[player.name].waitTime;
                                            
                                            this.log(`Updated player ${player.name} time stats: playTime=${this.playerStats[player.name].playTime}, waitTime=${this.playerStats[player.name].waitTime}, totalTime=${this.playerStats[player.name].totalTime}`);
                                        }
                                    }
                                }
                            });
                            
                            this.lastWebappSync = now;
                            this.log(`Synced ${webappPlayers.length} players from webapp using eval`);
                            resolve(this.webappPlayerCache);
                            return;
                        }
                    } catch (evalError) {
                        this.log(`Error evaluating in iframe context: ${evalError.message}`);
                    }
                    
                    // Fall back to direct access if eval fails
                    if (iframeWindow.players && Array.isArray(iframeWindow.players)) {
                        // Cache all players from the webapp
                        this.webappPlayerCache = {}; // Reset cache
                        iframeWindow.players.forEach(player => {
                            if (player && player.name) {
                                // Store in global cache
                                this.webappPlayerCache[player.name] = {
                                    name: player.name,
                                    gamesPlayed: player.gamesPlayed || 0,
                                    victoryPoints: player.victoryPoints || 0,
                                    picklePoints: player.picklePoints || 0,
                                    pickleDifferential: player.pickleDifferential || 0
                                };
                                
                                // Also update the old playerData structure for backward compatibility
                                this.playerData[player.name] = {
                                    ...player,
                                    gamesPlayed: player.gamesPlayed || 0
                                };
                                
                                // If this player doesn't exist in our stats, initialize them
                                if (!this.playerStats[player.name]) {
                                    this.playerStats[player.name] = {
                                        playTime: 0,
                                        waitTime: 0,
                                        totalTime: 0,
                                        availableTime: this.generateRandomAvailableTime(),
                                        hasLeftTournament: false
                                    };
                                    
                                    // Initialize processedMatches set
                                    this.playerStats[player.name].processedMatches = new Set();
                                    
                                    // FIX: If player has gamesPlayed from webapp but no play time in stats,
                                    // estimate their play time based on the average match duration
                                    if (player.gamesPlayed > 0) {
                                        // Use 10 minutes as default average match length if we don't have actual data
                                        const avgMatchDuration = 10;
                                        const avgWaitTime = 5; // Average wait time between matches
                                        
                                        // Set play time based on games played
                                        this.playerStats[player.name].playTime = player.gamesPlayed * avgMatchDuration;
                                        this.playerStats[player.name].waitTime = player.gamesPlayed * avgWaitTime;
                                        this.playerStats[player.name].totalTime = this.playerStats[player.name].playTime + this.playerStats[player.name].waitTime;
                                        
                                        this.log(`Initialized player ${player.name} with ${player.gamesPlayed} games played, estimated ${this.playerStats[player.name].playTime} min play time`);
                                    }
                                }
                                // If player exists but has games played in webapp and 0 play time, update them
                                else if (player.gamesPlayed > 0 && this.playerStats[player.name].playTime === 0) {
                                    // Use 10 minutes as default average match length if we don't have actual data
                                    const avgMatchDuration = 10;
                                    const avgWaitTime = 5; // Average wait time between matches
                                    
                                    // Set play time based on games played
                                    this.playerStats[player.name].playTime = player.gamesPlayed * avgMatchDuration;
                                    this.playerStats[player.name].waitTime = player.gamesPlayed * avgWaitTime;
                                    this.playerStats[player.name].totalTime = this.playerStats[player.name].playTime + this.playerStats[player.name].waitTime;
                                    
                                    this.log(`Updated player ${player.name} with ${player.gamesPlayed} games played, estimated ${this.playerStats[player.name].playTime} min play time`);
                                }
                            }
                        });
                        
                        this.lastWebappSync = now;
                        this.log(`Synced ${Object.keys(this.webappPlayerCache).length} players from webapp`);
                        resolve(this.webappPlayerCache);
                    } else {
                        this.log('No players array found in webapp');
                        reject(new Error('No players array found'));
                    }
                } else {
                    this.log('No iframe available or contentWindow not accessible');
                    reject(new Error('No iframe available'));
                }
            } catch (error) {
                this.log(`Error syncing player data: ${error.message}`);
                reject(error);
            }
        });
    }
    
    // Show detailed statistics for a specific player
    showPlayerDetailStats(playerName) {
        this.log(`Showing detailed stats for ${playerName}`);
        
        // Get player stats
        const playerStats = this.playerStats[playerName];
        if (!playerStats) {
            this.showToast(`No stats found for ${playerName}`, 'error');
            return;
        }
        
        // Get games played from webapp
                let gamesPlayed = 0;
        const webappPlayer = this.getPlayerFromWebapp(playerName);
        if (webappPlayer) {
            gamesPlayed = webappPlayer.gamesPlayed || 0;
        }
        
        // Create modal
        let detailModal = document.getElementById('playerDetailModal');
                if (detailModal) {
                    document.body.removeChild(detailModal);
                }
                
                detailModal = document.createElement('div');
        detailModal.id = 'playerDetailModal';
                detailModal.className = 'stats-modal';
                
                // Create modal content
                const modalContent = document.createElement('div');
        modalContent.className = 'stats-modal-content player-detail-modal';
        
        // Add custom styling for player details
        modalContent.style.maxWidth = '800px';
        modalContent.style.padding = '20px';
        modalContent.style.backgroundColor = '#f8f9fa';
        modalContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        modalContent.style.borderRadius = '8px';
                
                // Create close button
                const closeBtn = document.createElement('span');
                closeBtn.className = 'stats-close-btn';
                closeBtn.innerHTML = '&times;';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '15px';
        closeBtn.style.right = '20px';
        closeBtn.style.cursor = 'pointer';
                closeBtn.onclick = function() {
                    detailModal.style.display = 'none';
                };
                
        // Create header with player name
                const header = document.createElement('h3');
        header.textContent = `Player Details: ${playerName}`;
        header.style.margin = '0 0 20px 0';
        header.style.padding = '0 0 10px 0';
        header.style.borderBottom = '2px solid #3498db';
        header.style.color = '#2c3e50';
        header.style.fontSize = '24px';
        
        // Create player summary section
        const summarySection = document.createElement('div');
        summarySection.className = 'player-summary-section';
        summarySection.style.backgroundColor = 'white';
        summarySection.style.borderRadius = '8px';
        summarySection.style.padding = '15px';
        summarySection.style.marginBottom = '20px';
        summarySection.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
        
        // Calculate additional statistics
        const roundsAvailable = Object.keys(this.roundStats).length;
        const roundsPlayed = this.collectPlayerMatchData(playerName).length;
        const winLossRecord = this.calculatePlayerWinLoss(playerName);
        const averageMatchDuration = playerStats.playTime > 0 && gamesPlayed > 0 ? 
            Math.round(playerStats.playTime / gamesPlayed) : 0;
        const totalWaitPercent = playerStats.totalTime > 0 ? 
            Math.round((playerStats.waitTime / playerStats.totalTime) * 100) : 0;
        const timeUtilization = playerStats.availableTime > 0 ? 
            Math.round((playerStats.totalTime / playerStats.availableTime) * 100) : 0;
        
        // Format the summary information with improved styling
        summarySection.innerHTML = `
            <style>
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-bottom: 15px;
                }
                .summary-item {
                    text-align: center;
                    padding: 10px;
                    background-color: #f8f9fa;
                    border-radius: 6px;
                    border-left: 4px solid #3498db;
                }
                .summary-value {
                    font-size: 22px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 5px;
                }
                .summary-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    color: #7f8c8d;
                    letter-spacing: 0.5px;
                }
                .current-status {
                    text-align: center;
                    padding: 10px;
                    border-radius: 6px;
                    font-weight: bold;
                    color: white;
                }
                .status-active {
                    background-color: #2ecc71;
                }
                .status-left {
                    background-color: #e74c3c;
                }
                .status-warning {
                    background-color: #f39c12;
                }
                .status-sitting-out {
                    background-color: #95a5a6;
                }
                .status-waiting {
                    background-color: #3498db;
                }
            </style>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-value">${gamesPlayed}</div>
                    <div class="summary-label">Games Played</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${winLossRecord.wins}W - ${winLossRecord.losses}L</div>
                    <div class="summary-label">Win/Loss Record</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${roundsPlayed}/${roundsAvailable}</div>
                    <div class="summary-label">Rounds Played</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${playerStats.playTime || 0} min</div>
                    <div class="summary-label">Play Time</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${playerStats.waitTime || 0} min</div>
                    <div class="summary-label">Wait Time</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${playerStats.totalTime || 0}/${playerStats.availableTime || 0} min</div>
                    <div class="summary-label">Time Used</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${averageMatchDuration} min</div>
                    <div class="summary-label">Avg Match Duration</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${totalWaitPercent}%</div>
                    <div class="summary-label">Wait Time %</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${timeUtilization}%</div>
                    <div class="summary-label">Time Utilization</div>
                </div>
            </div>
            <div class="current-status ${playerStats.hasLeftTournament ? 'status-left' : 'status-active'}">
                Current Status: ${playerStats.hasLeftTournament ? 'Left Tournament' : 'Active'}
            </div>
        `;
        
        // Create timeline section header
        const timelineHeader = document.createElement('h4');
        timelineHeader.textContent = 'Player Timeline';
        timelineHeader.className = 'timeline-header';
        timelineHeader.style.margin = '20px 0 10px 0';
        timelineHeader.style.fontSize = '18px';
        timelineHeader.style.color = '#2c3e50';
        timelineHeader.style.borderLeft = '4px solid #3498db';
        timelineHeader.style.paddingLeft = '10px';
        
        // Collect the timeline data
        const timelineData = this.buildPlayerTimeline(playerName);
        
        // Create timeline table
        const timelineTable = document.createElement('table');
        timelineTable.className = 'player-timeline-table';
        timelineTable.style.width = '100%';
        timelineTable.style.borderCollapse = 'collapse';
        timelineTable.style.marginTop = '10px';
        timelineTable.style.backgroundColor = 'white';
        timelineTable.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
        timelineTable.style.borderRadius = '8px';
        timelineTable.style.overflow = 'hidden';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.style.backgroundColor = '#f2f6f9';
        const headerRow = document.createElement('tr');
        
        // Define columns
        const columns = ['Round', 'Match/Activity', 'Play Time', 'Wait Time', 'Total Time', 'Remaining Time', 'Status'];
        
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            th.style.padding = '12px 15px';
            th.style.textAlign = 'left';
            th.style.borderBottom = '2px solid #ddd';
            th.style.color = '#34495e';
            th.style.fontSize = '14px';
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        timelineTable.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        // Add CSS for timeline rows
        const timelineStyles = document.createElement('style');
        timelineStyles.textContent = `
            .timeline-join {
                background-color: #edf7ff;
            }
            .timeline-match {
                background-color: #f5ffed;
            }
            .timeline-match:hover {
                background-color: #e8f5e0;
            }
            .timeline-sitout {
                background-color: #f7f7f7;
            }
            .timeline-left, .timeline-time-limit {
                background-color: #fff0ef;
            }
            .timeline-warning {
                background-color: #fff7e6;
            }
            .timeline-no-match {
                background-color: #f0f6ff;
            }
            .time-warning {
                color: #f39c12;
                font-weight: bold;
            }
            .time-expired {
                color: #e74c3c;
                font-weight: bold;
            }
            tr:nth-child(even):not(.timeline-join):not(.timeline-match):not(.timeline-sitout):not(.timeline-left):not(.timeline-warning):not(.timeline-no-match) {
                background-color: #f9f9f9;
            }
            td {
                padding: 10px 15px;
                border-bottom: 1px solid #e0e0e0;
                vertical-align: middle;
            }
            tr:last-child td {
                border-bottom: none;
            }
        `;
        document.head.appendChild(timelineStyles);
        
        // Add rows for each timeline entry
        timelineData.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.className = this.getTimelineRowClass(entry);
            
            // Round column
            const roundCell = document.createElement('td');
            roundCell.textContent = entry.round || '-';
            roundCell.style.fontWeight = 'bold';
            row.appendChild(roundCell);
            
            // Match/Activity column
            const activityCell = document.createElement('td');
            activityCell.innerHTML = entry.activity || '-';
            row.appendChild(activityCell);
            
            // Play Time column
            const playTimeCell = document.createElement('td');
            if (entry.playTime !== undefined) {
                playTimeCell.textContent = entry.playTime > 0 ? `+${entry.playTime} min` : '0 min';
                if (entry.playTime > 0) {
                    playTimeCell.style.color = '#27ae60';
                    playTimeCell.style.fontWeight = 'bold';
                }
            } else {
                playTimeCell.textContent = '-';
                playTimeCell.style.color = '#bdc3c7';
            }
            row.appendChild(playTimeCell);
            
            // Wait Time column
            const waitTimeCell = document.createElement('td');
            if (entry.waitTime !== undefined) {
                waitTimeCell.textContent = entry.waitTime > 0 ? `+${entry.waitTime} min` : '0 min';
                if (entry.waitTime > 0) {
                    waitTimeCell.style.color = '#3498db';
                    waitTimeCell.style.fontWeight = entry.waitTime > 10 ? 'bold' : 'normal';
                }
            } else {
                waitTimeCell.textContent = '-';
                waitTimeCell.style.color = '#bdc3c7';
            }
            row.appendChild(waitTimeCell);
            
            // Total Time column
            const totalTimeCell = document.createElement('td');
            if (entry.totalTime !== undefined) {
                totalTimeCell.textContent = `${entry.totalTime} min`;
            } else {
                totalTimeCell.textContent = '-';
                totalTimeCell.style.color = '#bdc3c7';
            }
            row.appendChild(totalTimeCell);
            
            // Remaining Time column
            const remainingTimeCell = document.createElement('td');
            if (entry.remainingTime !== undefined) {
                remainingTimeCell.textContent = `${entry.remainingTime} min`;
                
                // Add warning styling if time is running low
                if (entry.remainingTime <= 15 && entry.remainingTime > 0) {
                    remainingTimeCell.className = 'time-warning';
                } else if (entry.remainingTime <= 0) {
                    remainingTimeCell.className = 'time-expired';
                }
            } else {
                remainingTimeCell.textContent = '-';
                remainingTimeCell.style.color = '#bdc3c7';
            }
            row.appendChild(remainingTimeCell);
            
            // Status column
            const statusCell = document.createElement('td');
            statusCell.textContent = entry.status || '-';
            statusCell.className = this.getStatusCellClass(entry.status);
            statusCell.style.borderRadius = '4px';
            statusCell.style.padding = '5px 8px';
            statusCell.style.textAlign = 'center';
            statusCell.style.fontSize = '12px';
            statusCell.style.fontWeight = 'bold';
            row.appendChild(statusCell);
            
            tbody.appendChild(row);
        });
        
        timelineTable.appendChild(tbody);
                
                // Add elements to modal
                modalContent.appendChild(closeBtn);
                modalContent.appendChild(header);
        modalContent.appendChild(summarySection);
        modalContent.appendChild(timelineHeader);
        modalContent.appendChild(timelineTable);
                detailModal.appendChild(modalContent);
        
        // Style the modal
        detailModal.style.display = 'none';
        detailModal.style.position = 'fixed';
        detailModal.style.zIndex = '1000';
        detailModal.style.left = '0';
        detailModal.style.top = '0';
        detailModal.style.width = '100%';
        detailModal.style.height = '100%';
        detailModal.style.overflow = 'auto';
        detailModal.style.backgroundColor = 'rgba(0,0,0,0.4)';
                
                // Add modal to document
                document.body.appendChild(detailModal);
                
        // Show the modal
                detailModal.style.display = 'block';
                
                // Close modal when clicking outside
                window.onclick = function(event) {
                    if (event.target === detailModal) {
                        detailModal.style.display = 'none';
                    }
                };
    }
    
    // Helper method to collect all matches a player participated in
    collectPlayerMatchData(playerName) {
        const playerMatches = [];
        
        // Check each round
        Object.keys(this.roundStats).sort((a, b) => parseInt(a) - parseInt(b)).forEach(roundNumber => {
            const roundData = this.roundStats[roundNumber];
            
            // Check each match in the round
            if (roundData.matches) {
                roundData.matches.forEach(match => {
                    // Check if player was in this match
                    const allPlayers = match.players || [];
                    if (allPlayers.includes(playerName)) {
                        playerMatches.push({
                            round: roundNumber,
                            match: match,
                            isWinner: match.winner && match.winner.includes(playerName)
                        });
                    }
                });
            }
        });
        
        return playerMatches;
    }
    
    // Helper method to calculate win/loss record
    calculatePlayerWinLoss(playerName) {
        const matches = this.collectPlayerMatchData(playerName);
        let wins = 0;
        let losses = 0;
        
        matches.forEach(matchData => {
            if (matchData.isWinner) {
                wins++;
            } else {
                losses++;
            }
        });
        
        return { wins, losses };
    }
    
    // Helper method to build the player timeline
    buildPlayerTimeline(playerName) {
        const timeline = [];
        const playerStats = this.playerStats[playerName];
        if (!playerStats) return timeline;
        
        // Start with player joining the tournament (if we know when they joined)
        if (playerStats.joinRound !== undefined) {
            timeline.push({
                type: 'join',
                round: `Before R${playerStats.joinRound}`,
                activity: 'Joined Tournament',
                totalTime: 0,
                remainingTime: playerStats.availableTime,
                status: 'Active'
            });
        } else {
            // If we don't know when they joined, assume they started at the beginning
            timeline.push({
                type: 'join',
                round: 'Start',
                activity: 'Joined Tournament',
                totalTime: 0,
                remainingTime: playerStats.availableTime,
                status: 'Active'
            });
        }
        
        // Get all rounds in order
        const roundNumbers = Object.keys(this.roundStats).sort((a, b) => parseInt(a) - parseInt(b));
        
        // Running totals for time
        let cumulativePlayTime = 0;
        let cumulativeWaitTime = 0;
        let cumulativeTotalTime = 0;
        
        // For each round, check what happened with the player
        roundNumbers.forEach(roundNumber => {
            const roundData = this.roundStats[roundNumber];
            
            // Check if player was manually sat out this round
            let manualSitOut = false;
            if (roundData.manualChanges) {
                const sitOutChange = roundData.manualChanges.find(change => 
                    change.player === playerName && change.action === 'sat-out');
                if (sitOutChange) {
                    manualSitOut = true;
                    
                    // Add the manual sit out entry
                    timeline.push({
                        type: 'manual-sitout',
                        round: roundNumber,
                        activity: `Manual Sit Out (${sitOutChange.duration || 1} round${sitOutChange.duration > 1 ? 's' : ''})`,
                        playTime: 0,
                        waitTime: 0, // No wait time added for manual sit out
                        totalTime: cumulativeTotalTime,
                        remainingTime: playerStats.availableTime - cumulativeTotalTime,
                        status: 'Manual Sit Out'
                    });
                }
            }
            
            // Check if player was time-limited this round
            let timeLimited = false;
            if (roundData.timeBasedChanges) {
                const timeChange = roundData.timeBasedChanges.find(change => 
                    change.player === playerName && change.action === 'left');
                if (timeChange) {
                    timeLimited = true;
                    
                    // Add the time limit entry
                    timeline.push({
                        type: 'time-limit',
                        round: roundNumber,
                        activity: 'Time Limit Reached',
                        totalTime: cumulativeTotalTime,
                        remainingTime: 0,
                        status: 'Left Tournament'
                    });
                }
            }
            
            // Skip further processing if player was manually sitting out or time limited
            if (manualSitOut || timeLimited) {
                return;
            }
            
            // Check if player played in any matches this round
            let playerMatches = [];
            if (roundData.matches) {
                playerMatches = roundData.matches.filter(match => {
                    const allPlayers = match.players || [];
                    return allPlayers.includes(playerName);
                });
            }
            
            if (playerMatches.length > 0) {
                // Player played in a match
                playerMatches.forEach(match => {
                    // Calculate team and opponent information
                    let teamPlayers = [];
                    let opposingPlayers = [];
                    
                    // Determine which team the player was on
                    if (match.team1Players && match.team1Players.includes(playerName)) {
                        teamPlayers = match.team1Players.filter(p => p !== playerName);
                        opposingPlayers = match.team2Players || [];
                    } else if (match.team2Players && match.team2Players.includes(playerName)) {
                        teamPlayers = match.team2Players.filter(p => p !== playerName);
                        opposingPlayers = match.team1Players || [];
                    } else if (match.players) {
                        // Fall back to the players array if we don't have explicit team assignments
                        const halfLength = Math.ceil(match.players.length / 2);
                        const team1 = match.players.slice(0, halfLength);
                        const team2 = match.players.slice(halfLength);
                        
                        if (team1.includes(playerName)) {
                            teamPlayers = team1.filter(p => p !== playerName);
                            opposingPlayers = team2;
                        } else {
                            teamPlayers = team2.filter(p => p !== playerName);
                            opposingPlayers = team1;
                        }
                    }
                    
                    // Format the activity information
                    const isWinner = match.winner && match.winner.includes(playerName);
                    const result = isWinner ? 'Win' : 'Loss';
                    const score = match.score ? `${match.score[0]}-${match.score[1]}` : 'N/A';
                    const teamMates = teamPlayers.length > 0 ? 
                        `with ${teamPlayers.join(' & ')}` : 'Singles';
                    const opponents = opposingPlayers.length > 0 ? 
                        `vs ${opposingPlayers.join(' & ')}` : '';
                    
                    // Calculate time for this match
                    const playTime = match.duration || 0;
                    const waitTime = match.waitTime || 0;
                    
                    // Update cumulative times
                    cumulativePlayTime += playTime;
                    cumulativeWaitTime += waitTime;
                    cumulativeTotalTime = cumulativePlayTime + cumulativeWaitTime;
                    
                    // Add the match entry
                    timeline.push({
                        type: 'match',
                        round: roundNumber,
                        activity: `<strong>${result}</strong> (${score}) ${teamMates} ${opponents}`,
                        playTime: playTime,
                        waitTime: waitTime,
                        totalTime: cumulativeTotalTime,
                        remainingTime: playerStats.availableTime - cumulativeTotalTime,
                        status: 'Playing'
                    });
                    
                    // Add a time warning if player is approaching their limit
                    const remainingTime = playerStats.availableTime - cumulativeTotalTime;
                    if (remainingTime <= 15 && remainingTime > 0 && !timeline.some(e => e.type === 'time-warning')) {
                        timeline.push({
                            type: 'time-warning',
                            round: roundNumber,
                            activity: `<strong>Time Warning:</strong> ${remainingTime} minutes remaining`,
                            totalTime: cumulativeTotalTime,
                            remainingTime: remainingTime,
                            status: 'Active - Limited Time'
                        });
                    }
                });
            } else if (this.activePlayers.includes(playerName)) {
                // Player was active but didn't get a match
                const waitTime = roundData.totalDuration || 0;
                cumulativeWaitTime += waitTime;
                cumulativeTotalTime = cumulativePlayTime + cumulativeWaitTime;
                
                timeline.push({
                    type: 'no-match',
                    round: roundNumber,
                    activity: 'No Match Assigned',
                    playTime: 0,
                    waitTime: waitTime,
                    totalTime: cumulativeTotalTime,
                    remainingTime: playerStats.availableTime - cumulativeTotalTime,
                    status: 'Waiting'
                });
            }
        });
        
        // Add final status if player left the tournament
        if (playerStats.hasLeftTournament && !timeline.some(e => e.type === 'time-limit')) {
            timeline.push({
                type: 'left',
                round: 'End',
                activity: 'Left Tournament',
                totalTime: cumulativeTotalTime,
                remainingTime: playerStats.availableTime - cumulativeTotalTime,
                status: 'Left Tournament'
            });
        }
        
        return timeline;
    }
    
    // Helper method to determine the CSS class for timeline rows
    getTimelineRowClass(entry) {
        switch (entry.type) {
            case 'join':
                return 'timeline-join';
            case 'match':
                return 'timeline-match';
            case 'manual-sitout':
                return 'timeline-sitout';
            case 'time-limit':
            case 'left':
                return 'timeline-left';
            case 'time-warning':
                return 'timeline-warning';
            case 'no-match':
                return 'timeline-no-match';
            default:
                return '';
        }
    }
    
    // Helper method to determine the CSS class for status cells
    getStatusCellClass(status) {
        if (!status) return '';
        
        if (status.includes('Left Tournament')) {
            return 'status-left';
        } else if (status.includes('Manual Sit Out')) {
            return 'status-sitting-out';
        } else if (status.includes('Limited Time')) {
            return 'status-warning';
        } else if (status === 'Waiting') {
            return 'status-waiting';
        } else if (status === 'Playing') {
            return 'status-active';
        }
        
        return '';
    }
    
    // Generate random match duration between 8-20 minutes
    generateRandomMatchDuration() {
        return Math.floor(Math.random() * 13) + 8; // 8-20 minutes
    }
    
    // Show round and match statistics in a modal
    showRoundStats() {
        // Log round stats for debugging
        this.log(`DEBUG - Round stats data: ${JSON.stringify(this.roundStats)}`);
        
        // Check if round stats modal already exists
        let roundStatsModal = document.getElementById('roundStatsModal');
        
        if (!roundStatsModal) {
            // Create round stats modal
            roundStatsModal = document.createElement('div');
            roundStatsModal.id = 'roundStatsModal';
            roundStatsModal.className = 'stats-modal';
            
            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.className = 'stats-modal-content';
            
            // Create close button
            const closeBtn = document.createElement('span');
            closeBtn.className = 'stats-close-btn';
            closeBtn.innerHTML = '&times;';
            closeBtn.onclick = function() {
                roundStatsModal.style.display = 'none';
            };
            
            // Create header
            const header = document.createElement('h3');
            header.textContent = 'Round & Match Statistics';
            
            // Create content container for round data
            const roundsContainer = document.createElement('div');
            roundsContainer.id = 'roundsStatsContainer';
            roundsContainer.className = 'rounds-container';
            
            // Add elements to modal
            modalContent.appendChild(closeBtn);
            modalContent.appendChild(header);
            modalContent.appendChild(roundsContainer);
            roundStatsModal.appendChild(modalContent);
            
            // Add modal to document
            document.body.appendChild(roundStatsModal);
            
            // Close modal when clicking outside
            window.onclick = function(event) {
                if (event.target === roundStatsModal) {
                    roundStatsModal.style.display = 'none';
                }
            };
        }
        
        // Update content with current round stats
        const roundsContainer = document.getElementById('roundsStatsContainer');
        roundsContainer.innerHTML = '';
        
        // Create round stats for each round
        const roundNumbers = Object.keys(this.roundStats).sort((a, b) => parseInt(a) - parseInt(b));
        
        for (const roundNumber of roundNumbers) {
            const roundData = this.roundStats[roundNumber];
            
            // Create section for this round
                const roundSection = document.createElement('div');
                roundSection.className = 'round-section';
                
                // Round header
                const roundHeader = document.createElement('h4');
                roundHeader.className = 'round-header';
            roundHeader.textContent = `Round ${roundNumber}`;
                
            // Round duration if available
            if (roundData.duration) {
                const roundDuration = document.createElement('div');
                roundDuration.className = 'round-duration';
                roundDuration.textContent = `Duration: ${roundData.duration} minutes`;
                roundSection.appendChild(roundHeader);
                roundSection.appendChild(roundDuration);
            } else {
                roundSection.appendChild(roundHeader);
            }
            
            // Player changes section (additions/removals)
            if (roundData.playerChanges && (roundData.playerChanges.added.length > 0 || roundData.playerChanges.removed.length > 0)) {
                const playerChangesDiv = document.createElement('div');
                playerChangesDiv.className = 'player-changes';
                
                if (roundData.playerChanges.added.length > 0) {
                    const addedPlayers = document.createElement('div');
                    addedPlayers.innerHTML = `<strong>Players Added:</strong> <span class="status-active">${roundData.playerChanges.added.join(', ')}</span>`;
                    playerChangesDiv.appendChild(addedPlayers);
                }
                
                if (roundData.playerChanges.removed.length > 0) {
                    const removedPlayers = document.createElement('div');
                    removedPlayers.innerHTML = `<strong>Players Removed:</strong> <span class="status-left">${roundData.playerChanges.removed.join(', ')}</span>`;
                    playerChangesDiv.appendChild(removedPlayers);
                }
                
                roundSection.appendChild(playerChangesDiv);
            }
            
            // Time-based changes section
            if (roundData.timeBasedChanges && roundData.timeBasedChanges.length > 0) {
                const timeBasedDiv = document.createElement('div');
                timeBasedDiv.className = 'time-based-changes';
                
                const timeChangesHeader = document.createElement('h5');
                timeChangesHeader.textContent = 'Time-Based Player Changes';
                timeBasedDiv.appendChild(timeChangesHeader);
                
                const timeChangesList = document.createElement('ul');
                timeChangesList.className = 'time-changes-list';
                
                for (const change of roundData.timeBasedChanges) {
                    const listItem = document.createElement('li');
                    let statusClass = '';
                    
                    if (change.action === 'joined') {
                        statusClass = 'status-active';
                    } else if (change.action === 'left') {
                        statusClass = 'status-left';
                    }
                    
                    listItem.innerHTML = `<span class="${statusClass}">${change.player}</span> ${change.action} the tournament (Available time: ${change.availableTime} minutes)`;
                    timeChangesList.appendChild(listItem);
                }
                
                timeBasedDiv.appendChild(timeChangesList);
                roundSection.appendChild(timeBasedDiv);
            }
            
            // Manual sit-outs and activations
            if (roundData.manualChanges && roundData.manualChanges.length > 0) {
                const manualChangesDiv = document.createElement('div');
                manualChangesDiv.className = 'manual-changes';
                
                const manualHeader = document.createElement('h5');
                manualHeader.textContent = 'Manual Status Changes';
                manualChangesDiv.appendChild(manualHeader);
                
                const manualList = document.createElement('ul');
                manualList.className = 'manual-changes-list';
                
                for (const change of roundData.manualChanges) {
                    const listItem = document.createElement('li');
                    let statusClass = change.action === 'activated' ? 'status-active' : 'status-sitting-out';
                    
                    if (change.action === 'activated') {
                        listItem.innerHTML = `<span class="${statusClass}">${change.player}</span> was manually activated`;
                    } else if (change.action === 'sat-out') {
                        const duration = change.duration || 'unknown';
                        listItem.innerHTML = `<span class="${statusClass}">${change.player}</span> manually sat out for ${duration} round(s)`;
                    }
                    
                    manualList.appendChild(listItem);
                }
                
                manualChangesDiv.appendChild(manualList);
                roundSection.appendChild(manualChangesDiv);
            }
            
            // Matches section
                if (roundData.matches && roundData.matches.length > 0) {
                const matchesDiv = document.createElement('div');
                matchesDiv.className = 'matches-container';
                
                const matchesHeader = document.createElement('h5');
                matchesHeader.textContent = 'Matches';
                matchesDiv.appendChild(matchesHeader);
                
                // Create match table
                    const matchTable = document.createElement('table');
                    matchTable.className = 'match-stats-table';
                    
                // Create table header
                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                ['Court', 'Players', 'Score', 'Winner', 'Duration'].forEach(text => {
                        const th = document.createElement('th');
                        th.textContent = text;
                        headerRow.appendChild(th);
                    });
                    thead.appendChild(headerRow);
                    matchTable.appendChild(thead);
                    
                // Create table body with match data
                    const tbody = document.createElement('tbody');
                    
                    roundData.matches.forEach((match, index) => {
                        const row = document.createElement('tr');
                        
                    // Court number
                    const courtCell = document.createElement('td');
                    courtCell.textContent = match.court || `Court ${index + 1}`;
                    row.appendChild(courtCell);
                    
                    // Players
                    const playersCell = document.createElement('td');
                    playersCell.textContent = match.players.join(' vs ');
                    
                    // FIX: Update the match display format to show Team1 vs Team2 format
                    if (match.team1Players && match.team2Players) {
                        // If we have explicit team players, use them
                        const team1Text = match.team1Players.join(' & ');
                        const team2Text = match.team2Players.join(' & ');
                        playersCell.textContent = `${team1Text} vs ${team2Text}`;
                    } else if (match.team1 && match.team2) {
                        // If we have team labels, use them
                        playersCell.textContent = `${match.team1} vs ${match.team2}`;
                    } else if (Array.isArray(match.players) && match.players.length > 0) {
                        // If we only have the players array, split it into two teams
                        const halfLength = Math.ceil(match.players.length / 2);
                        const team1Players = match.players.slice(0, halfLength);
                        const team2Players = match.players.slice(halfLength);
                        const team1Text = team1Players.join(' & ');
                        const team2Text = team2Players.join(' & ');
                        playersCell.textContent = `${team1Text} vs ${team2Text}`;
                    }
                    
                    row.appendChild(playersCell);
                    
                    // Score
                    const scoreCell = document.createElement('td');
                    scoreCell.textContent = match.score ? match.score.join('-') : 'Not recorded';
                    row.appendChild(scoreCell);
                    
                    // Winner
                    const winnerCell = document.createElement('td');
                    if (match.winner && match.winner.length > 0) {
                        winnerCell.textContent = match.winner.join(', ');
                        winnerCell.className = 'status-active';
                    } else {
                        winnerCell.textContent = 'Not recorded';
                    }
                    row.appendChild(winnerCell);
                        
                        // Duration
                        const durationCell = document.createElement('td');
                    durationCell.textContent = match.duration ? `${match.duration} minutes` : 'Not recorded';
                        row.appendChild(durationCell);
                        
                        tbody.appendChild(row);
                    });
                    
                    matchTable.appendChild(tbody);
                matchesDiv.appendChild(matchTable);
                roundSection.appendChild(matchesDiv);
            }
            
            // Add this round section to the container
                roundsContainer.appendChild(roundSection);
        }
        
        // Show the modal
        roundStatsModal.style.display = 'block';
    }
    
    // Get available time range with fallbacks for null/undefined values
    getAvailableTimeRange() {
        // Default values
        let min = 30;  // 30 minutes
        let max = 240; // 4 hours
        
        try {
            // Try to get min value safely
            if (this.minAvailableTimeInput && typeof this.minAvailableTimeInput.value !== 'undefined') {
                const parsedMin = parseInt(this.minAvailableTimeInput.value);
                if (!isNaN(parsedMin)) {
                    min = parsedMin;
                }
            }
            
            // Try to get max value safely
            if (this.maxAvailableTimeInput && typeof this.maxAvailableTimeInput.value !== 'undefined') {
                const parsedMax = parseInt(this.maxAvailableTimeInput.value);
                if (!isNaN(parsedMax)) {
                    max = parsedMax;
                }
            }
        } catch (error) {
            this.log(`Error getting available time range: ${error.message}`);
            // Use defaults if there's an error
        }
        
        // Make sure min <= max
        if (min > max) {
            const temp = min;
            min = max;
            max = temp;
        }
        
        return { min, max };
    }
    
    // Get manual sit out rounds range with fallbacks for null/undefined values
    getSitOutRoundsRange() {
        // Default values
        let min = 1;
        let max = 4;
        
        try {
            // Try to get min value safely
            if (this.minSitOutRoundsInput && typeof this.minSitOutRoundsInput.value !== 'undefined') {
                const parsedMin = parseInt(this.minSitOutRoundsInput.value);
                if (!isNaN(parsedMin)) {
                    min = parsedMin;
                }
            }
            
            // Try to get max value safely
            if (this.maxSitOutRoundsInput && typeof this.maxSitOutRoundsInput.value !== 'undefined') {
                const parsedMax = parseInt(this.maxSitOutRoundsInput.value);
                if (!isNaN(parsedMax)) {
                    max = parsedMax;
                }
            }
        } catch (error) {
            this.log(`Error getting sit out rounds range: ${error.message}`);
            // Use defaults if there's an error
        }
        
        // Make sure min <= max
        if (min > max) {
            const temp = min;
            min = max;
            max = temp;
        }
        
        return { min, max };
    }
    
    // Generate random number of rounds for a player to sit out
    generateRandomSitOutRounds() {
        const { min, max } = this.getSitOutRoundsRange();
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Generate random available time for a player within the set range
    generateRandomAvailableTime() {
        const { min, max } = this.getAvailableTimeRange();
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Save simulator settings to localStorage
    saveSimulatorSettings() {
        try {
            const settings = {
                courtCount: this.courtCountInput.value,
                initialPlayerCount: this.initialPlayerCountInput.value,
                maxRounds: this.maxRoundsInput.value,
                maxPlayers: this.maxPlayersInput.value,
                simulationSpeed: this.simulationSpeedSelect.value,
                minAvailableTime: this.minAvailableTimeInput.value,
                maxAvailableTime: this.maxAvailableTimeInput.value,
                minSitOutRounds: this.minSitOutRoundsInput.value,
                maxSitOutRounds: this.maxSitOutRoundsInput.value,
                enableAddPlayers: this.enableAddPlayersToggle.checked,
                enableSitOut: this.enableSitOutToggle.checked,
                enableEditRounds: this.enableEditRoundsToggle.checked,
                enableEditHistory: this.enableEditHistoryToggle.checked,
                enableSkipMatches: this.enableSkipMatchesToggle.checked,
                enableAddMatches: this.enableAddMatchesToggle.checked,
                enableTimeLimits: this.enableTimeLimitsToggle.checked
            };
            
            localStorage.setItem('simulatorSettings', JSON.stringify(settings));
            this.log('Simulator settings saved to localStorage');
        } catch (error) {
            this.log(`Error saving simulator settings: ${error.message}`);
        }
    }
    
    // Load simulator settings from localStorage
    loadSimulatorSettings() {
        try {
            const settingsJson = localStorage.getItem('simulatorSettings');
            if (!settingsJson) return;
            
            const settings = JSON.parse(settingsJson);
            
            // Apply each setting
            if (settings.courtCount) this.courtCountInput.value = settings.courtCount;
            if (settings.initialPlayerCount) this.initialPlayerCountInput.value = settings.initialPlayerCount;
            if (settings.maxRounds) this.maxRoundsInput.value = settings.maxRounds;
            if (settings.maxPlayers) this.maxPlayersInput.value = settings.maxPlayers;
            if (settings.simulationSpeed) this.simulationSpeedSelect.value = settings.simulationSpeed;
            if (settings.minAvailableTime) this.minAvailableTimeInput.value = settings.minAvailableTime;
            if (settings.maxAvailableTime) this.maxAvailableTimeInput.value = settings.maxAvailableTime;
            if (settings.minSitOutRounds) this.minSitOutRoundsInput.value = settings.minSitOutRounds;
            if (settings.maxSitOutRounds) this.maxSitOutRoundsInput.value = settings.maxSitOutRounds;
            
            // Apply toggle settings - only if explicitly defined
            if (settings.enableAddPlayers !== undefined) this.enableAddPlayersToggle.checked = settings.enableAddPlayers;
            if (settings.enableSitOut !== undefined) this.enableSitOutToggle.checked = settings.enableSitOut;
            if (settings.enableEditRounds !== undefined) this.enableEditRoundsToggle.checked = settings.enableEditRounds;
            if (settings.enableEditHistory !== undefined) this.enableEditHistoryToggle.checked = settings.enableEditHistory;
            if (settings.enableSkipMatches !== undefined) this.enableSkipMatchesToggle.checked = settings.enableSkipMatches;
            if (settings.enableAddMatches !== undefined) this.enableAddMatchesToggle.checked = settings.enableAddMatches;
            if (settings.enableTimeLimits !== undefined) this.enableTimeLimitsToggle.checked = settings.enableTimeLimits;
            
            this.log('Simulator settings loaded from localStorage');
        } catch (error) {
            this.log(`Error loading simulator settings: ${error.message}`);
        }
    }
    
    // Reset simulator settings to default
    resetSimulatorSettings() {
        // Default values
        this.courtCountInput.value = 4;
        this.initialPlayerCountInput.value = 6;
        this.maxRoundsInput.value = 25;
        this.maxPlayersInput.value = 50;
        this.simulationSpeedSelect.value = 'medium';
        this.minAvailableTimeInput.value = 30;
        this.maxAvailableTimeInput.value = 240;
        this.minSitOutRoundsInput.value = 1;
        this.maxSitOutRoundsInput.value = 4;
        
        // Reset toggles
        this.enableAddPlayersToggle.checked = true;
        this.enableSitOutToggle.checked = true;
        this.enableEditRoundsToggle.checked = true;
        this.enableEditHistoryToggle.checked = true;
        this.enableSkipMatchesToggle.checked = true;
        this.enableAddMatchesToggle.checked = true;
        this.enableTimeLimitsToggle.checked = true;
        
        // Remove settings from localStorage
        localStorage.removeItem('simulatorSettings');
        
        this.log('Simulator settings reset to defaults');
        this.showToast('Settings reset to defaults', 'success');
    }
    
    // Create a popup control panel
    createPopupControlPanel() {
        // Close any existing popup
        if (this.popupWindow && !this.popupWindow.closed) {
            this.popupWindow.close();
        }
        
        // Store current auto-run state so we can restore it
        const wasAutoRunning = this.autoRunInterval !== null;
        
        // If auto-run is active, temporarily stop it
        if (wasAutoRunning) {
            this.log('Temporarily pausing auto-run while opening popup window');
            clearInterval(this.autoRunInterval);
            this.autoRunInterval = null;
        }
        
        // Define popup features
        const width = 400;
        const height = 300;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,location=no,menubar=no,toolbar=no`;
        
        // Open popup window
        this.popupWindow = window.open('', 'PicklePairsControl', features);
        
        if (!this.popupWindow) {
            this.log('Failed to open popup window. Please check your popup blocker settings.');
            this.showToast('Failed to open control panel. Please allow popups for this site.', 'error');
            
            // Restore auto-run if it was active
            if (wasAutoRunning) {
                this.startAutoRun();
            }
            return;
        }
        
        // Hide the iframe overlay since we'll control from the popup
        this.hideOverlay(true);
        
        // Auto-enable fullscreen mode when opening popup
        const appContainer = document.querySelector('.app-container');
        const toggleBtn = document.querySelector('.toggle-panel-btn');
        
        if (appContainer && toggleBtn && !appContainer.classList.contains('fullscreen-mode')) {
            this.toggleSimulatorPanel(toggleBtn);
        }
        
        // Create popup content
        const popupContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pickle Pairs Controls</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 20px;
                color: #333;
            }
            .control-panel {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                padding: 20px;
            }
            h1 {
                margin-top: 0;
                font-size: 1.5rem;
                color: #2196F3;
            }
            .controls {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 20px;
            }
            button {
                padding: 10px;
                border: none;
                border-radius: 4px;
                background-color: #2196F3;
                color: white;
                cursor: pointer;
                font-weight: 500;
            }
            button:hover {
                background-color: #1976D2;
            }
            button:disabled {
                background-color: #B0BEC5;
                cursor: not-allowed;
            }
            .danger-btn {
                background-color: #F44336;
            }
            .danger-btn:hover {
                background-color: #D32F2F;
            }
            .warning-btn {
                background-color: #FF9800;
            }
            .warning-btn:hover {
                background-color: #F57C00;
            }
            .status {
                padding: 10px;
                background-color: #f5f5f5;
                border-radius: 4px;
                margin-bottom: 15px;
            }
            .speed-control {
                margin-top: 15px;
            }
            select {
                padding: 8px;
                border-radius: 4px;
                border: 1px solid #ddd;
                width: 100%;
            }
            .toggle-ui-btn {
                background-color: #673AB7;
                width: 100%;
                margin-top: 15px;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
            }
            .toggle-ui-btn:hover {
                background-color: #5E35B1;
            }
            .material-symbols-rounded {
                font-size: 18px;
            }
        </style>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    </head>
    <body>
        <div class="control-panel">
            <h1>Pickle Pairs Simulator Controls</h1>
            <div class="status" id="statusDisplay">Waiting to start...</div>
            <div class="controls">
                <button id="popupStartBtn" ${this.isRunning ? 'disabled' : ''}>Start</button>
                <button id="popupPauseBtn" ${!this.isRunning || this.isPaused ? 'disabled' : ''}>
                    ${this.isPaused ? 'Resume' : 'Pause'}
                </button>
                <button id="popupNextActionBtn" ${!this.isRunning ? 'disabled' : ''}>Next Action</button>
                <button id="popupAutoRunBtn" ${!this.isRunning ? 'disabled' : ''}>
                    ${this.autoRunInterval ? 'Stop Auto' : 'Auto Run'}
                </button>
                <button id="popupResetBtn" class="danger-btn">Reset</button>
                <button id="popupStatsBtn" class="warning-btn" ${!this.isRunning ? 'disabled' : ''}>Show Stats</button>
            </div>
            <div class="speed-control">
                <label for="popupSpeedSelect">Auto Run Speed:</label>
                <select id="popupSpeedSelect">
                    <option value="slow">Slow</option>
                    <option value="medium" selected>Medium</option>
                    <option value="fast">Fast</option>
                </select>
            </div>
            <button id="popupTogglePanelBtn" class="toggle-ui-btn">
                <span class="material-symbols-rounded" id="toggleIcon">fullscreen</span>
                <span id="toggleText">Enter Fullscreen Mode</span>
            </button>
        </div>
        <script>
            // Setup message passing with parent window
            
            // Send message to parent window
            function sendMessage(action, data = {}) {
                try {
                    window.opener.postMessage({
                        action: action,
                        data: data,
                        source: 'pickle-control-panel'
                    }, window.opener.origin);
                } catch (error) {
                    console.error('Error sending message to parent:', error);
                }
            }
            
            // Add event listeners
            document.getElementById('popupStartBtn').addEventListener('click', () => sendMessage('start'));
            document.getElementById('popupPauseBtn').addEventListener('click', () => sendMessage('toggle-pause'));
            document.getElementById('popupNextActionBtn').addEventListener('click', () => sendMessage('next-action'));
            document.getElementById('popupAutoRunBtn').addEventListener('click', () => sendMessage('toggle-auto-run'));
            document.getElementById('popupResetBtn').addEventListener('click', () => sendMessage('reset'));
            document.getElementById('popupStatsBtn').addEventListener('click', () => sendMessage('show-stats'));
            document.getElementById('popupTogglePanelBtn').addEventListener('click', () => sendMessage('toggle-panel'));
            document.getElementById('popupSpeedSelect').addEventListener('change', () => {
                sendMessage('set-speed', { speed: document.getElementById('popupSpeedSelect').value });
            });
            
            // Listen for messages from parent
            window.addEventListener('message', (event) => {
                try {
                    if (event.origin !== window.opener.origin) return;
                    
                    const { action, data } = event.data;
                    
                    if (action === 'update-status') {
                        document.getElementById('statusDisplay').textContent = data.status;
                        
                        // Update button states
                        document.getElementById('popupStartBtn').disabled = data.isRunning;
                        document.getElementById('popupPauseBtn').disabled = !data.isRunning;
                        document.getElementById('popupPauseBtn').textContent = data.isPaused ? 'Resume' : 'Pause';
                        document.getElementById('popupNextActionBtn').disabled = !data.isRunning;
                        document.getElementById('popupAutoRunBtn').disabled = !data.isRunning;
                        document.getElementById('popupAutoRunBtn').textContent = data.isAutoRunning ? 'Stop Auto' : 'Auto Run';
                        document.getElementById('popupStatsBtn').disabled = !data.isRunning;
                        
                        // Update fullscreen toggle button
                        if (data.isFullscreen) {
                            document.getElementById('toggleIcon').textContent = 'fullscreen_exit';
                            document.getElementById('toggleText').textContent = 'Exit Fullscreen Mode';
                        } else {
                            document.getElementById('toggleIcon').textContent = 'fullscreen';
                            document.getElementById('toggleText').textContent = 'Enter Fullscreen Mode';
                        }
                    }
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            });
            
            // Request initial status
            sendMessage('get-status');
            
            // Handle window close
            window.addEventListener('beforeunload', () => {
                sendMessage('control-panel-closed');
            });
        </script>
    </body>
    </html>
    `;
        
        // Write content to popup
        this.popupWindow.document.open();
        this.popupWindow.document.write(popupContent);
        this.popupWindow.document.close();
        
        // Set up message event listener
        window.addEventListener('message', this.handlePopupMessage.bind(this));
        
        // Restore auto-run if it was active
        if (wasAutoRunning) {
            setTimeout(() => {
                this.log('Restoring auto-run after popup window opened');
                this.startAutoRun();
            }, 500);
        }
        
        this.log('Control panel popup created successfully.');
        this.showToast('Control panel opened in a new window', 'success');
    }
    
    // Hide or show overlay (different from collapse/expand)
    hideOverlay(hide = true) {
        const overlay = document.querySelector('.iframe-overlay');
        if (overlay) {
            if (hide) {
                overlay.classList.add('hidden');
                this.log('Overlay controls hidden');
            } else {
                overlay.classList.remove('hidden');
                this.log('Overlay controls shown');
            }
        }
    }
    
    // Handle messages from popup
    handlePopupMessage(event) {
        // Verify origin for security
        if (event.origin !== this.popupOrigin) return;
        
        // Check if message is from our control panel
        const { action, data, source } = event.data;
        if (source !== 'pickle-control-panel') return;
        
        try {
            // Process different action types
            switch(action) {
                case 'start':
                    this.startSimulation();
                    break;
                    
                case 'toggle-pause':
                    this.togglePause();
                    break;
                    
                case 'next-action':
                    this.executeNextAction();
                    break;
                    
                case 'toggle-auto-run':
                    this.toggleAutoRun();
                    break;
                    
                case 'reset':
                    this.resetSimulation();
                    break;
                    
                case 'show-stats':
                    this.showPlayerStats();
                    break;
                    
                case 'toggle-panel':
                    const toggleBtn = document.querySelector('.toggle-panel-btn');
                    if (toggleBtn) {
                        this.toggleSimulatorPanel(toggleBtn);
                    }
                    break;
                    
                case 'set-speed':
                    if (data && data.speed && this.speedMap[data.speed]) {
                        const speedValue = data.speed;
                        const speedDelay = this.speedMap[speedValue];
                        
                        // Try to set the speed in the main window if it exists
                        const speedInput = document.getElementById('simulationSpeed');
                        if (speedInput) {
                            speedInput.value = speedValue;
                        }
                        
                        this.log(`Auto run speed set to: ${speedValue} (${speedDelay}ms)`);
                    }
                    break;
                    
                case 'get-status':
                    this.updatePopupStatus();
                    break;
                    
                case 'control-panel-closed':
                    // Clean up if needed
                    window.removeEventListener('message', this.handlePopupMessage.bind(this));
                    this.popupWindow = null;
                    // Show the overlay again when the popup is closed
                    this.hideOverlay(false);
                    break;
            }
        } catch (error) {
            this.log(`Error handling popup message (${action}): ${error.message}`);
            this.showToast(`Error: ${error.message}`, 'error');
        }
    }
    
    // Update popup status
    updatePopupStatus() {
        // Skip if popup doesn't exist or is closed
        if (!this.popupWindow || this.popupWindow.closed) return;
        
        try {
            // Get fullscreen status
            const appContainer = document.querySelector('.app-container');
            const isFullscreen = appContainer ? appContainer.classList.contains('fullscreen-mode') : false;
            
            // Get action status text safely
            const statusText = this.actionStatus ? this.actionStatus.textContent : 'Simulator running';
            
            // Prepare status message with defensive coding against undefined values
            const statusData = {
                status: statusText || 'Simulator running',
                isRunning: Boolean(this.isRunning),
                isPaused: Boolean(this.isPaused),
                isAutoRunning: Boolean(this.autoRunInterval),
                currentRound: this.currentRound || 0,
                actionsRemaining: this.actionQueue ? this.actionQueue.length : 0,
                isFullscreen: Boolean(isFullscreen)
            };
            
            // Send the status update to popup window with try/catch
            try {
                this.popupWindow.postMessage({
                    action: 'update-status',
                    data: statusData
                }, this.popupOrigin);
            } catch (postError) {
                console.error('Error posting message to popup:', postError);
                
                // If posting fails, try again with a simpler message
                try {
                    this.popupWindow.postMessage({
                        action: 'update-status',
                        data: {
                            status: 'Communication error, still running',
                            isRunning: true
                        }
                    }, '*');
                } catch (e) {
                    // Last resort - if we can't communicate, close the popup
                    this.popupWindow.close();
                    this.popupWindow = null;
                }
            }
        } catch (error) {
            console.error('Error updating popup status:', error);
        }
    }
    
    // Create a button to toggle the simulator panel
    createTogglePanelButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-panel-btn';
        toggleBtn.innerHTML = '<span class="material-symbols-rounded">fullscreen</span>';
        toggleBtn.title = 'Enter Fullscreen Mode';
        toggleBtn.setAttribute('aria-label', 'Toggle Fullscreen Mode');
        
        // Add event listener
        toggleBtn.addEventListener('click', () => this.toggleSimulatorPanel(toggleBtn));
        
        // Add to the document
        document.body.appendChild(toggleBtn);
    }
    
    // Toggle simulator panel visibility
    toggleSimulatorPanel(toggleBtn) {
        const appContainer = document.querySelector('.app-container');
        if (!appContainer) return;
        
        // Toggle fullscreen mode
        appContainer.classList.toggle('fullscreen-mode');
        
        // Update button appearance
        const isFullscreen = appContainer.classList.contains('fullscreen-mode');
        toggleBtn.classList.toggle('panel-hidden', isFullscreen);
        
        if (isFullscreen) {
            toggleBtn.title = 'Show Simulator Panel';
            toggleBtn.querySelector('.material-symbols-rounded').textContent = 'fullscreen_exit';
            this.log('Entered fullscreen mode - only header visible');
        } else {
            toggleBtn.title = 'Hide Simulator Panel';
            toggleBtn.querySelector('.material-symbols-rounded').textContent = 'fullscreen';
            this.log('Exited fullscreen mode');
        }
    }

    // Create a placeholder element when the original is not found
    createPlaceholderElement(type) {
        const element = document.createElement(type);
        element.style.display = 'none';
        return element;
    }
    
    // Helper to count how many consecutive rounds a player hasn't played
    getConsecutiveSittingRounds(playerName) {
        if (!this.roundStats) return 0;
        
        let consecutiveRounds = 0;
        for (let round = this.currentRound; round > 0; round--) {
            const roundData = this.roundStats[round];
            if (!roundData || !roundData.matches) break;
            
            let playerFoundInRound = false;
            for (const match of roundData.matches) {
                if (match.players && match.players.includes(playerName)) {
                    playerFoundInRound = true;
                    break;
                }
            }
            
            if (playerFoundInRound) break;
            consecutiveRounds++;
        }
        
        return consecutiveRounds;
    }
    
    // Helper method to get player data from the webapp
    getPlayerFromWebapp(playerName) {
        try {
            // First check the cache for faster access
            if (this.webappPlayerCache && this.webappPlayerCache[playerName]) {
                return this.webappPlayerCache[playerName];
            }
            
            // If not in cache, try to get from iframe
            if (this.iframe && this.iframe.contentWindow) {
                // Try to access the players array from the webapp
                const iframeWindow = this.iframe.contentWindow;
                
                try {
                    // Attempt to execute code in the iframe context to access the players array
                    const result = iframeWindow.eval(`
                        (function() {
                            if (typeof players !== 'undefined' && Array.isArray(players)) {
                                const player = players.find(p => p.name === "${playerName.replace(/"/g, '\\"')}");
                                return player ? JSON.stringify({
                                    name: player.name,
                                    gamesPlayed: player.gamesPlayed || 0,
                                    victoryPoints: player.victoryPoints || 0,
                                    picklePoints: player.picklePoints || 0,
                                    pickleDifferential: player.pickleDifferential || 0
                                }) : null;
                            }
                            return null;
                        })()
                    `);
                    
                    if (result) {
                        const webappPlayer = JSON.parse(result);
                        // Add to cache for future use
                        this.webappPlayerCache[playerName] = webappPlayer;
                        this.log(`Found player in webapp: ${playerName} with ${webappPlayer.gamesPlayed || 0} games played`);
                        return webappPlayer;
                    }
                } catch (evalError) {
                    this.log(`Error evaluating in iframe context: ${evalError.message}`);
                }
                
                // Fall back to direct access (previous method)
                if (iframeWindow.players) {
                    // Find the player by name in the webapp's players array
                    const webappPlayer = iframeWindow.players.find(p => p.name === playerName);
                    if (webappPlayer) {
                        // Add to cache for future use
                        this.webappPlayerCache[playerName] = {
                            name: webappPlayer.name,
                            gamesPlayed: webappPlayer.gamesPlayed || 0,
                            victoryPoints: webappPlayer.victoryPoints || 0,
                            picklePoints: webappPlayer.picklePoints || 0,
                            pickleDifferential: webappPlayer.pickleDifferential || 0
                        };
                        this.log(`Found player in webapp: ${playerName} with ${webappPlayer.gamesPlayed || 0} games played`);
                        return this.webappPlayerCache[playerName];
                    }
                } else {
                    this.log('Could not access players array in the webapp iframe');
                }
            } else {
                this.log('No iframe available or contentWindow not accessible');
            }
            
            // If we couldn't get data from the iframe, try fallback to any stored data
            if (this.playerData && this.playerData[playerName]) {
                this.log(`Using fallback data for player: ${playerName}`);
                return this.playerData[playerName];
            }
            
            return null;
        } catch (error) {
            this.log(`Error getting player data from webapp: ${error.message}`);
            return null;
        }
    }
    
    // Add a helper method to force synchronization with a timeout
    forcePlayerDataSync(timeout = 1000) {
        return new Promise((resolve) => {
            // Reset sync timestamp to force a fresh sync
            this.lastWebappSync = 0;
            
            // Try to sync
            this.syncPlayerDataFromWebapp()
                .then(data => {
                    this.log(`Forced sync complete, got ${Object.keys(data).length} players`);
                    resolve(data);
                })
                .catch(error => {
                    this.log(`Error in force sync: ${error.message}`);
                    resolve({}); // Resolve with empty object in case of error
                });
                
            // Also set a timeout to resolve anyway after specified time
            setTimeout(() => resolve(this.webappPlayerCache), timeout);
        });
    }
    
    // Helper method to force UI update when players leave the tournament
    updateWebappPlayerUI() {
        try {
            if (!this.iframeWin) return;
            
            this.log('Attempting to force updatePlayerList call in webapp');
            
            // Method 1: Direct function call if we have a reference
            if (this.updatePlayerListFn) {
                this.log('Calling stored updatePlayerList function reference');
                this.updatePlayerListFn();
                return;
            }
            
            // Method 2: Execute script directly in iframe context
            try {
                this.log('Executing updatePlayerList script in iframe context');
                this.iframeWin.eval(`
                    if (typeof updatePlayerList === 'function') {
                        console.log('Simulator triggered updatePlayerList');
                        updatePlayerList();
                    } else {
                        console.log('updatePlayerList function not found in webapp');
                    }
                `);
            } catch (evalError) {
                this.log(`Error executing script in iframe: ${evalError.message}`);
            }
            
            // Method 3: Create and dispatch a custom event
            try {
                this.log('Dispatching custom event to trigger UI update');
                const updateEvent = new CustomEvent('simulator:playerStatusChanged', {
                    detail: { source: 'simulator', timestamp: Date.now() }
                });
                this.iframeWin.document.dispatchEvent(updateEvent);
            } catch (eventError) {
                this.log(`Error dispatching custom event: ${eventError.message}`);
            }
        } catch (error) {
            this.log(`Error in updateWebappPlayerUI: ${error.message}`);
        }
    }
}

// Base Action class that all specific actions will inherit from
class Action {
    constructor(description) {
        this.description = description;
    }
    
    execute(simulator) {
        throw new Error('Execute method must be implemented by subclasses');
    }
    
    // Helper method to wait for a specific element to be available
    waitForElement(simulator, selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkElement = () => {
                let element;
                try {
                    // Try to find the element
                    element = simulator.iframeDoc.querySelector(selector);
                    
                    // If selector is a CSS selector and not found, try more specific approaches
                    if (!element && selector.startsWith('#')) {
                        // Try by ID without the # prefix
                        const idValue = selector.substring(1);
                        element = simulator.iframeDoc.getElementById(idValue);
                        
                        if (element) {
                            simulator.log(`Found element by ID: ${idValue}`);
                        }
                    }
                    
                    // Try to find buttons by text content if the selector starts with 'button:'
                    if (!element && selector.startsWith('button:')) {
                        const buttonText = selector.substring(7).toLowerCase();
                        simulator.log(`Looking for button with text: ${buttonText}`);
                        
                        // Try to find buttons containing the text
                        const allButtons = simulator.iframeDoc.querySelectorAll('button');
                        for (const btn of allButtons) {
                            if (btn.textContent.toLowerCase().includes(buttonText)) {
                                element = btn;
                                simulator.log(`Found button with text: ${btn.textContent.trim()}`);
                                break;
                            }
                        }
                    }
                } catch (error) {
                    simulator.log(`Error finding element: ${error.message}`);
                }
                
                if (element) {
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Timeout waiting for element: ${selector}`));
                } else {
                    setTimeout(checkElement, 100);
                }
            };
            
            checkElement();
        });
    }
    
    // Helper to click an element and wait for a brief moment
    async clickElement(simulator, element) {
        if (!element) {
            throw new Error('Element not found');
        }
        
        element.click();
        
        // Wait briefly for any UI updates
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Helper method to check if any players need to be sat out based on time limits
    async checkPlayersTimeLimit(simulator) {
        if (!simulator.playerStats) return;
        
        // Check if time limits are enabled
        const isTimeLimitsEnabled = simulator.enableTimeLimitsToggle ? simulator.enableTimeLimitsToggle.checked : true;
        if (!isTimeLimitsEnabled) {
            simulator.log('Time limits are disabled - skipping time limit checks');
            return;
        }
        
        // Add debug logging
        simulator.log(`[DEBUG] checkPlayersTimeLimit called - Current round: ${simulator.currentRound}`);
        simulator.log(`[DEBUG] Active players: ${simulator.activePlayers.join(', ')}`);
        simulator.log(`[DEBUG] Sitting out players: ${simulator.sittingOutPlayers.join(', ')}`);
        simulator.log(`[DEBUG] autoTimeLimitSitOut set: ${Array.from(simulator.autoTimeLimitSitOut).join(', ')}`);
        
        // This simulates a user manually sitting out players who have reached time limits
        for (const playerName of Object.keys(simulator.playerStats)) {
            const stats = simulator.playerStats[playerName];
            
            // Debug log player data
            simulator.log(`[DEBUG] Processing player ${playerName}:`);
            simulator.log(`[DEBUG] - hasLeftTournament: ${stats.hasLeftTournament}`);
            simulator.log(`[DEBUG] - totalTime: ${stats.totalTime || 0}, availableTime: ${stats.availableTime}`);
            simulator.log(`[DEBUG] - timeRemaining: ${(stats.availableTime || 0) - (stats.totalTime || 0)}`);
            simulator.log(`[DEBUG] - isActive: ${simulator.activePlayers.includes(playerName)}`);
            simulator.log(`[DEBUG] - inAutoTimeLimitSet: ${simulator.autoTimeLimitSitOut.has(playerName)}`);
            
            // Original behavior only checked hasLeftTournament players
            if (!stats.hasLeftTournament) {
                // Check if player should be sat out due to approaching time limit
                const timeRemaining = (stats.availableTime || 0) - (stats.totalTime || 0);
                if (timeRemaining <= 15 && simulator.activePlayers.includes(playerName)) {
                    simulator.log(`[DEBUG] Player ${playerName} should be sat out (${timeRemaining} min remaining), but hasLeftTournament flag not set`);
                }
                continue;
            }
            
            // Ensure player is properly marked as time limit sit out
            if (!simulator.autoTimeLimitSitOut.has(playerName)) {
                simulator.autoTimeLimitSitOut.add(playerName);
                simulator.log(`Adding player ${playerName} to autoTimeLimitSitOut set as they've left the tournament`);
                
                // Update the UI to reflect the player has left the tournament
                simulator.updateWebappPlayerUI();
            }
            
            // Only try to sit out players who are still active
            if (simulator.activePlayers.includes(playerName)) {
                simulator.log(`Player ${playerName} should be sat out due to time limit. Attempting to find UI controls...`);
                
                // Try to find player management UI
                const playerListToggle = simulator.iframeDoc.querySelector('.player-list-toggle, .toggle-player-panel, #togglePlayerList');
                if (playerListToggle) {
                    simulator.log(`[DEBUG] Found player list toggle: ${playerListToggle.outerHTML}`);
                    await this.clickElement(simulator, playerListToggle);
                    simulator.log('Opened player management panel');
                    
                    // Wait for panel to open
                    await new Promise(resolve => setTimeout(resolve, 300));
                } else {
                    simulator.log(`[DEBUG] Could not find player list toggle button`);
                }
                
                // Look for player elements in the UI
                const playerElements = simulator.iframeDoc.querySelectorAll('.player-item, .player-name, .player-card');
                simulator.log(`[DEBUG] Found ${playerElements.length} total player elements in the UI`);
                
                let playerFound = false;
                for (const element of playerElements) {
                    if (element.textContent.includes(playerName)) {
                        playerFound = true;
                        // Found the player, now look for a sit-out button
                        simulator.log(`Found player element for ${playerName}, looking for sit-out button`);
                        simulator.log(`[DEBUG] Player element HTML: ${element.outerHTML}`);
                        
                        // Try different approaches to find sit-out controls
                        let sitOutControl = element.querySelector('.sit-out-btn, .deactivate-btn, .toggle-btn');
                        
                        // If not found directly, try parent or nearby elements
                        if (!sitOutControl) {
                            simulator.log(`[DEBUG] Did not find sit-out button directly on player element, trying parent`);
                            const container = element.closest('.player-container, .player-card, .player-row');
                            if (container) {
                                sitOutControl = container.querySelector('button[title*="sit"], button[title*="deactivate"], .sit-out, .deactivate');
                                simulator.log(`[DEBUG] Found container: ${container.outerHTML}`);
                            } else {
                                simulator.log(`[DEBUG] Could not find parent container for player element`);
                            }
                        }
                        
                        // As a last resort, look for any button near the player
                        if (!sitOutControl) {
                            simulator.log(`[DEBUG] Still did not find sit-out button, looking for any nearby buttons`);
                            const allNearbyButtons = element.parentElement?.querySelectorAll('button');
                            if (allNearbyButtons && allNearbyButtons.length > 0) {
                                simulator.log(`[DEBUG] Found ${allNearbyButtons.length} nearby buttons`);
                                
                                // Log all buttons for debugging
                                Array.from(allNearbyButtons).forEach((btn, idx) => {
                                    simulator.log(`[DEBUG] Button ${idx}: ${btn.textContent} - ${btn.outerHTML}`);
                                });
                                
                                // Try to find a button that might be for sitting out (exclude edit buttons)
                                for (const btn of allNearbyButtons) {
                                    const btnText = btn.textContent.toLowerCase();
                                    if (btnText.includes('sit') || btnText.includes('out') || 
                                        btnText.includes('deactivate') || btn.classList.contains('toggle')) {
                                        sitOutControl = btn;
                                        simulator.log(`[DEBUG] Selected button with text: ${btnText}`);
                                        break;
                                    }
                                }
                                
                                // If still not found, just use the first button that's not clearly edit/delete
                                if (!sitOutControl) {
                                    sitOutControl = Array.from(allNearbyButtons).find(btn => 
                                        !btn.textContent.toLowerCase().includes('edit') && 
                                        !btn.textContent.toLowerCase().includes('delete'));
                                    
                                    if (sitOutControl) {
                                        simulator.log(`[DEBUG] Selected first non-edit button as fallback: ${sitOutControl.textContent}`);
                                    }
                                }
                            } else {
                                simulator.log(`[DEBUG] Did not find any buttons near the player element`);
                            }
                        }
                        
                        if (sitOutControl) {
                            simulator.log('Found sit-out control, clicking it');
                            simulator.log(`[DEBUG] Sit-out control HTML: ${sitOutControl.outerHTML}`);
                            await this.clickElement(simulator, sitOutControl);
                            
                            // Look for confirmation dialog if it appears
                            await new Promise(resolve => setTimeout(resolve, 200));
                            const confirmBtn = simulator.iframeDoc.querySelector('.confirm-btn, .confirm, .yes-btn, [data-action="confirm"]');
                            if (confirmBtn) {
                                simulator.log(`[DEBUG] Found confirmation button: ${confirmBtn.outerHTML}`);
                                await this.clickElement(simulator, confirmBtn);
                            } else {
                                simulator.log(`[DEBUG] No confirmation button found`);
                            }
                            
                            // Update our local tracking after UI interaction
                            simulator.activePlayers = simulator.activePlayers.filter(p => p !== playerName);
                            if (!simulator.sittingOutPlayers.includes(playerName)) {
                                simulator.sittingOutPlayers.push(playerName);
                                simulator.log(`Sat out player ${playerName} through UI interaction`);
                            }
                            
                            // Verify the change was successful
                            simulator.log(`[DEBUG] After sit-out attempt: active=${!simulator.activePlayers.includes(playerName)}, sitting=${simulator.sittingOutPlayers.includes(playerName)}`);
                            
                            break;
                        } else {
                            simulator.log('Could not find sit-out control for this player');
                        }
                    }
                }
                
                if (!playerFound) {
                    simulator.log(`[DEBUG] Could not find UI element for player ${playerName}`);
                }
                
                // If we opened the player panel, close it
                const closeBtn = simulator.iframeDoc.querySelector('.close-btn, .close-panel, .player-panel-close');
                if (closeBtn) {
                    simulator.log(`[DEBUG] Found close button, closing panel`);
                    await this.clickElement(simulator, closeBtn);
                } else {
                    simulator.log(`[DEBUG] Could not find close button for player panel`);
                }
            } else {
                simulator.log(`[DEBUG] Player ${playerName} has left but is already not in activePlayers (status already correct)`);
            }
        }
        
        // After processing all players, check if there are enough players to continue
        const availablePlayers = simulator.activePlayers.filter(player => 
            !simulator.manualSitOutPlayers.has(player) && 
            !simulator.autoTimeLimitSitOut.has(player) &&
            simulator.playerStats[player] && 
            !simulator.playerStats[player].hasLeftTournament
        );
        
        simulator.log(`Available players for next round: ${availablePlayers.length} - ${availablePlayers.join(', ')}`);
        
        // We need at least 4 players to form teams (2 per team, minimum 2 teams)
        if (availablePlayers.length < 4) {
            simulator.log(`WARNING: Only ${availablePlayers.length} active players are available. Not enough to continue the tournament.`);
            simulator.log(`Tournament simulation has reached its natural end after ${simulator.currentRound} rounds due to player time limits.`);
            
            // Show a toast notification in the simulator
            simulator.showToast(`Tournament complete after ${simulator.currentRound} rounds. Not enough eligible players remain due to time limits.`, 'info');
            
            // Stop auto run if it's running
            if (simulator.autoRunInterval) {
                simulator.stopAutoRun();
            }
        }
    }
}

// Set the court count in the app
class SetCourtCountAction extends Action {
    constructor(courtCount) {
        super(`Setting court count to ${courtCount}`);
        this.courtCount = courtCount;
    }
    
    async execute(simulator) {
        try {
            // Find the court select dropdown and set the value
            const courtSelect = await this.waitForElement(simulator, '#courtSelect');
            
            // Select the appropriate option
            if (this.courtCount >= 1 && this.courtCount <= 6) {
                courtSelect.value = this.courtCount.toString();
                
                // Trigger a change event to ensure the app registers the change
                const event = new Event('change', { bubbles: true });
                courtSelect.dispatchEvent(event);
                
                simulator.log(`Set court count to ${this.courtCount}`);
            } else {
                simulator.log(`Invalid court count: ${this.courtCount}. Must be between 1 and 6.`);
            }
            
        } catch (error) {
            simulator.log(`Error setting court count: ${error.message}`);
            throw error;
        }
    }
}

// Add players to the tournament
class AddPlayersAction extends Action {
    constructor(playerCount) {
        super(`Adding ${playerCount} players`);
        this.playerCount = playerCount;
    }
    
    async execute(simulator) {
        try {
            // Generate player names and join with commas
            const playerNames = [];
            for (let i = 0; i < this.playerCount; i++) {
                playerNames.push(simulator.getRandomPlayerName());
            }
            const playerNamesString = playerNames.join(', ');
            
            // Click the add players button to show the player input field
            const addPlayersBtn = await this.waitForElement(simulator, '#addPlayersBtn');
            await this.clickElement(simulator, addPlayersBtn);
            
            // Wait for player input textarea
            const playerInput = await this.waitForElement(simulator, '#playerInput');
            playerInput.value = playerNamesString;
            
            // Trigger input event to enable the add button
            const inputEvent = new Event('input', { bubbles: true });
            playerInput.dispatchEvent(inputEvent);
            
            // Trigger keyup event as well (needed for updateAddPlayersButtonState)
            const keyupEvent = new Event('keyup', { bubbles: true });
            playerInput.dispatchEvent(keyupEvent);
            
            // Click add button again to add the players
            await this.clickElement(simulator, addPlayersBtn);
            
            // Add to simulator's player tracking
            for (const playerName of playerNames) {
                simulator.playerNames.push(playerName);
                simulator.activePlayers.push(playerName);
                
                // Initialize player stats with new fields
                simulator.playerStats[playerName] = {
                    playTime: 0,
                    waitTime: 0,
                    totalTime: 0,
                    availableTime: simulator.generateRandomAvailableTime(),
                    hasLeftTournament: false,
                    processedMatches: new Set([`${simulator.currentRound}-${teamsLabel}`]) // Initialize with current match
                };
                
                // Initialize status history
                simulator.playerStatusHistory[playerName] = [{
                    round: simulator.currentRound, 
                    status: 'Active', 
                    reason: 'Joined'
                }];
                
                simulator.log(`Added player: ${playerName} (Round ${simulator.currentRound}, Available Time: ${simulator.playerStats[playerName].availableTime} min)`);
            }
            
            // Close the player panel if it's still open
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Find all possible panel toggle buttons and CSS selectors
            const possibleToggles = [
                '#togglePlayerList', 
                '.toggle-player-list-btn', 
                '.player-panel-toggle',
                '#playerPanelToggle',
                'button.panel-toggle',
                '.icon-btn.player-toggle',
                '.btn-circle',
                '.player-toggle',
                '[aria-label="Toggle player list"]'
            ];
            
            // Try each selector
            let toggleFound = false;
            for (const selector of possibleToggles) {
                const toggle = simulator.iframeDoc.querySelector(selector);
                if (toggle) {
                    simulator.log(`Found player panel toggle: ${selector}`);
                    await this.clickElement(simulator, toggle);
                    toggleFound = true;
                    break;
                }
            }
            
            // If no toggle button found, look for any button in a panel with arrow icon
            if (!toggleFound) {
                const panelButtons = simulator.iframeDoc.querySelectorAll('.panel button, .sidebar button, .player-panel button');
                
                for (const btn of panelButtons) {
                    // Check if the button contains an arrow icon or has an arrow class
                    const hasArrowIcon = btn.querySelector('.arrow, .chevron, [class*="arrow"], [class*="chevron"]') || 
                                         btn.innerHTML.includes('arrow') || 
                                         btn.className.includes('arrow') ||
                                         btn.className.includes('circle');
                    
                    if (hasArrowIcon) {
                        simulator.log('Found button with arrow/circle icon, clicking it to close panel');
                        await this.clickElement(simulator, btn);
                        toggleFound = true;
                        break;
                    }
                }
            }
            
            // If still not found, try other approaches
            if (!toggleFound) {
                // Try to find close button
                const closeBtn = simulator.iframeDoc.querySelector('.close-panel, .panel-close, #closePlayerPanel, .close-btn');
                if (closeBtn) {
                    simulator.log('Found close button for player panel, clicking it');
                    await this.clickElement(simulator, closeBtn);
                } else {
                    // If no specific close button, try clicking the add players button again to toggle panel
                    simulator.log('No close button found, trying to click add players button again to toggle panel');
                    await this.clickElement(simulator, addPlayersBtn);
                }
            }
            
            simulator.log('Player addition completed');
            
        } catch (error) {
            simulator.log(`Error adding players: ${error.message}`);
            throw error;
        }
    }
}

// Start the tournament
class StartTournamentAction extends Action {
    constructor() {
        super('Starting the tournament');
    }
    
    async execute(simulator) {
        try {
            // WORKAROUND: Safely handle potential "checked" property access errors
            // Do this FIRST before anything else to ensure checkboxes are properly initialized
            try {
                // Check if there are any checkboxes in the iframe
                const checkboxes = simulator.iframeDoc.querySelectorAll('input[type="checkbox"]');
                if (checkboxes && checkboxes.length > 0) {
                    simulator.log(`Found ${checkboxes.length} checkboxes, ensuring they are properly initialized`);
                    
                    // For each checkbox, make sure the checked property is set correctly
                    checkboxes.forEach(checkbox => {
                        // Create a safe reference to each checkbox
                        Object.defineProperty(checkbox, 'checked', {
                            get: function() {
                                return this.getAttribute('checked') === 'checked' || 
                                       this.getAttribute('checked') === '' || 
                                       this.getAttribute('checked') === 'true' || 
                                       false;
                            },
                            set: function(value) {
                                if (value) {
                                    this.setAttribute('checked', 'checked');
                                } else {
                                    this.removeAttribute('checked');
                                }
                            },
                            configurable: true
                        });
                        
                        // Set a default if undefined
                        if (checkbox.checked === undefined) {
                            checkbox.checked = false;
                        }
                    });
                }
            } catch (checkboxError) {
                simulator.log(`Checkbox initialization error: ${checkboxError.message}`);
            }
        
            // Try to find the "Start Tournament" button using various approaches
            let startBtn = null;
            
            // First try standard selector
            try {
                startBtn = await this.waitForElement(simulator, '#startTournament', 2000);
            } catch (error) {
                simulator.log('Could not find #startTournament, trying alternative selectors');
            }
            
            // If not found, try by text content
            if (!startBtn) {
                try {
                    startBtn = await this.waitForElement(simulator, 'button:start tournament', 2000);
                } catch (error) {
                    simulator.log('Could not find button with text "start tournament"');
                }
            }
            
            // Last resort - try to find any button that might be the start tournament button
            if (!startBtn) {
                simulator.log('Trying to find start button by scanning all buttons');
                const buttons = simulator.iframeDoc.querySelectorAll('button');
                simulator.log(`Found ${buttons.length} buttons`);
                
                for (const button of buttons) {
                    const text = button.textContent.toLowerCase().trim();
                    if (text.includes('start') || text.includes('begin') || text.includes('go')) {
                        startBtn = button;
                        simulator.log(`Found potential start button with text: "${text}"`);
                        break;
                    }
                }
            }
            
            if (!startBtn) {
                throw new Error('Could not find start tournament button');
            }
            
            simulator.log('Found Start Tournament button, clicking it');
                        
            // Click the start button
            await this.clickElement(simulator, startBtn);
            
            // Wait for the app to generate the round
            simulator.log('Waiting for round to be generated...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Try to find submit score buttons or score inputs with increased timeout
            try {
                const scoreInputs = simulator.iframeDoc.querySelectorAll('input.team-score, input[inputmode="numeric"]');
                if (scoreInputs.length > 0) {
                    simulator.log(`Found ${scoreInputs.length} score inputs`);
                } else {
                    // Try to find submit buttons
                    const submitBtns = simulator.iframeDoc.querySelectorAll('.submit-score-btn, button.score-submit, button');
                    if (submitBtns.length > 0) {
                        simulator.log(`Found ${submitBtns.length} potential submit buttons`);
                    } else {
                        simulator.log('Could not find score inputs or submit buttons');
                    }
                }
                
                // Try to find match containers
                const matchContainers = simulator.iframeDoc.querySelectorAll('.match-container');
                if (matchContainers.length > 0) {
                    simulator.log(`Found ${matchContainers.length} match containers`);
                }
                
            } catch (error) {
                simulator.log(`Error checking for score elements: ${error.message}`);
            }
            
            simulator.log('Tournament started successfully');
            
        } catch (error) {
            simulator.log(`Error starting tournament: ${error.message}`);
            // Don't throw error here - continue with simulation even if starting has issues
            simulator.log('Continuing with simulation despite start tournament error');
        }
    }
}

// Generate the next round
class GenerateNextRoundAction extends Action {
    constructor() {
        super('Generating next round');
    }
    
    async execute(simulator) {
        try {
            simulator.log('Attempting to generate next round...');
            
            // Check for players whose manual sit-out period has ended
            simulator.log('Checking for players whose sit-out period has ended...');
            simulator.checkManualSitOutPlayers();
            
            // Check for players who need to be sat out due to time limits
            await this.checkPlayersTimeLimit(simulator);
            
            // Check if time limits are enabled
            const isTimeLimitsEnabled = simulator.enableTimeLimitsToggle ? simulator.enableTimeLimitsToggle.checked : true;
            
            // Only perform the availability check if time limits are enabled
            if (isTimeLimitsEnabled) {
                // Count how many active players that haven't reached time limit
                const activePlayers = simulator.activePlayers.filter(player => 
                    !simulator.manualSitOutPlayers.has(player) && 
                    !simulator.autoTimeLimitSitOut.has(player) &&
                    simulator.playerStats[player] && 
                    !simulator.playerStats[player].hasLeftTournament
                );
                
                simulator.log(`Active players available for next round: ${activePlayers.length}`);
                simulator.log(`Active players: ${activePlayers.join(', ')}`);
                
                // We need at least 4 players to make a round (2 players per team, 2 teams)
                if (activePlayers.length < 4) {
                    simulator.log(`WARNING: Not enough active players (${activePlayers.length}) to form teams for the next round.`);
                    simulator.log(`Tournament simulation has reached its natural end after ${simulator.currentRound} rounds due to player time limits.`);
                    
                    // Show a toast notification in the simulator
                    simulator.showToast(`Tournament complete after ${simulator.currentRound} rounds. Not enough eligible players remain due to time limits.`, 'info');
                    
                    // Stop auto run if it's running
                    if (simulator.autoRunInterval) {
                        simulator.stopAutoRun();
                    }
                    
                    return;
                }
            }
            
            // Look for the "Next Round" button that appears after scores are submitted
            const submitButtons = simulator.iframeDoc.querySelectorAll('.submit-score-btn, .next-round-btn, button');
            simulator.log(`Found ${submitButtons.length} potential buttons`);
            
            // Try to find the Next Round button by text content
            let nextRoundButton = null;
            for (const button of submitButtons) {
                const text = button.textContent.trim().toLowerCase();
                if (text.includes('next round') || text.includes('next') || text.includes('continue')) {
                    nextRoundButton = button;
                    simulator.log(`Found button with text: "${button.textContent.trim()}"`);
                    break;
                }
            }
            
            // If we found a Next Round button, click it
            if (nextRoundButton) {
                simulator.log('Clicking Next Round button');
                await this.clickElement(simulator, nextRoundButton);
                simulator.log('Next round generated by clicking button');
                
                // Wait for the round to be generated
                await new Promise(resolve => setTimeout(resolve, 1000));
                return;
            }
            
            // Fallback: try to call the function directly
            simulator.log('No Next Round button found, calling function directly');
            
            try {
                if (simulator.iframeWin && typeof simulator.iframeWin.generateNextRound === 'function') {
                    simulator.iframeWin.generateNextRound();
                    simulator.log('Called generateNextRound function directly');
                } else {
                    simulator.log('generateNextRound function not found, trying alternative methods');
                    
                    // Try to find and click any submit button
                    const anyButton = simulator.iframeDoc.querySelector('.submit-score-btn');
                    if (anyButton) {
                        await this.clickElement(simulator, anyButton);
                        simulator.log('Clicked available submit button');
                    }
                }
            } catch (functionError) {
                simulator.log(`Error calling generateNextRound: ${functionError.message}`);
            }
            
            // Wait longer for the round to be generated
            await new Promise(resolve => setTimeout(resolve, 1500));
            
        } catch (error) {
            simulator.log(`Error generating next round: ${error.message}`);
            throw error;
        }
    }
}

// Submit scores for a round
class SubmitScoresAction extends Action {
    constructor() {
        super('Submitting scores for current round');
    }
    
    // Method to update player time stats after all matches are processed
    updatePlayerTimeStats(simulator, roundStats) {
        // Check if time limits are enabled
        const isTimeLimitsEnabled = simulator.enableTimeLimitsToggle ? simulator.enableTimeLimitsToggle.checked : true;
        
        // Get all active and sitting out players
        const allPlayers = [...simulator.activePlayers, ...simulator.sittingOutPlayers];
        
        // Add debug logging for match counting
        simulator.log(`--- Validating match counts for round ${simulator.currentRound} ---`);
        for (const playerName of allPlayers) {
            if (simulator.playerStats[playerName]) {
                const processedCount = simulator.playerStats[playerName].processedMatches ? 
                    simulator.playerStats[playerName].processedMatches.size : 0;
                
                // Try to access the webapp's player data to get gamesPlayed using the improved method
                let gamesPlayed = 0;
                const player = simulator.getPlayerFromWebapp(playerName);
                if (player) {
                    gamesPlayed = player.gamesPlayed || 0;
                } else {
                    simulator.log(`Could not find games played for ${playerName}`);
                }
                
                simulator.log(`Player ${playerName}: gamesPlayed=${gamesPlayed}, processedMatches=${processedCount}`);
            }
        }
        simulator.log(`----------------------------------------------`);
        
        // For each player, determine if they played in any match
        for (const playerName of allPlayers) {
            // Skip players who have already reached their time limit and left
            if (simulator.autoTimeLimitSitOut.has(playerName) && 
                simulator.playerStats[playerName] && 
                simulator.playerStats[playerName].hasLeftTournament) {
                continue;
            }
            
            // Check if player has left but not properly marked
            if (simulator.playerStats[playerName] && 
                simulator.playerStats[playerName].hasLeftTournament) {
                
                // Make sure they are in autoTimeLimitSitOut
                if (!simulator.autoTimeLimitSitOut.has(playerName)) {
                    simulator.autoTimeLimitSitOut.add(playerName);
                    simulator.log(`Marking player ${playerName} as timed out - they have left the tournament`);
                }
                
                // Make sure they are removed from active players
                if (simulator.activePlayers.includes(playerName)) {
                    simulator.activePlayers = simulator.activePlayers.filter(p => p !== playerName);
                    simulator.log(`Removing ${playerName} from active players - they have left the tournament`);
                    
                    // Add to sitting out if not already there
                    if (!simulator.sittingOutPlayers.includes(playerName)) {
                        simulator.sittingOutPlayers.push(playerName);
                        simulator.log(`Adding ${playerName} to sitting out players - they have left the tournament`);
                    }
                }
                
                // Skip further processing for this player
                continue;
            }
            
            let playerFoundInMatch = false;
            let totalPlayTime = 0;
            let totalWaitTime = 0;
            
            // Check each match to see if player participated
            for (const match of roundStats.matches) {
                // Extract all players from team labels
                let team1Players = [];
                let team2Players = [];
                
                // FIX: Improved handling of player extraction from team labels
                if (match.team1Players && match.team2Players) {
                    // Use explicitly stored team players if available
                    team1Players = match.team1Players;
                    team2Players = match.team2Players;
                } else if (Array.isArray(match.players)) {
                    // If we already have the players array, use it directly
                    const halfLength = Math.ceil(match.players.length / 2);
                    team1Players = match.players.slice(0, halfLength);
                    team2Players = match.players.slice(halfLength);
                } else if (typeof match.team1 === 'string' && typeof match.team2 === 'string') {
                    // Safely parse team names
                    team1Players = match.team1.split(' & ');
                    team2Players = match.team2.split(' & ');
                    
                    // Verify that we have a reasonable number of players per team (typically 1-2 players per team)
                    if (team1Players.length > 2 || team2Players.length > 2) {
                        simulator.log(`WARNING: Unusual number of players detected in match. Team1: ${team1Players.length}, Team2: ${team2Players.length}`);
                        // If the split seems incorrect, use a safer approach
                        if (match.players) {
                            // Use stored players array if available
                            const halfLength = Math.ceil(match.players.length / 2);
                            team1Players = match.players.slice(0, halfLength); 
                            team2Players = match.players.slice(halfLength);
                        } else {
                            // Last resort - just use the team names as single players
                            team1Players = [match.team1];
                            team2Players = [match.team2];
                        }
                    }
                }
                
                const matchPlayers = [...team1Players, ...team2Players];
                
                // Check if player was in this match
                if (matchPlayers.includes(playerName)) {
                    playerFoundInMatch = true;
                    totalPlayTime += match.duration;
                    totalWaitTime += match.waitTime;
                    
                    // Store player information in match data for player timeline
                    if (!match.players) {
                        match.players = matchPlayers;
                    }
                    
                    // Determine the winner based on scores
                    if (!match.winner) {
                        if (match.score1 > match.score2) {
                            match.winner = team1Players;
                            match.score = [match.score1, match.score2];
                        } else {
                            match.winner = team2Players;
                            match.score = [match.score1, match.score2];
                        }
                    }
                }
            }
            
            // Update player stats
            if (simulator.playerStats[playerName]) {
                const stats = simulator.playerStats[playerName];
                
                // If player was in a match, add play time and wait time
                if (playerFoundInMatch) {
                    stats.playTime = (stats.playTime || 0) + totalPlayTime;
                    stats.waitTime = (stats.waitTime || 0) + totalWaitTime;
                    // We track match participation via processedMatches, not by incrementing a counter
                    simulator.log(`Player ${playerName} played in round ${simulator.currentRound}: +${totalPlayTime} play min, +${totalWaitTime} wait min`);
                } 
                // If player didn't play but was active (not manually sitting out), add wait time for whole round
                else if (simulator.activePlayers.includes(playerName) && !simulator.manualSitOutPlayers.has(playerName)) {
                    stats.waitTime = (stats.waitTime || 0) + roundStats.totalDuration;
                    simulator.log(`Player ${playerName} waited entire round ${simulator.currentRound}: +${roundStats.totalDuration} wait min`);
                }
                // If player was sitting out by choice or time limit, don't add wait time
                else if (simulator.sittingOutPlayers.includes(playerName) && 
                         (simulator.manualSitOutPlayers.has(playerName) || simulator.autoTimeLimitSitOut.has(playerName))) {
                    simulator.log(`Player ${playerName} sat out round ${simulator.currentRound}, no wait time added`);
                }
                
                // FIX: If the player has processedMatches but wasn't found in any matches, calculate play time
                if (!playerFoundInMatch && stats.processedMatches && stats.processedMatches.size > 0 && stats.playTime === 0) {
                    // Number of matches they've played according to the tracking
                    const matchCount = stats.processedMatches.size;
                    // Use the average match duration for this round to estimate their play time
                    const avgMatchDuration = roundStats.matches.reduce((sum, match) => sum + match.duration, 0) / 
                                           (roundStats.matches.length || 1);
                    
                    // Apply the fix - set play time based on their processedMatches count
                    stats.playTime = Math.round(avgMatchDuration * matchCount);
                    // Also set wait time proportionally
                    const avgWaitTime = roundStats.matches.reduce((sum, match) => sum + (match.waitTime || 0), 0) / 
                                       (roundStats.matches.length || 1);
                    stats.waitTime = Math.round(avgWaitTime * matchCount);
                    
                    simulator.log(`FIXING: Player ${playerName} has ${matchCount} processedMatches but 0 play time. Setting to ${stats.playTime} min play, ${stats.waitTime} min wait.`);
                }
                
                // Only add total round time if player hasn't left the tournament
                if (!stats.hasLeftTournament) {
                    // Total time is the sum of play time and wait time
                    stats.totalTime = (stats.playTime || 0) + (stats.waitTime || 0);
                    simulator.log(`Updated total time for ${playerName}, now at ${stats.totalTime} min (play: ${stats.playTime || 0}, wait: ${stats.waitTime || 0})`);
                }
                
                // Only check time limits if the feature is enabled
                if (isTimeLimitsEnabled) {
                    // Check if player is approaching their available time limit
                    const timeRemaining = stats.availableTime - stats.totalTime;
                    
                    // Add detailed debug logs
                    simulator.log(`[DEBUG] ${playerName} time check: totalTime=${stats.totalTime}, availableTime=${stats.availableTime}, timeRemaining=${timeRemaining}`);
                    simulator.log(`[DEBUG] ${playerName} status: active=${simulator.activePlayers.includes(playerName)}, sitting=${simulator.sittingOutPlayers.includes(playerName)}`);
                    simulator.log(`[DEBUG] ${playerName} tracking sets: autoTimeLimitSitOut=${simulator.autoTimeLimitSitOut.has(playerName)}, manualSitOut=${simulator.manualSitOutPlayers.has(playerName)}`);
                    
                    // Simulate a user keeping track of available time and making decisions based on it
                    
                    // If player is within 15 minutes of their limit (either approaching or just over) and still active, sit them out
                    if (timeRemaining <= 15 && timeRemaining > -15 && simulator.activePlayers.includes(playerName)) {
                        // We're not going to auto-sit out players here directly - that would be handled
                        // by the UI interaction in the GenerateNextRoundAction class
                        
                        // Just log this for tracking in the simulator's internal state
                        simulator.log(`NOTICE: Player ${playerName} has only ${timeRemaining} minutes remaining (limit: ${stats.availableTime} min), will need to manually sit out`);
                        
                        // Debug log for tracking logic
                        simulator.log(`[DEBUG] Player ${playerName} should be sat out due to approaching time limit (${timeRemaining} min remaining)`);
                        simulator.log(`[DEBUG] Current round: ${simulator.currentRound}, Player is active: ${simulator.activePlayers.includes(playerName)}`);
                        
                        // Track this in simulator's internal state for UI decisions later
                        if (!simulator.playerManualSitOutRounds[playerName]) {
                            simulator.autoTimeLimitSitOut.add(playerName);
                            simulator.log(`[DEBUG] Added ${playerName} to autoTimeLimitSitOut set, has size ${simulator.autoTimeLimitSitOut.size}`);
                        }
                        
                        // Create timeline entries
                        if (!simulator.playerStatusHistory[playerName]) {
                            simulator.playerStatusHistory[playerName] = [];
                        }
                        simulator.playerStatusHistory[playerName].push({
                            round: simulator.currentRound,
                            status: 'Approaching Time Limit',
                            reason: `Time Limit (${timeRemaining} min remaining)`
                        });
                        
                        // Add additional debug log to check if immediate sit-out should be attempted
                        simulator.log(`[DEBUG] ${playerName} needs to be sat out now - should trigger UI interaction on next checkPlayersTimeLimit call`);
                        
                        // Fix: Add code to apply the hasLeftTournament flag for players approaching time limit
                        // This addresses the issue where players who should be sat out aren't being processed by checkPlayersTimeLimit
                        if (timeRemaining <= 0) {
                            stats.hasLeftTournament = true;
                            simulator.log(`[DEBUG] Setting hasLeftTournament=true for ${playerName} who has ${timeRemaining} minutes remaining`);
                            
                            // Use the dedicated method to update the webapp UI
                            simulator.updateWebappPlayerUI();
                        }
                    }
                    
                    // If player has reached or exceeded their available time by 15 minutes, mark them as having left
                    if (timeRemaining <= -15 && !stats.hasLeftTournament) {
                        stats.hasLeftTournament = true;
                        simulator.log(`ATTENTION: Player ${playerName} has reached their time limit (${Math.abs(timeRemaining)} minutes over limit), will need to be manually removed via UI`);
                        simulator.log(`[DEBUG] Marked player ${playerName} as hasLeftTournament=true due to exceeding time limit by ${Math.abs(timeRemaining)} minutes`);
                        
                        // Use the dedicated method to update the webapp UI
                        simulator.updateWebappPlayerUI();
                        
                        // Track in history for display purposes
                        if (!simulator.playerStatusHistory[playerName]) {
                            simulator.playerStatusHistory[playerName] = [];
                        }
                        simulator.playerStatusHistory[playerName].push({
                            round: simulator.currentRound,
                            status: 'Left Tournament',
                            reason: 'Time Limit Reached'
                        });
                        
                        // Store this change for timeline display, but don't directly modify app state
                        if (!roundStats.timeBasedChanges) {
                            roundStats.timeBasedChanges = [];
                        }
                        roundStats.timeBasedChanges.push({
                            player: playerName,
                            type: 'leave',
                            reason: 'Time Limit Reached'
                        });
                    }
                } else {
                    // Time limits are disabled, so we don't mark anyone as needing to leave
                    // Just log that time limits are being tracked but not enforced
                    if (simulator.currentRound === 1 || simulator.currentRound % 5 === 0) {
                        simulator.log(`NOTE: Time limits are disabled - players can continue playing regardless of time spent`);
                    }
                }
            }
        }
    }
    
    async execute(simulator) {
        try {
            // Increment the round counter
            simulator.currentRound++;
            simulator.log(`Starting round ${simulator.currentRound}`);
            
            // Reset tracking for this round
            simulator.roundStats[simulator.currentRound] = {
                matches: [],
                totalDuration: 0,
                longestMatchDuration: 0
            };
            
            // Check for players whose manual sit-out period has ended BEFORE generating the round
            simulator.log('Checking for players whose sit-out period has ended...');
            simulator.checkManualSitOutPlayers();
            
            // Check for players approaching their time limit
            await this.checkPlayersTimeLimit(simulator);
            
            // Find all matches in the current round
            const allRounds = simulator.iframeDoc.querySelectorAll('.round-container, .round');
            if (allRounds.length === 0) {
                simulator.log('No round containers found');
                throw new Error('No round containers found');
            }
            
            const currentRound = allRounds[allRounds.length - 1];
            simulator.log(`Found current round: ${currentRound.getAttribute('data-round') || 'unknown'}`);
            
            // Find all matches in the current round
            const matches = currentRound.querySelectorAll('.match');
            simulator.log(`Found ${matches.length} matches in the current round`);
            
            if (matches.length === 0) {
                simulator.log('No matches found in the current round');
                return;
            }
            
            // Generate round duration based on longest match
            let longestMatchDuration = 0;
            const matchDurations = [];
            const roundStats = simulator.roundStats[simulator.currentRound];
            
            // Fill in scores for each match
            for (const match of matches) {
                // Skip matches that are already completed or skipped
                if (match.classList.contains('completed') || match.classList.contains('skipped')) {
                    simulator.log('Skipping completed/skipped match');
                    continue;
                }
                
                simulator.log(`Processing match: ${match.getAttribute('data-match') || 'unknown'}`);
                
                // Find the team score inputs for this match
                const team1ScoreInput = match.querySelector('.team-score[data-team="1"]');
                const team2ScoreInput = match.querySelector('.team-score[data-team="2"]');
                
                if (!team1ScoreInput || !team2ScoreInput) {
                    simulator.log('Score inputs not found for this match, skipping');
                    continue;
                }
                
                // Extract player names from the match
                const players = [];
                
                // Debug the match content
                simulator.log(`Match HTML structure: ${match.outerHTML.substring(0, 100)}...`);
                
                // Try multiple selectors for player names
                const selectors = [
                    // Primary selectors
                    { team1: '.team1 .player-name', team2: '.team2 .player-name' }, 
                    // Alternative selectors
                    { team1: '.team-1 .player', team2: '.team-2 .player' },
                    { team1: '.player-team1', team2: '.player-team2' },
                    { team1: '[data-team="1"] .player', team2: '[data-team="2"] .player' },
                    { team1: '.team:first-child .player', team2: '.team:last-child .player' }
                ];
                
                let team1Players = [], team2Players = [];
                let selectorUsed = null;
                
                // Try each selector pair until we find players
                for (const selector of selectors) {
                    team1Players = match.querySelectorAll(selector.team1);
                    team2Players = match.querySelectorAll(selector.team2);
                    
                    if (team1Players.length > 0 || team2Players.length > 0) {
                        selectorUsed = selector;
                        simulator.log(`Found player elements with selectors - Team 1: ${selector.team1} (${team1Players.length} players), Team 2: ${selector.team2} (${team2Players.length} players)`);
                        break;
                    }
                }
                
                if (!selectorUsed) {
                    simulator.log('Failed to find players with any selector. Trying generic player elements...');
                    // Last resort - try to find any elements that might contain player names
                    const allPlayerElements = match.querySelectorAll('.player, [class*="player"], [class*="team"] span, .match-team span');
                    
                    if (allPlayerElements.length > 0) {
                        simulator.log(`Found ${allPlayerElements.length} potential player elements`);
                        // Split them into two teams
                        const halfLength = Math.ceil(allPlayerElements.length / 2);
                        team1Players = Array.from(allPlayerElements).slice(0, halfLength);
                        team2Players = Array.from(allPlayerElements).slice(halfLength);
                    } else {
                        simulator.log('Could not find any player elements in the match');
                    }
                }
                
                let team1Names = [];
                let team2Names = [];
                
                // Extract team 1 player names
                simulator.log('Extracting Team 1 player names:');
                team1Players.forEach(playerEl => {
                    const name = playerEl.textContent.trim();
                    simulator.log(`- Found Team 1 player: "${name}"`);
                    players.push(name);
                    team1Names.push(name);
                });
                
                // Extract team 2 player names
                simulator.log('Extracting Team 2 player names:');
                team2Players.forEach(playerEl => {
                    const name = playerEl.textContent.trim();
                    simulator.log(`- Found Team 2 player: "${name}"`);
                    players.push(name);
                    team2Names.push(name);
                });
                
                // Create team labels for stats
                const team1Label = team1Names.join(' & ');
                const team2Label = team2Names.join(' & ');
                const teamsLabel = `${team1Label} vs ${team2Label}`;
                
                // FIX: Check for duplicate players in this round's matches
                const playersInMatch = [...team1Names, ...team2Names];
                const alreadyPlayingPlayers = [];
                
                // Check if any player is already in another match for this round
                for (const playerName of playersInMatch) {
                    // Check all previously processed matches in this round
                    for (const existingMatch of roundStats.matches) {
                        if (existingMatch.players && existingMatch.players.includes(playerName)) {
                            alreadyPlayingPlayers.push(playerName);
                            simulator.log(`WARNING: Player ${playerName} appears in multiple matches in round ${simulator.currentRound}`);
                            break; // Only need to find one instance
                        }
                    }
                }
                
                if (alreadyPlayingPlayers.length > 0) {
                    simulator.log(`FIXING: Removing duplicate players: ${alreadyPlayingPlayers.join(', ')}`);
                    
                    // Option 1: Skip this match entirely if there are too many duplicates
                    if (alreadyPlayingPlayers.length > Math.floor(playersInMatch.length / 2)) {
                        simulator.log(`Too many duplicate players (${alreadyPlayingPlayers.length}/${playersInMatch.length}), skipping this match`);
                        continue; // Skip to next match
                    }
                    
                    // Option 2: Try to replace duplicated players with other players
                    // Note: In a real fix, we'd implement this with actual replacement logic
                    // For now, we'll just remove the duplicate players from the team arrays
                    team1Names = team1Names.filter(name => !alreadyPlayingPlayers.includes(name));
                    team2Names = team2Names.filter(name => !alreadyPlayingPlayers.includes(name));
                    
                    // Rebuild player list and team labels after fixing
                    const updatedPlayers = [...team1Names, ...team2Names];
                    const updatedTeam1Label = team1Names.join(' & ');
                    const updatedTeam2Label = team2Names.join(' & ');
                    const updatedTeamsLabel = `${updatedTeam1Label} vs ${updatedTeam2Label}`;
                    
                    // If we don't have enough players after filtering, skip this match
                    if (updatedPlayers.length < 2) {
                        simulator.log(`Not enough players after removing duplicates, skipping this match`);
                        continue;
                    }
                    
                    // Update our variables with the fixed data
                    players.length = 0;
                    players.push(...updatedPlayers);
                    teamsLabel = updatedTeamsLabel;
                }
                
                // Increment match count for each player
                for (const playerName of players) {
                    // Check if player should be excluded from matches based on time limits
                    // This is just tracking for our simulator UI, the actual web app would handle this
                    const hasLeftTournament = simulator.playerStats[playerName] && simulator.playerStats[playerName].hasLeftTournament;
                    
                    if (hasLeftTournament) {
                        simulator.log(`NOTE: Player ${playerName} appears in a match despite reaching time limit. A user should manually sit out this player.`);
                    }
                    
                    if (simulator.playerStats[playerName]) {
                        // To prevent double-counting, track which matches a player has participated in
                        // by using a unique match identifier
                        const matchIdentifier = `${simulator.currentRound}-${teamsLabel}`;
                        simulator.playerStats[playerName].processedMatches = simulator.playerStats[playerName].processedMatches || new Set();
                        
                        if (!simulator.playerStats[playerName].processedMatches.has(matchIdentifier)) {
                            // Track that we've processed this match (webapp will handle gamesPlayed counter)
                            simulator.playerStats[playerName].processedMatches.add(matchIdentifier);
                            simulator.log(`Processed match for ${playerName}: ${matchIdentifier}`);
                        } else {
                            simulator.log(`Match already processed for ${playerName} in match ${matchIdentifier}`);
                        }
                    } else {
                        simulator.log(`WARNING: Player ${playerName} not found in stats. Looking for similar names...`);
                        // Debug: Log all player names in simulator.playerStats
                        simulator.log(`Available players in stats: ${Object.keys(simulator.playerStats).join(', ')}`);
                        
                        // Try to find case-insensitive match
                        let found = false;
                        for (const existingPlayer of Object.keys(simulator.playerStats)) {
                            if (existingPlayer.toLowerCase() === playerName.toLowerCase()) {
                                simulator.log(`Found case-insensitive match: ${existingPlayer} vs ${playerName}`);
                                
                                // Ensure we have a processed matches set
                                simulator.playerStats[existingPlayer].processedMatches = simulator.playerStats[existingPlayer].processedMatches || new Set();
                                
                                // Check if we already processed this match
                                const matchIdentifier = `${simulator.currentRound}-${teamsLabel}`;
                                if (!simulator.playerStats[existingPlayer].processedMatches.has(matchIdentifier)) {
                                    simulator.playerStats[existingPlayer].processedMatches.add(matchIdentifier);
                                    simulator.log(`Processed match for ${existingPlayer}: ${matchIdentifier}`);
                                } else {
                                    simulator.log(`Match already processed for ${existingPlayer} in match ${matchIdentifier}`);
                                }
                                
                                found = true;
                                break;
                            }
                        }
                        
                        if (!found) {
                            // Add this player to stats if not found
                            simulator.log(`Adding missing player to stats: ${playerName}`);
                            simulator.playerStats[playerName] = {
                                playTime: 0,
                                waitTime: 0,
                                totalTime: 0,
                                availableTime: simulator.generateRandomAvailableTime(),
                                hasLeftTournament: false,
                                processedMatches: new Set([`${simulator.currentRound}-${teamsLabel}`]) // Initialize with current match
                            };
                            // Also add to player tracking if needed
                            if (!simulator.playerNames.includes(playerName)) {
                                simulator.playerNames.push(playerName);
                                simulator.activePlayers.push(playerName);
                                simulator.log(`Added missing player to tracking: ${playerName}`);
                            }
                        }
                    }
                }
                
                // Debug: log player names found in the DOM vs player names in our tracking
                simulator.log(`Team 1 players from DOM: ${team1Names.join(', ')}`);
                simulator.log(`Team 2 players from DOM: ${team2Names.join(', ')}`);
                simulator.log(`Current tracked players: ${simulator.playerNames.join(', ')}`);
                
                // Generate random scores
                const [score1, score2] = simulator.generateRandomScores();
                simulator.log(`Setting scores: ${score1}-${score2}`);
                
                // Generate random match duration (8-20 minutes) - ensure it's at least 8 minutes
                const matchDuration = Math.max(8, simulator.generateRandomMatchDuration());
                matchDurations.push(matchDuration);
                
                // Track the longest match for round duration
                if (matchDuration > longestMatchDuration) {
                    longestMatchDuration = matchDuration;
                }
                
                // Add match stats to roundStats
                roundStats.matches.push({
                    teams: teamsLabel,
                    duration: matchDuration,
                    waitTime: 0, // We'll calculate this after all matches are processed
                    team1: team1Label,
                    team2: team2Label,
                    score1: score1,
                    score2: score2,
                    // FIX: Store players per team explicitly
                    players: [...team1Names, ...team2Names], // All players in the match
                    team1Players: [...team1Names], // Team 1 players explicitly
                    team2Players: [...team2Names], // Team 2 players explicitly
                    winner: score1 > score2 ? team1Names : team2Names, // Determine the winner based on scores
                    score: [score1, score2] // Store scores as an array for consistency
                });
                
                // Set score for team 1
                team1ScoreInput.focus();
                await new Promise(resolve => setTimeout(resolve, 200));
                team1ScoreInput.value = score1;
                
                // Trigger input and change events
                const inputEvent = new Event('input', { bubbles: true });
                team1ScoreInput.dispatchEvent(inputEvent);
                
                const changeEvent = new Event('change', { bubbles: true });
                team1ScoreInput.dispatchEvent(changeEvent);
                
                // Set score for team 2
                team2ScoreInput.focus();
                await new Promise(resolve => setTimeout(resolve, 200));
                team2ScoreInput.value = score2;
                
                team2ScoreInput.dispatchEvent(inputEvent);
                team2ScoreInput.dispatchEvent(changeEvent);
                team2ScoreInput.blur();
                
                // Don't click the submit button yet - we'll do that once after setting all scores
            }
            
            // Set the round duration to the longest match duration
            roundStats.totalDuration = longestMatchDuration;
            roundStats.longestMatchDuration = longestMatchDuration;
            
            // Calculate wait times for each match
            for (const match of roundStats.matches) {
                match.waitTime = longestMatchDuration - match.duration;
            }
            
            // Update player time stats
            this.updatePlayerTimeStats(simulator, roundStats);
            
            simulator.log(`Round ${simulator.currentRound} duration: ${longestMatchDuration} minutes`);
            
            // Now find and click the submit button for the entire round
            const submitBtn = currentRound.querySelector('.submit-scores-btn');
            if (submitBtn) {
                simulator.log(`Found submit button with text: "${submitBtn.textContent.trim()}"`);
                
                // Before submitting scores, check if the next round can be played
                // Count how many active players that haven't reached time limit
                const activePlayers = simulator.activePlayers.filter(player => 
                    !simulator.manualSitOutPlayers.has(player) && 
                    !simulator.autoTimeLimitSitOut.has(player) &&
                    simulator.playerStats[player] && 
                    !simulator.playerStats[player].hasLeftTournament
                );
                
                simulator.log(`Active players available for next round: ${activePlayers.length}`);
                simulator.log(`Active players: ${activePlayers.join(', ')}`);
                
                // We need at least 4 players to make a round (2 players per team, 2 teams)
                if (activePlayers.length < 4) {
                    simulator.log(`WARNING: Not enough active players (${activePlayers.length}) to form teams for the next round.`);
                    simulator.log(`Tournament simulation has reached its natural end after ${simulator.currentRound} rounds due to player time limits.`);
                    
                    // Show a toast notification in the simulator
                    simulator.showToast(`Tournament complete after ${simulator.currentRound} rounds. Not enough eligible players remain due to time limits.`, 'info');
                    
                    // Submit the final round scores still
                    await this.clickElement(simulator, submitBtn);
                    simulator.log('Final round scores submitted');
                    
                    // Stop auto run if it's running
                    if (simulator.autoRunInterval) {
                        simulator.stopAutoRun();
                    }
                    
                    return;
                }
                
                // If we have enough players, proceed normally
                await this.clickElement(simulator, submitBtn);
                simulator.log('Scores submitted for all matches in round');
                
                // Wait longer for the round submission to be processed
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check if there's a "Next Round" button that appears after submission
                // First try the specific next round button
                let nextRoundBtn = simulator.iframeDoc.querySelector('.next-round-btn');
                if (!nextRoundBtn) {
                    // If no specific next round button is found, look at all buttons
                    const allButtons = simulator.iframeDoc.querySelectorAll('button');
                    simulator.log(`Looking for next round button among ${allButtons.length} buttons`);
                    
                    // Log all button texts for debugging
                    Array.from(allButtons).forEach(btn => {
                        simulator.log(`Button text: "${btn.textContent.trim()}"`);
                    });
                    
                    nextRoundBtn = Array.from(allButtons).find(btn => {
                        const text = btn.textContent.toLowerCase().trim();
                        return text.includes('next round') || text.includes('next') || 
                               text.includes('continue') || text.includes('generate');
                    });
                }
                
                if (nextRoundBtn) {
                    simulator.log(`Found Next Round button with text: "${nextRoundBtn.textContent.trim()}", clicking it`);
                    await this.clickElement(simulator, nextRoundBtn);
                    
                    // Wait longer for the next round to be generated
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Verify that the next round was generated
                    const roundContainers = simulator.iframeDoc.querySelectorAll('.round-container, .round');
                    if (roundContainers.length > 0) {
                        const latestRound = roundContainers[roundContainers.length - 1];
                        simulator.log(`Found round container: ${latestRound.getAttribute('data-round') || 'unknown'}`);
                    } else {
                        simulator.log('No round containers found after clicking Next Round button');
                    }
                } else {
                    simulator.log('No Next Round button found, trying direct function call');
                    
                    // Try calling the generateNextRound function directly
                    try {
                        if (simulator.iframeWin && typeof simulator.iframeWin.generateNextRound === 'function') {
                            simulator.iframeWin.generateNextRound();
                            simulator.log('Called generateNextRound function directly');
                            
                            // Wait for the round to be generated
                            await new Promise(resolve => setTimeout(resolve, 1500));
                        } else {
                            simulator.log('generateNextRound function not available, adding GenerateNextRoundAction to queue');
                            
                            // Force add a GenerateNextRoundAction to the queue
                            if (simulator.actionQueue.length === 0 || 
                                !(simulator.actionQueue[0] instanceof GenerateNextRoundAction)) {
                                simulator.actionQueue.unshift(new GenerateNextRoundAction());
                                simulator.log('Added GenerateNextRoundAction to the beginning of the queue');
                            }
                        }
                    } catch (error) {
                        simulator.log(`Error calling generateNextRound: ${error.message}`);
                        
                        // Force add a GenerateNextRoundAction to the queue as fallback
                        simulator.actionQueue.unshift(new GenerateNextRoundAction());
                        simulator.log('Added GenerateNextRoundAction to the queue after error');
                    }
                }
            } else {
                simulator.log('Submit button not found for the round. Looking for alternatives...');
                
                // Try other potential selectors
                const altButtons = currentRound.querySelectorAll('button.submit-all, button.submit, button:not(.skip-match-btn):not(.edit-round-btn):not(.add-match-btn)');
                if (altButtons.length > 0) {
                    // Find the one that looks most like a submit button
                    const submitBtnAlt = Array.from(altButtons).find(btn => {
                        const text = btn.textContent.toLowerCase();
                        return text.includes('submit') || text.includes('save') || text.includes('continue');
                    }) || altButtons[0];
                    
                    simulator.log(`Found alternative submit button with text: "${submitBtnAlt.textContent.trim()}"`);
                    await this.clickElement(simulator, submitBtnAlt);
                    simulator.log('Scores submitted using alternative button');
                    
                    // Wait longer for the round submission to be processed
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Check if there's a "Next Round" button that appears after submission
                    // First try the specific next round button
                    let nextRoundBtn = simulator.iframeDoc.querySelector('.next-round-btn');
                    if (!nextRoundBtn) {
                        // If no specific next round button is found, look at all buttons
                        const allButtons = simulator.iframeDoc.querySelectorAll('button');
                        simulator.log(`Looking for next round button among ${allButtons.length} buttons`);
                        
                        // Log all button texts for debugging
                        Array.from(allButtons).forEach(btn => {
                            simulator.log(`Button text: "${btn.textContent.trim()}"`);
                        });
                        
                        nextRoundBtn = Array.from(allButtons).find(btn => {
                            const text = btn.textContent.toLowerCase().trim();
                            return text.includes('next round') || text.includes('next') || 
                                   text.includes('continue') || text.includes('generate');
                        });
                    }
                    
                    if (nextRoundBtn) {
                        simulator.log(`Found Next Round button with text: "${nextRoundBtn.textContent.trim()}", clicking it`);
                        await this.clickElement(simulator, nextRoundBtn);
                        
                        // Wait longer for the next round to be generated
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // Verify that the next round was generated
                        const roundContainers = simulator.iframeDoc.querySelectorAll('.round-container, .round');
                        if (roundContainers.length > 0) {
                            const latestRound = roundContainers[roundContainers.length - 1];
                            simulator.log(`Found round container: ${latestRound.getAttribute('data-round') || 'unknown'}`);
                        } else {
                            simulator.log('No round containers found after clicking Next Round button');
                        }
                    } else {
                        simulator.log('No Next Round button found, trying direct function call');
                        
                        // Try calling the generateNextRound function directly
                        try {
                            if (simulator.iframeWin && typeof simulator.iframeWin.generateNextRound === 'function') {
                                simulator.iframeWin.generateNextRound();
                                simulator.log('Called generateNextRound function directly');
                                
                                // Wait for the round to be generated
                                await new Promise(resolve => setTimeout(resolve, 1500));
                            } else {
                                simulator.log('generateNextRound function not available, adding GenerateNextRoundAction to queue');
                                
                                // Force add a GenerateNextRoundAction to the queue
                                if (simulator.actionQueue.length === 0 || 
                                    !(simulator.actionQueue[0] instanceof GenerateNextRoundAction)) {
                                    simulator.actionQueue.unshift(new GenerateNextRoundAction());
                                    simulator.log('Added GenerateNextRoundAction to the beginning of the queue');
                                }
                            }
                        } catch (error) {
                            simulator.log(`Error calling generateNextRound: ${error.message}`);
                            
                            // Force add a GenerateNextRoundAction to the queue as fallback
                            simulator.actionQueue.unshift(new GenerateNextRoundAction());
                            simulator.log('Added GenerateNextRoundAction to the queue after error');
                        }
                    }
                } else {
                    simulator.log('No submit button found for this round');
                }
            }
            
            // Add debug analysis of which players didn't get to play this round
            simulator.log(`--- Match Distribution Analysis for Round ${simulator.currentRound} ---`);
            const playersInMatches = new Set();
            for (const match of roundStats.matches) {
                match.players.forEach(player => playersInMatches.add(player));
            }
            
            // Check which active players didn't get to play
            const activePlayersNotPlayed = simulator.activePlayers.filter(player => !playersInMatches.has(player));
            
            if (activePlayersNotPlayed.length > 0) {
                simulator.log(`NOTICE: ${activePlayersNotPlayed.length} active players did not play in round ${simulator.currentRound}:`);
                activePlayersNotPlayed.forEach(player => {
                    const consecutiveRounds = simulator.getConsecutiveSittingRounds(player);
                    simulator.log(`- ${player} (missed ${consecutiveRounds} consecutive rounds)`);
                });
            } else {
                simulator.log(`All ${simulator.activePlayers.length} active players participated in matches this round.`);
            }
            
            simulator.log(`---------------------------------------------------`);
            
            // Final step - make sure UI is up to date for any player status changes
            simulator.log('Ensuring player UI is synchronized with simulator data...');
            simulator.updateWebappPlayerUI();
            
            simulator.log('Round completed!');
            
        } catch (error) {
            simulator.log(`Error submitting scores: ${error.message}`);
            throw error;
        }
    }
}

// Edit a round
class EditRoundAction extends Action {
    constructor() {
        super('Editing a round');
    }
    
    async execute(simulator) {
        try {
            // Since there's no explicit "Edit Round" button in the app,
            // this action will simulate clicking a match to edit its scores
            
            // Find all match containers in the current round
            const currentRoundContainer = simulator.iframeDoc.querySelector('.round-container:last-child');
            if (!currentRoundContainer) {
                simulator.log('Current round container not found');
                return;
            }
            
            // Find completed matches that can be edited
            const completedMatches = currentRoundContainer.querySelectorAll('.match-container.completed');
            if (completedMatches.length === 0) {
                simulator.log('No completed matches found to edit');
                return;
            }
            
            // Select a random completed match
            const matchToEdit = completedMatches[Math.floor(Math.random() * completedMatches.length)];
            
            // Find the edit button within the match
            const editButton = matchToEdit.querySelector('.edit-match-btn, .edit-score-btn');
            if (!editButton) {
                simulator.log('Edit button not found in the selected match');
                return;
            }
            
            // Click the edit button
            await this.clickElement(simulator, editButton);
            
            // Find the score input fields
            const team1ScoreInput = matchToEdit.querySelector('.team1-score');
            const team2ScoreInput = matchToEdit.querySelector('.team2-score');
            
            if (!team1ScoreInput || !team2ScoreInput) {
                simulator.log('Score input fields not found');
                return;
            }
            
            // Generate new random scores
            const [score1, score2] = simulator.generateRandomScores();
            
            // Set the new score values
            team1ScoreInput.value = score1;
            team2ScoreInput.value = score2;
            
            // Trigger input events
            const inputEvent = new Event('input', { bubbles: true });
            team1ScoreInput.dispatchEvent(inputEvent);
            team2ScoreInput.dispatchEvent(inputEvent);
            
            // Find and click the submit/save button
            const submitBtn = matchToEdit.querySelector('.submit-score-btn, .save-edit-btn');
            if (submitBtn) {
                await this.clickElement(simulator, submitBtn);
                simulator.log('Match scores edited successfully');
            } else {
                simulator.log('Submit/save button not found');
            }
            
        } catch (error) {
            simulator.log(`Error editing round: ${error.message}`);
            throw error;
        }
    }
}

// Edit match history
class EditMatchHistoryAction extends Action {
    constructor() {
        super('Viewing match history');
    }
    
    async execute(simulator) {
        try {
            // Click the "Match History" button
            const matchHistoryBtn = await this.waitForElement(simulator, '#matchesPlayed');
            await this.clickElement(simulator, matchHistoryBtn);
            simulator.log('Opened match history panel');
            
            // Wait for history to load
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Click a random match in the history (if available)
            const historyMatches = simulator.iframeDoc.querySelectorAll('.match-history-item');
            if (historyMatches && historyMatches.length > 0) {
                const randomMatch = historyMatches[Math.floor(Math.random() * historyMatches.length)];
                simulator.log(`Clicking on match history item: ${randomMatch.textContent.trim().substring(0, 30)}...`);
                await this.clickElement(simulator, randomMatch);
                
                // Wait for match details to load
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Close match details dialog if opened
                const closeDetailsBtn = simulator.iframeDoc.querySelector('.close-details, .back-btn, .close-match-btn, .close-modal, .modal-close');
                if (closeDetailsBtn) {
                    simulator.log('Found close button for match details, clicking it');
                    await this.clickElement(simulator, closeDetailsBtn);
                    
                    // Wait for match details to close
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    simulator.log('No close button found for match details');
                    
                    // Try clicking outside the modal (a common way to close modals)
                    const modal = simulator.iframeDoc.querySelector('.modal, .dialog, .popup');
                    if (modal && modal.parentElement) {
                        simulator.log('Attempting to close modal by clicking outside it');
                        modal.parentElement.click();
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            } else {
                simulator.log('No match history items found');
            }
            
            // Look for the specific close button mentioned in the requirements
            const closeMatchHistoryBtn = simulator.iframeDoc.querySelector('#closeMatchHistoryBtn');
            if (closeMatchHistoryBtn) {
                simulator.log('Found #closeMatchHistoryBtn, clicking it to close match history panel');
                await this.clickElement(simulator, closeMatchHistoryBtn);
                simulator.log('Closed match history panel using the close button');
                return;
            }
            
            // If the specific button is not found, try other approaches
            simulator.log('Could not find #closeMatchHistoryBtn, trying alternative approaches');
            
            // Try common close button selectors
            const closeButtons = [
                '.close-history-btn',
                '.back-btn',
                '.close-btn',
                '.panel-close',
                '.close-panel',
                '.close',
                '.history-close',
                'button:has(.material-symbols-rounded)', // Any button with icon
                'button.btn-close'
            ];
            
            let closedPanel = false;
            
            // Try each selector
            for (const selector of closeButtons) {
                const closeBtn = simulator.iframeDoc.querySelector(selector);
                if (closeBtn) {
                    simulator.log(`Found close button with selector "${selector}", clicking it`);
                    await this.clickElement(simulator, closeBtn);
                    closedPanel = true;
                    break;
                }
            }
            
            // If no close button found, try clicking any button with a close icon
            if (!closedPanel) {
                const allButtons = simulator.iframeDoc.querySelectorAll('button');
                for (const btn of allButtons) {
                    const hasCloseIcon = btn.querySelector('.material-symbols-rounded') && 
                                         (btn.textContent.trim() === 'close' || 
                                          btn.textContent.trim() === 'arrow_back' ||
                                          btn.textContent.trim() === '×' ||
                                          btn.querySelector('.material-symbols-rounded').textContent === 'close');
                    
                    if (hasCloseIcon) {
                        simulator.log('Found button with close icon, clicking it');
                        await this.clickElement(simulator, btn);
                        closedPanel = true;
                        break;
                    }
                }
            }
            
            // If still no success, try clicking the match history button again to toggle panel
            if (!closedPanel) {
                simulator.log('No specific close button found, clicking match history button again to toggle panel');
                await this.clickElement(simulator, matchHistoryBtn);
            }
            
            // Extra check to ensure all modals/panels are closed
            await new Promise(resolve => setTimeout(resolve, 500));
            const anyVisibleModals = simulator.iframeDoc.querySelectorAll('.modal[style*="display: block"], .panel.active, .panel.open, .panel[style*="display: block"]');
            if (anyVisibleModals.length > 0) {
                simulator.log(`Found ${anyVisibleModals.length} still-open modals/panels, attempting to close them`);
                
                // Try clicking the first close button in each modal
                for (const modal of anyVisibleModals) {
                    const modalCloseBtn = modal.querySelector('button.close, .close-btn, .btn-close, [class*="close"]');
                    if (modalCloseBtn) {
                        await this.clickElement(simulator, modalCloseBtn);
                    } else {
                        // If no close button, try clicking outside the modal
                        if (modal.parentElement) {
                            modal.parentElement.click();
                        }
                    }
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
            
            simulator.log('Match history viewing completed');
            
        } catch (error) {
            simulator.log(`Error viewing match history: ${error.message}`);
            throw error;
        }
    }
}

// Sit out players
class SitOutPlayersAction extends Action {
    constructor(playerCount) {
        super(`Sitting out ${playerCount} players`);
        this.playerCount = playerCount;
    }
    
    async execute(simulator) {
        try {
            // Check if sit outs are allowed
            if (simulator.enableSitOutToggle && !simulator.enableSitOutToggle.checked) {
                simulator.log('Skipping sit out action because sit outs are disabled in settings');
                return;
            }
            
            // Save reference to the toggle button that opens the panel
            let togglePlayerListBtn = await this.waitForElement(simulator, '#togglePlayerList');
            // Remember which button we used to open the panel for closing it later
            const toggleButtonSelector = togglePlayerListBtn.id ? `#${togglePlayerListBtn.id}` : 
                                        togglePlayerListBtn.className ? `.${togglePlayerListBtn.className.split(' ')[0]}` : 
                                        'button[id*="player"], button[class*="player"]';
            
            simulator.log(`Using player panel toggle: ${toggleButtonSelector}`);
            await this.clickElement(simulator, togglePlayerListBtn);
            
            // Find the player list
            const playerList = await this.waitForElement(simulator, '#playerList');
            const playerRows = playerList.querySelectorAll('tr');
            
            if (playerRows.length === 0) {
                simulator.log('No players found in player list');
                // Close the panel using the same button
                togglePlayerListBtn = simulator.iframeDoc.querySelector(toggleButtonSelector);
                if (togglePlayerListBtn) {
                    await this.clickElement(simulator, togglePlayerListBtn);
                }
                return;
            }
            
            // Filter only active players who are not approaching their time limit
            const activePlayers = Array.from(playerRows).filter(row => {
                const playerCell = row.querySelector('td:first-child');
                const statusCell = row.querySelector('td:nth-child(2)');
                
                if (!playerCell || !statusCell) return false;
                
                const playerName = playerCell.textContent.trim();
                const isActive = statusCell.textContent.trim() !== 'Sitting Out';
                
                // Check if player is approaching time limit
                const playerStats = simulator.playerStats[playerName];
                let isApproachingTimeLimit = false;
                if (playerStats) {
                    const timeRemaining = playerStats.availableTime - playerStats.totalTime;
                    isApproachingTimeLimit = timeRemaining <= 15;
                }
                
                // Only include players who are active and not approaching time limit
                return isActive && !isApproachingTimeLimit;
            });
            
            if (activePlayers.length === 0) {
                simulator.log('No eligible active players found to sit out');
                // Close the panel using the same button
                togglePlayerListBtn = simulator.iframeDoc.querySelector(toggleButtonSelector);
                if (togglePlayerListBtn) {
                    await this.clickElement(simulator, togglePlayerListBtn);
                }
                return;
            }
            
            // Sit out random players from active players
            const playersToSitOut = simulator.getRandomPlayers(
                activePlayers, 
                Math.min(this.playerCount, activePlayers.length - 4) // Ensure at least 4 remain active
            );
            
            // Toggle their status
            for (const playerRow of playersToSitOut) {
                const playerName = playerRow.querySelector('td:first-child').textContent.trim();
                const statusToggle = playerRow.querySelector('input[type="checkbox"]');
                
                if (statusToggle) {
                    statusToggle.checked = false;
                    
                    // Trigger change event
                    const changeEvent = new Event('change', { bubbles: true });
                    statusToggle.dispatchEvent(changeEvent);
                    
                    // Update simulator tracking
                    simulator.sittingOutPlayers.push(playerName);
                    simulator.activePlayers = simulator.activePlayers.filter(p => p !== playerName);
                    
                    // Add to manual sit out tracking
                    simulator.manualSitOutPlayers.add(playerName);
                    
                    // Calculate a reasonable sit-out period based on court count and player count
                    // With 4 courts and standard doubles (8 players per round), the max sit-out should be lower
                    // when there are fewer total players to ensure everyone gets to play regularly
                    const totalPlayers = simulator.activePlayers.length + simulator.sittingOutPlayers.length;
                    const courtCount = simulator.iframeDoc.querySelectorAll('.court-count button.active').length || 4;
                    const playersPerRound = courtCount * 4; // 4 players per court
                    
                    // Calculate max reasonable sit-out rounds:
                    // If we have just enough players for all courts (or fewer), sit-out should be 1 round max
                    // As we get more players, sit-out can be longer
                    const recommendedMaxSitOut = Math.max(1, Math.min(3, Math.ceil((totalPlayers - playersPerRound) / 4)));
                    
                    // Get the configured min/max sit-out rounds
                    const sitOutConfig = simulator.getSitOutRoundsRange();
                    
                    // Special case: if min equals max and equals 1, ALWAYS use 1 round
                    let sitOutRounds = 1;
                    
                    if (sitOutConfig.min === 1 && sitOutConfig.max === 1) {
                        // Always sit out exactly 1 round when min=max=1
                        sitOutRounds = 1;
                        simulator.log(`Using fixed 1-round sit-out period (min=max=1 in settings)`);
                    } else {
                        // Otherwise use the normal calculation with the recommended max
                        sitOutRounds = Math.min(simulator.generateRandomSitOutRounds(), recommendedMaxSitOut);
                        simulator.log(`Generated random sit-out duration: ${sitOutRounds} rounds (min=${sitOutConfig.min}, max=${sitOutConfig.max}, recommended max=${recommendedMaxSitOut})`);
                    }
                    
                    simulator.log(`Calculated recommended max sit-out: ${recommendedMaxSitOut} rounds ` +
                                  `(players: ${totalPlayers}, courts: ${courtCount}, players per round: ${playersPerRound})`);
                    
                    simulator.playerManualSitOutRounds[playerName] = {
                        startRound: simulator.currentRound,
                        duration: sitOutRounds,
                        endRound: simulator.currentRound + sitOutRounds,
                        forceSingleRound: sitOutConfig.min === 1 && sitOutConfig.max === 1 // Flag for special handling
                    };
                    
                    // Add to status history
                    if (!simulator.playerStatusHistory[playerName]) {
                        simulator.playerStatusHistory[playerName] = [];
                    }
                    simulator.playerStatusHistory[playerName].push({
                        round: simulator.currentRound,
                        status: 'Sitting Out',
                        reason: `Manual (for ${sitOutRounds} rounds)`
                    });
                    
                    simulator.log(`Sitting out player: ${playerName} for ${sitOutRounds} rounds (until round ${simulator.currentRound + sitOutRounds})`);
                    simulator.log(`Current active players: ${simulator.activePlayers.length}, Sitting out: ${simulator.sittingOutPlayers.length}, Total: ${simulator.activePlayers.length + simulator.sittingOutPlayers.length}`);
                }
            }
            
            // Close the player list panel with the same button we used to open it
            await new Promise(resolve => setTimeout(resolve, 500));
            togglePlayerListBtn = simulator.iframeDoc.querySelector(toggleButtonSelector);
            if (togglePlayerListBtn) {
                simulator.log('Closing player panel using the same toggle button');
                await this.clickElement(simulator, togglePlayerListBtn);
            } else {
                simulator.log('Toggle button not found for closing, trying alternatives');
                
                // Try to find any button with arrow icon that might be the toggle
                const panelButtons = simulator.iframeDoc.querySelectorAll('.panel button, .sidebar button, .player-panel button');
                
                for (const btn of panelButtons) {
                    // Check if the button contains an arrow icon or has an arrow class
                    const hasArrowIcon = btn.querySelector('.arrow, .chevron, .material-symbols-rounded, [class*="arrow"], [class*="chevron"]') || 
                                         btn.innerHTML.includes('arrow') || 
                                         btn.className.includes('arrow') ||
                                         btn.className.includes('circle');
                    
                    if (hasArrowIcon) {
                        simulator.log('Found button with arrow/circle icon, clicking it to close panel');
                        await this.clickElement(simulator, btn);
                        break;
                    }
                }
            }
            
            simulator.log('Player status changes completed');
            
        } catch (error) {
            simulator.log(`Error sitting out players: ${error.message}`);
            throw error;
        }
    }
}

// Activate players
class ActivatePlayersAction extends Action {
    constructor(playerCount) {
        super(`Activating ${playerCount} players`);
        this.playerCount = playerCount;
    }
    
    async execute(simulator) {
        try {
            // If there are no sitting out players, nothing to do
            if (simulator.sittingOutPlayers.length === 0) {
                simulator.log('No players to activate.');
                return;
            }
            
            // If sit outs are disabled, activate all sitting out players
            const activateAll = simulator.enableSitOutToggle && !simulator.enableSitOutToggle.checked;
            const numToActivate = activateAll ? simulator.sittingOutPlayers.length : Math.min(this.playerCount, simulator.sittingOutPlayers.length);
            
            if (activateAll) {
                simulator.log(`Activating all ${numToActivate} sitting out players because sit outs are disabled`);
            } else {
                simulator.log(`Activating ${numToActivate} of ${simulator.sittingOutPlayers.length} sitting out players`);
            }
            
            // Save reference to the toggle button that opens the panel
            let togglePlayerListBtn = await this.waitForElement(simulator, '#togglePlayerList');
            // Remember which button we used to open the panel for closing it later
            const toggleButtonSelector = togglePlayerListBtn.id ? `#${togglePlayerListBtn.id}` : 
                                        togglePlayerListBtn.className ? `.${togglePlayerListBtn.className.split(' ')[0]}` : 
                                        'button[id*="player"], button[class*="player"]';
            
            simulator.log(`Using player panel toggle: ${toggleButtonSelector}`);
            await this.clickElement(simulator, togglePlayerListBtn);
            
            // Find the player list
            const playerList = await this.waitForElement(simulator, '#playerList');
            const playerRows = playerList.querySelectorAll('tr');
            
            // Filter only sitting out players
            const sittingOutPlayers = Array.from(playerRows).filter(row => {
                const statusCell = row.querySelector('td:nth-child(2)');
                return statusCell && statusCell.textContent.trim() === 'Sitting Out';
            });
            
            if (sittingOutPlayers.length === 0) {
                simulator.log('No sitting out players found in player list');
                // Close the panel using the same button
                togglePlayerListBtn = simulator.iframeDoc.querySelector(toggleButtonSelector);
                if (togglePlayerListBtn) {
                    await this.clickElement(simulator, togglePlayerListBtn);
                }
                return;
            }
            
            // Activate players
            const playersToActivate = activateAll ? 
                sittingOutPlayers : 
                simulator.getRandomPlayers(sittingOutPlayers, numToActivate);
            
            // Toggle their status
            for (const playerRow of playersToActivate) {
                const playerName = playerRow.querySelector('td:first-child').textContent.trim();
                const statusToggle = playerRow.querySelector('input[type="checkbox"]');
                
                if (statusToggle) {
                    statusToggle.checked = true;
                    
                    // Trigger change event
                    const changeEvent = new Event('change', { bubbles: true });
                    statusToggle.dispatchEvent(changeEvent);
                    
                    // Update simulator tracking
                    simulator.activePlayers.push(playerName);
                    simulator.sittingOutPlayers = simulator.sittingOutPlayers.filter(p => p !== playerName);
                    
                    // Remove from manual sit out tracking
                    simulator.manualSitOutPlayers.delete(playerName);
                    
                    // Clear any sit-out rounds tracking for this player
                    delete simulator.playerManualSitOutRounds[playerName];
                    
                    // Add to status history
                    if (!simulator.playerStatusHistory[playerName]) {
                        simulator.playerStatusHistory[playerName] = [];
                    }
                    simulator.playerStatusHistory[playerName].push({
                        round: simulator.currentRound,
                        status: 'Active',
                        reason: 'Manually activated'
                    });
                    
                    simulator.log(`Activated player: ${playerName}`);
                    simulator.log(`Current active players: ${simulator.activePlayers.length}, Sitting out: ${simulator.sittingOutPlayers.length}, Total: ${simulator.activePlayers.length + simulator.sittingOutPlayers.length}`);
                }
            }
            
            // Close the player list panel with the same button we used to open it
            await new Promise(resolve => setTimeout(resolve, 500));
            togglePlayerListBtn = simulator.iframeDoc.querySelector(toggleButtonSelector);
            if (togglePlayerListBtn) {
                simulator.log('Closing player panel using the same toggle button');
                await this.clickElement(simulator, togglePlayerListBtn);
            } else {
                simulator.log('Toggle button not found for closing, trying alternatives');
                
                // Try to find any button with arrow icon that might be the toggle
                const panelButtons = simulator.iframeDoc.querySelectorAll('.panel button, .sidebar button, .player-panel button');
                
                for (const btn of panelButtons) {
                    // Check if the button contains an arrow icon or has an arrow class
                    const hasArrowIcon = btn.querySelector('.arrow, .chevron, .material-symbols-rounded, [class*="arrow"], [class*="chevron"]') || 
                                         btn.innerHTML.includes('arrow') || 
                                         btn.className.includes('arrow') ||
                                         btn.className.includes('toggle');
                    
                    if (hasArrowIcon) {
                        simulator.log('Found button with arrow icon, clicking it to close panel');
                        await this.clickElement(simulator, btn);
                        break;
                    }
                }
            }
            
            simulator.log('Player activation completed');
            
        } catch (error) {
            simulator.log(`Error activating players: ${error.message}`);
            throw error;
        }
    }
}

// Add a match
class AddMatchAction extends Action {
    constructor() {
        super('Adding a match manually');
    }
    
    async execute(simulator) {
        try {
            // Since there's no explicit "Add Match" button in the app,
            // we will log that this feature isn't implemented
            simulator.log('Manual match addition not implemented in the app UI');
            
        } catch (error) {
            simulator.log(`Error adding match: ${error.message}`);
            throw error;
        }
    }
}

// Skip a match
class SkipMatchAction extends Action {
    constructor() {
        super('Skipping a match');
    }
    
    async execute(simulator) {
        try {
            // Only execute if skip matches is enabled
            // Make a safer check for enableSkipMatchesToggle
            if (!simulator.enableSkipMatchesToggle || 
                (simulator.enableSkipMatchesToggle && simulator.enableSkipMatchesToggle.checked === false)) {
                simulator.log('Skip matches is disabled, skipping this action');
                return;
            }
            
            // Find all match containers in the current round
            const allRounds = simulator.iframeDoc.querySelectorAll('.round-container, .round');
            if (allRounds.length === 0) {
                simulator.log('No round containers found');
                return;
            }
            
            const currentRound = allRounds[allRounds.length - 1];
            simulator.log(`Found current round: ${currentRound.getAttribute('data-round') || 'unknown'}`);
            
            // Find incomplete matches
            const allMatches = currentRound.querySelectorAll('.match, .match-container');
            const incompleteMatches = Array.from(allMatches).filter(
                match => !match.classList.contains('completed') && !match.classList.contains('skipped')
            );
            
            if (incompleteMatches.length === 0) {
                simulator.log('No incomplete matches found to skip');
                return;
            }
            
            // Select a random incomplete match
            const matchToSkip = incompleteMatches[Math.floor(Math.random() * incompleteMatches.length)];
            simulator.log(`Selected match to skip: ${matchToSkip.getAttribute('data-match') || 'unknown'}`);
            
            // Look for a skip button
            const skipButton = matchToSkip.querySelector('.skip-match-btn');
            if (skipButton) {
                simulator.log('Found skip button, clicking it');
                await this.clickElement(simulator, skipButton);
                
                // Wait for the confirmation dialog
                await new Promise(resolve => setTimeout(resolve, 600));
                
                // Now look for the confirmation dialog
                const confirmButtons = simulator.iframeDoc.querySelectorAll('button.confirm-skip, button.confirm, button.yes-button, button.confirm-btn');
                simulator.log(`Found ${confirmButtons.length} potential confirmation buttons`);
                
                if (confirmButtons.length > 0) {
                    // Find the most likely confirmation button by text content
                    let confirmBtn = null;
                    
                    for (const btn of confirmButtons) {
                        const text = btn.textContent.toLowerCase().trim();
                        simulator.log(`Found button with text: "${text}"`);
                        
                        if (text.includes('confirm') || text.includes('yes') || text.includes('ok') || text.includes('skip')) {
                            confirmBtn = btn;
                            break;
                        }
                    }
                    
                    // If no button with typical confirmation text found, use the first one
                    if (!confirmBtn && confirmButtons.length > 0) {
                        confirmBtn = confirmButtons[0];
                    }
                    
                    if (confirmBtn) {
                        simulator.log(`Clicking confirmation button with text: "${confirmBtn.textContent.trim()}"`);
                        await this.clickElement(simulator, confirmBtn);
                    } else {
                        simulator.log('No confirmation button found');
                    }
                } else {
                    // If no specific confirmation buttons found, try to find any button in a dialog or modal
                    const modalButtons = simulator.iframeDoc.querySelectorAll('.modal button, .dialog button, .popup button');
                    
                    if (modalButtons.length > 0) {
                        const confirmBtn = Array.from(modalButtons).find(btn => {
                            const text = btn.textContent.toLowerCase().trim();
                            return text.includes('confirm') || text.includes('yes') || text.includes('ok') || !text.includes('cancel');
                        }) || modalButtons[0];
                        
                        simulator.log(`Clicking modal button with text: "${confirmBtn.textContent.trim()}"`);
                        await this.clickElement(simulator, confirmBtn);
                    } else {
                        // Last resort: click anywhere on the document to dismiss any overlay
                        simulator.log('No modal buttons found, clicking on document body to dismiss dialog');
                        simulator.iframeDoc.body.click();
                    }
                }
                
                simulator.log('Match skipped successfully');
            } else {
                simulator.log('Skip button not found, skipping this action');
            }
            
        } catch (error) {
            simulator.log(`Error skipping match: ${error.message}`);
            throw error;
        }
    }
}

// New class to activate specific players by name
class ActivateSpecificPlayersAction extends Action {
    constructor(playerNames) {
        super(`Activating specific players: ${playerNames.join(', ')}`);
        this.playerNames = playerNames;
    }
    
    async execute(simulator) {
        try {
            if (this.playerNames.length === 0) {
                simulator.log('No players to activate');
                return;
            }
            
            // Save reference to the toggle button that opens the panel
            let togglePlayerListBtn = await this.waitForElement(simulator, '#togglePlayerList');
            // Remember which button we used to open the panel for closing it later
            const toggleButtonSelector = togglePlayerListBtn.id ? `#${togglePlayerListBtn.id}` : 
                                        togglePlayerListBtn.className ? `.${togglePlayerListBtn.className.split(' ')[0]}` : 
                                        'button[id*="player"], button[class*="player"]';
            
            simulator.log(`Using player panel toggle: ${toggleButtonSelector}`);
            await this.clickElement(simulator, togglePlayerListBtn);
            
            // Find the player list
            const playerList = await this.waitForElement(simulator, '#playerList');
            const playerRows = playerList.querySelectorAll('tr');
            
            if (playerRows.length === 0) {
                simulator.log('No players found in player list');
                // Close the panel using the same button
                togglePlayerListBtn = simulator.iframeDoc.querySelector(toggleButtonSelector);
                if (togglePlayerListBtn) {
                    await this.clickElement(simulator, togglePlayerListBtn);
                }
                return;
            }
            
            // Find and activate each player in the list
            for (const playerName of this.playerNames) {
                let found = false;
                
                // Skip players who have left the tournament
                if (simulator.playerStats[playerName] && simulator.playerStats[playerName].hasLeftTournament) {
                    simulator.log(`Player ${playerName} has left the tournament and cannot be activated`);
                    continue;
                }
                
                for (const playerRow of playerRows) {
                    const playerCell = playerRow.querySelector('td:first-child');
                    if (!playerCell) continue;
                    
                    const rowPlayerName = playerCell.textContent.trim();
                    if (rowPlayerName === playerName) {
                        found = true;
                        const statusToggle = playerRow.querySelector('input[type="checkbox"]');
                        
                        if (statusToggle) {
                            // Toggle to checked (active)
                            statusToggle.checked = true;
                            
                            // Trigger change event
                            const changeEvent = new Event('change', { bubbles: true });
                            statusToggle.dispatchEvent(changeEvent);
                            
                            // Update simulator tracking
                            simulator.activePlayers.push(playerName);
                            simulator.sittingOutPlayers = simulator.sittingOutPlayers.filter(p => p !== playerName);
                            
                            // Remove from manual sit out tracking
                            simulator.manualSitOutPlayers.delete(playerName);
                            // Remove from playerManualSitOutRounds
                            delete simulator.playerManualSitOutRounds[playerName];
                            
                            simulator.log(`Activated player: ${playerName}`);
                        } else {
                            simulator.log(`Could not find status toggle for player: ${playerName}`);
                        }
                        break;
                    }
                }
                
                if (!found) {
                    simulator.log(`Player not found in list: ${playerName}`);
                }
            }
            
            // Close the player list panel with the same button we used to open it
            await new Promise(resolve => setTimeout(resolve, 500));
            togglePlayerListBtn = simulator.iframeDoc.querySelector(toggleButtonSelector);
            if (togglePlayerListBtn) {
                simulator.log('Closing player panel using the same toggle button');
                await this.clickElement(simulator, togglePlayerListBtn);
            } else {
                simulator.log('Toggle button not found for closing, trying alternatives');
                
                // Try to find any button with arrow icon that might be the toggle
                const panelButtons = simulator.iframeDoc.querySelectorAll('.panel button, .sidebar button, .player-panel button');
                
                for (const btn of panelButtons) {
                    // Check if the button contains an arrow icon or has an arrow class
                    const hasArrowIcon = btn.querySelector('.arrow, .chevron, .material-symbols-rounded, [class*="arrow"], [class*="chevron"]') || 
                                         btn.innerHTML.includes('arrow') || 
                                         btn.className.includes('arrow') ||
                                         btn.className.includes('circle');
                    
                    if (hasArrowIcon) {
                        simulator.log('Found button with arrow/circle icon, clicking it to close panel');
                        await this.clickElement(simulator, btn);
                        break;
                    }
                }
            }
            
            simulator.log('Player activation completed');
            
        } catch (error) {
            simulator.log(`Error activating players: ${error.message}`);
            throw error;
        }
    }
}

// Create a global simulator variable
let simulator;

// Add debugging statements and initialize the simulator
document.addEventListener('DOMContentLoaded', function() {
    console.log('Document loaded, initializing simulator...');
    simulator = new PicklePairsSimulator();
    console.log('Simulator initialized!');
    
    // Optional: Automatically start the simulation after a brief delay (for debugging)
    /*
    setTimeout(() => {
        if (simulator.startBtn && !simulator.isRunning) {
            console.log('Auto-starting simulation...');
            simulator.startBtn.click();
        }
    }, 2000);
    */
}); 