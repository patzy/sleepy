from flask import Flask, g
from auth import jwt_init_app
from users import init_users
from utils import load_json
from datetime import timedelta
import os

VERSION="0.1"

app = Flask('Sleepy')
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = False
cfg = load_json("sleepy.cfg")
app.secret_key = cfg['secret']
jwt_init_app(app)
app.config['SLEEPY'] = {"auth-expiration": 300,
                        "users": []}

@app.before_first_request
def sleepy_init():
    app.config['SLEEPY'].update(cfg)
    auth_exp = app.config['SLEEPY'].get('auth-expiration',300)
    app.config['JWT_EXPIRATION_DELTA'] = timedelta(seconds=auth_exp)
    init_users(app.config['SLEEPY'].get('users',list()))

import sleepy.views
