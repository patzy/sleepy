SleepyApp.factory('messageFactory', [
    '$http',
    'api_url',
    '$sce',
    '$filter',
    function($http, api_url, $sce, $filter) {
        var messageFact = {};

        messageFact.getAccounts = function() {
            return $http.get(api_url+ "/accounts");
        }

        messageFact.getContacts = function() {
            return $http.get(api_url+"/contacts");
        }
        
        messageFact.send = function(from,recipients,copies,blind_copies,subject,body) {
            return $http.post(api_url + "/sendmail",
                              {"sender": from,
                               "recipients": recipients,
                               "cc": copies,
                               "bcc": blind_copies,
                               "subject": subject,
                               "body": body
                             })
                .error(function(error) {
                    console.log(error);
                });
        }
        
        messageFact.authAttachment = function(messageId,attachmentId) {
            return $http.get(api_url + '/attachments/' + messageId + '/' + attachmentId);
        };

        messageFact.downloadUrl = function(downloadToken) {
            return api_url + '/downloads/' + downloadToken;
        }

        messageFact.getMessage = function (messageId) {
            return $http.get(api_url + '/messages/' + messageId);
        };

        var formatPlainText = function (text) {
            return {"raw": text,
                    "type": "text/plain",
                    "trusted": $sce.trustAsHtml($filter('linky')(text).replace(/&#10;/g,"<br/>"))};
        }

        var formatHtml = function(msg,text) {
            var result = {"raw": text,
                          "type": "text/html",
                          "trusted": $sce.trustAsHtml(text)}
            return result;
        }

        var formatInvalid = function(ctype) {
            var text = "<pre>Invalid content "+ctype+"</pre>";
            return {"raw": text,
                    "type": "invalid",
                    "trusted": $sce.trustAsHtml(text)};
        }
                
        var selectAlternative = function _selectAlternative(msg,alt_part) {
            var selectedAlt = null;
            var selectedType = null;
            for (var i=0;i<alt_part.content.length;i++) {
                var subpart = alt_part.content[i];
                console.log("Considering alternative ",subpart["content-type"]);
                var subtype = subpart["content-type"];
                if (subtype == "text/html") {
                    console.log("Selected text/html");
                    selectedAlt = [formatHtml(msg,subpart.content)];
                }
                else if (!selectedAlt && (subtype == "text/plain")) {
                    console.log("Selected text/plain");
                    selectedAlt = [formatPlainText(subpart.content)];
                }
                else if (subtype == "multipart/related") {
                    console.log("Considering related subpart");
                    selectedAlt = messageFact.collectMsgContent(msg,subpart);
                }
                else if (subtype == "multipart/mixed") {
                    console.log("Collecting mixed subpart");
                    selectedAlt = messageFact.collectMsgContent(msg,subpart);
                }
                else if (subtype == "multipart/alternative") {
                    console.log("Considering alternative subpart");
                    selectedAlt =  _selectAlternative(msg,subpart);
                }
            }
            return selectedAlt;
        }

        messageFact.collectMsgContent = function(msg,part) {
            var part = part || msg.body;
                                
            var part_list = [];
                    
            var ctype = part["content-type"];
            if (ctype == "multipart/alternative") {
                console.log("Selecting alternative");
                console.log(part);
                part_list = part_list.concat(selectAlternative(msg,part));
            }
            else if ((ctype == "multipart/mixed")||(ctype == 'multipart/related')||
                     (ctype == "multipart/digest")) {
                console.log("Collecting ",ctype);
                for (var j=0;j<part.content.length;j++) {
                    sub_cont = messageFact.collectMsgContent(msg,part.content[j]);
                    part_list = part_list.concat(sub_cont);
                }
            }
            else if (part.content) {
                if ((ctype == "text/plain")||(ctype=="message/rfc822")) {
                    part_list.push(formatPlainText(part.content));
                }
                else if (ctype == "text/html") {
                    part_list.push(formatHtml(msg,part.content));
                }
                else {
                    part_list.push(formatInvalid(ctype));
                }
            }
            else if (!part.att_id) {
                part_list.push(formatInvalid(ctype));
            }
            return part_list;
            
        }

        messageFact.collectMsgAttachment = function(msg,part) {
            var part = part || msg.body;
            var att_list = []
            var ctype = part["content-type"];
            if ( (ctype=="multipart/alternative") ||
                 (ctype=="multipart/mixed") ||
                 (ctype=="multipart/digest") ||
                 (ctype=="multipart/related")) {
                for (var i=0;i<part.content.length;i++) {
                    sub_atts = messageFact.collectMsgAttachment(msg,part.content[i]);
                    att_list = att_list.concat(sub_atts);
                }
            }
            else if (part.att_id) {
                console.log("Collecting attachment",part.att_id);
                att_list.push({"att_id": part.att_id,
                               "msg_id": msg.id,
                               "cid": part.cid,
                               "filename": part.filename});
            }
            return att_list;
        }

        return messageFact;
    }
]);
