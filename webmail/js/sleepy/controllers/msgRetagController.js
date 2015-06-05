SleepyApp.controller('msgRetagController', [
    '$scope',
    '$state',
    'retags',
    'tagsFactory',
    function ($scope, $state, retags, tagsFactory) {
        $scope.doRetag = function(msg,retag) {
            tagsFactory.retag("id:"+msg.id,retag.add,retag.remove)
                .success(function(data) {
                    $state.go($state.current, {}, {reload: true});
                });
        }
        $scope.retag_list = retags;
    } 
]);
