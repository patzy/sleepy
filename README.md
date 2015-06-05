Sleepy
======

Notmuch mail REST API and web interface.

Webmail isn't included in the python server, you'll need a web server for it.

This is a proof of concept and full of problems.
Issues are disabled as I won't work on this anymore.
Fork this and write proper remote notmuch support !

Authentication code has been adapted from [flask-jwt](https://github.com/mattupstate/flask-jwt).

Sendmail code has been adapted from [flask-sendmail](https://github.com/ajford/flask-sendmail).

Also peeked at [alot](https://github.com/pazz/alot) for some functionalities.

Thanks to [lu6fer](https://github.com/lu6fer) for helping me through angular dev.

Dependencies
------------

Requirements:

- python 2.x
- [Flask](http://flask.pocoo.org/)
- [notmuch](http://notmuchmail.org) and its python bindings

Optional:

- [bower](http://bower.io/) for js dependencies
- some working sendmail command on the computer running the REST server

Quick start
-----------

Install all the dependencies. If you want to run the web interface also
install its dependencies by running `bower install` in the `webmail/` directory.

Edit the REST server configuration file `sleepy.cfg` (json).
Edit the web interface configuation file `webmail/js/config.js`

Start the REST server by running `python run.py`.
Serve the web interface with `python -m SimpleHTTPServer` from the `webmail/` directory.

Open `http://localhost:8000` in your browser.

REST configuration
------------------

REST server configuration is located in `sleepy.cfg`.

REST server configuration file is a json file with the following entries:

- `auth-expiration`: authentication token validity duration in seconds
- `secret`: server secret key (used for authentication)
- `users`: list of user entries (see below)

Each user entry is a dict with the following fields:

- `username`
- `password` (clear text)
- `notmuch_path`: path to the notmuch database of the user (absolute path)
- `contact_query`: additional query for contact retrieval
Final contact query is an OR of all accounts FROM addresses and the contact_query field.
- `sendmail_command`: default sendmail command to use
- `accounts`: list of user mail accounts

Each account entry is a dict with the following fields:

- `name`: user display name
- `address`: from email address
- `sendmail_command`: sendmail command to use for the account

Webmail configuration
---------------------

Webmail configuration is located in `webmail/js/config.js`, should be clear reading the comments.
