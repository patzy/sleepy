SleepyApp.controller('searchShortcutController', [
    '$scope',
    'special_searches',
    'tagsFactory',
    function ($scope, special_searches, tagsFactory) {
        $scope.search_list = special_searches;
    }
]);
