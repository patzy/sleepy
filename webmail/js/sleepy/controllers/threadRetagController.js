SleepyApp.controller('threadRetagController', [
    '$scope',
    '$state',
    'retags',
    'tagsFactory',
    function ($scope, $state, retags, tagsFactory) {
        $scope.doRetag = function(thread,retag) {
            tagsFactory.retag("thread:"+thread.id,retag.add,retag.remove)
                .success(function(data) {
                    $state.go($state.current, {}, {reload: true});
                });
        }

        $scope.retag_list = retags;
    } 
]);
