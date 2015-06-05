SleepyApp.factory('tagsFactory', [
    '$http',
    'api_url',
    'sync_maildir',
    function($http, api_url, sync_maildir) {
        var tagsFact = {};

        tagsFact.getAll = function() {
            return $http.get(api_url + '/tags');
        };

        tagsFact.getCount = function(tag) {
            return $http.get(api_url + '/count/tag:' + tag);
        }

        tagsFact.retag = function(search_str,add_list,remove_list) {
            return $http.post(api_url + "/retag",
                              {"search": search_str,
                               "add_tags": add_list,
                               "remove_tags": remove_list,
                               "sync_maildir": sync_maildir})
                .error(function(error) {
                    console.log(error);
                });
        }

        return tagsFact;
    }
]);
