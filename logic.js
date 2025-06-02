// Navigation handling

// Modified showSection function
function showSection(sectionId) {
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active-section');
        s.style.display = 'none';
    });
    
    // Update active button state
    document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active-button'));
    
    // Show requested section
    const section = document.getElementById(sectionId);
    section.classList.add('active-section');
    section.style.display = 'block';
    event.currentTarget.classList.add('active-button');
}
// Sheet URLs
const mainSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbgKj5tqe0BVFOO-7ArgU_To2jU6pK4sWK3-nv61Tl6Zhba5Ocx6f8_cLlWgsWR1kD4Xg3W5Glm8t8/pub?gid=0&single=true&output=csv';
const topPlayersSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbgKj5tqe0BVFOO-7ArgU_To2jU6pK4sWK3-nv61Tl6Zhba5Ocx6f8_cLlWgsWR1kD4Xg3W5Glm8t8/pub?gid=1567169448&single=true&output=csv';

// Countdown Configuration
const targetDate = new Date("2025-06-03T01:50:00");
let countdownIntervalId;
let dataFetchIntervalId;

function updateCountdownDisplay(days, hours, minutes, seconds) {
    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

function checkCountdown() {
    const now = new Date();
    const timeLeft = targetDate - now;
    // Note: tableBodies selector is now handled within the if/else or by fetchData

    if (timeLeft <= 0) {
        // Countdown finished
        clearInterval(countdownIntervalId);
        updateCountdownDisplay(0, 0, 0, 0);
        document.getElementById('countdown-message').textContent = "Standings are now live!";
        
        // fetchData will now handle making tables visible after populating them.
        fetchData(); 
        if (!dataFetchIntervalId) { // Ensure interval is only set once
            dataFetchIntervalId = setInterval(fetchData, 300000); // Refresh every 5 minutes
        }
    } else {
        // Countdown active
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        updateCountdownDisplay(days, hours, minutes, seconds);
        document.getElementById('countdown-message').textContent = "Until standings are revealed!";
        // Keep tables hidden during countdown
        document.querySelectorAll('.scouting-table tbody').forEach(tbody => tbody.style.display = 'none');
    }
}

// Team mapping configuration
const teamMapping = {
    'Inter Milan': 'inter-milan',
    'Liverpool': 'liverpool',
    'AC Milan': 'AC-milan',
    'Real Madrid': 'Real-madrid',
    'Bayern Munich': 'bayern',
    'Arsenal': 'Arsenal',
    'Paris Saint-Germain': 'Paris',
    'Manchester City': 'Manchester',
    'Barcelona': 'Barcelona',
    'Chelsea': 'Chelsea'
};

// Main data fetching function
async function fetchData() {
    try {
        // Fetch and process main team data
        const mainResponse = await axios.get(mainSheetURL);
        const mainData = Papa.parse(mainResponse.data, { header: true });
        updateTeamData(mainData.data); // This calls updateStandings internally for the main table
        
        // Fetch and process top players data
        const topPlayersResponse = await axios.get(topPlayersSheetURL);
        const topPlayersData = Papa.parse(topPlayersResponse.data, { header: true });
        updateTopPlayersTable(topPlayersData.data); // This populates the top players table

        // Now that data is fetched and tables are populated, make them visible
        document.querySelectorAll('.scouting-table tbody').forEach(tbody => {
            tbody.style.display = ''; // Reset to default display (e.g., 'table-row-group')
        });

    } catch (error) {
        console.error('Error fetching data:', error);
        // Optionally, still show tables but empty or with an error message.
        // For now, if there's an error, they might remain hidden or display issues
        // depending on when the error occurred.
    }
}

// Update team data and standings
function updateTeamData(players) {
    // Clear existing team cards
    document.querySelectorAll('.team-group').forEach(team => {
        team.querySelectorAll('.member-card').forEach(card => card.remove());
    });

    // Group players by team
    const grouped = players.reduce((acc, player) => {
        const teamId = teamMapping[player.Team];
        if (teamId) {
            if (!acc[teamId]) acc[teamId] = [];
            acc[teamId].push(player);
        }
        return acc;
    }, {});

    // Calculate team points
    const teamPoints = {};
    Object.entries(grouped).forEach(([teamId, players]) => {
        const totalPoints = players.reduce((sum, player) => sum + parseFloat(player.Rate || 0), 0);
        teamPoints[teamId] = Math.round(totalPoints);
    });

    // Update team rosters
    Object.entries(grouped).forEach(([teamId, players]) => {
        const teamSection = document.getElementById(teamId);
        if (teamSection) {
            players.forEach(player => {
                const card = document.createElement('div');
                card.className = 'member-card';
                card.innerHTML = `
                    <div class="player-number">${player.Number}</div>
                    <div>${player.Name}</div>
                    <div class="scout-rating">⭐ ${player.Rate}</div>
                `;
                teamSection.appendChild(card);
            });
        }
    });

    // Update standings table
    updateStandings(teamPoints);
}

// Update league standings
function updateStandings(teamPoints) {
    const tableBody = document.querySelector('#table .scouting-table tbody');
    if (!tableBody) {
        console.error("Standings table body in #table not found!");
        return;
    }
    tableBody.innerHTML = ''; // Clear any existing rows, including placeholders if any were left

    // Create an array of team data for sorting
    const teamsArray = [];
    // Iterate through teamMapping to maintain a consistent order or get display names
    for (const teamDisplayName in teamMapping) {
        const teamId = teamMapping[teamDisplayName];
        teamsArray.push({
            name: teamDisplayName, // The name to display in the table
            id: teamId,
            points: teamPoints[teamId] || 0
        });
    }

    // Sort teams by points in descending order
    teamsArray.sort((a, b) => b.points - a.points);

    // Populate the table
    teamsArray.forEach((team, index) => {
        const row = document.createElement('tr');

        const posCell = document.createElement('td');
        posCell.textContent = index + 1;
        row.appendChild(posCell);

        const nameCell = document.createElement('td');
        nameCell.textContent = team.name;
        row.appendChild(nameCell);

        const ptsCell = document.createElement('td');
        ptsCell.textContent = team.points;
        row.appendChild(ptsCell);

        // Apply special styling for top 3 teams (e.g., Inter Milan theme)
        if (index < 3) {
            row.classList.add('inter-row');
        }
        
        tableBody.appendChild(row);
    });
}

// Update top players table
function updateTopPlayersTable(players) {
    const tbody = document.getElementById('top-players-body');
    tbody.innerHTML = '';

    // Display first 11 players from the sheet
    players.slice(0, 11).forEach(player => {
        const row = document.createElement('tr');
        row.className = 'top-player-row';
        row.innerHTML = `
            <td>${player.Rank}</td>
            <td>${player['Player Name']}</td>
            <td>${player.Team}</td>
        `;
        tbody.appendChild(row);
    });
}

// Event listeners for card hover effects
document.addEventListener('mouseover', e => {
    const card = e.target.closest('.member-card');
    if (card) card.style.transform = 'translateX(10px)';
});

document.addEventListener('mouseout', e => {
    const card = e.target.closest('.member-card');
    if (card) card.style.transform = 'translateX(0)';
});

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    // Initialize countdown
    checkCountdown(); // Initial check, this will also set initial table visibility
    countdownIntervalId = setInterval(checkCountdown, 1000); // Update countdown every second

    // Note: fetchData() and its interval are now controlled by checkCountdown()
    // The original setInterval(fetchData, 300000) is removed from here.
});

document.getElementById('playerSearch').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    document.querySelectorAll('.member-card').forEach(card => {
        const playerName = card.querySelector('div:nth-child(2)').textContent.toLowerCase();
        const teamId = card.closest('.team-group').id.toLowerCase(); // Team ID (e.g., "ac-milan")
        const teamName = card.closest('.team-group').querySelector('.team-title')
                          .textContent.toLowerCase(); // Team name (e.g., "AC Milan")
        
        // Check if search term matches player name, team ID, or team name
        const showCard = playerName.includes(searchTerm) || 
                        teamId.includes(searchTerm) || 
                        teamName.includes(searchTerm);
        
        card.style.display = showCard ? 'grid' : 'none';
    });

    document.querySelectorAll('.team-group').forEach(team => {
        const hasVisiblePlayers = Array.from(team.querySelectorAll('.member-card'))
            .some(card => card.style.display !== 'none');
        
        team.style.display = hasVisiblePlayers ? 'block' : 'none';
    });
});



// Attendance Section Functions
function toggleAttendanceSection() {
    const section = document.getElementById('attendance-section');

    // Show the section each time the button is pressed
    section.style.display = 'block';

    // Update active button state
    document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active-button'));
    event.currentTarget.classList.add('active-button');

    // Hide other sections
    document.querySelectorAll('.content-section').forEach(s => {
        if (s.id !== 'attendance-section') s.style.display = 'none';
    });
}

// Populate team members when team is selected
document.getElementById('team-select').addEventListener('change', function() {
    const teamId = this.value;
    const teamSection = document.getElementById(teamId);
    const tbody = document.getElementById('attendance-body');
    
    tbody.innerHTML = '';
    
    if (teamSection) {
        const members = teamSection.querySelectorAll('.member-card');
        members.forEach(member => {
            const name = member.querySelector('div:nth-child(2)').textContent;
            if (name.toLowerCase() === 'bonus') return; // Skip rows with name BONUS
            
            const number = member.querySelector('.player-number').textContent;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${number}</td>
                <td>${name}</td>
                <td><input type="checkbox" class="attendance-checkbox"></td>
                <td><input type="checkbox" class="absence-checkbox"></td>
                <td><input type="number" value="0" class="budget-input"></td>
                <td><input type="text"></td>
            `;
            tbody.appendChild(row);
        });

        // Add a row for totals
        const totalRow = document.createElement('tr');
        totalRow.innerHTML = `
            <td colspan="2"><strong>Totals</strong></td>
            <td id="total-attendance">0</td>
            <td id="total-absence">0</td>
            <td id="total-budget">0</td>
            <td></td>
        `;
        tbody.appendChild(totalRow);

        // Update totals dynamically
        tbody.addEventListener('input', () => {
            const attendanceCount = tbody.querySelectorAll('.attendance-checkbox:checked').length;
            const absenceCount = tbody.querySelectorAll('.absence-checkbox:checked').length;
            const totalBudget = Array.from(tbody.querySelectorAll('.budget-input'))
                .reduce((sum, input) => sum + parseFloat(input.value || 0), 0);

            document.getElementById('total-attendance').textContent = attendanceCount;
            document.getElementById('total-absence').textContent = absenceCount;
            document.getElementById('total-budget').textContent = totalBudget;
        });
    }
});
//default date
document.getElementById("attendance-date").valueAsDate = new Date();


function printAttendance() {
    window.print();
}
