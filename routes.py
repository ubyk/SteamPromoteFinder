from flask import render_template, request, jsonify
from app import app
from steam_api import search_steam_games, get_game_details

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search')
def search():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    games = search_steam_games(query)
    return jsonify(games)

@app.route('/game/<int:app_id>')
def game_details(app_id):
    details = get_game_details(app_id)
    return jsonify(details)
