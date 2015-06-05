from collections import OrderedDict
from datetime import timedelta
from functools import wraps
import jwt
from flask import current_app, request, jsonify, _request_ctx_stack
from flask.views import MethodView
from werkzeug.local import LocalProxy

CONFIG_DEFAULTS = {
    'JWT_DEFAULT_REALM': 'Login Required',
    'JWT_ALGORITHM': 'HS256',
    'JWT_VERIFY': True,
    'JWT_VERIFY_EXPIRATION': True,
    'JWT_EXPIRATION_DELTA': timedelta(seconds=300)
}

current_user = LocalProxy(lambda: getattr(_request_ctx_stack.top, 'current_user', None))

def jwt_encode(payload):
    """Return the encoded payload."""
    return jwt.encode(payload,
                      current_app.config['JWT_SECRET_KEY'],
                      current_app.config['JWT_ALGORITHM']).decode('utf-8')


def jwt_decode(token):
    """Return the decoded token."""
    return jwt.decode(token,
                      current_app.config['JWT_SECRET_KEY'],
                      current_app.config['JWT_VERIFY'])

def _default_payload_handler(user):
    return {
        'user_id': user.id,
        'exp': datetime.utcnow() + current_app.config['JWT_EXPIRATION_DELTA']
    }


def _default_response_handler(payload):
    """Return a Flask response, given an encoded payload."""
    return jsonify({'id_token': payload})


def jwt_required(user_handler,realm=None):
    """View decorator that requires a valid JWT token to be present in the request

    :param realm: an optional realm
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt(user_handler,realm)
            return fn(*args, **kwargs)
        return decorator
    return wrapper


class JWTError(Exception):
    def __init__(self, error, description, status_code=400, headers=None):
        self.error = error
        self.description = description
        self.status_code = status_code
        self.headers = headers


def verify_jwt(user_handler,realm=None):
    if not current_app.config['JWT_VERIFY']:
        _request_ctx_stack.top.current_user = user = user_handler(None)
        return

    realm = realm or current_app.config['JWT_DEFAULT_REALM']
    auth = request.headers.get('Authorization', None)

    if auth is None:
        raise JWTError('Authorization Required', 'Authorization header was missing', 401, {
            'WWW-Authenticate': 'JWT realm="%s"' % realm
        })

    parts = auth.split()

    if parts[0].lower() != 'bearer':
        raise JWTError('Invalid JWT header', 'Unsupported authorization type')
    elif len(parts) == 1:
        raise JWTError('Invalid JWT header', 'Token missing')
    elif len(parts) > 2:
        raise JWTError('Invalid JWT header', 'Token contains spaces')

    try:
        payload = jwt_decode(parts[1])
    except jwt.ExpiredSignature:
        raise JWTError('Invalid JWT', 'Token is expired')
    except jwt.DecodeError:
        raise JWTError('Invalid JWT', 'Token is undecipherable')

    _request_ctx_stack.top.current_user = user = user_handler(payload)

    if user is None:
        raise JWTError('Invalid JWT', 'User does not exist')


def jwt_authenticate(auth_handler,
                     payload_handler=_default_payload_handler,
                     response_handler=_default_response_handler):
    data = request.get_json(force=True)
    username = data.get('username', None)
    password = data.get('password', None)
    criterion = [username, password, len(data) == 2]

    if not all(criterion):
        raise JWTError('Bad Request', 'Missing required credentials', status_code=400)

    user = auth_handler(username=username, password=password)

    if user:
        payload = payload_handler(user)
        token = jwt_encode(payload)
        return response_handler(token)
    else:
        raise JWTError('Bad Request', 'Invalid credentials')


def jwt_init_app(app):
    def _error_handler(e):
        return jsonify(OrderedDict([
            ('status_code', e.status_code),
            ('error', e.error),
            ('description', e.description),
    ])), e.status_code, e.headers
    for k, v in CONFIG_DEFAULTS.items():
        app.config.setdefault(k, v)
    app.config.setdefault('JWT_SECRET_KEY', app.config['SECRET_KEY'])
    app.errorhandler(JWTError)(_error_handler)
