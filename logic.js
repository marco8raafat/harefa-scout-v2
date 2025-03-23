// Navigation handling
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active-section'));
    document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active-button'));
    document.getElementById(sectionId).classList.add('active-section');
    event.currentTarget.classList.add('active-button');
}

// Sheet URLs
const mainSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbgKj5tqe0BVFOO-7ArgU_To2jU6pK4sWK3-nv61Tl6Zhba5Ocx6f8_cLlWgsWR1kD4Xg3W5Glm8t8/pub?gid=0&single=true&output=csv';
const topPlayersSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbgKj5tqe0BVFOO-7ArgU_To2jU6pK4sWK3-nv61Tl6Zhba5Ocx6f8_cLlWgsWR1kD4Xg3W5Glm8t8/pub?gid=1567169448&single=true&output=csv';

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
// async function fetchData() {
//     try {
//         // Fetch and process main team data
//         const mainResponse = await axios.get(mainSheetURL);
//         const mainData = Papa.parse(mainResponse.data, { header: true });
//         updateTeamData(mainData.data);
        
//         // Fetch and process top players data
//         const topPlayersResponse = await axios.get(topPlayersSheetURL);
//         const topPlayersData = Papa.parse(topPlayersResponse.data, { header: true });
//         updateTopPlayersTable(topPlayersData.data);
//     } catch (error) {
//         console.error('Error fetching data:', error);
//     }
// }
async function fetchData() {
    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loader);

    try {
        // Existing fetch logic
        
        const mainResponse = await axios.get(mainSheetURL);
        const mainData = Papa.parse(mainResponse.data, { header: true });
        updateTeamData(mainData.data);
        
        // Fetch and process top players data
        const topPlayersResponse = await axios.get(topPlayersSheetURL);
        const topPlayersData = Papa.parse(topPlayersResponse.data, { header: true });
        updateTopPlayersTable(topPlayersData.data);
    } catch (error) {
        // Show error message
        console.error('Error fetching data:', error);
    } finally {
        loader.remove();
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
    const tableBody = document.querySelector('.scouting-table tbody');
    const rows = Array.from(tableBody.querySelectorAll('tr'));

    const standings = rows.map(row => {
        const teamName = row.children[1].textContent;
        const teamId = teamMapping[teamName];
        const points = teamPoints[teamId] || 0;
        return { row, points };
    });

    // Sort standings by points
    standings.sort((a, b) => b.points - a.points);

    // Update table positions
    standings.forEach((standing, index) => {
        const row = standing.row;
        row.children[0].textContent = index + 1;
        row.children[2].textContent = standing.points;
        row.classList.toggle('inter-row', index < 3);
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
    fetchData();
    setInterval(fetchData, 300000); // Refresh every 5 minutes
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
