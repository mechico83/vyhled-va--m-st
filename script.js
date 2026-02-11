document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsContainer = document.getElementById('resultsContainer');

    // 2. Asynchronní stažení dat pomocí fetch() z GitHub Gist
    async function fetchPickupPoints() {
        const targetUrl = 'https://gist.githubusercontent.com/mechico83/43a864a9904b26d4c38d1f6519e32272/raw/3bbc6e0cc65f82f5d436b4a5d1de79a206e00070/pobocky.json';

        try {
            const response = await fetch(targetUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const json = await response.json();

            // Debug log pro kontrolu stažených dat
            console.log('Stažená data:', json);

            return json.data || (Array.isArray(json) ? json : []);
        } catch (error) {
            console.error("Fetch error:", error);
            throw error;
        }
    }

    async function handleSearch() {
        // 1. Oříznutí a lowercased hledaný výraz
        const term = cityInput.value.trim().toLowerCase();

        if (!term) {
            resultsContainer.innerHTML = '<div class="message">Zadejte prosím město pro vyhledávání.</div>';
            return;
        }

        resultsContainer.innerHTML = '<div class="loading">Načítám data...</div>';

        try {
            const rawData = await fetchPickupPoints();

            // 3. Logika zpracování dat (Přímo s rawData, žádné mapování)

            // 2. Filtrování (place obsahuje term NEBO name obsahuje term)
            const filteredByQuery = rawData.filter(item => {
                const placeStr = (item.place || '').toLowerCase();
                const nameStr = (item.name || '').toLowerCase();

                return placeStr.includes(term) || nameStr.includes(term);
            });

            // 3. Deduplikace podle názvu (protože name obsahuje adresu v Gistu)
            const uniqueNames = new Set();
            const uniqueResults = filteredByQuery.filter(item => {
                const name = item.name;
                if (!name || uniqueNames.has(name)) {
                    return false;
                }
                uniqueNames.add(name);
                return true;
            });

            renderResults(uniqueResults);

        } catch (error) {
            console.error("Chyba při stahování dat:", error);

            let errorMessage = 'Chyba připojení k datovému zdroji. Data se nepodařilo načíst.';

            resultsContainer.innerHTML = `<div class="error-message">${errorMessage}</div>`;
        }
    }

    function renderResults(points) {
        resultsContainer.innerHTML = '';

        if (points.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">Nebylo nalezeno žádné výdejní místo.</div>';
            return;
        }

        points.forEach(point => {
            const card = document.createElement('div');
            card.className = 'result-card';

            // 1. Priorita: 'place' > 'name' (fallback, i když name je použito i jako adresa)
            const title = point.place ? point.place : point.name;

            // 4. Renderování: title jako H3, name jako adresa
            card.innerHTML = `
                <h3>${title}</h3>
                <p>${point.name}</p> 
            `;

            resultsContainer.appendChild(card);
        });
    }

    searchBtn.addEventListener('click', handleSearch);

    // Allow searching by pressing Enter
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
});
