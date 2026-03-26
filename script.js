// Конфигурация API (замените на свой ключ, если нужно)
const API_KEY = 'bd5e378503939ddaee76f12ad7a97608'; // Учебный ключ, работает для демо
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM элементы
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const cityNameEl = document.getElementById('cityName');
const dateTimeEl = document.getElementById('dateTime');
const weatherIcon = document.getElementById('weatherIcon');
const tempEl = document.getElementById('temp');
const weatherDescEl = document.getElementById('weatherDesc');
const feelsLikeEl = document.getElementById('feelsLike');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const pressureEl = document.getElementById('pressure');
const forecastContainer = document.getElementById('forecastContainer');

// Сохранённый город из localStorage
let lastCity = localStorage.getItem('lastCity') || 'Москва';

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    cityInput.value = lastCity;
    getWeatherByCity(lastCity);
});

// Поиск по городу
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherByCity(city);
    }
});

// Enter в поле ввода
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) getWeatherByCity(city);
    }
});

// Геолокация
locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
            },
            (error) => {
                alert('Не удалось определить местоположение. Разрешите доступ к геолокации.');
                console.error(error);
            }
        );
    } else {
        alert('Ваш браузер не поддерживает геолокацию');
    }
});

// Получение погоды по названию города
async function getWeatherByCity(city) {
    try {
        showLoading();
        // Текущая погода
        const currentRes = await fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=ru`);
        if (!currentRes.ok) throw new Error('Город не найден');
        const currentData = await currentRes.json();

        // Прогноз на 5 дней
        const forecastRes = await fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=ru`);
        const forecastData = await forecastRes.json();

        updateUI(currentData, forecastData);
        saveLastCity(city);
        changeBackground(currentData.weather[0].main);
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}

// Получение погоды по координатам
async function getWeatherByCoords(lat, lon) {
    try {
        showLoading();
        const currentRes = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`);
        if (!currentRes.ok) throw new Error('Ошибка получения данных');
        const currentData = await currentRes.json();

        const forecastRes = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`);
        const forecastData = await forecastRes.json();

        updateUI(currentData, forecastData);
        saveLastCity(currentData.name);
        changeBackground(currentData.weather[0].main);
        cityInput.value = currentData.name;
    } catch (error) {
        alert('Ошибка геолокации: ' + error.message);
    }
}

// Обновление интерфейса
function updateUI(current, forecast) {
    // Текущая погода
    cityNameEl.textContent = `${current.name}, ${current.sys.country}`;
    tempEl.textContent = Math.round(current.main.temp);
    feelsLikeEl.textContent = Math.round(current.main.feels_like);
    humidityEl.textContent = current.main.humidity;
    windEl.textContent = current.wind.speed;
    pressureEl.textContent = Math.round(current.main.pressure * 0.750064); // перевод в мм рт.ст.
    weatherDescEl.textContent = current.weather[0].description;
    
    const iconCode = current.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    
    // Дата и время (локальное)
    const now = new Date();
    dateTimeEl.textContent = now.toLocaleString('ru-RU', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Прогноз на 5 дней (каждые 24 часа, берём примерно на 12:00)
    const dailyForecasts = {};
    forecast.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyForecasts[date] && item.dt_txt.includes('12:00:00')) {
            dailyForecasts[date] = item;
        }
    });
    
    const days = Object.values(dailyForecasts).slice(0, 5);
    forecastContainer.innerHTML = '';
    days.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="day">${dayName}</div>
            <div class="date">${date.getDate()}.${date.getMonth()+1}</div>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="иконка">
            <div class="temp">${Math.round(day.main.temp)}°C</div>
            <div class="desc">${day.weather[0].description}</div>
        `;
        forecastContainer.appendChild(card);
    });
}

// Смена фона в зависимости от погоды
function changeBackground(weatherMain) {
    const body = document.body;
    body.setAttribute('data-weather', weatherMain);
}

// Сохранение последнего города
function saveLastCity(city) {
    localStorage.setItem('lastCity', city);
    lastCity = city;
}

// Индикатор загрузки (простой)
function showLoading() {
    tempEl.textContent = '--';
    weatherDescEl.textContent = 'Загрузка...';
}

// Обработка ошибки отсутствия сети (можно добавить)
window.addEventListener('online', () => {
    if (lastCity) getWeatherByCity(lastCity);
});
