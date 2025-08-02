const apiKey = 'a7f8225b8c774c13f887cde4dee77226'; // Replace with your OpenWeatherMap API key
let chart;
let map;
let marker;

async function getWeather() {
  const city = document.getElementById('locationInput').value.trim();
  if (!city) return alert('❗ Please enter a city name.');

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;
  fetchWeatherData(url);
}

async function getCurrentLocationWeather() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async position => {
    const { latitude, longitude } = position.coords;
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
    fetchWeatherData(url, latitude, longitude);
  }, () => {
    alert("Unable to retrieve your location.");
  });
}

async function fetchWeatherData(url, lat = null, lon = null) {
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.cod !== "200") {
      document.getElementById('weatherInfo').innerText = `⚠️ ${data.message}`;
      return;
    }

    const temps = data.list.slice(0, 8).map(item => item.main.temp);
    const labels = data.list.slice(0, 8).map(item => item.dt_txt.split(' ')[1]);
    const weatherDesc = data.list[0].weather[0].description;
    const emoji = getWeatherEmoji(weatherDesc);
    const location = `${data.city.name}, ${data.city.country}`;

    document.getElementById('weatherInfo').innerHTML = `
      <h2>📍 ${location}</h2>
      <p>🌡️ Temp: ${temps[0]}°C</p>
      <p>${emoji} Weather: ${weatherDesc}</p>
    `;

    drawChart(labels, temps);

    const latVal = lat || data.city.coord.lat;
    const lonVal = lon || data.city.coord.lon;
    showMap(latVal, lonVal, location);

  } catch (error) {
    console.error(error);
    alert('🚫 Unable to fetch weather data.');
  }
}

function getWeatherEmoji(desc) {
  desc = desc.toLowerCase();
  if (desc.includes("cloud")) return "☁️";
  if (desc.includes("rain")) return "🌧️";
  if (desc.includes("clear")) return "☀️";
  if (desc.includes("storm")) return "⛈️";
  if (desc.includes("snow")) return "❄️";
  return "🌈";
}

function drawChart(labels, temps) {
  const ctx = document.getElementById('tempChart').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '🌡️ Temperature (°C)',
        data: temps,
        borderColor: '#007BFF',
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: value => `${value}°C`
          }
        }
      }
    }
  });
}

function showMap(lat, lon, label = 'Your Location') {
  if (!map) {
    map = L.map('map').setView([lat, lon], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  } else {
    map.setView([lat, lon], 10);
    if (marker) map.removeLayer(marker);
  }

  marker = L.marker([lat, lon]).addTo(map)
    .bindPopup(`📍 ${label}`)
    .openPopup();
}
