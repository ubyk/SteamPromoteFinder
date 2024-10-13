import requests

STEAM_API_BASE_URL = "https://store.steampowered.com/api"

def search_steam_games(query):
    url = f"{STEAM_API_BASE_URL}/storesearch/"
    params = {
        "term": query,
        "l": "english",
        "cc": "US"
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
    
    return games

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
