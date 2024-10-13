from flask import render_template, request, jsonify
from app import app
from steam_api import search_steam_games, get_game_details

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search')
def search():
    query = request.args.get('q', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    try:
        min_price = float(request.args.get('min_price')) if request.args.get('min_price') else 0
    except ValueError:
        min_price = 0
    
    try:
        max_price = float(request.args.get('max_price')) if request.args.get('max_price') else float('inf')
    except ValueError:
        max_price = float('inf')
    
    try:
        min_discount = int(request.args.get('min_discount')) if request.args.get('min_discount') else 0
    except ValueError:
        min_discount = 0
    
    sort_by = request.args.get('sort', 'relevance')
    
    if not query:
        return jsonify({'games': [], 'total': 0})
    
    games, total_results = search_steam_games(query, page, per_page)
    
    # Apply filters and sorting
    filtered_games = []
    for game in games:
        discounted_price = game.get('discounted_price', '0')
        if discounted_price.startswith('$'):
            discounted_price = discounted_price[1:]
        try:
            price = float(discounted_price)
            if min_price <= price <= max_price and game.get('discount_percent', 0) >= min_discount:
                filtered_games.append(game)
        except ValueError:
            # Skip games with invalid price format
            continue
    
    # Apply sorting
    if sort_by == 'price_asc':
        filtered_games.sort(key=lambda g: float(g.get('discounted_price', '0').replace('$', '')) or float('inf'))
    elif sort_by == 'price_desc':
        filtered_games.sort(key=lambda g: float(g.get('discounted_price', '0').replace('$', '')) or 0, reverse=True)
    elif sort_by == 'discount_desc':
        filtered_games.sort(key=lambda g: g.get('discount_percent', 0), reverse=True)
    
    return jsonify({'games': filtered_games, 'total': len(filtered_games)})

@app.route('/game/<int:app_id>')
def game_details(app_id):
    details = get_game_details(app_id)
    return jsonify(details)
