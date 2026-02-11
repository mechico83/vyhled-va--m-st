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

            // 1. Debug log pro kontrolu stažených dat
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

            // Mapování dat pro jednotný formát
            const normalizedData = rawData.map(item => ({
                place: item.place,
                name: item.name,
                city: item.city,
                address: item.street || item.address
            }));

            // 2. & 3. Bezpečné filtrování (substring, case-insensitive)
            const filteredByQuery = normalizedData.filter(item => {
                // Bezpečné získání stringů (fallback na prázdný string)
                const placeStr = (item.place || '').toLowerCase();
                const nameStr = (item.name || '').toLowerCase();
                // Pro jistotu necháme i město, kdyby uživatel hledal město
                const cityStr = (item.city || '').toLowerCase();

                // Podmínka: place obsahuje term NEBO name obsahuje term NEBO city obsahuje term
                return placeStr.includes(term) || nameStr.includes(term) || cityStr.includes(term);
            });

            // Deduplikace podle adresy
            const uniqueAddresses = new Set();
            const uniqueResults = filteredByQuery.filter(item => {
                const address = item.address;
                if (!address || uniqueAddresses.has(address)) {
                    return false;
                }
                uniqueAddresses.add(address);
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

            // 1. Priorita: 'place' > 'name' (fallback)
            const title = point.place ? point.place : point.name;

            card.innerHTML = `
                <h3>${title}</h3>
                <p>${point.address}</p>
                <p style="font-size: 0.85em; opacity: 0.7; margin-top: 5px;">${point.city}</p>
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
