from sleepy import app,VERSION

from flask import jsonify,request,make_response,abort, current_app
from flask import send_from_directory
from auth import jwt_authenticate, jwt_required, current_user
from auth import jwt_encode, jwt_decode
import jwt
from cors import crossdomain

import time,datetime
from datetime import timedelta

from utils import string_decode
from utils import format_thread,format_thread_summary
from utils import format_message,format_message_summary
from utils import message_from_file,parse_mail_headers,parse_mail_body
from users import User,init_users, find_user_id, find_user_name

def user_handler(payload):
    print "Loading user %s"%payload
    user_id = payload.get('user_id',-1)
    return find_user_id(user_id)

def payload_handler(user):
    print "Creating payload for user %s"%user
    datetimenow = datetime.datetime.now()
    expiration = datetimenow + current_app.config['JWT_EXPIRATION_DELTA']
    return {'user_id': user.id,
            'exp': time.mktime(expiration.timetuple()),
            'nbf': time.mktime(datetimenow.timetuple())}

def authenticate_handler(username, password):
    print "Authenticating user %s"%username
    user = find_user_name(username)
    print "Found user %s"%user
    if user and user.password == password:
        print "Authentication ok"
        return user
    print "Authentication failed"

@app.route('/auth',methods=['POST','OPTIONS'])
@crossdomain(origin="*",headers=['Content-Type'])
def do_auth():
    return jwt_authenticate(authenticate_handler,payload_handler)

@app.route("/infos")
@crossdomain(origin="*",headers=['Content-Type','Authorization'])
def get_db_infos():
    return jsonify({"timezone": time.tzname[time.localtime().tm_isdst],
                    "api_version": VERSION})

@app.route("/stats")
@crossdomain(origin="*",headers=['Content-Type','Authorization'])
@jwt_required(user_handler)
def get_db_stats():
    tcount,mcount = current_user.db().get_stats('*')
    return jsonify({"thread_count": tcount,
                    "message_count": mcount})

@app.route("/tags",methods=['GET','OPTIONS'])
@crossdomain(origin="*",headers=['Content-Type','Authorization'])
@jwt_required(user_handler)
def get_tags():
    all_tags = current_user.db().get_all_tags()
    return jsonify({"count": len(all_tags),
                    "tags": all_tags})


@app.route("/attachments/<message_id>/<attachment_id>",
           methods=['GET','OPTIONS'])
@crossdomain(origin="*",headers=['Content-Type','Authorization'])
@jwt_required(user_handler)
def get_attachment(message_id,attachment_id):
    download_id = jwt_encode({"user_id": current_user.id,
                              "message_id": message_id,
                              "attachment_id": attachment_id})
    print "Created download token: %s"%download_id
    return jsonify({"download_token": download_id})

@app.route("/downloads/<download_token>")
@crossdomain(origin="*")
def get_data(download_token):
    try:
        payload = jwt_decode(download_token);
    except jwt.ExpiredSignature:
        abort(410)
    except jwt.DecodeError:
        abort(404)
    user = find_user_id(payload.get("user_id",-1))
    if user is None:
        abort(401)
    msg_id = payload.get('message_id')
    att_id = payload.get("attachment_id")
    print "Retrieving attachment %s/%s for user %s"%(msg_id,att_id,payload.get("user_id"))
    cache = user.attachment_cache.get(msg_id)
    if not cache:
        msg_list = user.db.search_messages("id:%s"%msg_id)
        if len(msg_list) != 1:
            abort(404)
        m = msg_list[0]
        mail = message_from_file(m.get_filename())
        parse_mail_body(m,mail,user)
        cache = user.attachment_cache.get(m.get_message_id())
    data = cache.get(att_id)
    if not data:
        abort(404)
    print "data.type = %s"%data["type"]
    print "data.filename = %s"%data["filename"]
    resp = make_response(data["content"])
    resp.headers["Content-Type"] = data["type"]
    if data.get("filename"):
        resp.headers["Content-disposition"] = "attachment; filename=%s"%data["filename"]
    return resp

@app.route("/messages/<message_id>",methods=['GET','OPTIONS'])
@crossdomain(origin="*",headers=['Content-Type','Authorization'])
@jwt_required(user_handler)
def get_message(message_id):
    msg_list = current_user.db().search_messages("id:%s"%message_id)
    if len(msg_list) != 1:
        abort(404)
    m = msg_list[0]
    return jsonify(format_message(m))

@app.route("/threads/<thread_id>",methods=['GET','OPTIONS'])
@crossdomain(origin="*",headers=['Content-Type','Authorization'])
@jwt_required(user_handler)
def get_thread(thread_id):
    tlist = current_user.db().search_threads("thread:%s"%thread_id)
    if len(tlist) != 1:
        abort(404)
    return jsonify(format_thread(tlist[0]))

@app.route("/search/threads/<path:search_query>",methods=['GET','OPTIONS'])
@crossdomain(origin="*",headers=['Content-Type','Authorization'])
@jwt_required(user_handler)
def search_threads(search_query):
    try:
        limit = int(request.args.get("limit",100))
        offset = int(request.args.get("offet",0))
    except ValueError:
        limit = 100
        offset = 0
    tlist = current_user.db().search_threads(search_query)
    threads = list()
    i = 0
    for it in tlist:
        if i >= offset and (i + offset) <= limit:
            threads.append(format_thread_summary(it))
        i += 1
    return jsonify({"threads": threads,
                    "total": i,
                    "count": len(threads),
                    "limit": limit,
                    "offset": offset})

@app.route("/search/messages/<search_query>",methods=['GET','OPTIONS'])
@crossdomain(origin="*",headers=['Content-Type','Authorization'])
@jwt_required(user_handler)
def search_messages(search_query):
    try:
        limit = int(request.args.get("limit",100))
        offset = int(request.args.get("offet",0))
    except ValueError:
        limit = 100
        offset = 0
    mlist = current_user.db().search_messages(search_query)
    msgs = list()
    i = 0
    for it in mlist:
        if i >= offset and (i + offset) <= limit:
            msgs.append(format_message_summary(it))
        i += 1
    return jsonify({"messages": msgs,
                    "total": i,
                    "count": len(msgs),
                    "limit": limit,
                    "offset": offset})


@app.route("/count/<search_query>",methods=['GET','OPTIONS'])
@crossdomain(origin="*",headers=['Content-Type','Authorization'])
@jwt_required(user_handler)
def get_count(search_query):
    tcount,mcount = current_user.db().get_stats(search_query)
    return jsonify({"thread_count": tcount,
                    "message_count": mcount})

@app.route('/retag',methods=['POST','OPTIONS'])
@crossdomain(origin="*",headers=['Content-Type','Authorization'])
@jwt_required(user_handler)
def do_retag():
    data = request.get_json(force=True)
    add_list = data.get("add_tags",list())
    remove_list = data.get("remove_tags",list())
    search_str = data.get("search","")
    sync_maildir = data.get("sync_maildir",True)
    if current_user.db().retag(search_str,add_list,remove_list,sync_maildir):
        return jsonify({"status": "ok"})
    else:
        return jsonify({"status": "error"})

@app.route('/accounts',methods=['GET','OPTIONS'])
@crossdomain(origin='*',headers=['Content-type','Authorization'])
@jwt_required(user_handler)
def get_accounts():
    account_list = current_user.accounts
    return jsonify({"accounts": account_list})


@app.route('/contacts',methods=['GET','OPTIONS'])
@crossdomain(origin='*',headers=['Content-type','Authorization'])
@jwt_required(user_handler)
def get_contacts():
    contacts = current_user.retrieve_contacts()
    return jsonify({"contacts": contacts})


import sendmail
@app.route('/sendmail',methods=['POST','OPTIONS'])
@crossdomain(origin='*',headers=['Content-type','Authorization'])
@jwt_required(user_handler)
def do_sendmail():
    data = request.get_json(force=True)
    msg = sendmail.Message(**data)
    if sendmail.send(msg) == 0:
        return jsonify({"status": "ok"})
    else:
        return jsonify({"status": "error",
                        "status_code": -1})
