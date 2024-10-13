document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('results');
    const themeToggle = document.getElementById('theme-toggle');
    let currentPage = 1;
    let totalResults = 0;
    let currentQuery = '';
    let isLoading = false;

    // Theme toggle functionality
    themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        if (html.getAttribute('data-bs-theme') === 'dark') {
            html.setAttribute('data-bs-theme', 'light');
            themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i> Toggle Theme';
        } else {
            html.setAttribute('data-bs-theme', 'dark');
            themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i> Toggle Theme';
        }
    });

    searchButton.addEventListener('click', () => {
        currentPage = 1;
        performSearch();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentPage = 1;
            performSearch();
        }
    });

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !isLoading) {
            loadMoreResults();
        }
    });

    function performSearch() {
        const query = searchInput.value.trim();
        const minPrice = document.getElementById('min-price').value;
        const maxPrice = document.getElementById('max-price').value;
        const minDiscount = document.getElementById('min-discount').value;

        if (query) {
            currentQuery = query;
            isLoading = true;
            fetch(`/search?q=${encodeURIComponent(query)}&page=${currentPage}&min_price=${minPrice}&max_price=${maxPrice}&min_discount=${minDiscount}`)
                .then(response => response.json())
                .then(data => {
                    if (currentPage === 1) {
                        resultsContainer.innerHTML = '';
                    }
                    displayResults(data.games);
                    totalResults = data.total;
                    isLoading = false;
                })
                .catch(error => {
                    console.error('Error:', error);
                    isLoading = false;
                });
        }
    }

    function loadMoreResults() {
        if (resultsContainer.children.length < totalResults) {
            currentPage++;
            performSearch();
        }
    }

    function displayResults(games) {
        games.forEach(game => {
            const gameElement = createGameElement(game);
            resultsContainer.appendChild(gameElement);
        });
    }

    function createGameElement(game) {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-lg-3 mb-4';
        col.innerHTML = `
            <div class="card game-card h-100">
                <img src="${game.image_url}" class="card-img-top" alt="${game.name}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${game.name}</h5>
                    <p class="card-text">
                        <strong>Price:</strong> ${game.discounted_price}<br>
                        <strong>Discount:</strong> ${game.discount_percent}%
                    </p>
                    <button class="btn btn-primary mt-auto view-details" data-app-id="${game.app_id}">View Details</button>
                </div>
            </div>
        `;

        const viewDetailsButton = col.querySelector('.view-details');
        viewDetailsButton.addEventListener('click', () => {
            fetchGameDetails(game.app_id);
        });

        return col;
    }

    function fetchGameDetails(appId) {
        fetch(`/game/${appId}`)
            .then(response => response.json())
            .then(details => {
                displayGameDetails(details);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function displayGameDetails(details) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${details.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <img src="${details.image_url}" class="img-fluid mb-3" alt="${details.name}">
                            </div>
                            <div class="col-md-6">
                                <p><strong>Original Price:</strong> ${details.original_price}</p>
                                <p><strong>Discounted Price:</strong> ${details.discounted_price}</p>
                                <p><strong>Discount:</strong> ${details.discount_percent}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }
});
