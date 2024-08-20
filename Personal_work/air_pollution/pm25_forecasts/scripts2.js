// Initialize the second map
const map2 = L.map('map2').setView([23.4787, 120.4506], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map2);

const markersMap2 = []; // Initialize markers array for map2

// Function to determine color based on PM2.5 value
function getColor(value) {
    if (value <= 12) return '#00FF00'; // Green for good
    if (value <= 35) return '#FFFF00'; // Yellow for moderate
    if (value <= 55) return '#FFA500'; // Orange for unhealthy for sensitive groups
    if (value <= 150) return '#FF0000'; // Red for unhealthy
    return '#800080'; // Purple for very unhealthy
}

// Populate the directory dropdown with directories from the prediction data
async function populateDirectoryDropdownForMap2() {
    try {
        const baseUrl = 'https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/pred?ref=gh-pages';
        const directoryResponse = await fetch(baseUrl);
        if (!directoryResponse.ok) throw new Error('Failed to fetch prediction directories');
        const directories = await directoryResponse.json();

        console.log('Prediction directories:', directories); // Debugging line

        const directorySelect = document.getElementById('pred-directorySelect');
        if (!directorySelect) {
            console.error('Dropdown with id "pred-directorySelect" not found');
            return;
        }
        directorySelect.innerHTML = ''; // Clear any existing options

        directories.forEach(dir => {
            if (dir.type === 'dir') { // Only include directories
                const option = document.createElement('option');
                option.value = dir.path;
                option.text = dir.name;
                directorySelect.add(option);
            }
        });

        // Trigger file dropdown population when a directory is selected
        directorySelect.addEventListener('change', () => {
            populateFileDropdownForMap2(); // Populate files based on selected directory
        });
    } catch (error) {
        console.error('Failed to fetch directories:', error);
    }
}

// Populate the file dropdown with CSV files from the prediction data
async function populateFileDropdownForMap2() {
    try {
        const predDirectoryPath = document.getElementById('pred-directorySelect').value;
        if (!predDirectoryPath) {
            console.warn('No directory selected');
            return;
        }

        const predDirectoryUrl = `https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/pred/${predDirectoryPath}?ref=gh-pages`;
        const predDirectoryResponse = await fetch(predDirectoryUrl);
        if (!predDirectoryResponse.ok) throw new Error('Failed to fetch prediction files');
        const predFiles = await predDirectoryResponse.json();

        console.log('Prediction files:', predFiles); // Debugging line

        const fileSelect = document.getElementById('pred-fileSelect');
        if (!fileSelect) {
            console.error('Dropdown with id "pred-fileSelect" not found');
            return;
        }
        fileSelect.innerHTML = ''; // Clear any existing options

        predFiles.forEach(file => {
            if (file.name.endsWith('.csv')) {
                const option = document.createElement('option');
                option.value = file.download_url;
                option.text = file.name;
                fileSelect.add(option);
            }
        });

        // Trigger data load when a CSV file is selected
        fileSelect.addEventListener('change', () => {
            loadAndMergeDataForMap2(fileSelect.value);
        });
    } catch (error) {
        console.error('Failed to fetch files:', error);
    }
}

// Populate the time step dropdown for predictions
function populateTimeStepsForMap2() {
    const timeStepSelector = document.getElementById('pred-timeStep');
    if (!timeStepSelector) {
        console.error('Dropdown with id "pred-timeStep" not found');
        return;
    }
    for (let i = 0; i <= 72; i += 1) { // Adjust the step size as needed
        const optionValue = i === 0 ? 't' : 't+' + i;
        const optionText = i === 0 ? 't' : 't+' + i;
        const option = document.createElement('option');
        option.value = optionValue;
        option.text = optionText;
        timeStepSelector.add(option);
    }
}

// Function to load and merge data from a selected CSV file for map2
async function loadAndMergeDataForMap2(fileUrl) {
    try {
        console.log('Loading data from CSV for map2');
        const stationInfoUrl = 'https://raw.githubusercontent.com/puyun321/puyun321.github.io/gh-pages/Personal_work/air_pollution/data/station_info.csv';
        const stationInfoText = await fetch(stationInfoUrl).then(response => response.text());
        const stationData = Papa.parse(stationInfoText, { header: true }).data;

        const csvText = await fetch(fileUrl).then(response => response.text());
        const csvData = Papa.parse(csvText, { header: true }).data;

        // Clear existing markers
        markersMap2.forEach(marker => map2.removeLayer(marker));
        markersMap2.length = 0;

        const timeStep = document.getElementById('pred-timeStep').value;

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
                }).addTo(map2);

                marker.bindPopup(
                    '<b>' + (matchingStation ? matchingStation['StationName'] : 'Unknown Station') + '</b><br>' +
                    'PM2.5: ' + value + '<br>' +
                    'Area: ' + (matchingStation ? matchingStation['Area'] : 'Unknown Area') + '<br>' +
                    'County: ' + (matchingStation ? matchingStation['County'] : 'Unknown County') + '<br>' +
                    'Location: ' + (matchingStation ? matchingStation['Location'] : 'Unknown Location') + '<br>' +
                    'Address: ' + (matchingStation ? matchingStation['Address'] : 'Unknown Address')
                );
                markersMap2.push(marker);
            }
        });
    } catch (error) {
        console.error('Failed to load or merge data:', error);
    }
}

// Populate observation dropdowns (assuming similar structure for observation data)
async function populateObservationDropdowns() {
    try {
        const baseUrl = 'https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/obs?ref=gh-pages';
        const response = await fetch(baseUrl);
        if (!response.ok) throw new Error('Failed to fetch observation data directories');
        const directories = await response.json();

        console.log('Observation directories:', directories); // Debugging line

        const obsDirectorySelect = document.getElementById('obs-fileSelect');
        const obsDateSelect = document.getElementById('obs-timeStep');
        if (!obsDirectorySelect || !obsDateSelect) {
            console.error('Dropdown with id "obs-fileSelect" or "obs-timeStep" not found');
            return;
        }
        obsDirectorySelect.innerHTML = ''; // Clear any existing options
        obsDateSelect.innerHTML = ''; // Clear any existing options

        directories.forEach(dir => {
            if (dir.type === 'dir') { // Only include directories
                const option = document.createElement('option');
                option.value = dir.path;
                option.text = dir.name;
                obsDirectorySelect.add(option);
            }
        });

        // Trigger file dropdown population when a directory is selected
        obsDirectorySelect.addEventListener('change', () => {
            populateObservationFileDropdowns(); // Populate files based on selected directory
        });

        // Populate time steps
        populateObservationTimeSteps();
    } catch (error) {
        console.error('Failed to fetch observation data:', error);
    }
}

// Populate the file dropdown for observations
async function populateObservationFileDropdowns() {
    try {
        const obsDirectoryPath = document.getElementById('obs-fileSelect').value;
        if (!obsDirectoryPath) {
            console.warn('No directory selected');
            return;
        }

        const obsDirectoryUrl = `https://api.github.com/repos/puyun321/puyun321.github.io/contents/Personal_work/air_pollution/data/obs/${obsDirectoryPath}?ref=gh-pages`;
        const obsDirectoryResponse = await fetch(obsDirectoryUrl);
        if (!obsDirectoryResponse.ok) throw new Error('Failed to fetch observation files');
        const obsFiles = await obsDirectoryResponse.json();

        console.log('Observation files:', obsFiles); // Debugging line

        const obsFileSelect = document.getElementById('obs-fileSelect');
        if (!obsFileSelect) {
            console.error('Dropdown with id "obs-fileSelect" not found');
            return;
        }
        obsFileSelect.innerHTML = ''; // Clear any existing options

        obsFiles.forEach(file => {
            if (file.name.endsWith('.csv')) {
                const option = document.createElement('option');
                option.value = file.download_url;
                option.text = file.name;
                obsFileSelect.add(option);
            }
        });

        // Trigger data load when a CSV file is selected
        obsFileSelect.addEventListener('change', () => {
            loadAndMergeObservationData(obsFileSelect.value);
        });
    } catch (error) {
        console.error('Failed to fetch files:', error);
    }
}

// Populate time steps for observation data
function populateObservationTimeSteps() {
    const timeStepSelector = document.getElementById('obs-timeStep');
    if (!timeStepSelector) {
        console.error('Dropdown with id "obs-timeStep" not found');
        return;
    }
    for (let i = 0; i <= 72; i += 1) { // Adjust the step size as needed
        const optionValue = i === 0 ? 't' : 't+' + i;
        const optionText = i === 0 ? 't' : 't+' + i;
        const option = document.createElement('option');
        option.value = optionValue;
        option.text = optionText;
        timeStepSelector.add(option);
    }
}

// Function to load and merge observation data from a selected CSV file
async function loadAndMergeObservationData(fileUrl) {
    try {
        console.log('Loading observation data from CSV');
        const csvText = await fetch(fileUrl).then(response => response.text());
        const csvData = Papa.parse(csvText, { header: true }).data;

        // Clear existing markers
        markersMap2.forEach(marker => map2.removeLayer(marker));
        markersMap2.length = 0;

        const timeStep = document.getElementById('obs-timeStep').value;

        csvData.forEach(demoRow => {
            const lat = parseFloat(demoRow['lat']);
            const lon = parseFloat(demoRow['lon']);
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
                }).addTo(map2);

                marker.bindPopup(
                    '<b>Station</b><br>' +
                    'PM2.5: ' + value + '<br>'
                );
                markersMap2.push(marker);
            }
        });
    } catch (error) {
        console.error('Failed to load or merge observation data:', error);
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    populateDirectoryDropdownForMap2();
    populateObservationDropdowns(); // Populate observation dropdowns

    // Trigger data load when a CSV file is selected for predictions
    document.getElementById('pred-fileSelect').addEventListener('change', function() {
        console.log('Selected prediction file:', this.value);
        loadAndMergeDataForMap2(this.value);
    });

    // Trigger data load when time step is changed for predictions
    document.getElementById('pred-timeStep').addEventListener('change', function() {
        console.log('Selected prediction time step:', this.value);
        loadAndMergeDataForMap2(document.getElementById('pred-fileSelect').value);
    });

    // Trigger data load when a CSV file is selected for observations
    document.getElementById('obs-fileSelect').addEventListener('change', function() {
        console.log('Selected observation file:', this.value);
        loadAndMergeObservationData(this.value);
    });

    // Trigger data load when time step is changed for observations
    document.getElementById('obs-timeStep').addEventListener('change', function() {
        console.log('Selected observation time step:', this.value);
        loadAndMergeObservationData(document.getElementById('obs-fileSelect').value);
    });
});
