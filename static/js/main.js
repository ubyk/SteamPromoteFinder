document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('results');

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            fetch(`/search?q=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(games => {
                    displayResults(games);
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }
    }

    function displayResults(games) {
        resultsContainer.innerHTML = '';
        games.forEach(game => {
            const gameElement = createGameElement(game);
            resultsContainer.appendChild(gameElement);
        });
    }

    function createGameElement(game) {
        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card game-card">
                <img src="${game.image_url}" class="card-img-top" alt="${game.name}">
                <div class="card-body">
                    <h5 class="card-title">${game.name}</h5>
                    <button class="btn btn-primary btn-sm view-details" data-app-id="${game.app_id}">View Details</button>
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
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${details.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <img src="${details.image_url}" class="img-fluid mb-3" alt="${details.name}">
                        <p><strong>Original Price:</strong> ${details.original_price}</p>
                        <p><strong>Discounted Price:</strong> ${details.discounted_price}</p>
                        <p><strong>Discount:</strong> ${details.discount_percent}%</p>
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
