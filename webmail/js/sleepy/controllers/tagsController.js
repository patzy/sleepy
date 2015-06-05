SleepyApp.controller('tagsController', [
    '$scope',
    'special_tags',
    'tagsFactory',
    function ($scope, special_tags, tagsFactory) {
        tagsFactory.getAll().then(
            function (tags) {
                $scope.tags_list = {};
                $scope.ntags = 0;
                angular.forEach(tags.data.tags, function(tag) {
                    $scope.ntags += 1;
                    if (special_tags.indexOf(tag) > -1) {
                        tagsFactory.getCount(tag).then(
                            function(stats) {
                                $scope.tags_list[tag] = {"msg_count": stats.data.message_count,
                                                         "thread_count": stats.data.thread_count};
                            },
                            function(error) {
                                console.log(error);
                            }
                        );
                    }
                    else {
                        $scope.tags_list[tag] = null;
                    }
                });
            },
            function (error) {
                console.log(error);
            }
        )
    }
]);
