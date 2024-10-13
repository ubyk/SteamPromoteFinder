import requests
from app import cache

STEAM_API_BASE_URL = "https://store.steampowered.com/api"

@cache.memoize(timeout=300)
def search_steam_games(query, page=1, per_page=20):
    url = f"{STEAM_API_BASE_URL}/storesearch/"
    params = {
        "term": query,
        "l": "english",
        "cc": "US",
        "start": (page - 1) * per_page,
        "count": per_page
    }
    response = requests.get(url, params=params)
    data = response.json()
    
    games = []
    for item in data.get('items', []):
        game = {
            'app_id': item['id'],
            'name': item['name'],
            'image_url': item.get('tiny_image')
        }
        games.append(game)
    
    total_results = data.get('total', 0)
    
    return games, total_results

@cache.memoize(timeout=300)
def get_game_details(app_id):
    url = f"{STEAM_API_BASE_URL}/appdetails/"
    params = {
        "appids": app_id,
        "cc": "US",
        "l": "english"
    }
    response = requests.get(url, params=params)
    data = response.json()
    
    game_data = data.get(str(app_id), {}).get('data', {})
    
    if not game_data:
        return None
    
    price_overview = game_data.get('price_overview', {})
    
    return {
        'app_id': app_id,
        'name': game_data.get('name'),
        'original_price': price_overview.get('initial_formatted'),
        'discounted_price': price_overview.get('final_formatted'),
        'discount_percent': price_overview.get('discount_percent'),
        'image_url': game_data.get('header_image')
    }
