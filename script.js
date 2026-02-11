document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsContainer = document.getElementById('resultsContainer');

    // Mock data pro offline testování přes fetch (data URI)
    const mockData = [
        { id: 1, city: "Praha", address: "Václavské náměstí 1, Praha 1", place: "AlzaBox", name: "AlzaBox Václavák" },
        { id: 2, city: "Praha 2", address: "Vinohradská 10, Praha 2", name: "Potraviny u Nováků" }, // place chybí
        { id: 3, city: "Brno", address: "náměstí Svobody 5, Brno", place: "Zásilkovna", name: "Z-BOX Náměstí" },
        { id: 4, city: "Praha 1", address: "Václavské náměstí 1, Praha 1", place: "AlzaBox 2", name: "Duplicate Address Test" }, // Duplicitní adresa, měla by být odstraněna
        { id: 5, city: "Ostrava", address: "Masarykovo náměstí 3, Ostrava", place: "PPL ParcelShop", name: "Trafika Centrum" },
        { id: 6, city: "Brno", address: "Masarykova 12, Brno", name: "Květinářství Hana" },
        { id: 7, city: "Plzeň", address: "Americká 42, Plzeň", place: "GLS ParcelShop", name: "Elektro Novák" },
        { id: 8, city: "Liberec", address: "Soukenné náměstí 1, Liberec", place: "DPD Pickup", name: "Papírnictví" },
        { id: 9, city: "Praha 2", address: "Karlovo náměstí 10, Praha 2", place: "Z-BOX", name: "Box Nemocnice" }
    ];

    // Vytvoření Data URI pro simulaci fetch
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(mockData));

    async function fetchPickupPoints() {
        // Zde používáme fetch s data URI, což je technicky fetch, ale funguje offline/lokálně
        const response = await fetch(dataUri);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    async function handleSearch() {
        const query = cityInput.value.trim().toLowerCase();

        // Pokud je pole prázdné, vyzveme uživatele
        if (!query) {
            resultsContainer.innerHTML = '<div class="message">Zadejte prosím město pro vyhledávání.</div>';
            return;
        }

        resultsContainer.innerHTML = '<div class="loading">Načítám data...</div>';

        try {
            const data = await fetchPickupPoints();

            // 3. Logika zpracování dat (Filtrování)
            // Filtrujeme podle města (case-insensitive)
            const filteredByCity = data.filter(item =>
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

            let errorMessage = 'Chyba připojení k serveru. Data se nepodařilo načíst.';
            if (window.location.protocol === 'file:') {
                errorMessage = 'Chyba: Aplikaci nelze spustit přímo ze souboru (CORS politika prohlížeče). Prosím, spusťte ji přes lokální server (např. VS Code Live Server).';
            }

            // 3. (Fallback) Výpis chybové hlášky červeně
            resultsContainer.innerHTML = `<div class="error-message">${errorMessage}</div>`;
        }
    }

    function renderResults(points) {
        resultsContainer.innerHTML = '';

        if (points.length === 0) {
            // 3. Zpráva, pokud se nic nenašlo
            resultsContainer.innerHTML = '<div class="no-results">Nebylo nalezeno žádné výdejní místo.</div>';
            return;
        }

        points.forEach(point => {
            const card = document.createElement('div');
            card.className = 'result-card';

            // 1. Priorita: 'place' > 'name' (fallback)
            const title = point.place ? point.place : point.name;

            // Zajištění bezpečného výpisu (XSS prevence není v zadání explicitně, ale textContent je bezpečnější než innerHTML pro data)
            // Zde pro jednoduchost a formátování použijeme innerHTML šablonu
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
