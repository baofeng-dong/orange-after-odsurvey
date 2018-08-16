
from flask import render_template

from dashboard import app
from dashboard.auth import Auth

@app.route('/')
@Auth.requires_auth
def index():
    return render_template("index.html")

