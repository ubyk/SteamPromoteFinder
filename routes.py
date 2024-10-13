from flask import render_template, request, jsonify
from app import app
from steam_api import fetch_discounted_games, get_game_details

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/discounted_games')
def discounted_games():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    min_discount = int(request.args.get('min_discount', 0))
    max_discount = int(request.args.get('max_discount', 100))
    
    sort_by = request.args.get('sort', 'discount_desc')
    
    games, total_results = fetch_discounted_games(page, per_page)
    
    # Apply filters
    filtered_games = [
        game for game in games
        if min_discount <= game['discount_percent'] <= max_discount
    ]
    
    # Apply sorting
    if sort_by == 'price_asc':
        filtered_games.sort(key=lambda g: g['discounted_price'])
    elif sort_by == 'price_desc':
        filtered_games.sort(key=lambda g: g['discounted_price'], reverse=True)
    elif sort_by == 'discount_desc':
        filtered_games.sort(key=lambda g: g['discount_percent'], reverse=True)
    
    return jsonify({'games': filtered_games, 'total': len(filtered_games)})

@app.route('/game/<int:app_id>')
def game_details(app_id):
    details = get_game_details(app_id)
    return jsonify(details)
