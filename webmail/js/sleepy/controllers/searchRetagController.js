SleepyApp.controller('searchRetagController', [
    '$scope',
    '$state',
    'retags',
    'tagsFactory',
    function ($scope, $state, retags, tagsFactory) {
        $scope.doRetag = function(thread_list,retag) {
            var search_query = ""
            for (var i=0;i<thread_list.length;i++) {
                var thread = thread_list[i];
                if (thread.selected) {
                    if (search_query != "") {
                        search_query += " or ";
                    }
                    search_query += "thread:"+thread.id
                }
            }
            if (search_query != "") {
                tagsFactory.retag(search_query,retag.add,retag.remove)
                    .success(function(data) {
                        $state.go($state.current, {}, {reload: true});
                    });
            }
        }
        $scope.retag_list = retags;
    } 
]);
