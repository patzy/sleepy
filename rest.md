REST API
========

All entries required authentication unless specified.

`/auth`
------
POST

    {
     "username": username,
     "password": password
    }

returns

    {"id_token": jwt_token}

`/infos`
-------
no_auth

GET

returns

    {"timezone": timezone,
     "api_version": version}
     
`/stats`
--------
GET

returns

    {"thread_count": count,
     "message_count": count}
     
`/tags`
-------
GET

returns

    {"count": number of tags,
     "tags": list of tags}
     
`/attachments/<message_id>/<attachment_id>`
------------------------------------------
GET

returns

    {"download_token": jwt download token}

`/downloads/<download_token>`
-----------------------------
GET

returns

    attachment data or 410/404/401

`/messages/<message_id>`
-----------------------
GET

returns

    {"headers": message headers,
     "body": recusrive message body content,
     "id": message id,
     "tags": message tags list}
     or 404

`/threads/<thread_id>`
---------------------
GET

returns

    {"id": thread id,
     "count": number of messages,
     "authors": authors list,
     "oldest_date": unix timestamp,
     "newest_date": unix timestamp,
     "subject": thread subject,
     "messages": message summary hierarchy
    }
    or 404

`/search/threads/<search_query>?limit=xxx&offset=xxx`
-------------------------------
GET

parameters

    limit: maximum number of results to return
    offset: start index of first result returned

returns

    {"threads": [{"id": thread id,
                  "count": number of messages,
                  "authors": authors list,
                  "oldest_date": unix timestamp,
                  "newest_date": unix timestamp,
                  "subject": thread subject
                  }, ...]
     "total": total number of search results,
     "count": returned results,
     "limit": maximum number of results returned,
     "offset": start index of first result returned}

`/search/messages/<search_query>?limit=xxx&offset=xxx`
--------------------------------
GET

parameters

    limit: maximum number of results to return
    offset: start index of first result returned

returns

    {"messages": [{"id": thread id,
                   "date": unix timestamp,
                   "thread": thread id,
                   "from": sender,
                   "to": recipients,
                   "subject": message subject
                   }, ...]
     "total": total number of search results,
     "count": returned results,
     "limit": maximum number of results returned,
     "offset": start index of first result returned}

`/count/<search_query>`
----------------------
GET

returns

    {"thread_count": query thread count,
     "message_count": query message count}

`/retag`
--------
POST

    {"add_tags": list of tags to add,
     "remove_tags": list of tags to remove (true to remove all),
     "search": search query to retag,
     "sync_maildir": synchronize maildir flags on retag (true/false)}

returns

    {"status": "ok"} or 500

`/accounts`
----------
GET

returns

    {"accounts": list of user accounts as in sleepy.cfg}

`/contacts`
----------
GET

returns

    {"contacts": list of contacts using configured contact_query}
    each contact is as follow:
    {display name: list of addresses}

`/sendmail`
----------
POST

    {"account": sender account index,
     "message": {"subject": message subject,
                 "sender": message sender,
                 "body": plain text content,
                 "charset": content charset,
                 "html": html content,
                 "cc": list of recipients,
                 "recipients": list of recipients,
                 "references": message references,
                 "reply_to": parent id,
                 "bcc": list of recipients
                }
    }
    
returns

    {"status": "ok"} or 500
