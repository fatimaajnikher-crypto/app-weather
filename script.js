/* ===========================
   Weather Widget - JavaScript
   =========================== */

// ========== API CONFIGURATION ==========
const API_KEY = 'd2043978e6d173fe594df306002344cc';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// ========== DOM ELEMENTS ==========
const cityInput = document.getElementById('cityInput');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.getElementById('loadingSpinner');
const weatherCard = document.getElementById('weatherCard');

// Weather elements
const cityName = document.getElementById('cityName');
const dateTime = document.getElementById('dateTime');
const weatherEmoji = document.getElementById('weatherEmoji');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weatherDescription');
const windSpeed = document.getElementById('windSpeed');
const humidity = document.getElementById('humidity');
const feelsLike = document.getElementById('feelsLike');
const pressure = document.getElementById('pressure');

// Forecast elements
const hourlyForecast = document.getElementById('hourlyForecast');
const weeklyForecast = document.getElementById('weeklyForecast');

// ========== EVENT LISTENERS ==========
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

let currentCity = '';
let currentWeatherData = {};

// ========== MAIN SEARCH FUNCTION ==========
async function handleSearch() {
    const city = cityInput.value.trim();

    if (!city) {
        showError('Please enter a city name!');
        return;
    }

    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please add your OpenWeatherMap API key!');
        return;
    }

    currentCity = city;
    cityInput.value = '';
    await fetchWeather(city);
}

// ========== REFRESH CURRENT WEATHER ==========
async function refreshWeather() {
    if (currentCity) {
        await fetchWeather(currentCity);
    }
}

// ========== FETCH WEATHER DATA ==========
async function fetchWeather(city) {
    try {
        showLoading(true);
        hideError();

        const url = `${API_URL}?q=${city}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling.');
            } else if (response.status === 401) {
                throw new Error('Invalid API key.');
            } else {
                throw new Error(`Error: ${response.status}`);
            }
        }

        const data = await response.json();
        displayWeather(data);
        
        // Also fetch forecast
        await fetchForecast(city);

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// ========== FETCH FORECAST DATA ==========
async function fetchForecast(city) {
    try {
        const url = `${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) throw new Error('Forecast fetch failed');

        const data = await response.json();
        displayForecast(data);

    } catch (error) {
        console.error('Forecast Error:', error);
    }
}

// ========== DISPLAY WEATHER ==========
function displayWeather(data) {
    try {
        currentWeatherData = data; // Store for copy function
        
        const temp = Math.round(data.main.temp);
        const feelsLikeTemp = Math.round(data.main.feels_like);
        const desc = data.weather[0].description;
        const weatherMain = data.weather[0].main;
        const windSpeedValue = Math.round(data.wind.speed * 3.6);
        const humidityValue = data.main.humidity;
        const pressureValue = data.main.pressure;

        cityName.textContent = `${data.name}`;
        dateTime.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        weatherEmoji.textContent = getWeatherEmoji(weatherMain);
        temperature.textContent = `${temp}°C`;
        weatherDescription.textContent = desc.toUpperCase();
        windSpeed.textContent = `${windSpeedValue} km/h`;
        humidity.textContent = `${humidityValue}%`;
        feelsLike.textContent = `${feelsLikeTemp}°C`;
        pressure.textContent = `${pressureValue} hPa`;

        showWeatherWidget();

    } catch (error) {
        console.error('Display Error:', error);
        showError('Failed to display weather.');
    }
}

// ========== DISPLAY FORECAST ==========
function displayForecast(data) {
    try {
        // Hourly forecast
        const hourlyData = data.list.slice(0, 8);
        hourlyForecast.innerHTML = '';
        hourlyData.forEach(item => {
            const time = new Date(item.dt * 1000);
            const hour = time.getHours().toString().padStart(2, '0') + ':00';
            const temp = Math.round(item.main.temp);
            const emoji = getWeatherEmoji(item.weather[0].main);

            const card = document.createElement('div');
            card.className = 'hourly-card';
            card.innerHTML = `
                <div class="hourly-time">${hour}</div>
                <div class="hourly-emoji">${emoji}</div>
                <div class="hourly-temp">${temp}°</div>
            `;
            hourlyForecast.appendChild(card);
        });

        // Weekly forecast
        const dailyData = getDailyForecast(data.list);
        weeklyForecast.innerHTML = '';
        dailyData.forEach(day => {
            const maxTemp = Math.round(Math.max(...day.temps));
            const minTemp = Math.round(Math.min(...day.temps));
            const emoji = getWeatherEmoji(day.weather.main);
            const dateStr = day.date.toLocaleDateString('en-US', {
                weekday: 'short'
            });

            const card = document.createElement('div');
            card.className = 'daily-card';
            card.innerHTML = `
                <div class="daily-day">${dateStr}</div>
                <div class="daily-emoji">${emoji}</div>
                <div class="daily-temps">
                    <span class="daily-high">${maxTemp}°</span>
                    <span class="daily-low">${minTemp}°</span>
                </div>
            `;
            weeklyForecast.appendChild(card);
        });

    } catch (error) {
        console.error('Forecast Display Error:', error);
    }
}

// ========== GET DAILY FORECAST ==========
function getDailyForecast(forecastList) {
    const dailyMap = {};

    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US');

        if (!dailyMap[day]) {
            dailyMap[day] = {
                date: date,
                temps: [item.main.temp],
                weather: item.weather[0]
            };
        } else {
            dailyMap[day].temps.push(item.main.temp);
        }
    });

    return Object.values(dailyMap).slice(1, 6);
}

// ========== WEATHER EMOJI MAP ==========
function getWeatherEmoji(weatherMain) {
    const emojiMap = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Smoke': '💨',
        'Haze': '🌫️',
        'Dust': '🌪️',
        'Fog': '🌫️',
        'Sand': '🌪️',
        'Ash': '🌋',
        'Squall': '🌪️',
        'Tornado': '🌪️'
    };

    return emojiMap[weatherMain] || '🌤️';
}

// ========== UI HELPERS ==========

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 4000);
}

function hideError() {
    errorMessage.classList.remove('show');
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.classList.add('show');
    } else {
        loadingSpinner.classList.remove('show');
    }
}

function showWeatherWidget() {
    weatherCard.classList.add('show');
}

// ========== INITIALIZATION ==========
console.log('%c�️ Weather Dashboard Ready!', 'font-size: 14px; font-weight: bold; color: #64c8ff;');

// ========== COPY TO CLIPBOARD ==========
function copyToClipboard() {
    const jsonData = JSON.stringify(currentWeatherData, null, 2);
    navigator.clipboard.writeText(jsonData).then(() => {
        alert('✓ Weather data copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showError('Failed to copy to clipboard');
    });
}
