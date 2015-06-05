SleepyApp.factory('threadFactory', [
    '$http',
    'api_url',
    function($http, api_url) {
        var threadFact = {};
        
        threadFact.getThread = function (threadId) {
            return $http.get(api_url + '/threads/' + threadId);
        };

        threadFact.flattenMsgTree = function(msgTree,index,output) {
            var output = output || [];
            var current_index = index || 0;
            var parent_index = current_index - 1;
            for (var i=0;i<msgTree.length;i++) {
                var msg = msgTree[i];
                output[current_index] = msg;
                msg.index = current_index;
                msg.parent_index =  parent_index
                current_index++;
                if (msg.replies && msg.replies.length != 0) {
                    threadFact.flattenMsgTree(msg.replies,current_index,output);
                    current_index += msg.replies.length;
                }
            }
            return output;
        };

        return threadFact;
    }
]);
