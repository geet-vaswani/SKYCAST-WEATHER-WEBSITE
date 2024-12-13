const cityInput = document.getElementById('city_input');
const searchBtn = document.getElementById('searchBtn');
const apiKey = '7e2c8d92518d1bbc91a1091ac7b8a8f5'; 
const geminiApiKey = 'AIzaSyB6Jd_IVv3QcMOhqMe8uM4SLXaNnHAVYNA';
const weatherWidget = document.querySelector('.weather-widget');
const forecastTable = document.getElementById('forecastTable');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

let currentPage = 1;
let itemsPerPage = 10;
let forecastData = [];

// Chart instances
let tempChart, conditionsChart, tempChangeChart;

function getWeatherDetails(name, lat, lon) {
    const FORECAST_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(name)}&appid=${apiKey}&units=metric`;
    
    // Fetch Current Weather
    fetch(WEATHER_API_URL).then(res => res.json()).then(data => {
            updateWeatherWidget(data);
        })
        .catch(() => {
            alert('Failed to fetch current weather');
        });

    // Fetch 5-Day Forecast
    fetch(FORECAST_API_URL).then(res => res.json()).then(data => {
            forecastData = data.list;
            updateForecastTable();
            updateCharts();
        })
        .catch(() => {
            alert('Failed to fetch weather forecast');
        });
}

function updateWeatherWidget(data) {    
    // Update the inner HTML with the weather data
    weatherWidget.innerHTML = `
        <div class="current-weather">
            <div class="weather-icon">
                <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather Icon" id="weather-icon">
            </div>
             <div class="details">
                <h2 id="city-name">
                    <i class="fas fa-city"></i> ${data.name}, ${data.sys.country}
                </h2>
                <p id="temperature">
                    <i class="fas fa-thermometer-half"></i> ${data.main.temp.toFixed(1)}°C
                </p>
                <p id="humidity">
                    <i class="fas fa-tint"></i> ${data.main.humidity}%
                </p>
                <p id="wind-speed">
                    <i class="fas fa-wind"></i> ${data.wind.speed} m/s
                </p>
                <p id="description"> <i class="fas fa-cloud"></i> ${data.weather[0].description} </p>
            </div>
        </div>
        </div>
    `;
    // Update the widget background based on weather condition
    const weatherMain = data.weather[0].description.toLowerCase().replace(/\s+/g, '');
    weatherWidget.className = `weather-widget ${weatherMain}`; // Update className for background
}

function updateForecastTable() {
    const tbody = forecastTable.querySelector('tbody');
    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = forecastData.slice(startIndex, endIndex);

    pageData.forEach(forecast => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(forecast.dt * 1000).toLocaleDateString()}</td>
            <td>${forecast.main.temp.toFixed(1)}°C</td>
            <td>${forecast.weather[0].description}</td>
        `;
        tbody.appendChild(row);
    });

    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(forecastData.length / itemsPerPage);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

function updateCharts() {
    // Group the forecast data by day
    const dailyForecast = forecastData.reduce((acc, data) => {
        const date = new Date(data.dt * 1000).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(data);
        return acc;
    }, {});

    // Extract only the first 5 days of forecast
    const labels = Object.keys(dailyForecast).slice(0, 5).map(date => {
        const day = new Date(date).toLocaleString('en-US', { weekday: 'long' });
        return day; 
    });

    const temperatures = Object.keys(dailyForecast).slice(0, 5).map(date => {
        const temps = dailyForecast[date].map(item => item.main.temp);
        return (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1); 
    });

    const conditions = Object.keys(dailyForecast).slice(0, 5).map(date => {
        // Most common weather condition for the day
        const conditionCounts = dailyForecast[date].reduce((acc, item) => {
            const condition = item.weather[0].main;
            acc[condition] = (acc[condition] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(conditionCounts).reduce((a, b) =>
            conditionCounts[a] > conditionCounts[b] ? a : b
        );
    });

    // Temperature Forecast Chart
    if (tempChart) tempChart.destroy(); // Destroy previous chart to avoid duplication
    tempChart = new Chart(document.getElementById('tempChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            animation: {
                delay: 500 // 500 ms delay
            }
        }
    });

    // Weather Conditions Chart
    const conditionCounts = conditions.reduce((acc, condition) => {
        acc[condition] = (acc[condition] || 0) + 1;
        return acc;
    }, {});

    if (conditionsChart) conditionsChart.destroy(); 
    conditionsChart = new Chart(document.getElementById('conditionsChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(conditionCounts),
            datasets: [{
                data: Object.values(conditionCounts),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ]
            }]
        },
        options: {
            animation: {
                delay: 500 // 500 ms delay
            }
        }
    });

    // Temperature Change Chart
    if (tempChangeChart) tempChangeChart.destroy();
    tempChangeChart = new Chart(document.getElementById('tempChangeChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            animation: {
                delay: 500 // 500 ms delay
            }
        }
    });
}

function getCityCoordinates() {
    const cityName = cityInput.value.trim();
    if (!cityName) return;

    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${apiKey}`;

    fetch(GEOCODING_API_URL)
        .then(res => res.json())
        .then(data => {
            if (data.length > 0) {
                const { name, lat, lon } = data[0];
                getWeatherDetails(name, lat, lon);
            } else {
                alert(`No coordinates found for ${cityName}`);
            }
        })
        .catch(() => {
            alert('Failed to fetch coordinates');
        });
}

const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
// Main function to handle user queries
async function handleChatbotQuery(query) {
    let response;

    if (query.includes("highest temperature")) {
        const highest = Math.max(...forecastData.map(data => data.main.temp));
        response = `The highest temperature in the forecast is ${highest.toFixed(1)}°C.`;
    } else if (query.includes("lowest temperature")) {
        const lowest = Math.min(...forecastData.map(data => data.main.temp));
        response = `The lowest temperature in the forecast is ${lowest.toFixed(1)}°C.`;
    } else if (query.includes("average temperature")) {
        const sum = forecastData.reduce((acc, data) => acc + data.main.temp, 0);
        const average = sum / forecastData.length;
        response = `The average temperature in the forecast is ${average.toFixed(1)}°C.`;
    } else if (query.toLowerCase().includes('weather')) {  
        const city = extractCityFromQuery(query);  
        if (city) {
            await fetchForecastData(city); 
            response = generateWeatherResponse();
        } else {
            response = "Please provide a city name for the weather forecast.";
        }
    } else {
        response = await fetchGeminiResponse(query);  
    }

    displayChatMessage('You', query);
    displayChatMessage('Bot', response);
}

// Extract city name from the query
function extractCityFromQuery(query) {
    const words = query.split(' ');
    const city = words.find(word => word[0] === word[0].toUpperCase()); 
    return city || cityInput.value.trim();  
}

// Fetch 5-day weather forecast from OpenWeatherMap API
async function fetchForecastData(city) {
    const FORECAST_API_URL = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(FORECAST_API_URL);
        if (response.ok) {
            const data = await response.json();
            forecastData = data.list.slice(0, 5); 
        } else {
            alert('Failed to fetch forecast data. Please check the city name.');
        }
    } catch (error) {
        console.error('Error fetching forecast data:', error);
        alert('An error occurred while fetching forecast data.');
    }
}

// Generate response using the latest forecast data
function generateWeatherResponse() {
    if (forecastData.length === 0) {
        return "I don't have any forecast data at the moment. Please try again.";
    }

    const latest = forecastData[0];
    const { temp } = latest.main;
    const description = latest.weather[0].description;

    return `The weather is expected to be ${description} with a temperature of ${temp.toFixed(1)}°C.`;
}

// Fetch response from Gemini API for non-weather queries
async function fetchGeminiResponse(query) {
    const requestBody = {
        contents: [{ parts: [{ text: query }] }]
    };

    try {
        const response = await fetch(`${geminiUrl}?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        return data.contents?.[0]?.parts?.[0]?.text.trim() || "I couldn't find an answer to your query.";
    } catch (error) {
        console.error('Error fetching response from Gemini API:', error);
        return "I'm sorry, I couldn't process your request.";
    }
}

// Display chat messages in the chatbox
function displayChatMessage(sender, message) {
    const messageElement = document.createElement('p');
    messageElement.textContent = `${sender}: ${message}`;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Event Listeners
searchBtn.addEventListener('click', getCityCoordinates);
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        updateForecastTable();
    }
});
nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(forecastData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updateForecastTable();
    }
});

sendBtn.addEventListener('click', () => {
    const query = userInput.value.trim();
    if (query) {
        handleChatbotQuery(query);
        userInput.value = '';
    }
});