document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsContainer = document.getElementById('resultsContainer');

    // 2. Asynchronní stažení dat pomocí fetch() s dvojitým záchranným systémem
    async function fetchPickupPoints() {
        const targetUrl = 'https://www.zasilkovna.cz/api/v4/branch.json';
        const backupProxyUrl = 'https://api.codetabs.com/v1/proxy?quest=' + targetUrl;

        try {
            // 1. Pokus: Přímé spojení
            const response = await fetch(targetUrl);
            if (!response.ok) throw new Error(`Direct fetch failed: ${response.status}`);
            const json = await response.json();
            return json.data || [];
        } catch (error) {
            console.warn("Direct fetch failed, trying backup proxy...", error);

            try {
                // 2. Pokus: Záložní proxy (CodeTabs)
                const response = await fetch(backupProxyUrl);
                if (!response.ok) throw new Error(`Backup proxy failed: ${response.status}`);
                const json = await response.json();
                return json.data || [];
            } catch (backupError) {
                console.error("Backup proxy also failed.", backupError);
                throw backupError; // Propagate error to handleSearch catch block
            }
        }
    }

    async function handleSearch() {
        const query = cityInput.value.trim().toLowerCase();

        if (!query) {
            resultsContainer.innerHTML = '<div class="message">Zadejte prosím město pro vyhledávání.</div>';
            return;
        }

        resultsContainer.innerHTML = '<div class="loading">Načítám data z API...</div>';

        try {
            const rawData = await fetchPickupPoints();

            // 3. Logika zpracování dat (Mapping & Filtering)
            // Musíme namapovat data z API na náš formát
            // Zásilkovna API item example (simplified): { place: "Z-BOX ...", name: "...", street: "...", city: "..." }

            const normalizedData = rawData.map(item => ({
                place: item.place,
                name: item.name,
                city: item.city,
                address: item.street
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

            let errorMessage = 'Chyba připojení k serveru Zásilkovny. Data se nepodařilo načíst.';

            // Hint about adblockers blocking proxies
            errorMessage += ' (Zkontrolujte připojení nebo AdBlock)';

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
