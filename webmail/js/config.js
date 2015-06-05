// REST api base url
SleepyApp.constant('api_url', 'http://localhost:3000');

// mark thread as read when viewing
SleepyApp.constant('auto_read',false);

// sync tags to maildir flags on retag
SleepyApp.constant('sync_maildir',true);

// special tags from http://notmuchmail.org/special-tags/
// will retrieve message count for these tags in "All Tags" page
SleepyApp.constant('special_tags',['draft',
                                   'flagged',
                                   'unread',
                                   'deleted',
                                   'unread',
                                   'inbox',
                                   'new',
                                   'deleted',
                                   'spam']);

// saved searches
SleepyApp.constant('folders',[{"name": "All threads",
                               "search": "*"},
                              {"name": "Inbox",
                               "search": "tag:inbox and not tag:killed"},
                              {"name": "Flagged",
                               "search": "tag:flagged and not tag:killed"},
                              {"name": "Drafts",
                               "search": "tag:draft and not tag:killed",
                               "show_count": true},
                              {"name": "Unread",
                               "search": "tag:unread and not tag:killed",
                               "show_count": true},
                              {"name": "Graveyard",
                               "search": "tag:killed"}                              
                             ]);

// retag shortcuts
SleepyApp.constant('retags',[{"name": "Read",
                              "remove": ["unread"]},
                             {"name": "Unread",
                              "add": ["unread"]},
                             {"name": "Archive",
                              "add": ["archive"],
                              "remove": ["inbox"]},
                             {"name": "Unarchive",
                              "add": ["inbox"],
                              "remove": ["archive"]},
                             {"name": "Kill",
                              "add": ["killed"]},
                             {"name": "Resurect",
                              "remove": ["killed"]},
                             {"name": "Flag",
                              "add": ["flagged"]},
                             {"name": "Unflag",
                              "remove": ["flagged"]}
                            ]);
