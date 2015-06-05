import notmuch
import email
from auth import current_user
import json

def load_json(cfg_file):
    data = ''
    with open(cfg_file) as f:
        data = ''.join(f.readlines())
    return json.loads(data)

def string_decode(string, enc='ascii'):
    """
    safely decodes string to unicode bytestring, respecting `enc` as a hint.
    """

    if enc is None:
        enc = 'ascii'
    try:
        string = unicode(string, enc, errors='replace')
    except LookupError:  # malformed enc string
        string = string.decode('ascii', errors='replace')
    except TypeError:  # already unicode
        pass
    return string


def format_thread(t):
    print "Formatting thread %s"%t
    def format_msg(msg):
        replies = list()
        for x in msg.get_replies():
            replies.append(format_msg(x))
        return {"id": msg.get_message_id(),
                "to": msg.get_header("to"),
                "date": msg.get_date(),
                "from": msg.get_header("from"),
                "subject": msg.get_header("subject"),
                "tags": [x for x in msg.get_tags()],
                "replies": replies}
    return {"id": t.get_thread_id(),
            "count": t.get_total_messages(),
            "authors": t.get_authors().split(',') if t.get_authors() else "(null)",
            "tags": [ str(x) for x in t.get_tags()],
            "subject": t.get_subject(),
            "oldest_date": t.get_oldest_date(),
            "newest_date": t.get_newest_date(),
            "messages": [format_msg(x) for x in t.get_toplevel_messages()]}

def format_thread_summary(t):
    return {"id": t.get_thread_id(),
            "count": t.get_total_messages(),
            "authors": t.get_authors().split(',') if t.get_authors() else "(null)",
            "tags": [ str(x) for x in t.get_tags()],
            "oldest_date": t.get_oldest_date(),
            "newest_date": t.get_newest_date(),
            "subject": t.get_subject()}

def message_from_file(fname):
    with open(fname) as f:
        return email.message_from_file(f)

def parse_mail_headers(msg,mail):
    return dict(mail)

def parse_mail_body(msg,mail,user=None):
    user = user or current_user
    def parse_mail_part(mail_part):
        part = dict()
        # common properties
        part["content-type"] = cont_type = mail_part.get_content_type().lower()
        full_cont_type = mail_part["Content-Type"]
        if mail_part.is_multipart():
            part["content"] = [parse_mail_part(x) for x in mail_part.get_payload()]
            return part
        cont_disp = mail_part["Content-Disposition"]
        enc = mail_part.get_content_charset() or 'ascii'
        content = mail_part.get_payload(decode=True)
        # embbeded data and attachments
        if mail_part.get_filename() or mail_part.has_key("Content-ID"):
            file_id = mail_part.get_filename()
            if mail_part.get_filename():
                part["filename"] = mail_part.get_filename()
            if mail_part["Content-ID"]:
                part["cid"] = mail_part["Content-ID"].lstrip(' <').rstrip(' >')
                file_id = part["cid"]
            part["att_id"] = file_id
            if cont_disp and "inline" in cont_disp.lower():
                part["inline"] = True
            if cont_disp and "attachment" in cont_disp.lower():
                part["attachment"] = True
            if cont_type in ["text/plain","text/html"]:
                part["content"] = string_decode(content,enc)
            else:
                cache = user.attachment_cache.get(msg.get_message_id())
                if not cache:
                    cache = dict()
                    user.attachment_cache[msg.get_message_id()] = cache
                if not file_id in cache:
                    cache[file_id] = {"content": content,
                                      "type": cont_type,
                                      "filename": part.get("filename"),
                                      "cid": part.get("cid")}
            return part
        # actual part content
        part["content"] = string_decode(content,enc)
        return part
    body = parse_mail_part(mail)
    return body

def format_message(m):
    print "Formatting message file: %s"%m.get_filename()
    mail = message_from_file(m.get_filename())
    return {"headers": parse_mail_headers(m,mail),
            "body": parse_mail_body(m,mail),
            "id": m.get_message_id(),
            "tags": list(m.get_tags())}

def format_message_summary(m):
    return {"id": m.get_message_id(),
            "date": m.get_date(),
            "thread": m.get_thread_id(),
            "from": m.get_header("from"),
            "to": m.get_header("to"),
            "subject": m.get_header("subject")}
