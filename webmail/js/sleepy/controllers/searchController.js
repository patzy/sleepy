SleepyApp.controller('searchController', [
    '$scope',
    '$state',
    'searchResult',
    function ($scope, $state, searchResult) {
        $scope.nselected = 0;
        $scope.selectThread = function(thread) {
            if (thread.selected) {
                $scope.nselected += 1;
            }
            else {
                $scope.nselected -= 1;
            }
        }
        $scope.toggleSelection = function() {
            if ($scope.nselected == 0) {
                for (var i=0;i<$scope.threads.length;i++) {
                    $scope.threads[i].selected = true;
                }
                $scope.nselected = $scope.threads.length;
            }
            else {
                for (var i=0;i<$scope.threads.length;i++) {
                    $scope.threads[i].selected = false;
                }
                $scope.nselected = 0;
            }
        }
        $scope.count = searchResult.data.total;
        $scope.limit = searchResult.data.limit;
        $scope.offset = searchResult.data.offset;
        $scope.threads = searchResult.data.threads;
    }
]);
