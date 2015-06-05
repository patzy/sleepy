SleepyApp.directive('msgelem',
                    ['$compile','$state','threadFactory','messageFactory',
                     function($compile,$state,threadFactory,messageFactory) {
    return {
	restrict: 'E',
	replace: true,
	scope: {
	    msg: '='
	},
	templateUrl: 'templates/message.html',
	link: function(scope,element,attrs) {
            console.log("LINK for",scope.msg);
	    scope.msg.collapsed = true;
	    scope.msg.parsed_from = emailAddresses.parseOneAddress(scope.msg.from);
	    scope.toggleMessage = function() {
		console.log("Toggling mesage",scope.msg);
		if (scope.msg.collapsed) {
		    scope.retrieveMessage();
                    scope.msg.collapsed = false;
		}
                else {
		    scope.msg.collapsed = true;
                }
	    };
	    scope.retrieveMessage = function() {
		if (!scope.msg.collectedContent) {
		    console.log("Showing unloaded message ",scope.msg);
		    messageFactory.getMessage(scope.msg.id)
			.success(function(data) {
			    console.log("Retrieved msg content ",data);
			    scope.msg.collectedContent = messageFactory.collectMsgContent(data);
			    scope.msg.collectedAtts = messageFactory.collectMsgAttachment(data);
			    scope.msg.headers = data.headers;
			    console.log("MSG FROM:",scope.msg.from);
			    console.log("Parsed from:",scope.msg.parsed_from);
			    console.log("Attachements: ",scope.msg.collectedAtts);
			    console.log(scope.msg);
			});
		}
	    };
	    scope.doReply = function() {
                $state.go('home.compose',{msg:scope.msg});
            }
	    if (scope.msg.replies.length != 0) {
		var elt = angular.element('<msgtree class="tree" messages=msg.replies></msgtree>');
                element.append(elt);
		$compile(elt)(scope);
	    }
	}
    };
}]);

SleepyApp.directive('msgtree', function($compile) {
    return {
	restrict: 'E',
	replace: true,
	scope: {
	    messages: '='
	},
	template:
	'<ul class="unstyled">'+
	    '<msgelem class="tree" ng-repeat="msg in messages" msg="msg">'+
	    '</msgelem></ul>'
    };
});

SleepyApp.controller('threadController', [
    '$scope',
    'threadContent',
    'auto_read',
    'tagsFactory',
    function ($scope, threadContent, auto_read, tagsFactory) {
        $scope.thread = threadContent.data;
        if (auto_read) {
            tagsFactory.retag("thread:"+$scope.thread.id,[],["unread"]);
        }
    }
]);
