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
    min_price = float(request.args.get('min_price', 0))
    max_price = float(request.args.get('max_price', float('inf')))
    min_discount = int(request.args.get('min_discount', 0))
    
    if not query:
        return jsonify({'games': [], 'total': 0})
    
    games, total_results = search_steam_games(query, page, per_page)
    
    # Apply filters
    filtered_games = [
        game for game in games
        if min_price <= float(game['discounted_price'].replace('$', '')) <= max_price
        and game['discount_percent'] >= min_discount
    ]
    
    return jsonify({'games': filtered_games, 'total': len(filtered_games)})

@app.route('/game/<int:app_id>')
def game_details(app_id):
    details = get_game_details(app_id)
    return jsonify(details)
