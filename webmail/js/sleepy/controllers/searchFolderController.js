SleepyApp.controller('searchFolderController', [
    '$scope',
    'folders',
    'searchFactory',
    function ($scope, folders, searchFactory) {
        $scope.folder_list = folders;
        angular.forEach(folders,function(folder) {
            console.log("Folder",folder);
            if (folder.show_count == true) {
                searchFactory.getCount(folder.search)
                    .success(function(stats) {
                        folder.thread_count = stats.thread_count;
                        folder.message_count = stats.message_count;
                    });
            }
        });
    }
]);
