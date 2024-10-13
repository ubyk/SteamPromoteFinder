document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('results');
    const themeToggle = document.getElementById('theme-toggle');
    const loadingIndicator = document.getElementById('loading');
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

    // Debounce function
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Debounced search function
    const debouncedSearch = debounce(() => {
        currentPage = 1;
        performSearch();
    }, 300);

    searchButton.addEventListener('click', debouncedSearch);
    searchInput.addEventListener('input', debouncedSearch);

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
        const sortBy = document.getElementById('sort-by').value;

        if (query) {
            currentQuery = query;
            isLoading = true;
            showLoading(true);

            // Check cache first
            const cacheKey = `${query}_${minPrice}_${maxPrice}_${minDiscount}_${sortBy}_${currentPage}`;
            const cachedResults = getCachedResults(cacheKey);

            if (cachedResults) {
                displayResults(cachedResults.games);
                totalResults = cachedResults.total;
                isLoading = false;
                showLoading(false);
            } else {
                fetch(`/search?q=${encodeURIComponent(query)}&page=${currentPage}&min_price=${minPrice}&max_price=${maxPrice}&min_discount=${minDiscount}&sort=${sortBy}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (currentPage === 1) {
                            resultsContainer.innerHTML = '';
                        }
                        displayResults(data.games);
                        totalResults = data.total;
                        isLoading = false;
                        showLoading(false);

                        // Cache the results
                        cacheResults(cacheKey, data);
                    })
                    .catch(error => {
                        console.error('Error:', error.message);
                        isLoading = false;
                        showLoading(false);
                        displayError(`An error occurred while fetching results: ${error.message}. Please try again.`);
                    });
            }
        } else {
            displayError('Please enter a search query.');
        }
    }

    function loadMoreResults() {
        if (resultsContainer.children.length < totalResults) {
            currentPage++;
            performSearch();
        }
    }

    function displayResults(games) {
        if (games.length === 0) {
            displayError('No games found matching your criteria.');
            return;
        }
        games.forEach(game => {
            const gameElement = createGameElement(game);
            resultsContainer.appendChild(gameElement);
        });
        initLazyLoading();
    }

    function createGameElement(game) {
        const col = document.createElement('div');
        col.className = 'col-sm-6 col-md-4 col-lg-3 mb-4';
        col.innerHTML = `
            <div class="card game-card h-100">
                <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${game.image_url}" class="card-img-top lazy" alt="${game.name}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${game.name}</h5>
                    <p class="card-text">
                        <strong>Price:</strong> ${game.discounted_price || 'N/A'}<br>
                        <strong>Discount:</strong> ${game.discount_percent || 0}%
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

    function initLazyLoading() {
        const lazyImages = document.querySelectorAll('img.lazy');
        const lazyImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.remove('lazy');
                    lazyImageObserver.unobserve(lazyImage);
                }
            });
        });

        lazyImages.forEach(lazyImage => {
            lazyImageObserver.observe(lazyImage);
        });
    }

    function fetchGameDetails(appId) {
        showLoading(true);
        fetch(`/game/${appId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(details => {
                displayGameDetails(details);
                showLoading(false);
            })
            .catch(error => {
                console.error('Error:', error.message);
                showLoading(false);
                displayError(`An error occurred while fetching game details: ${error.message}. Please try again.`);
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
                                <p><strong>Original Price:</strong> ${details.original_price || 'N/A'}</p>
                                <p><strong>Discounted Price:</strong> ${details.discounted_price || 'N/A'}</p>
                                <p><strong>Discount:</strong> ${details.discount_percent || 0}%</p>
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

    function showLoading(show) {
        loadingIndicator.classList.toggle('d-none', !show);
    }

    function displayError(message) {
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger mt-3';
        errorAlert.textContent = message;
        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(errorAlert);
    }

    function getCachedResults(key) {
        const cachedData = localStorage.getItem(key);
        if (cachedData) {
            try {
                const { timestamp, data } = JSON.parse(cachedData);
                if (Date.now() - timestamp < 5 * 60 * 1000) { // 5 minutes cache
                    return data;
                }
            } catch (error) {
                console.error('Error parsing cached data:', error.message);
            }
        }
        return null;
    }

    function cacheResults(key, data) {
        try {
            const cacheData = {
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(key, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error caching results:', error.message);
        }
    }

    // Initialize lazy loading for initial content
    initLazyLoading();
});
