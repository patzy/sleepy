SleepyApp.controller('searchInputController', [
    '$scope',
    'searchFactory',
    function ($scope, searchFactory) {
        $scope.searchFact = searchFactory;
    }
]);
