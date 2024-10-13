import requests
from app import cache

STEAM_API_BASE_URL = "https://store.steampowered.com/api"

@cache.memoize(timeout=300)
def fetch_discounted_games(page=1, per_page=20):
    url = f"{STEAM_API_BASE_URL}/featuredcategories/"
    response = requests.get(url)
    data = response.json()
    
    specials = data.get('specials', {}).get('items', [])
    
    start = (page - 1) * per_page
    end = start + per_page
    
    games = []
    for item in specials[start:end]:
        game = {
            'app_id': item['id'],
            'name': item['name'],
            'image_url': item.get('large_capsule_image'),
            'original_price': item.get('original_price'),
            'discounted_price': item.get('final_price'),
            'discount_percent': item.get('discount_percent')
        }
        games.append(game)
    
    total_results = len(specials)
    
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
