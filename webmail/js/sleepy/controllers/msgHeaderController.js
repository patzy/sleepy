SleepyApp.controller('msgHeaderController', [
    '$scope',
    '$window',
    '$sce',
    'messageFactory',
    function ($scope,$window,$sce,messageFactory) {
        $scope.embeddedShown = false;
        $scope.detailsCollapsed = true;
        $scope.downloadAttachment = function(att) {
            console.log("Downloading",att);
            // retrieve download token
            messageFactory.authAttachment(att.msg_id,att.att_id)
                .then(function(response) {
                    console.log("Download data",response.data);
                    console.log("Download token",response.data.download_token);
                    var url = messageFactory.downloadUrl(response.data.download_token);
                    $window.location.assign(url);
                },function(error) {
                    console.log("Download failed",error);
                });
        }
        $scope.showEmbedded = function(msg) {
            console.log("Showing embedded in",msg.id);
            for (var i=0;i<msg.collectedContent.length;i++) {
                var content = msg.collectedContent[i];
                if (content.type != "text/html") continue;
                var text = content.raw;
                var att_id_list = text.match(/\ssrc=['"]cid:([^"]*)['"]/g);
                console.log("Att id match",att_id_list);
                if (att_id_list) {
                    for (var j=0;j<att_id_list.length;j++) {
                        var att_id = att_id_list[j].match(/\ssrc=['"]cid:([^"]*)['"]/);
                        console.log("Html block embedded att id",att_id);
                        var requestEmbedded = function(msg,content,att_id) {
                            messageFactory.authAttachment(msg.id,att_id[1])
                                .then(function(response) {
                                    var att_token = response.data.download_token;
                                    var download_url = messageFactory.downloadUrl(att_token);
                                    content.raw = content.raw.replace(att_id[0],
                                                                       ' src="'+download_url+'"');
                                    content.trusted = $sce.trustAsHtml(content.raw);
                                });
                        }
                        requestEmbedded(msg,content,att_id);
                    }
                }
            }
            $scope.embeddedShown = true;
        }
        $scope.hasEmbedded = function(msg) {
            if (!msg.collectedAtts) return false;
            for (var i=0;i<msg.collectedAtts.length;i++) {
                console.log("cid:",msg.collectedAtts[i].cid);
                if (msg.collectedAtts[i].cid) return true;
            }
            return false;
        }
    }
]);
