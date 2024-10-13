document.addEventListener('DOMContentLoaded', () => {
    const findDiscountsButton = document.getElementById('find-discounts');
    const resultsContainer = document.getElementById('results');
    const themeToggle = document.getElementById('theme-toggle');
    const loadingIndicator = document.getElementById('loading');
    let currentPage = 1;
    let totalResults = 0;
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

    findDiscountsButton.addEventListener('click', () => {
        currentPage = 1;
        fetchDiscountedGames();
    });

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !isLoading) {
            loadMoreResults();
        }
    });

    function fetchDiscountedGames() {
        const discountRange = document.getElementById('discount-range').value;
        const sortBy = document.getElementById('sort-by').value;
        const [minDiscount, maxDiscount] = discountRange.split('-');

        isLoading = true;
        showLoading(true);

        fetch(`/discounted_games?page=${currentPage}&min_discount=${minDiscount}&max_discount=${maxDiscount}&sort=${sortBy}`)
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
            })
            .catch(error => {
                console.error('Error:', error.message);
                isLoading = false;
                showLoading(false);
                displayError(`An error occurred while fetching results: ${error.message}. Please try again.`);
            });
    }

    function loadMoreResults() {
        if (resultsContainer.children.length < totalResults) {
            currentPage++;
            fetchDiscountedGames();
        }
    }

    function displayResults(games) {
        if (games.length === 0) {
            displayError('No discounted games found matching your criteria.');
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
                <div class="position-relative">
                    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${game.image_url}" class="card-img-top lazy" alt="${game.name}">
                    <div class="discount-badge bg-danger text-white p-2 rounded-end">${game.discount_percent}% OFF</div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${game.name}</h5>
                    <p class="card-text">
                        <s class="text-muted">${game.original_price}</s><br>
                        <strong class="text-success">${game.discounted_price}</strong>
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
                                <p><strong>Original Price:</strong> <s class="text-muted">${details.original_price || 'N/A'}</s></p>
                                <p><strong>Discounted Price:</strong> <span class="text-success">${details.discounted_price || 'N/A'}</span></p>
                                <p><strong>Discount:</strong> <span class="text-danger">${details.discount_percent || 0}% OFF</span></p>
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

    // Initialize lazy loading for initial content
    initLazyLoading();
});
