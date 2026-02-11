document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsContainer = document.getElementById('resultsContainer');

    // 2. Asynchronní stažení dat pomocí fetch() z GitHub Gist (obejití CORS a 403 API)
    async function fetchPickupPoints() {
        const targetUrl = 'https://gist.githubusercontent.com/mechico83/43a864a9904b26d4c38d1f6519e32272/raw/3bbc6e0cc65f82f5d436b4a5d1de79a206e00070/pobocky.json';

        try {
            const response = await fetch(targetUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // GitHub Gist vrací JSON přímo (buď pole, nebo wrapper)
            // Předpokládáme stejnou strukturu jako Zásilkovna, nebo se přizpůsobíme.
            // Pokud je to raw dump Zásilkovny, bude to mít klíč "data": [...]
            // Pokud je to pole, vrátíme přímo json.
            const json = await response.json();

            return json.data || (Array.isArray(json) ? json : []);
        } catch (error) {
            console.error("Fetch error:", error);
            throw error;
        }
    }

    async function handleSearch() {
        const query = cityInput.value.trim().toLowerCase();

        if (!query) {
            resultsContainer.innerHTML = '<div class="message">Zadejte prosím město pro vyhledávání.</div>';
            return;
        }

        resultsContainer.innerHTML = '<div class="loading">Načítám data...</div>';

        try {
            const rawData = await fetchPickupPoints();

            // 3. Logika zpracování dat (Mapping & Filtering)
            // Mapování dat pro jednotný formát
            // Očekáváme klíče jako Zásilkovna: place, name, city, street

            const normalizedData = rawData.map(item => ({
                place: item.place,
                name: item.name,
                city: item.city,
                address: item.street || item.address // Fallback if Gist uses different key
            }));

            // Filtrování podle města (case-insensitive)
            const filteredByCity = normalizedData.filter(item =>
                item.city && item.city.toLowerCase().includes(query)
            );

            // Deduplikace podle adresy
            const uniqueAddresses = new Set();
            const uniqueResults = filteredByCity.filter(item => {
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
