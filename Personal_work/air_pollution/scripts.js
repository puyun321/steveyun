//This file will contain all your JavaScript code.

var map = L.map('map').setView([23.6978, 120.9605], 7); // Centered on Taiwan
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
var markers = []; // Initialize markers array

// Function to determine color based on PM2.5 value
function getColor(value) {
    if (value <= 12) return '#00FF00'; // Green for good
    if (value <= 35) return '#FFFF00'; // Yellow for moderate
    if (value <= 55) return '#FFA500'; // Orange for unhealthy for sensitive groups
    if (value <= 150) return '#FF0000'; // Red for unhealthy
    return '#800080'; // Purple for very unhealthy
}

// Populate the file dropdown with CSV files
async function populateFileDropdown() {
    try {
        const obsDirectoryUrl = 'https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/obs?ref=gh-pages';
        const obsDirectoryResponse = await fetch(obsDirectoryUrl);
        const obsFiles = await obsDirectoryResponse.json();

        const fileSelect = document.getElementById('fileSelect');
        fileSelect.innerHTML = ''; // Clear any existing options

        obsFiles.forEach(file => {
            if (file.name.endsWith('.csv')) {
                const option = document.createElement('option');
                option.value = file.download_url;
                option.text = file.name;
                fileSelect.add(option);
            }
        });

        // Trigger a load on initial selection
        fileSelect.addEventListener('change', () => {
            loadAndMergeDataFromCSV(fileSelect.value);
        });
    } catch (error) {
        console.error('Failed to fetch files:', error);
    }
}

// Populate the time step dropdown
function populateTimeSteps() {
    var timeStepSelector = document.getElementById('timeStep');
    for (var i = 0; i <= 72; i += 1) { // Adjust the step size as needed
        var optionValue = i === 0 ? 't' : 't+' + i;
        var optionText = i === 0 ? 't' : 't+' + i;
        var option = document.createElement('option');
        option.value = optionValue;
        option.text = optionText;
        timeStepSelector.add(option);
    }
}

// Function to fetch file contents from GitHub
async function fetchGitHubFileContents(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3.raw'
            }
        });
        if (!response.ok) throw new Error('Network response was not ok.');
        return response.text();
    } catch (error) {
        console.error('Failed to fetch file:', error);
        return '';
    }
}

// Function to load and merge data from a selected CSV file
async function loadAndMergeDataFromCSV(fileUrl) {
    try {
        const stationInfoUrl = 'https://raw.githubusercontent.com/puyun321/puyun321.github.io/gh-pages/Personal_work/air_pollution/data/station_info.csv';
        const stationInfoText = await fetchGitHubFileContents(stationInfoUrl);
        const stationData = Papa.parse(stationInfoText, { header: true }).data;

        const csvText = await fetchGitHubFileContents(fileUrl);
        const csvData = Papa.parse(csvText, { header: true }).data;

        // Clear existing markers
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];

        let timeStep = document.getElementById('timeStep').value;

        csvData.forEach(demoRow => {
            const matchingStation = stationData.find(stationRow => stationRow['SITE ID'] === demoRow['SITE ID']);
            const lat = parseFloat(matchingStation ? matchingStation['lat'] : null);
            const lon = parseFloat(matchingStation ? matchingStation['lon'] : null);
            const value = parseFloat(demoRow[timeStep]);

            if (!isNaN(lat) && !isNaN(lon)) {
                const color = getColor(value);
                const marker = L.circleMarker([lat, lon], {
                    radius: 8,
                    fillColor: color,
                    color: color,
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map);

                marker.bindPopup(
                    '<b>' + (matchingStation ? matchingStation['StationName'] : 'Unknown Station') + '</b><br>' +
                    'PM2.5: ' + value + '<br>' +
                    'Area: ' + (matchingStation ? matchingStation['Area'] : 'Unknown Area') + '<br>' +
                    'County: ' + (matchingStation ? matchingStation['County'] : 'Unknown County') + '<br>' +
                    'Location: ' + (matchingStation ? matchingStation['Location'] : 'Unknown Location') + '<br>' +
                    'Address: ' + (matchingStation ? matchingStation['Address'] : 'Unknown Address')
                );
                markers.push(marker);
            }
        });
    } catch (error) {
        console.error('Failed to load or merge data:', error);
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    populateFileDropdown();
    populateTimeSteps();

    // Trigger a load when a CSV file is selected
    document.getElementById('fileSelect').addEventListener('change', function() {
        loadAndMergeDataFromCSV(this.value);
    });

    // Trigger a load when time step is changed
    document.getElementById('timeStep').addEventListener('change', function() {
        loadAndMergeDataFromCSV(document.getElementById('fileSelect').value);
    });
});