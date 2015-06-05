SleepyApp.filter('propsFilter', function() {
  return function(items, props) {
      var out = [];
      if (angular.isArray(items)) {
          items.forEach(function(item) {
              var itemMatches = false;
              
              var keys = Object.keys(props);
              for (var i = 0; i < keys.length; i++) {
                  var prop = keys[i];
                  var text = props[prop].toLowerCase();
                  if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                      itemMatches = true;
                      break;
                  }
              }
              
              if (itemMatches) {
                  out.push(item);
              }
          });
      } else {
          // Let the output be the input untouched
          out = items;
      }
      
      return out;
  };
});

SleepyApp.controller('composeController', [
    '$scope',
    '$stateParams',
    'messageFactory',
    function ($scope, $stateParams, messageFactory) {
        console.log("StateParams:",$stateParams);
        $scope.ref_msg = $stateParams.msg;
        $scope.reply_all = $stateParams.reply_all;
        $scope.send = function() {
            var sender = $scope.sender.selected;
            sender = sender.name + " <"+sender.address+">";
            var recipients = $scope.recipients.selected.map(function(item) {
                return item.name+" <"+item.address+">";
            });
            var copies = $scope.copies.selected.map(function(item) {
                return item.name+" <"+item.address+">";
            });
            var blind_copies = $scope.blind_copies.selected.map(function(item) {
                return item.name+" <"+item.address+">";
            });
            messageFactory.send(sender,
                                recipients,
                                copies,
                                blind_copies,
                                $scope.subject,$scope.body)
                .success(function(resp) {
                });
        }
        messageFactory.getAccounts()
            .success(function(data) {
                console.log(data);
                $scope.accounts = data.accounts;
                $scope.from_addresses = [];
                for (var i = 0;i<$scope.accounts.length;i++) {
                    var acc = $scope.accounts[i];
                    console.log(acc);
                    $scope.from_addresses.push({"name": acc.name || "",
                                                "address": acc.address || ""});
                }
                console.log($scope.from_addresses);
            })
            .error(function(error) {
                console.log("getAccounts:",error);
            });
        $scope.parseContact = function(contact_str) {
            console.log("Parsing contact",contact_str);
            email_data = emailAddresses.parseOneAddress(contact_str);
            if (email_data) {
                return {"name": email_data.name || "",
                        "address": email_data.address || ""}
            }
            else {
                return null;
            }
        };
        $scope.contacts = [];
        $scope.sender = {};
        $scope.sender.selected = null;
        $scope.recipients = {};
        $scope.recipients.selected = [];
        $scope.copies = {};
        $scope.copies.selected = [];
        $scope.blind_copies = {};
        $scope.blind_copies.selected = [];
        $scope.headers = {}; // additional headers
        $scope.subject = "";
        $scope.body = "";
        if ($scope.ref_msg) {
            var addr = emailAddresses.parseOneAddress($scope.ref_msg.headers['Reply-To']);
            $scope.recipients.selected.push({"name": addr.name,
                                             "address": addr.address});
            $scope.headers['In-Reply-To'] = $scope.ref_msg.headers['Message-ID'];
            $scope.headers['References'] = $scope.ref_msg.headers['Message-ID'];
        }
        console.log("Recipients:",$scope.recipients.selected);
        messageFactory.getContacts()
            .success(function(data) {
                console.log(data);
                $scope.contacts = []
                console.log(data.contacts);
                angular.forEach(data.contacts,function(name_list,address) {
                    console.log(address);
                    console.log(name_list);
                    if (name_list.length != 0) {
                        for (var i = 0; i < name_list.length; i++) {
                            $scope.contacts.push({"name": name_list[i],
                                                  "address": address});
                        }
                    }
                    else {
                        $scope.contacts.push({"name": "",
                                              "address": address});
                    }
                });
                console.log($scope.contacts);
            })
            .error(function(error) {
                console.log("getContacts:",error);
            });
    }
]);
