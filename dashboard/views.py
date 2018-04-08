# Copyright (C) 2017 Baofeng Dong
# This program is released under the "MIT License".
# Please see the file COPYING in the source
# distribution of this software for license terms.

from flask import render_template

from dashboard import app
from dashboard.auth import Auth

@app.route('/')
@Auth.requires_auth
def index():
    return render_template("index.html")

