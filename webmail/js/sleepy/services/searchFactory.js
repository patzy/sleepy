SleepyApp.factory('searchFactory', [
    '$http',
    'api_url',
    function($http, api_url) {
        var searchFact = {};

        searchFact.currentSearch = null;
        
        searchFact.getThreads = function (searchStr) {
            searchFact.currentSearch = searchStr;
            return $http.get(api_url + '/search/threads/' + searchStr);
        };

        searchFact.getCount = function(searchStr) {
            return $http.get(api_url + 'count/' + searchStr);
        };

        return searchFact;
    }
]);
