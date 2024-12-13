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

document.getElementById('sortAscBtn').addEventListener('click', () => {
  forecastData.sort((a, b) => a.main.temp - b.main.temp);
  updateForecastTable();
});

document.getElementById('sortDescBtn').addEventListener('click', () => {
  forecastData.sort((a, b) => b.main.temp - a.main.temp);
  updateForecastTable();
});

document.getElementById('filterRainBtn').addEventListener('click', () => {
  const rainyDays = forecastData.filter(forecast =>
      forecast.weather.some(condition => condition.description.toLowerCase().includes('rain'))
  );
  forecastData = rainyDays;
  updateForecastTable();
});

document.getElementById('highestTempBtn').addEventListener('click', () => {
  const highestTempDay = forecastData.reduce((max, current) =>
      current.main.temp > max.main.temp ? current : max
  );
  forecastData = [highestTempDay];
  updateForecastTable();
});

function updatePagination() {
  const totalPages = Math.ceil(forecastData.length / itemsPerPage);
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}