from subprocess import PIPE, STDOUT, Popen
from email.mime.text import MIMEText
import sys

MAILER="/usr/sbin/sendmail"
MAILER_FLAGS="-t"

class Message(object):
    def __init__(self, subject=None,sender=None,body=None,charset=None,
                 html=None,cc=None,bcc=None,reply_to=None,references=None,
                 recipients=None,attachments=None):

        self.subject = subject
        self.sender = sender
        self.body = body
        self.html = html
        self.charset = charset or 'utf-8'
        self.cc = cc
        self.bcc = bcc
        self.reply_to = reply_to
        self.references = references

        if recipients is None:
            recipients = []

        self.recipients = list(recipients)

        if attachments is None:
            attachments = []

        self.attachments = attachments

    def is_bad_headers(self):
        """
        Checks for bad headers i.e. newlines in subject, sender or recipients.
        """

        reply_to = self.reply_to or ''
        for val in [self.subject, self.sender, reply_to] + self.recipients:
            for c in '\r\n':
                if c in val:
                    return True
        return False

    def dump(self):
        if self.html:
            msg = MIMEText(self.html, 'html', self.charset)
        elif self.body:
            msg = MIMEText(self.body, 'plain', self.charset)
        else:
            return ""

        if isinstance(self.sender, tuple):
            # sender can be tuple of (name, address)
            self.sender = "%s <%s>" % self.sender

        msg['Subject'] = self.subject
        msg['To'] = ', '.join(self.recipients)
        msg['From'] = self.sender
        if self.cc:
            if hasattr(self.cc, '__iter__'):
                msg['Cc'] = ', '.join(self.cc)
            else:
                msg['Cc'] = self.cc
        if self.bcc:
            if hasattr(self.bcc, '__iter__'):
                msg['Bcc'] = ', '.join(self.bcc)
            else:
                msg['Bcc'] = self.bcc
        if self.reply_to:
            msg['Reply-To'] = self.reply_to
        if self.references:
            msg['References'] = self.references

        msg_str = msg.as_string()
        if sys.version_info >= (3,0) and isinstance(msg_str, str):
            return msg_str.encode(self.charset or 'utf-8')
        else:
            return msg_str

def send(message):
    sm = Popen([MAILER, MAILER_FLAGS], stdin=PIPE,
               stdout=PIPE, stderr=STDOUT)
    sm.stdin.write(message.dump())
    sm.communicate()
    return sm.returncode

def send_message(self, *args, **kwargs):
    send(Message(*args, **kwargs))
