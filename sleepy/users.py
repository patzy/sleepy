import notmuch
import os
import email.utils
import re

user_db = list()

class NotmuchDBManager:
    def __init__(self,db_path):
        self.db_path = db_path
        self.db = None
    def _open_db(self,rw=False):
        self._close_db()
        mode = notmuch.Database.MODE.READ_WRITE if rw else notmuch.Database.MODE.READ_ONLY
        self.db = notmuch.Database(path=self.db_path,mode=mode)
        return self.db
    def _close_db(self):
        if self.db:
            self.db.close()
            self.db = None
    def get_stats(self,search_query="*"):
        db = self._open_db()
        query = db.create_query(search_query)
        thread_count = query.count_threads()
        message_count = query.count_messages()
        self._close_db()
        return thread_count,message_count
    def get_all_tags(self):
        db = self._open_db()
        tags = list(self.db.get_all_tags())
        self._close_db()
        return tags
    def search_messages(self,search_query,as_list=True):
        db = self._open_db()
        query = db.create_query(search_query)
        msg_list = query.search_messages()
        if as_list: return list(msg_list)
        else: return msg_list
    def search_threads(self,search_query,as_list=True):
        db = self._open_db()
        query = db.create_query(search_query)
        t = query.search_threads()
        if as_list:
            thread_list = list()
            for it in t:
                thread_list.append(it)
            return thread_list
        else:
            return t
    def retag(self,search_query,add_list,remove_list,sync_maildir):
        db = self._open_db(rw=True)
        query = db.create_query(search_query)
        print "Retagging %s"%search_query
        print "Adding %s"%add_list
        print "Removing %s"%remove_list
        print "Sync maildir: %s"%sync_maildir
        try:
            msg_list = list(query.search_messages())
            print "Found %d messages to retag"%len(msg_list)
            db.begin_atomic()
            for msg in msg_list:
                msg.freeze()
                if remove_list == True:
                    msg.remove_all_tags()
                else:
                    for t in remove_list:
                        msg.remove_tag(t)
                for t in add_list:
                    msg.add_tag(t)
                msg.thaw()
                if sync_maildir:
                    msg.tags_to_maildir_flags()
            if db.end_atomic() != notmuch.STATUS.SUCCESS:
                raise NotmuchError()
        except NotmuchError as e:
            print "Failed to retag"
            print e
            return False
        finally:
            self._close_db()
        return True

class User(object):
    def __init__(self, **kwargs):
        self.contact_query = None
        self.sendmail_command = "/usr/sbin/sendmail -t"
        self.accounts = list()
        for k, v in kwargs.items():
            setattr(self, k, v)
        self.notmuch_db = NotmuchDBManager(self.notmuch_path)
        self.attachment_cache = dict()
        self.contact_cache = dict()
        self.update_contacts()
    def get_sendmail_cmd(self,index=None):
        cmd = self.sendmail_command
        if index != None and index >= 0 and index < len(self.accounts):
            cmd = self.accounts[index].get('sendmail_command',cmd)
        return cmd
    def db(self):
        return self.notmuch_db
    def update_contacts(self):
        self.contact_cache = dict()
        search_query = ' or '.join(['from:'+x['address'] for x in self.accounts])
        if self.contact_query:
            search_query += " or ("+self.contact_query+")"
        print "contact search_query: %s"%search_query
        msg_list = self.db().search_messages(search_query,as_list=False)
        for m in msg_list:
            addrs = list()
            for h in ('to','cc','bcc','from'):
                v = m.get_header(h)
                if v:
                    splited_v = v.split(',')
                    for addr in splited_v:
                        it = email.utils.parseaddr(addr)
                        if it == ('',''): continue
                        if not it[1] in self.contact_cache:
                            self.contact_cache[it[1]] = list()
                        if it[0] and not it[0] in self.contact_cache[it[1]]:
                            self.contact_cache[it[1]].append(it[0])
        print "Found %d contact"%len(self.contact_cache)
    def retrieve_contacts(self):
        return self.contact_cache

def init_users(user_list):
    user_index = 0
    for it in user_list:
        user_db.append(User(id=user_index,**it))

def find_user_id(user_id):
    if user_id > len(user_db): return None
    return user_db[user_id]

def find_user_name(username):
    for it in user_db:
        if it.username == username:
            return it
