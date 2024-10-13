from app import db

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    app_id = db.Column(db.Integer, unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    original_price = db.Column(db.Float)
    discounted_price = db.Column(db.Float)
    discount_percent = db.Column(db.Integer)
    image_url = db.Column(db.String(500))
