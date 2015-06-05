
SleepyApp.config(function Config($httpProvider, jwtInterceptorProvider) {
    jwtInterceptorProvider.tokenGetter =
        ['jwtHelper','$http','api_url','config','$modal',function(jwtHelper,$http,api_url,config,
                                                                  $modal) {
            var idToken = localStorage.getItem('id_token');
            if (config.url.substr(config.url.length - 5) == '.html') {
                return null;
            }
            if (!idToken || idToken == "undefined" || jwtHelper.isTokenExpired(idToken)) {
                var loginModal = $modal.open({
                    templateUrl: 'templates/auth.html',
                    size: 'sm',
                    controller: function($scope){
                        $scope.login = function() {
                            loginModal.close({"username": $scope.username,
                                              "password": $scope.password});
                        }
                        $scope.cancel = function() {
                            loginModal.dismiss("cancelled");
                        }
                    }
                });
                return loginModal.result.then(function(result) {
                    return $http({
                        url: api_url+'/auth',
                        skipAuthorization: true,
                        method: 'POST',
                        data: result
                    }).then(function(response) {
                        var id_token = response.data.id_token;
                        localStorage.setItem('id_token', id_token);
                        return id_token;
                    },function(response,status) {
                        return null;
                    });
                },function(reason) {
                    return null;
                });
            }
            else {
                return idToken;
            }
        }]
    $httpProvider.interceptors.push('jwtInterceptor');
})


SleepyApp.config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.when('', '/home');
        $urlRouterProvider.otherwise('/home');
        $stateProvider
            .state('home', {
                url: '/home',
                views: {
                    'navbar@':{
                        templateUrl: 'templates/navbar.html'
                    },
                }
            })
            .state('home.tags', {
                url: '/tags',
                views: {
                    'content@': {
                        templateUrl: 'templates/tags.html',
                        controller: 'tagsController'
                    }
                }
            })
            .state('home.compose', {
                url: '/compose',
                params: {
                    'msg': null,
                    'reply_all': null
                },
                views: {
                    'content@': {
                        templateUrl: 'templates/compose.html',
                        controller: 'composeController'
                    }
                }
            })
            .state ('home.search', {
                url: '/search/:search_str',
                views: {
                    'content@' : {
                        templateUrl: 'templates/search.html',
                        controller:  'searchController',
                        resolve: {
                            searchResult: function(searchFactory, $stateParams) {
                                return searchFactory.getThreads($stateParams.search_str)
                                    .success(function(data){
                                        return data;
                                    })
                                    .error(function(data) {
                                        console.log("search failed",data);
                                    });
                            }
                        }
                    }
                }
            })
            .state ('home.thread', {
                url: '/thread/:thread_id',
                views: {
                    'content@': {
                        templateUrl: 'templates/thread.html',
                        controller: 'threadController',
                        resolve: {
                            threadContent: function(threadFactory, $stateParams) {
                                return threadFactory.getThread($stateParams.thread_id)
                                    .success(function(data) {
                                        return data;
                                    });
                            }
                        }
                    }
                }
            });
    }
]);
