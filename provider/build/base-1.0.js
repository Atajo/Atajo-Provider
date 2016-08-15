//You can use the below options if you are testing on a browser and want the UI for a specific platform
//atajoui.Platform.setPlatform("android");
//atajoui.Platform.setPlatform("ios");

var ampFilter = angular.module('ampFilter', []).filter('ampFilter', function() {
    return function(input) {
        var output = '';
        if (typeof input != 'undefined') {
            return input.replace(/&amp;/g, '&');
        } else {
            return input;
        }
    };
});


var getIcon = angular.module('getIcon', []).filter('getIcon', function() {
    return function(input) {
        var output = '';
        if (input.indexOf('.pptx') > -1) {
            output = 'file-powerpoint-o';
        } else if (input.indexOf('.docx') > -1) {
            output = 'file-word-o';
        } else if (input.indexOf('.doc') > -1) {
            output = 'file-word-o';
        } else if (input.indexOf('.pdf') > -1) {
            output = 'file-pdf-o';
        } else if (input.indexOf('.aspx') > -1) {
            output = 'file-word-o';
        } else if (input.indexOf('.xlsm') > -1) {
            output = 'file-excel-o';
        } else if (input.indexOf('.xls') > -1) {
            output = 'file-excel-o';
        } else {
            output = 'file-text-o';
        }

        return output;
    };
});


var toTrusted = angular.module('toTrusted', []).filter('to_trusted', ['$sce', function($sce) {
    return function(text) {
        return $sce.trustAsHtml(text);
    };
}]);



var module = angular.module('AtajoApp', [
    'atajoui',
    'ngStorage',
    'toTrusted',
    'picardy.fontawesome',
    'ampFilter',
    'getIcon'
]);

module.run(function($atajoUiPlatform) {
    $atajoUiPlatform.ready(function() {
        atajo.log.d("ATAJO-UI: platform " + atajoui.Platform.platform());

        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleLightContent();
            if (atajoui.Platform.isAndroid())
                StatusBar.backgroundColorByHexString("#455A64");
        }
    });
})

module.run(function($rootScope, $window) {
    $rootScope.$on("$locationChangeSuccess", function(event, next, current) {
        // $rootScope.transitionClass = "";
    });
    $rootScope.$on("$locationChangeStart", function(event, next, current) {

        // url slug : shortening the url to stuff that follows after "#"
        current = current.slice(current.lastIndexOf('#') + 1, current.length);
        next = next.slice(next.lastIndexOf('#') + 1, next.length);

        // apply transition class according to route
        /*
    switch( next ){
      // trigger "back" transition
      case $rootScope.lastPage:   $rootScope.transitionClass = $rootScope.backTransition; break;
      // trigger "regular" transitions
      case '/one':                $rootScope.transitionClass = "RL"; break;
      case '/two':                $rootScope.transitionClass = "RL"; break;
      case '/three':              $rootScope.transitionClass = "RL"; break;
    }
*/

        if (next == $rootScope.lastPage) {
            $rootScope.transitionClass = $rootScope.backTransition;
        } else {
            $rootScope.transitionClass = "RL";
        }

        // set "back" transition class according to currently set transitionClass
        switch ($rootScope.transitionClass) {
            case 'RL':
                $rootScope.backTransition = "LR";
                break;
            case 'LR':
                $rootScope.backTransition = "RL";
                break;
            default:
                console.log("couldn't set backTransition");
        }

        // save current page slug, so we can check next time whether "back" transition should be triggered
        $rootScope.lastPage = current;

        // log stuff
        console.log("locationChange from:" + current + " to:" + next + " transition:" + $rootScope.transitionClass + " backTransition:" + $rootScope.backTransition);
    })
});


module.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/login');

    $stateProvider
        .state('login', {
            url: '/login',
            controller: 'LoginCtrl',
            templateUrl: 'login.html'
        })
        .state('dash', {
            url: '/dash',
            cache: false,
            controller: 'DashboardCtrl',
            templateUrl: 'dashboard.html'
        })
        .state('mode', {
            url: '/mode',
            controller: 'ModeCtrl',
            templateUrl: 'mode.html'
        })
        .state('track', {
            url: '/track/:mode',
            controller: 'TrackCtrl',
            templateUrl: 'track.html'
        });
}]);;;
base = {

    init: function(cb) {
        atajo.log.d("BASE INIT");
        cb();
    }
};;

module.controller('AgendaCtrl', [
    '$log', '$q', 'AgendaDayService', 'AgendaItemService', '$rootScope', '$scope', '$state', '$localStorage',
    function($log, $q, AgendaDayService, AgendaItemService, $rootScope, $scope, $state, $localStorage) {
        var ctrl = this;
        $scope.isLoading = false;
        $scope.agendaDays = [];
        $scope.agendaItems = [];
        $scope.agenda = [];

        $scope.filter ={
            text: ""
        };

        $scope.clearFilterText = function(){
            console.log("clear text");
            console.log($scope.filter.text);
            console.log("clear text 2");
            $scope.filter.text = "";
            console.log($scope.filter.text);
        };

        $scope.hasFilterText = function() {
            return !!$scope.filter.text;
        };

        $scope.openAgendaItem = function(day, item) {
            $localStorage.tempNavigationAgendaItem = JSON.parse(JSON.stringify(item));
            $localStorage.tempNavigationAgendaDay = JSON.parse(JSON.stringify(day));
            $state.go('tab.agenda-item', { id: item._id });
        };

        $scope.openAgendaDay = function(day) {
            $localStorage.tempNavigationAgendaDay = JSON.parse(JSON.stringify(day));
            $state.go('tab.agenda-day', { id: day._id });
        };

        $scope.doRefresh = function(){
            $scope.$broadcast('scroll.refreshComplete'); //mock (normally you will call this after loading -but we will use our custom loader instead)
            ctrl.init();
        };

        ctrl.init = function() {
            $scope.isLoading = true;
            AgendaDayService.getAllInGroups().then(function(data) {
                $scope.agendaDays = data.data.map(function(elem) {
                    elem.momentObj = moment(elem.date);
                    elem.dayOfWeek = elem.momentObj.format('dddd');
                    elem.dayOfMonth = elem.momentObj.format('DD');
                    elem.month = elem.momentObj.format('MMMM');
                    elem.year = elem.momentObj.format('YYYY');
                    elem.dateObj = moment(elem.date).toDate();
                    return elem;
                });
                //$log.debug("days");
                //$log.debug($scope.agendaDays);
                AgendaItemService.getAllInGroups().then(function(idata) {
                    $scope.agendaItems = idata.data.map(function(elem) {
                        elem.momentObj = moment(elem.timeStart);
                        elem.timeStartText = moment(elem.timeStart).format('HH:mm');
                        elem.timeEndText = moment(elem.timeEnd).format('HH:mm');
                        elem.dateObj = moment(elem.timeStart).toDate();
                        return elem;
                    });

                    //$log.debug("items");
                    //$log.debug($scope.agendaItems);

                    $scope.agenda = $scope.agendaDays.map(function(elem) {
                        var dayRange = moment.range(moment(elem.date), moment(elem.date).add(1, 'day'));
                        elem.items = $scope.agendaItems.filter(function(ielem) {
                            //console.log(dayRange.toString() + " contains " + ielem.momentObj.toString() + " | " + dayRange.contains(ielem.momentObj))
                            return dayRange.contains(ielem.momentObj);
                        });
                        return elem;
                    });

                    //$log.debug("whole agenda");
                    //$log.debug($scope.agenda);

                    $scope.isLoading = false;
                }, function(err) {
                    $scope.isLoading = false;
                    $log.error(err.msg);
                });
            }, function(err) {
                $scope.isLoading = false;
                $log.error(err.msg);
            });
        };

        //---------------------------------------
        //---------------- INIT -----------------
        ctrl.init();
        //---------------------------------------
    }
]);

module.controller('AgendaDayCtrl', [
    '$log', '$q', 'AgendaDayService', 'AgendaItemService', '$rootScope', '$scope', '$state', '$localStorage',
    function($log, $q, AgendaDayService, AgendaItemService, $rootScope, $scope, $state, $localStorage) {
        var ctrl = this;

        $scope.day = $localStorage.tempNavigationAgendaDay;

        $scope.getTitle = function() {
            return moment($scope.day.date).format("DD MMM YYYY");
        };

        $scope.openAgendaItem = function(day, item) {
            $localStorage.tempNavigationAgendaItem = JSON.parse(JSON.stringify(item));
            $localStorage.tempNavigationAgendaDay = JSON.parse(JSON.stringify(day));
            $state.go('tab.agenda-item', { id: item._id });
        };

        $scope.shareExperience = function(day) {
            // this is the complete list of currently supported params you can pass to the plugin (all optional)
            // var options = {
            //     message: 'So excited to join @DimensionData on the road at #TDF2016! My #racetogreatness starts here. ', // not supported on some apps (Facebook, Instagram)
            //     subject: '@DimensionData Tour de France 2016', // fi. for email
            //     files: ['img/cycle_back.png'], // an array of filenames either locally or remotely
            //     url: 'http://bit.ly/28PHqVn',
            //     chooserTitle: 'Share with' // Android only, you can override the default share sheet title
            // }

            // var onSuccess = function(result) {
            //     console.log("Share completed? " + result.completed); // On Android apps mostly return false even while it's true
            //     console.log("Shared to app: " + result.app); // On Android result.app is currently empty. On iOS it's empty when sharing is cancelled (result.completed=false)
            // }

            // var onError = function(msg) {
            //     console.log("Sharing failed with message: " + msg);
            // }

            window.plugins.socialsharing.share(
                'So excited to join @DimensionData on the road at #TDF2016! My #racetogreatness starts here.',
                '@DimensionData Tour de France 2016',
                'http://za.ws.atajo.co.za:8080/images/defaultImage.jpg',
                'http://bit.ly/28PHqVn');
        };

        ctrl.init = function() {
            $scope.isLoading = true;
            $scope.isLoading = false
        };

        //---------------------------------------
        //---------------- INIT -----------------
        ctrl.init();
        //---------------------------------------
    }
]);

module.controller('AgendaItemCtrl', [
    '$log', '$q', 'AgendaDayService', 'AgendaItemService', '$rootScope', '$scope', '$state', '$localStorage',
    function($log, $q, AgendaDayService, AgendaItemService, $rootScope, $scope, $state, $localStorage) {
        var ctrl = this;

        $scope.item = $localStorage.tempNavigationAgendaItem;
        $scope.day = $localStorage.tempNavigationAgendaDay;

        $scope.shareExperience = function(day) {
            // this is the complete list of currently supported params you can pass to the plugin (all optional)
            // var options = {
            //     message: 'So excited to join @DimensionData on the road at #TDF2016! My #racetogreatness starts here. ', // not supported on some apps (Facebook, Instagram)
            //     subject: '@DimensionData Tour de France 2016', // fi. for email
            //     files: ['img/cycle_back.png'], // an array of filenames either locally or remotely
            //     url: 'http://bit.ly/28PHqVn', 
            //     chooserTitle: 'Share with' // Android only, you can override the default share sheet title
            // }

            // var onSuccess = function(result) {
            //     console.log("Share completed? " + result.completed); // On Android apps mostly return false even while it's true
            //     console.log("Shared to app: " + result.app); // On Android result.app is currently empty. On iOS it's empty when sharing is cancelled (result.completed=false)
            // }

            // var onError = function(msg) {
            //     console.log("Sharing failed with message: " + msg);
            // }
            //images/cycle_back.png
            // window.plugins.socialsharing.shareWithOptions(options, onSuccess, onError);
            window.plugins.socialsharing.share(
                'So excited to join @DimensionData on the road at #TDF2016! My #racetogreatness starts here.',
                '@DimensionData Tour de France 2016',
                'http://za.ws.atajo.co.za:8080/images/defaultImage.jpg',
                'http://bit.ly/28PHqVn');
        };

        ctrl.init = function() {
            $scope.isLoading = true;
            $scope.isLoading = false
        };

        //---------------------------------------
        //---------------- INIT -----------------
        ctrl.init();
        //---------------------------------------
    }
]);;;

module.factory('AgendaDayService', ['HandlerAPI', '$rootScope', function(HandlerAPI, $rootScope) {
    var handlerName = "agendaDay";
    return {
        get: function(id) {
            return HandlerAPI.promiseRequest(handlerName, 'get', { id: id });
        },

        getAllInGroups: function() {
            return HandlerAPI.promiseRequest(handlerName, 'getAllInGroups', { groups: $rootScope.getGroupIds(), roles: [$rootScope.getRole()] });
        }
    }
}]);

module.factory('AgendaItemService', ['HandlerAPI', '$rootScope', function(HandlerAPI, $rootScope) {
    var handlerName = "agendaItem";
    return {
        get: function(id) {
            return HandlerAPI.promiseRequest(handlerName, 'get', { id: id });
        },

        getAllInGroups: function() {
            return HandlerAPI.promiseRequest(handlerName, 'getAllInGroups', { groups: $rootScope.getGroupIds(), roles: [$rootScope.getRole()] });
        }
    }
}]);;;

module.directive('svgIcon', function() {
    // Runs during compile
    return {
        restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
        templateUrl: function(elem, attr) {
            if (!attr.svgicon)
                attr.svgicon = "dd-cycle"; //fallback

            return 'img/svg/' + attr.svgicon + '.svg';
        },
        compile: function($element, $attrs) {
            $element.addClass('svgicon');
        },
        link: function($scope, $element, $attrs, controller) {}

    };
});;;
module.filter('openLinksWithBrowser', function ($sce, $sanitize) {
    return function (text) {
        var regex = /href="([\S]+)"/g;
        var newString = $sanitize(text).replace(regex, "onClick=\"window.open('$1', '_system')\"");
        return $sce.trustAsHtml(newString);
    }
});;;
module.run(['$rootScope', '$localStorage', '$log',
    function($rootScope, $localStorage, $log) {

        //on login
        $rootScope.saveProfile = function(profile) {
            $localStorage.profile = profile;
            $localStorage.isLoggedIn = true;
        };

        $rootScope.isLoggedIn = function() {
            return $localStorage.isLoggedIn && $localStorage.profile && $localStorage.profile.userGroup; //extra redundant checks to help with update
        };

        //on logout
        $rootScope.clearProfile = function() {
            delete $localStorage.profile;
            $localStorage.isLoggedIn = false;
        };

        $rootScope.getUserFullName = function() {
            if ($localStorage.profile) {
                return $localStorage.profile.firstName + " " + ($localStorage.profile.lastName ? $localStorage.profile.lastName : '');
            } else {
                return "";
            }
        };

        $rootScope.getProfile = function() {
            return $localStorage.profile;
        };

        $rootScope.getProfileId = function() {
            if ($localStorage.profile) {
                return $localStorage.profile._id;
            } else {
                return "";
            }
        };

        $rootScope.getRole = function() {
            if ($localStorage.profile) {
                return $localStorage.profile.role;
            } else {
                return "";
            }
        };

        $rootScope.getGroupIds = function() {
            if ($localStorage.profile) {
                return $localStorage.profile.groups.map(function(elem){ return elem._id;});
            } else {
                return "";
            }
        };

        $rootScope.getGroupName = function() {
            if ($localStorage.profile) {
                return $localStorage.profile.group.name;
            } else {
                return "";
            }
        };

        $rootScope.getUsername = function() {
            if ($localStorage.profile) {
                return $localStorage.profile.email;
            } else {
                return "";
            }
        };


        $rootScope.getRole = function() {
            if ($localStorage.profile) {
                return $localStorage.profile.role;
            } else {
                return "guest";
            }
        };

        
        //all methods to call immediately as a person is logged in
        $rootScope.$on('CLAIMS_SUCCESSFUL_LOGIN', function() {
            $log.debug("Initialise on login...");
            
        });
        //if logged in call on init/refresg
        if ($rootScope.isLoggedIn()) {
           
        }
        

        $rootScope.getFullname = function(user, defaultValue) {
            if (!user)
                return defaultValue;
            else
                return user.firstName + " " + user.lastName;
        };

    }
]);;;
module.controller('DashboardCtrl', [
    '$log', '$scope', '$state', '$atajoUiPopup',
    function($log, $scope, $state, $atajoUiPopup) {
        var ctrl = this;
        $scope.trips = {};
        $scope.loading = true;
        $scope.version = {
            app: _bootConfig.APPVERSION,
            release: _bootConfig.RELEASE,
            code: (window.localStorage.getItem('LAST_BASE_HASH')).slice(0, 8)
        };

        function getData() {

            atajo.database.getAll(atajo.values.db.trips, function(trips) {
                atajo.log.d("TRIPS ARE " + JSON.stringify(trips));

                $scope.trips.total = trips.length;
                var distance = 0;
                $scope.trips.distance = formatDistance(distance);
                var time = 0;
                $scope.trips.time = 0;
                $scope.trips.ribyts = 0;

                for (var t in trips) {
                    distance += trips[t].distance || 0;
                    time += ((trips[t].endAt && trips[t].endAt != '') ? (trips[t].endAt - trips[t].startAt) : (new Date().getTime() - trips[t].startAt)) || 0;
                }

                $scope.trips.ribyts = formatRibyts(distance);
                $scope.trips.distance = formatDistance(distance);
                $scope.trips.time = formatTime(time);

                $scope.loading = false;
                $scope.$apply();
            });

        }

        function formatTime(ms) {

            $log.debug("######## HOME:: Raw time in ms :: " + ms);

            var duration = moment.duration(ms, 'milliseconds');
            var h = duration.hours();
            var m = duration.minutes();
            var s = duration.seconds();

            h = ((h + "").length == 1) ? '0' + h : h;
            m = ((m + "").length == 1) ? '0' + m : m;
            s = ((s + "").length == 1) ? '0' + s : s;

            return h + ':' + m + ':' + s;


        }

        function formatDistance(kilometers) {
            return kilometers.toFixed(2);
        }

        function formatRibyts(kilometers) {

            return Math.round(kilometers);
        }

        $scope.beginTrip = function() {

            //Check location status
            atajo.diagnostics.isLocationEnabled(function(enabled) {
                $log.debug("Location setting is " + (enabled ? "enabled" : "disabled"));
                if (enabled) {
                    var trip = atajo.geo.trip.status(function(trip) {
                        if (!trip.error) {
                            $log.debug("######## HOME:: GOING TO TRACKING SCREEN, TRIP ERROR:: " + trip.error);
                            $state.go('track', {
                                mode: 'none'
                            });
                        } else {
                            $log.debug("######## HOME:: GOING TO MODE SCREEN, TRIP ERROR:: " + trip.error);
                            $state.go('mode');
                        }
                    });
                } else {
                    showAlert('Location Disabled', 'Please turn your location service on in settings.');
                }
            }, function(error) {
                showAlert('Location Error', 'There was an error while checking the status of your location settings.');
                $log.debug("Location Error::: The following error occurred: " + error);
            });
        }

        function showAlert(title, message) {
            $atajoUiPopup.alert({
                title: title,
                template: message,
                okType: 'button-royal'
            });
        }

        $scope.$on("$atajoUiView.enter", function(event, data) {
            getData();
        });
    }
]);;;
!function(e,o){"use strict";function n(e,n,t){function i(e,t,i){var u,c;i=i||{},c=i.expires,u=o.isDefined(i.path)?i.path:r,o.isUndefined(t)&&(c="Thu, 01 Jan 1970 00:00:00 GMT",t=""),o.isString(c)&&(c=new Date(c));var s=encodeURIComponent(e)+"="+encodeURIComponent(t);s+=u?";path="+u:"",s+=i.domain?";domain="+i.domain:"",s+=c?";expires="+c.toUTCString():"",s+=i.secure?";secure":"";var f=s.length+1;return f>4096&&n.warn("Cookie '"+e+"' possibly not set or overflowed because it was too large ("+f+" > 4096 bytes)!"),s}var r=t.baseHref(),u=e[0];return function(e,o,n){u.cookie=i(e,o,n)}}o.module("ngCookies",["ng"]).provider("$cookies",[function(){function e(e){return e?o.extend({},n,e):n}var n=this.defaults={};this.$get=["$$cookieReader","$$cookieWriter",function(n,t){return{get:function(e){return n()[e]},getObject:function(e){var n=this.get(e);return n?o.fromJson(n):n},getAll:function(){return n()},put:function(o,n,i){t(o,n,e(i))},putObject:function(e,n,t){this.put(e,o.toJson(n),t)},remove:function(o,n){t(o,void 0,e(n))}}}]}]),o.module("ngCookies").factory("$cookieStore",["$cookies",function(e){return{get:function(o){return e.getObject(o)},put:function(o,n){e.putObject(o,n)},remove:function(o){e.remove(o)}}}]),n.$inject=["$document","$log","$browser"],o.module("ngCookies").provider("$$cookieWriter",function(){this.$get=n})}(window,window.angular);;;
!function(r,s){"use strict";function a(){function r(r,s,a,e){var o=e[1],t=e[0],n=o[a.matchPassword];t.$validators?t.$validators.passwordMatch=function(r){return r===n.$modelValue}:t.$parsers.push(function(r){return t.$setValidity("passwordMatch",r===n.$viewValue),r}),n.$parsers.push(function(r){return t.$setValidity("passwordMatch",r===t.$viewValue),r})}var s=["^ngModel","^form"];return{restrict:"A",require:s,link:r}}r.module("ngPassword",[]).directive("matchPassword",a),r.module("angular.password",["ngPassword"]),r.module("angular-password",["ngPassword"]),"object"==typeof module&&"function"!=typeof define&&(module.exports=r.module("ngPassword"))}(angular);;;
!function(e,t){"use strict";function n(){var e=!1;this.$get=["$$sanitizeUri",function(n){return e&&t.extend(w,y),function(e){var t=[];return a(e,l(t,function(e,t){return!/^unsafe:/.test(n(e,t))})),t.join("")}}],this.enableSvg=function(n){return t.isDefined(n)?(e=n,this):e}}function r(e){var n=[],r=l(n,t.noop);return r.chars(e),n.join("")}function i(e,n){var r,i={},a=e.split(",");for(r=0;r<a.length;r++)i[n?t.lowercase(a[r]):a[r]]=!0;return i}function a(t,n){null===t||void 0===t?t="":"string"!=typeof t&&(t=""+t),d.innerHTML=t;var r=5;do{if(0===r)throw u("uinput","Failed to sanitize html because the input is unstable");r--,e.document.documentMode&&c(d),t=d.innerHTML,d.innerHTML=t}while(t!==d.innerHTML);for(var i=d.firstChild;i;){switch(i.nodeType){case 1:n.start(i.nodeName.toLowerCase(),o(i.attributes));break;case 3:n.chars(i.textContent)}var a;if(!(a=i.firstChild)&&(1==i.nodeType&&n.end(i.nodeName.toLowerCase()),a=i.nextSibling,!a))for(;null==a&&(i=i.parentNode,i!==d);)a=i.nextSibling,1==i.nodeType&&n.end(i.nodeName.toLowerCase());i=a}for(;i=d.firstChild;)d.removeChild(i)}function o(e){for(var t={},n=0,r=e.length;r>n;n++){var i=e[n];t[i.name]=i.value}return t}function s(e){return e.replace(/&/g,"&amp;").replace(h,function(e){var t=e.charCodeAt(0),n=e.charCodeAt(1);return"&#"+(1024*(t-55296)+(n-56320)+65536)+";"}).replace(p,function(e){return"&#"+e.charCodeAt(0)+";"}).replace(/</g,"&lt;").replace(/>/g,"&gt;")}function l(e,n){var r=!1,i=t.bind(e,e.push);return{start:function(e,a){e=t.lowercase(e),!r&&k[e]&&(r=e),r||w[e]!==!0||(i("<"),i(e),t.forEach(a,function(r,a){var o=t.lowercase(a),l="img"===e&&"src"===o||"background"===o;L[o]!==!0||C[o]===!0&&!n(r,l)||(i(" "),i(a),i('="'),i(s(r)),i('"'))}),i(">"))},end:function(e){e=t.lowercase(e),r||w[e]!==!0||f[e]===!0||(i("</"),i(e),i(">")),e==r&&(r=!1)},chars:function(e){r||i(s(e))}}}function c(t){if(t.nodeType===e.Node.ELEMENT_NODE)for(var n=t.attributes,r=0,i=n.length;i>r;r++){var a=n[r],o=a.name.toLowerCase();"xmlns:ns1"!==o&&0!==o.lastIndexOf("ns1:",0)||(t.removeAttributeNode(a),r--,i--)}var s=t.firstChild;s&&c(s),s=t.nextSibling,s&&c(s)}var d,u=t.$$minErr("$sanitize"),h=/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,p=/([^\#-~ |!])/g,f=i("area,br,col,hr,img,wbr"),m=i("colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr"),g=i("rp,rt"),b=t.extend({},g,m),v=t.extend({},m,i("address,article,aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,section,table,ul")),x=t.extend({},g,i("a,abbr,acronym,b,bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s,samp,small,span,strike,strong,sub,sup,time,tt,u,var")),y=i("circle,defs,desc,ellipse,font-face,font-face-name,font-face-src,g,glyph,hkern,image,linearGradient,line,marker,metadata,missing-glyph,mpath,path,polygon,polyline,radialGradient,rect,stop,svg,switch,text,title,tspan"),k=i("script,style"),w=t.extend({},f,v,x,b),C=i("background,cite,href,longdesc,src,xlink:href"),E=i("abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,scope,scrolling,shape,size,span,start,summary,tabindex,target,title,type,valign,value,vspace,width"),z=i("accent-height,accumulate,additive,alphabetic,arabic-form,ascent,baseProfile,bbox,begin,by,calcMode,cap-height,class,color,color-rendering,content,cx,cy,d,dx,dy,descent,display,dur,end,fill,fill-rule,font-family,font-size,font-stretch,font-style,font-variant,font-weight,from,fx,fy,g1,g2,glyph-name,gradientUnits,hanging,height,horiz-adv-x,horiz-origin-x,ideographic,k,keyPoints,keySplines,keyTimes,lang,marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mathematical,max,min,offset,opacity,orient,origin,overline-position,overline-thickness,panose-1,path,pathLength,points,preserveAspectRatio,r,refX,refY,repeatCount,repeatDur,requiredExtensions,requiredFeatures,restart,rotate,rx,ry,slope,stemh,stemv,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,stroke,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,stroke-width,systemLanguage,target,text-anchor,to,transform,type,u1,u2,underline-position,underline-thickness,unicode,unicode-range,units-per-em,values,version,viewBox,visibility,width,widths,x,x-height,x1,x2,xlink:actuate,xlink:arcrole,xlink:role,xlink:show,xlink:title,xlink:type,xml:base,xml:lang,xml:space,xmlns,xmlns:xlink,y,y1,y2,zoomAndPan",!0),L=t.extend({},C,z,E);!function(e){var t;if(!e.document||!e.document.implementation)throw u("noinert","Can't create an inert html document");t=e.document.implementation.createHTMLDocument("inert");var n=t.documentElement||t.getDocumentElement(),r=n.getElementsByTagName("body");if(1===r.length)d=r[0];else{var i=t.createElement("html");d=t.createElement("body"),i.appendChild(d),t.appendChild(i)}}(e),t.module("ngSanitize",[]).provider("$sanitize",n),t.module("ngSanitize").filter("linky",["$sanitize",function(e){var n=/((ftp|https?):\/\/|(www\.)|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>"\u201d\u2019]/i,i=/^mailto:/i,a=t.$$minErr("linky"),o=t.isString;return function(s,l,c){function d(e){e&&g.push(r(e))}function u(e,n){var r;if(g.push("<a "),t.isFunction(c)&&(c=c(e)),t.isObject(c))for(r in c)g.push(r+'="'+c[r]+'" ');else c={};!t.isDefined(l)||"target"in c||g.push('target="',l,'" '),g.push('href="',e.replace(/"/g,"&quot;"),'">'),d(n),g.push("</a>")}if(null==s||""===s)return s;if(!o(s))throw a("notstring","Expected string but received: {0}",s);for(var h,p,f,m=s,g=[];h=m.match(n);)p=h[0],h[2]||h[4]||(p=(h[3]?"http://":"mailto:")+p),f=h.index,d(m.substr(0,f)),u(p,h[0].replace(i,"")),m=m.substring(f+h[0].length);return d(m),e(g.join(""))}}])}(window,window.angular);;;
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):e.moment=t()}(this,function(){"use strict";function e(){return as.apply(null,arguments)}function t(e){as=e}function n(e){return e instanceof Array||"[object Array]"===Object.prototype.toString.call(e)}function s(e){return e instanceof Date||"[object Date]"===Object.prototype.toString.call(e)}function i(e,t){var n,s=[];for(n=0;n<e.length;++n)s.push(t(e[n],n));return s}function r(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function a(e,t){for(var n in t)r(t,n)&&(e[n]=t[n]);return r(t,"toString")&&(e.toString=t.toString),r(t,"valueOf")&&(e.valueOf=t.valueOf),e}function o(e,t,n,s){return He(e,t,n,s,!0).utc()}function u(){return{empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1,parsedDateParts:[],meridiem:null}}function l(e){return null==e._pf&&(e._pf=u()),e._pf}function d(e){if(null==e._isValid){var t=l(e),n=os.call(t.parsedDateParts,function(e){return null!=e});e._isValid=!isNaN(e._d.getTime())&&t.overflow<0&&!t.empty&&!t.invalidMonth&&!t.invalidWeekday&&!t.nullInput&&!t.invalidFormat&&!t.userInvalidated&&(!t.meridiem||t.meridiem&&n),e._strict&&(e._isValid=e._isValid&&0===t.charsLeftOver&&0===t.unusedTokens.length&&void 0===t.bigHour)}return e._isValid}function h(e){var t=o(NaN);return null!=e?a(l(t),e):l(t).userInvalidated=!0,t}function c(e){return void 0===e}function f(e,t){var n,s,i;if(c(t._isAMomentObject)||(e._isAMomentObject=t._isAMomentObject),c(t._i)||(e._i=t._i),c(t._f)||(e._f=t._f),c(t._l)||(e._l=t._l),c(t._strict)||(e._strict=t._strict),c(t._tzm)||(e._tzm=t._tzm),c(t._isUTC)||(e._isUTC=t._isUTC),c(t._offset)||(e._offset=t._offset),c(t._pf)||(e._pf=l(t)),c(t._locale)||(e._locale=t._locale),us.length>0)for(n in us)s=us[n],i=t[s],c(i)||(e[s]=i);return e}function m(t){f(this,t),this._d=new Date(null!=t._d?t._d.getTime():NaN),ls===!1&&(ls=!0,e.updateOffset(this),ls=!1)}function _(e){return e instanceof m||null!=e&&null!=e._isAMomentObject}function y(e){return 0>e?Math.ceil(e):Math.floor(e)}function g(e){var t=+e,n=0;return 0!==t&&isFinite(t)&&(n=y(t)),n}function p(e,t,n){var s,i=Math.min(e.length,t.length),r=Math.abs(e.length-t.length),a=0;for(s=0;i>s;s++)(n&&e[s]!==t[s]||!n&&g(e[s])!==g(t[s]))&&a++;return a+r}function w(t){e.suppressDeprecationWarnings===!1&&"undefined"!=typeof console&&console.warn&&console.warn("Deprecation warning: "+t)}function v(t,n){var s=!0;return a(function(){return null!=e.deprecationHandler&&e.deprecationHandler(null,t),s&&(w(t+"\nArguments: "+Array.prototype.slice.call(arguments).join(", ")+"\n"+(new Error).stack),s=!1),n.apply(this,arguments)},n)}function M(t,n){null!=e.deprecationHandler&&e.deprecationHandler(t,n),ds[t]||(w(n),ds[t]=!0)}function S(e){return e instanceof Function||"[object Function]"===Object.prototype.toString.call(e)}function D(e){return"[object Object]"===Object.prototype.toString.call(e)}function k(e){var t,n;for(n in e)t=e[n],S(t)?this[n]=t:this["_"+n]=t;this._config=e,this._ordinalParseLenient=new RegExp(this._ordinalParse.source+"|"+/\d{1,2}/.source)}function Y(e,t){var n,s=a({},e);for(n in t)r(t,n)&&(D(e[n])&&D(t[n])?(s[n]={},a(s[n],e[n]),a(s[n],t[n])):null!=t[n]?s[n]=t[n]:delete s[n]);return s}function O(e){null!=e&&this.set(e)}function x(e){return e?e.toLowerCase().replace("_","-"):e}function b(e){for(var t,n,s,i,r=0;r<e.length;){for(i=x(e[r]).split("-"),t=i.length,n=x(e[r+1]),n=n?n.split("-"):null;t>0;){if(s=T(i.slice(0,t).join("-")))return s;if(n&&n.length>=t&&p(i,n,!0)>=t-1)break;t--}r++}return null}function T(e){var t=null;if(!ms[e]&&"undefined"!=typeof module&&module&&module.exports)try{t=cs._abbr,require("./locale/"+e),P(t)}catch(n){}return ms[e]}function P(e,t){var n;return e&&(n=c(t)?U(e):W(e,t),n&&(cs=n)),cs._abbr}function W(e,t){return null!==t?(t.abbr=e,null!=ms[e]?(M("defineLocaleOverride","use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale"),t=Y(ms[e]._config,t)):null!=t.parentLocale&&(null!=ms[t.parentLocale]?t=Y(ms[t.parentLocale]._config,t):M("parentLocaleUndefined","specified parentLocale is not defined yet")),ms[e]=new O(t),P(e),ms[e]):(delete ms[e],null)}function R(e,t){if(null!=t){var n;null!=ms[e]&&(t=Y(ms[e]._config,t)),n=new O(t),n.parentLocale=ms[e],ms[e]=n,P(e)}else null!=ms[e]&&(null!=ms[e].parentLocale?ms[e]=ms[e].parentLocale:null!=ms[e]&&delete ms[e]);return ms[e]}function U(e){var t;if(e&&e._locale&&e._locale._abbr&&(e=e._locale._abbr),!e)return cs;if(!n(e)){if(t=T(e))return t;e=[e]}return b(e)}function C(){return hs(ms)}function H(e,t){var n=e.toLowerCase();_s[n]=_s[n+"s"]=_s[t]=e}function L(e){return"string"==typeof e?_s[e]||_s[e.toLowerCase()]:void 0}function G(e){var t,n,s={};for(n in e)r(e,n)&&(t=L(n),t&&(s[t]=e[n]));return s}function F(t,n){return function(s){return null!=s?(A(this,t,s),e.updateOffset(this,n),this):V(this,t)}}function V(e,t){return e.isValid()?e._d["get"+(e._isUTC?"UTC":"")+t]():NaN}function A(e,t,n){e.isValid()&&e._d["set"+(e._isUTC?"UTC":"")+t](n)}function E(e,t){var n;if("object"==typeof e)for(n in e)this.set(n,e[n]);else if(e=L(e),S(this[e]))return this[e](t);return this}function N(e,t,n){var s=""+Math.abs(e),i=t-s.length,r=e>=0;return(r?n?"+":"":"-")+Math.pow(10,Math.max(0,i)).toString().substr(1)+s}function I(e,t,n,s){var i=s;"string"==typeof s&&(i=function(){return this[s]()}),e&&(ws[e]=i),t&&(ws[t[0]]=function(){return N(i.apply(this,arguments),t[1],t[2])}),n&&(ws[n]=function(){return this.localeData().ordinal(i.apply(this,arguments),e)})}function j(e){return e.match(/\[[\s\S]/)?e.replace(/^\[|\]$/g,""):e.replace(/\\/g,"")}function Z(e){var t,n,s=e.match(ys);for(t=0,n=s.length;n>t;t++)ws[s[t]]?s[t]=ws[s[t]]:s[t]=j(s[t]);return function(t){var i,r="";for(i=0;n>i;i++)r+=s[i]instanceof Function?s[i].call(t,e):s[i];return r}}function z(e,t){return e.isValid()?(t=$(t,e.localeData()),ps[t]=ps[t]||Z(t),ps[t](e)):e.localeData().invalidDate()}function $(e,t){function n(e){return t.longDateFormat(e)||e}var s=5;for(gs.lastIndex=0;s>=0&&gs.test(e);)e=e.replace(gs,n),gs.lastIndex=0,s-=1;return e}function q(e,t,n){Gs[e]=S(t)?t:function(e,s){return e&&n?n:t}}function B(e,t){return r(Gs,e)?Gs[e](t._strict,t._locale):new RegExp(J(e))}function J(e){return Q(e.replace("\\","").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,function(e,t,n,s,i){return t||n||s||i}))}function Q(e){return e.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}function X(e,t){var n,s=t;for("string"==typeof e&&(e=[e]),"number"==typeof t&&(s=function(e,n){n[t]=g(e)}),n=0;n<e.length;n++)Fs[e[n]]=s}function K(e,t){X(e,function(e,n,s,i){s._w=s._w||{},t(e,s._w,s,i)})}function ee(e,t,n){null!=t&&r(Fs,e)&&Fs[e](t,n._a,n,e)}function te(e,t){return new Date(Date.UTC(e,t+1,0)).getUTCDate()}function ne(e,t){return n(this._months)?this._months[e.month()]:this._months[qs.test(t)?"format":"standalone"][e.month()]}function se(e,t){return n(this._monthsShort)?this._monthsShort[e.month()]:this._monthsShort[qs.test(t)?"format":"standalone"][e.month()]}function ie(e,t,n){var s,i,r,a=e.toLocaleLowerCase();if(!this._monthsParse)for(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[],s=0;12>s;++s)r=o([2e3,s]),this._shortMonthsParse[s]=this.monthsShort(r,"").toLocaleLowerCase(),this._longMonthsParse[s]=this.months(r,"").toLocaleLowerCase();return n?"MMM"===t?(i=fs.call(this._shortMonthsParse,a),-1!==i?i:null):(i=fs.call(this._longMonthsParse,a),-1!==i?i:null):"MMM"===t?(i=fs.call(this._shortMonthsParse,a),-1!==i?i:(i=fs.call(this._longMonthsParse,a),-1!==i?i:null)):(i=fs.call(this._longMonthsParse,a),-1!==i?i:(i=fs.call(this._shortMonthsParse,a),-1!==i?i:null))}function re(e,t,n){var s,i,r;if(this._monthsParseExact)return ie.call(this,e,t,n);for(this._monthsParse||(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[]),s=0;12>s;s++){if(i=o([2e3,s]),n&&!this._longMonthsParse[s]&&(this._longMonthsParse[s]=new RegExp("^"+this.months(i,"").replace(".","")+"$","i"),this._shortMonthsParse[s]=new RegExp("^"+this.monthsShort(i,"").replace(".","")+"$","i")),n||this._monthsParse[s]||(r="^"+this.months(i,"")+"|^"+this.monthsShort(i,""),this._monthsParse[s]=new RegExp(r.replace(".",""),"i")),n&&"MMMM"===t&&this._longMonthsParse[s].test(e))return s;if(n&&"MMM"===t&&this._shortMonthsParse[s].test(e))return s;if(!n&&this._monthsParse[s].test(e))return s}}function ae(e,t){var n;if(!e.isValid())return e;if("string"==typeof t)if(/^\d+$/.test(t))t=g(t);else if(t=e.localeData().monthsParse(t),"number"!=typeof t)return e;return n=Math.min(e.date(),te(e.year(),t)),e._d["set"+(e._isUTC?"UTC":"")+"Month"](t,n),e}function oe(t){return null!=t?(ae(this,t),e.updateOffset(this,!0),this):V(this,"Month")}function ue(){return te(this.year(),this.month())}function le(e){return this._monthsParseExact?(r(this,"_monthsRegex")||he.call(this),e?this._monthsShortStrictRegex:this._monthsShortRegex):this._monthsShortStrictRegex&&e?this._monthsShortStrictRegex:this._monthsShortRegex}function de(e){return this._monthsParseExact?(r(this,"_monthsRegex")||he.call(this),e?this._monthsStrictRegex:this._monthsRegex):this._monthsStrictRegex&&e?this._monthsStrictRegex:this._monthsRegex}function he(){function e(e,t){return t.length-e.length}var t,n,s=[],i=[],r=[];for(t=0;12>t;t++)n=o([2e3,t]),s.push(this.monthsShort(n,"")),i.push(this.months(n,"")),r.push(this.months(n,"")),r.push(this.monthsShort(n,""));for(s.sort(e),i.sort(e),r.sort(e),t=0;12>t;t++)s[t]=Q(s[t]),i[t]=Q(i[t]),r[t]=Q(r[t]);this._monthsRegex=new RegExp("^("+r.join("|")+")","i"),this._monthsShortRegex=this._monthsRegex,this._monthsStrictRegex=new RegExp("^("+i.join("|")+")","i"),this._monthsShortStrictRegex=new RegExp("^("+s.join("|")+")","i")}function ce(e){var t,n=e._a;return n&&-2===l(e).overflow&&(t=n[As]<0||n[As]>11?As:n[Es]<1||n[Es]>te(n[Vs],n[As])?Es:n[Ns]<0||n[Ns]>24||24===n[Ns]&&(0!==n[Is]||0!==n[js]||0!==n[Zs])?Ns:n[Is]<0||n[Is]>59?Is:n[js]<0||n[js]>59?js:n[Zs]<0||n[Zs]>999?Zs:-1,l(e)._overflowDayOfYear&&(Vs>t||t>Es)&&(t=Es),l(e)._overflowWeeks&&-1===t&&(t=zs),l(e)._overflowWeekday&&-1===t&&(t=$s),l(e).overflow=t),e}function fe(e){var t,n,s,i,r,a,o=e._i,u=Ks.exec(o)||ei.exec(o);if(u){for(l(e).iso=!0,t=0,n=ni.length;n>t;t++)if(ni[t][1].exec(u[1])){i=ni[t][0],s=ni[t][2]!==!1;break}if(null==i)return void(e._isValid=!1);if(u[3]){for(t=0,n=si.length;n>t;t++)if(si[t][1].exec(u[3])){r=(u[2]||" ")+si[t][0];break}if(null==r)return void(e._isValid=!1)}if(!s&&null!=r)return void(e._isValid=!1);if(u[4]){if(!ti.exec(u[4]))return void(e._isValid=!1);a="Z"}e._f=i+(r||"")+(a||""),be(e)}else e._isValid=!1}function me(t){var n=ii.exec(t._i);return null!==n?void(t._d=new Date(+n[1])):(fe(t),void(t._isValid===!1&&(delete t._isValid,e.createFromInputFallback(t))))}function _e(e,t,n,s,i,r,a){var o=new Date(e,t,n,s,i,r,a);return 100>e&&e>=0&&isFinite(o.getFullYear())&&o.setFullYear(e),o}function ye(e){var t=new Date(Date.UTC.apply(null,arguments));return 100>e&&e>=0&&isFinite(t.getUTCFullYear())&&t.setUTCFullYear(e),t}function ge(e){return pe(e)?366:365}function pe(e){return e%4===0&&e%100!==0||e%400===0}function we(){return pe(this.year())}function ve(e,t,n){var s=7+t-n,i=(7+ye(e,0,s).getUTCDay()-t)%7;return-i+s-1}function Me(e,t,n,s,i){var r,a,o=(7+n-s)%7,u=ve(e,s,i),l=1+7*(t-1)+o+u;return 0>=l?(r=e-1,a=ge(r)+l):l>ge(e)?(r=e+1,a=l-ge(e)):(r=e,a=l),{year:r,dayOfYear:a}}function Se(e,t,n){var s,i,r=ve(e.year(),t,n),a=Math.floor((e.dayOfYear()-r-1)/7)+1;return 1>a?(i=e.year()-1,s=a+De(i,t,n)):a>De(e.year(),t,n)?(s=a-De(e.year(),t,n),i=e.year()+1):(i=e.year(),s=a),{week:s,year:i}}function De(e,t,n){var s=ve(e,t,n),i=ve(e+1,t,n);return(ge(e)-s+i)/7}function ke(e,t,n){return null!=e?e:null!=t?t:n}function Ye(t){var n=new Date(e.now());return t._useUTC?[n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()]:[n.getFullYear(),n.getMonth(),n.getDate()]}function Oe(e){var t,n,s,i,r=[];if(!e._d){for(s=Ye(e),e._w&&null==e._a[Es]&&null==e._a[As]&&xe(e),e._dayOfYear&&(i=ke(e._a[Vs],s[Vs]),e._dayOfYear>ge(i)&&(l(e)._overflowDayOfYear=!0),n=ye(i,0,e._dayOfYear),e._a[As]=n.getUTCMonth(),e._a[Es]=n.getUTCDate()),t=0;3>t&&null==e._a[t];++t)e._a[t]=r[t]=s[t];for(;7>t;t++)e._a[t]=r[t]=null==e._a[t]?2===t?1:0:e._a[t];24===e._a[Ns]&&0===e._a[Is]&&0===e._a[js]&&0===e._a[Zs]&&(e._nextDay=!0,e._a[Ns]=0),e._d=(e._useUTC?ye:_e).apply(null,r),null!=e._tzm&&e._d.setUTCMinutes(e._d.getUTCMinutes()-e._tzm),e._nextDay&&(e._a[Ns]=24)}}function xe(e){var t,n,s,i,r,a,o,u;t=e._w,null!=t.GG||null!=t.W||null!=t.E?(r=1,a=4,n=ke(t.GG,e._a[Vs],Se(Le(),1,4).year),s=ke(t.W,1),i=ke(t.E,1),(1>i||i>7)&&(u=!0)):(r=e._locale._week.dow,a=e._locale._week.doy,n=ke(t.gg,e._a[Vs],Se(Le(),r,a).year),s=ke(t.w,1),null!=t.d?(i=t.d,(0>i||i>6)&&(u=!0)):null!=t.e?(i=t.e+r,(t.e<0||t.e>6)&&(u=!0)):i=r),1>s||s>De(n,r,a)?l(e)._overflowWeeks=!0:null!=u?l(e)._overflowWeekday=!0:(o=Me(n,s,i,r,a),e._a[Vs]=o.year,e._dayOfYear=o.dayOfYear)}function be(t){if(t._f===e.ISO_8601)return void fe(t);t._a=[],l(t).empty=!0;var n,s,i,r,a,o=""+t._i,u=o.length,d=0;for(i=$(t._f,t._locale).match(ys)||[],n=0;n<i.length;n++)r=i[n],s=(o.match(B(r,t))||[])[0],s&&(a=o.substr(0,o.indexOf(s)),a.length>0&&l(t).unusedInput.push(a),o=o.slice(o.indexOf(s)+s.length),d+=s.length),ws[r]?(s?l(t).empty=!1:l(t).unusedTokens.push(r),ee(r,s,t)):t._strict&&!s&&l(t).unusedTokens.push(r);l(t).charsLeftOver=u-d,o.length>0&&l(t).unusedInput.push(o),l(t).bigHour===!0&&t._a[Ns]<=12&&t._a[Ns]>0&&(l(t).bigHour=void 0),l(t).parsedDateParts=t._a.slice(0),l(t).meridiem=t._meridiem,t._a[Ns]=Te(t._locale,t._a[Ns],t._meridiem),Oe(t),ce(t)}function Te(e,t,n){var s;return null==n?t:null!=e.meridiemHour?e.meridiemHour(t,n):null!=e.isPM?(s=e.isPM(n),s&&12>t&&(t+=12),s||12!==t||(t=0),t):t}function Pe(e){var t,n,s,i,r;if(0===e._f.length)return l(e).invalidFormat=!0,void(e._d=new Date(NaN));for(i=0;i<e._f.length;i++)r=0,t=f({},e),null!=e._useUTC&&(t._useUTC=e._useUTC),t._f=e._f[i],be(t),d(t)&&(r+=l(t).charsLeftOver,r+=10*l(t).unusedTokens.length,l(t).score=r,(null==s||s>r)&&(s=r,n=t));a(e,n||t)}function We(e){if(!e._d){var t=G(e._i);e._a=i([t.year,t.month,t.day||t.date,t.hour,t.minute,t.second,t.millisecond],function(e){return e&&parseInt(e,10)}),Oe(e)}}function Re(e){var t=new m(ce(Ue(e)));return t._nextDay&&(t.add(1,"d"),t._nextDay=void 0),t}function Ue(e){var t=e._i,i=e._f;return e._locale=e._locale||U(e._l),null===t||void 0===i&&""===t?h({nullInput:!0}):("string"==typeof t&&(e._i=t=e._locale.preparse(t)),_(t)?new m(ce(t)):(n(i)?Pe(e):i?be(e):s(t)?e._d=t:Ce(e),d(e)||(e._d=null),e))}function Ce(t){var r=t._i;void 0===r?t._d=new Date(e.now()):s(r)?t._d=new Date(r.valueOf()):"string"==typeof r?me(t):n(r)?(t._a=i(r.slice(0),function(e){return parseInt(e,10)}),Oe(t)):"object"==typeof r?We(t):"number"==typeof r?t._d=new Date(r):e.createFromInputFallback(t)}function He(e,t,n,s,i){var r={};return"boolean"==typeof n&&(s=n,n=void 0),r._isAMomentObject=!0,r._useUTC=r._isUTC=i,r._l=n,r._i=e,r._f=t,r._strict=s,Re(r)}function Le(e,t,n,s){return He(e,t,n,s,!1)}function Ge(e,t){var s,i;if(1===t.length&&n(t[0])&&(t=t[0]),!t.length)return Le();for(s=t[0],i=1;i<t.length;++i)t[i].isValid()&&!t[i][e](s)||(s=t[i]);return s}function Fe(){var e=[].slice.call(arguments,0);return Ge("isBefore",e)}function Ve(){var e=[].slice.call(arguments,0);return Ge("isAfter",e)}function Ae(e){var t=G(e),n=t.year||0,s=t.quarter||0,i=t.month||0,r=t.week||0,a=t.day||0,o=t.hour||0,u=t.minute||0,l=t.second||0,d=t.millisecond||0;this._milliseconds=+d+1e3*l+6e4*u+1e3*o*60*60,this._days=+a+7*r,this._months=+i+3*s+12*n,this._data={},this._locale=U(),this._bubble()}function Ee(e){return e instanceof Ae}function Ne(e,t){I(e,0,0,function(){var e=this.utcOffset(),n="+";return 0>e&&(e=-e,n="-"),n+N(~~(e/60),2)+t+N(~~e%60,2)})}function Ie(e,t){var n=(t||"").match(e)||[],s=n[n.length-1]||[],i=(s+"").match(li)||["-",0,0],r=+(60*i[1])+g(i[2]);return"+"===i[0]?r:-r}function je(t,n){var i,r;return n._isUTC?(i=n.clone(),r=(_(t)||s(t)?t.valueOf():Le(t).valueOf())-i.valueOf(),i._d.setTime(i._d.valueOf()+r),e.updateOffset(i,!1),i):Le(t).local()}function Ze(e){return 15*-Math.round(e._d.getTimezoneOffset()/15)}function ze(t,n){var s,i=this._offset||0;return this.isValid()?null!=t?("string"==typeof t?t=Ie(Cs,t):Math.abs(t)<16&&(t=60*t),!this._isUTC&&n&&(s=Ze(this)),this._offset=t,this._isUTC=!0,null!=s&&this.add(s,"m"),i!==t&&(!n||this._changeInProgress?lt(this,st(t-i,"m"),1,!1):this._changeInProgress||(this._changeInProgress=!0,e.updateOffset(this,!0),this._changeInProgress=null)),this):this._isUTC?i:Ze(this):null!=t?this:NaN}function $e(e,t){return null!=e?("string"!=typeof e&&(e=-e),this.utcOffset(e,t),this):-this.utcOffset()}function qe(e){return this.utcOffset(0,e)}function Be(e){return this._isUTC&&(this.utcOffset(0,e),this._isUTC=!1,e&&this.subtract(Ze(this),"m")),this}function Je(){return this._tzm?this.utcOffset(this._tzm):"string"==typeof this._i&&this.utcOffset(Ie(Us,this._i)),this}function Qe(e){return this.isValid()?(e=e?Le(e).utcOffset():0,(this.utcOffset()-e)%60===0):!1}function Xe(){return this.utcOffset()>this.clone().month(0).utcOffset()||this.utcOffset()>this.clone().month(5).utcOffset()}function Ke(){if(!c(this._isDSTShifted))return this._isDSTShifted;var e={};if(f(e,this),e=Ue(e),e._a){var t=e._isUTC?o(e._a):Le(e._a);this._isDSTShifted=this.isValid()&&p(e._a,t.toArray())>0}else this._isDSTShifted=!1;return this._isDSTShifted}function et(){return this.isValid()?!this._isUTC:!1}function tt(){return this.isValid()?this._isUTC:!1}function nt(){return this.isValid()?this._isUTC&&0===this._offset:!1}function st(e,t){var n,s,i,a=e,o=null;return Ee(e)?a={ms:e._milliseconds,d:e._days,M:e._months}:"number"==typeof e?(a={},t?a[t]=e:a.milliseconds=e):(o=di.exec(e))?(n="-"===o[1]?-1:1,a={y:0,d:g(o[Es])*n,h:g(o[Ns])*n,m:g(o[Is])*n,s:g(o[js])*n,ms:g(o[Zs])*n}):(o=hi.exec(e))?(n="-"===o[1]?-1:1,a={y:it(o[2],n),M:it(o[3],n),w:it(o[4],n),d:it(o[5],n),h:it(o[6],n),m:it(o[7],n),s:it(o[8],n)}):null==a?a={}:"object"==typeof a&&("from"in a||"to"in a)&&(i=at(Le(a.from),Le(a.to)),a={},a.ms=i.milliseconds,a.M=i.months),s=new Ae(a),Ee(e)&&r(e,"_locale")&&(s._locale=e._locale),s}function it(e,t){var n=e&&parseFloat(e.replace(",","."));return(isNaN(n)?0:n)*t}function rt(e,t){var n={milliseconds:0,months:0};return n.months=t.month()-e.month()+12*(t.year()-e.year()),e.clone().add(n.months,"M").isAfter(t)&&--n.months,n.milliseconds=+t-+e.clone().add(n.months,"M"),n}function at(e,t){var n;return e.isValid()&&t.isValid()?(t=je(t,e),e.isBefore(t)?n=rt(e,t):(n=rt(t,e),n.milliseconds=-n.milliseconds,n.months=-n.months),n):{milliseconds:0,months:0}}function ot(e){return 0>e?-1*Math.round(-1*e):Math.round(e)}function ut(e,t){return function(n,s){var i,r;return null===s||isNaN(+s)||(M(t,"moment()."+t+"(period, number) is deprecated. Please use moment()."+t+"(number, period)."),r=n,n=s,s=r),n="string"==typeof n?+n:n,i=st(n,s),lt(this,i,e),this}}function lt(t,n,s,i){var r=n._milliseconds,a=ot(n._days),o=ot(n._months);t.isValid()&&(i=null==i?!0:i,r&&t._d.setTime(t._d.valueOf()+r*s),a&&A(t,"Date",V(t,"Date")+a*s),o&&ae(t,V(t,"Month")+o*s),i&&e.updateOffset(t,a||o))}function dt(e,t){var n=e||Le(),s=je(n,this).startOf("day"),i=this.diff(s,"days",!0),r=-6>i?"sameElse":-1>i?"lastWeek":0>i?"lastDay":1>i?"sameDay":2>i?"nextDay":7>i?"nextWeek":"sameElse",a=t&&(S(t[r])?t[r]():t[r]);return this.format(a||this.localeData().calendar(r,this,Le(n)))}function ht(){return new m(this)}function ct(e,t){var n=_(e)?e:Le(e);return this.isValid()&&n.isValid()?(t=L(c(t)?"millisecond":t),"millisecond"===t?this.valueOf()>n.valueOf():n.valueOf()<this.clone().startOf(t).valueOf()):!1}function ft(e,t){var n=_(e)?e:Le(e);return this.isValid()&&n.isValid()?(t=L(c(t)?"millisecond":t),"millisecond"===t?this.valueOf()<n.valueOf():this.clone().endOf(t).valueOf()<n.valueOf()):!1}function mt(e,t,n,s){return s=s||"()",("("===s[0]?this.isAfter(e,n):!this.isBefore(e,n))&&(")"===s[1]?this.isBefore(t,n):!this.isAfter(t,n))}function _t(e,t){var n,s=_(e)?e:Le(e);return this.isValid()&&s.isValid()?(t=L(t||"millisecond"),"millisecond"===t?this.valueOf()===s.valueOf():(n=s.valueOf(),this.clone().startOf(t).valueOf()<=n&&n<=this.clone().endOf(t).valueOf())):!1}function yt(e,t){return this.isSame(e,t)||this.isAfter(e,t)}function gt(e,t){return this.isSame(e,t)||this.isBefore(e,t)}function pt(e,t,n){var s,i,r,a;return this.isValid()?(s=je(e,this),s.isValid()?(i=6e4*(s.utcOffset()-this.utcOffset()),t=L(t),"year"===t||"month"===t||"quarter"===t?(a=wt(this,s),"quarter"===t?a/=3:"year"===t&&(a/=12)):(r=this-s,a="second"===t?r/1e3:"minute"===t?r/6e4:"hour"===t?r/36e5:"day"===t?(r-i)/864e5:"week"===t?(r-i)/6048e5:r),n?a:y(a)):NaN):NaN}function wt(e,t){var n,s,i=12*(t.year()-e.year())+(t.month()-e.month()),r=e.clone().add(i,"months");return 0>t-r?(n=e.clone().add(i-1,"months"),s=(t-r)/(r-n)):(n=e.clone().add(i+1,"months"),s=(t-r)/(n-r)),-(i+s)||0}function vt(){return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")}function Mt(){var e=this.clone().utc();return 0<e.year()&&e.year()<=9999?S(Date.prototype.toISOString)?this.toDate().toISOString():z(e,"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"):z(e,"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]")}function St(t){t||(t=this.isUtc()?e.defaultFormatUtc:e.defaultFormat);var n=z(this,t);return this.localeData().postformat(n)}function Dt(e,t){return this.isValid()&&(_(e)&&e.isValid()||Le(e).isValid())?st({to:this,from:e}).locale(this.locale()).humanize(!t):this.localeData().invalidDate()}function kt(e){return this.from(Le(),e)}function Yt(e,t){return this.isValid()&&(_(e)&&e.isValid()||Le(e).isValid())?st({from:this,to:e}).locale(this.locale()).humanize(!t):this.localeData().invalidDate()}function Ot(e){return this.to(Le(),e)}function xt(e){var t;return void 0===e?this._locale._abbr:(t=U(e),null!=t&&(this._locale=t),this)}function bt(){return this._locale}function Tt(e){switch(e=L(e)){case"year":this.month(0);case"quarter":case"month":this.date(1);case"week":case"isoWeek":case"day":case"date":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===e&&this.weekday(0),"isoWeek"===e&&this.isoWeekday(1),"quarter"===e&&this.month(3*Math.floor(this.month()/3)),this}function Pt(e){return e=L(e),void 0===e||"millisecond"===e?this:("date"===e&&(e="day"),this.startOf(e).add(1,"isoWeek"===e?"week":e).subtract(1,"ms"))}function Wt(){return this._d.valueOf()-6e4*(this._offset||0)}function Rt(){return Math.floor(this.valueOf()/1e3)}function Ut(){return this._offset?new Date(this.valueOf()):this._d}function Ct(){var e=this;return[e.year(),e.month(),e.date(),e.hour(),e.minute(),e.second(),e.millisecond()]}function Ht(){var e=this;return{years:e.year(),months:e.month(),date:e.date(),hours:e.hours(),minutes:e.minutes(),seconds:e.seconds(),milliseconds:e.milliseconds()}}function Lt(){return this.isValid()?this.toISOString():null}function Gt(){return d(this)}function Ft(){return a({},l(this))}function Vt(){return l(this).overflow}function At(){return{input:this._i,format:this._f,locale:this._locale,isUTC:this._isUTC,strict:this._strict}}function Et(e,t){I(0,[e,e.length],0,t)}function Nt(e){return zt.call(this,e,this.week(),this.weekday(),this.localeData()._week.dow,this.localeData()._week.doy)}function It(e){return zt.call(this,e,this.isoWeek(),this.isoWeekday(),1,4)}function jt(){return De(this.year(),1,4)}function Zt(){var e=this.localeData()._week;return De(this.year(),e.dow,e.doy)}function zt(e,t,n,s,i){var r;return null==e?Se(this,s,i).year:(r=De(e,s,i),t>r&&(t=r),$t.call(this,e,t,n,s,i))}function $t(e,t,n,s,i){var r=Me(e,t,n,s,i),a=ye(r.year,0,r.dayOfYear);return this.year(a.getUTCFullYear()),this.month(a.getUTCMonth()),this.date(a.getUTCDate()),this}function qt(e){return null==e?Math.ceil((this.month()+1)/3):this.month(3*(e-1)+this.month()%3)}function Bt(e){return Se(e,this._week.dow,this._week.doy).week}function Jt(){return this._week.dow}function Qt(){return this._week.doy}function Xt(e){var t=this.localeData().week(this);return null==e?t:this.add(7*(e-t),"d")}function Kt(e){var t=Se(this,1,4).week;return null==e?t:this.add(7*(e-t),"d")}function en(e,t){return"string"!=typeof e?e:isNaN(e)?(e=t.weekdaysParse(e),"number"==typeof e?e:null):parseInt(e,10)}function tn(e,t){return n(this._weekdays)?this._weekdays[e.day()]:this._weekdays[this._weekdays.isFormat.test(t)?"format":"standalone"][e.day()]}function nn(e){return this._weekdaysShort[e.day()]}function sn(e){return this._weekdaysMin[e.day()]}function rn(e,t,n){var s,i,r,a=e.toLocaleLowerCase();if(!this._weekdaysParse)for(this._weekdaysParse=[],this._shortWeekdaysParse=[],this._minWeekdaysParse=[],s=0;7>s;++s)r=o([2e3,1]).day(s),this._minWeekdaysParse[s]=this.weekdaysMin(r,"").toLocaleLowerCase(),this._shortWeekdaysParse[s]=this.weekdaysShort(r,"").toLocaleLowerCase(),this._weekdaysParse[s]=this.weekdays(r,"").toLocaleLowerCase();return n?"dddd"===t?(i=fs.call(this._weekdaysParse,a),-1!==i?i:null):"ddd"===t?(i=fs.call(this._shortWeekdaysParse,a),-1!==i?i:null):(i=fs.call(this._minWeekdaysParse,a),-1!==i?i:null):"dddd"===t?(i=fs.call(this._weekdaysParse,a),-1!==i?i:(i=fs.call(this._shortWeekdaysParse,a),-1!==i?i:(i=fs.call(this._minWeekdaysParse,a),-1!==i?i:null))):"ddd"===t?(i=fs.call(this._shortWeekdaysParse,a),-1!==i?i:(i=fs.call(this._weekdaysParse,a),-1!==i?i:(i=fs.call(this._minWeekdaysParse,a),-1!==i?i:null))):(i=fs.call(this._minWeekdaysParse,a),-1!==i?i:(i=fs.call(this._weekdaysParse,a),-1!==i?i:(i=fs.call(this._shortWeekdaysParse,a),-1!==i?i:null)))}function an(e,t,n){var s,i,r;if(this._weekdaysParseExact)return rn.call(this,e,t,n);for(this._weekdaysParse||(this._weekdaysParse=[],this._minWeekdaysParse=[],this._shortWeekdaysParse=[],this._fullWeekdaysParse=[]),s=0;7>s;s++){if(i=o([2e3,1]).day(s),n&&!this._fullWeekdaysParse[s]&&(this._fullWeekdaysParse[s]=new RegExp("^"+this.weekdays(i,"").replace(".",".?")+"$","i"),this._shortWeekdaysParse[s]=new RegExp("^"+this.weekdaysShort(i,"").replace(".",".?")+"$","i"),this._minWeekdaysParse[s]=new RegExp("^"+this.weekdaysMin(i,"").replace(".",".?")+"$","i")),this._weekdaysParse[s]||(r="^"+this.weekdays(i,"")+"|^"+this.weekdaysShort(i,"")+"|^"+this.weekdaysMin(i,""),this._weekdaysParse[s]=new RegExp(r.replace(".",""),"i")),n&&"dddd"===t&&this._fullWeekdaysParse[s].test(e))return s;if(n&&"ddd"===t&&this._shortWeekdaysParse[s].test(e))return s;if(n&&"dd"===t&&this._minWeekdaysParse[s].test(e))return s;if(!n&&this._weekdaysParse[s].test(e))return s}}function on(e){if(!this.isValid())return null!=e?this:NaN;var t=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=e?(e=en(e,this.localeData()),this.add(e-t,"d")):t}function un(e){if(!this.isValid())return null!=e?this:NaN;var t=(this.day()+7-this.localeData()._week.dow)%7;return null==e?t:this.add(e-t,"d")}function ln(e){return this.isValid()?null==e?this.day()||7:this.day(this.day()%7?e:e-7):null!=e?this:NaN}function dn(e){return this._weekdaysParseExact?(r(this,"_weekdaysRegex")||fn.call(this),e?this._weekdaysStrictRegex:this._weekdaysRegex):this._weekdaysStrictRegex&&e?this._weekdaysStrictRegex:this._weekdaysRegex}function hn(e){return this._weekdaysParseExact?(r(this,"_weekdaysRegex")||fn.call(this),e?this._weekdaysShortStrictRegex:this._weekdaysShortRegex):this._weekdaysShortStrictRegex&&e?this._weekdaysShortStrictRegex:this._weekdaysShortRegex}function cn(e){return this._weekdaysParseExact?(r(this,"_weekdaysRegex")||fn.call(this),e?this._weekdaysMinStrictRegex:this._weekdaysMinRegex):this._weekdaysMinStrictRegex&&e?this._weekdaysMinStrictRegex:this._weekdaysMinRegex}function fn(){function e(e,t){return t.length-e.length}var t,n,s,i,r,a=[],u=[],l=[],d=[];for(t=0;7>t;t++)n=o([2e3,1]).day(t),s=this.weekdaysMin(n,""),i=this.weekdaysShort(n,""),r=this.weekdays(n,""),a.push(s),u.push(i),l.push(r),d.push(s),d.push(i),d.push(r);for(a.sort(e),u.sort(e),l.sort(e),d.sort(e),t=0;7>t;t++)u[t]=Q(u[t]),l[t]=Q(l[t]),d[t]=Q(d[t]);this._weekdaysRegex=new RegExp("^("+d.join("|")+")","i"),this._weekdaysShortRegex=this._weekdaysRegex,this._weekdaysMinRegex=this._weekdaysRegex,this._weekdaysStrictRegex=new RegExp("^("+l.join("|")+")","i"),this._weekdaysShortStrictRegex=new RegExp("^("+u.join("|")+")","i"),this._weekdaysMinStrictRegex=new RegExp("^("+a.join("|")+")","i")}function mn(e){var t=Math.round((this.clone().startOf("day")-this.clone().startOf("year"))/864e5)+1;return null==e?t:this.add(e-t,"d")}function _n(){return this.hours()%12||12}function yn(){return this.hours()||24}function gn(e,t){I(e,0,0,function(){return this.localeData().meridiem(this.hours(),this.minutes(),t)})}function pn(e,t){return t._meridiemParse}function wn(e){return"p"===(e+"").toLowerCase().charAt(0)}function vn(e,t,n){return e>11?n?"pm":"PM":n?"am":"AM"}function Mn(e,t){t[Zs]=g(1e3*("0."+e))}function Sn(){return this._isUTC?"UTC":""}function Dn(){return this._isUTC?"Coordinated Universal Time":""}function kn(e){return Le(1e3*e)}function Yn(){return Le.apply(null,arguments).parseZone()}function On(e,t,n){var s=this._calendar[e];return S(s)?s.call(t,n):s}function xn(e){var t=this._longDateFormat[e],n=this._longDateFormat[e.toUpperCase()];return t||!n?t:(this._longDateFormat[e]=n.replace(/MMMM|MM|DD|dddd/g,function(e){return e.slice(1)}),this._longDateFormat[e])}function bn(){return this._invalidDate}function Tn(e){return this._ordinal.replace("%d",e)}function Pn(e){return e}function Wn(e,t,n,s){var i=this._relativeTime[n];return S(i)?i(e,t,n,s):i.replace(/%d/i,e)}function Rn(e,t){var n=this._relativeTime[e>0?"future":"past"];return S(n)?n(t):n.replace(/%s/i,t)}function Un(e,t,n,s){var i=U(),r=o().set(s,t);return i[n](r,e)}function Cn(e,t,n){if("number"==typeof e&&(t=e,e=void 0),e=e||"",null!=t)return Un(e,t,n,"month");var s,i=[];for(s=0;12>s;s++)i[s]=Un(e,s,n,"month");return i}function Hn(e,t,n,s){"boolean"==typeof e?("number"==typeof t&&(n=t,t=void 0),t=t||""):(t=e,n=t,e=!1,"number"==typeof t&&(n=t,t=void 0),t=t||"");var i=U(),r=e?i._week.dow:0;if(null!=n)return Un(t,(n+r)%7,s,"day");var a,o=[];for(a=0;7>a;a++)o[a]=Un(t,(a+r)%7,s,"day");return o}function Ln(e,t){return Cn(e,t,"months")}function Gn(e,t){return Cn(e,t,"monthsShort")}function Fn(e,t,n){return Hn(e,t,n,"weekdays")}function Vn(e,t,n){return Hn(e,t,n,"weekdaysShort")}function An(e,t,n){return Hn(e,t,n,"weekdaysMin")}function En(){var e=this._data;return this._milliseconds=Fi(this._milliseconds),this._days=Fi(this._days),this._months=Fi(this._months),e.milliseconds=Fi(e.milliseconds),e.seconds=Fi(e.seconds),e.minutes=Fi(e.minutes),e.hours=Fi(e.hours),e.months=Fi(e.months),e.years=Fi(e.years),this}function Nn(e,t,n,s){var i=st(t,n);return e._milliseconds+=s*i._milliseconds,e._days+=s*i._days,e._months+=s*i._months,e._bubble()}function In(e,t){return Nn(this,e,t,1)}function jn(e,t){return Nn(this,e,t,-1)}function Zn(e){return 0>e?Math.floor(e):Math.ceil(e)}function zn(){var e,t,n,s,i,r=this._milliseconds,a=this._days,o=this._months,u=this._data;return r>=0&&a>=0&&o>=0||0>=r&&0>=a&&0>=o||(r+=864e5*Zn(qn(o)+a),a=0,o=0),u.milliseconds=r%1e3,e=y(r/1e3),u.seconds=e%60,t=y(e/60),u.minutes=t%60,n=y(t/60),u.hours=n%24,a+=y(n/24),i=y($n(a)),o+=i,a-=Zn(qn(i)),s=y(o/12),o%=12,u.days=a,u.months=o,u.years=s,this}function $n(e){return 4800*e/146097}function qn(e){return 146097*e/4800}function Bn(e){var t,n,s=this._milliseconds;if(e=L(e),"month"===e||"year"===e)return t=this._days+s/864e5,n=this._months+$n(t),"month"===e?n:n/12;switch(t=this._days+Math.round(qn(this._months)),e){case"week":return t/7+s/6048e5;case"day":return t+s/864e5;case"hour":return 24*t+s/36e5;case"minute":return 1440*t+s/6e4;case"second":return 86400*t+s/1e3;case"millisecond":return Math.floor(864e5*t)+s;default:throw new Error("Unknown unit "+e)}}function Jn(){return this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*g(this._months/12)}function Qn(e){return function(){return this.as(e)}}function Xn(e){
return e=L(e),this[e+"s"]()}function Kn(e){return function(){return this._data[e]}}function es(){return y(this.days()/7)}function ts(e,t,n,s,i){return i.relativeTime(t||1,!!n,e,s)}function ns(e,t,n){var s=st(e).abs(),i=er(s.as("s")),r=er(s.as("m")),a=er(s.as("h")),o=er(s.as("d")),u=er(s.as("M")),l=er(s.as("y")),d=i<tr.s&&["s",i]||1>=r&&["m"]||r<tr.m&&["mm",r]||1>=a&&["h"]||a<tr.h&&["hh",a]||1>=o&&["d"]||o<tr.d&&["dd",o]||1>=u&&["M"]||u<tr.M&&["MM",u]||1>=l&&["y"]||["yy",l];return d[2]=t,d[3]=+e>0,d[4]=n,ts.apply(null,d)}function ss(e,t){return void 0===tr[e]?!1:void 0===t?tr[e]:(tr[e]=t,!0)}function is(e){var t=this.localeData(),n=ns(this,!e,t);return e&&(n=t.pastFuture(+this,n)),t.postformat(n)}function rs(){var e,t,n,s=nr(this._milliseconds)/1e3,i=nr(this._days),r=nr(this._months);e=y(s/60),t=y(e/60),s%=60,e%=60,n=y(r/12),r%=12;var a=n,o=r,u=i,l=t,d=e,h=s,c=this.asSeconds();return c?(0>c?"-":"")+"P"+(a?a+"Y":"")+(o?o+"M":"")+(u?u+"D":"")+(l||d||h?"T":"")+(l?l+"H":"")+(d?d+"M":"")+(h?h+"S":""):"P0D"}var as,os;os=Array.prototype.some?Array.prototype.some:function(e){for(var t=Object(this),n=t.length>>>0,s=0;n>s;s++)if(s in t&&e.call(this,t[s],s,t))return!0;return!1};var us=e.momentProperties=[],ls=!1,ds={};e.suppressDeprecationWarnings=!1,e.deprecationHandler=null;var hs;hs=Object.keys?Object.keys:function(e){var t,n=[];for(t in e)r(e,t)&&n.push(t);return n};var cs,fs,ms={},_s={},ys=/(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,gs=/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,ps={},ws={},vs=/\d/,Ms=/\d\d/,Ss=/\d{3}/,Ds=/\d{4}/,ks=/[+-]?\d{6}/,Ys=/\d\d?/,Os=/\d\d\d\d?/,xs=/\d\d\d\d\d\d?/,bs=/\d{1,3}/,Ts=/\d{1,4}/,Ps=/[+-]?\d{1,6}/,Ws=/\d+/,Rs=/[+-]?\d+/,Us=/Z|[+-]\d\d:?\d\d/gi,Cs=/Z|[+-]\d\d(?::?\d\d)?/gi,Hs=/[+-]?\d+(\.\d{1,3})?/,Ls=/[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,Gs={},Fs={},Vs=0,As=1,Es=2,Ns=3,Is=4,js=5,Zs=6,zs=7,$s=8;fs=Array.prototype.indexOf?Array.prototype.indexOf:function(e){var t;for(t=0;t<this.length;++t)if(this[t]===e)return t;return-1},I("M",["MM",2],"Mo",function(){return this.month()+1}),I("MMM",0,0,function(e){return this.localeData().monthsShort(this,e)}),I("MMMM",0,0,function(e){return this.localeData().months(this,e)}),H("month","M"),q("M",Ys),q("MM",Ys,Ms),q("MMM",function(e,t){return t.monthsShortRegex(e)}),q("MMMM",function(e,t){return t.monthsRegex(e)}),X(["M","MM"],function(e,t){t[As]=g(e)-1}),X(["MMM","MMMM"],function(e,t,n,s){var i=n._locale.monthsParse(e,s,n._strict);null!=i?t[As]=i:l(n).invalidMonth=e});var qs=/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/,Bs="January_February_March_April_May_June_July_August_September_October_November_December".split("_"),Js="Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),Qs=Ls,Xs=Ls,Ks=/^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/,ei=/^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/,ti=/Z|[+-]\d\d(?::?\d\d)?/,ni=[["YYYYYY-MM-DD",/[+-]\d{6}-\d\d-\d\d/],["YYYY-MM-DD",/\d{4}-\d\d-\d\d/],["GGGG-[W]WW-E",/\d{4}-W\d\d-\d/],["GGGG-[W]WW",/\d{4}-W\d\d/,!1],["YYYY-DDD",/\d{4}-\d{3}/],["YYYY-MM",/\d{4}-\d\d/,!1],["YYYYYYMMDD",/[+-]\d{10}/],["YYYYMMDD",/\d{8}/],["GGGG[W]WWE",/\d{4}W\d{3}/],["GGGG[W]WW",/\d{4}W\d{2}/,!1],["YYYYDDD",/\d{7}/]],si=[["HH:mm:ss.SSSS",/\d\d:\d\d:\d\d\.\d+/],["HH:mm:ss,SSSS",/\d\d:\d\d:\d\d,\d+/],["HH:mm:ss",/\d\d:\d\d:\d\d/],["HH:mm",/\d\d:\d\d/],["HHmmss.SSSS",/\d\d\d\d\d\d\.\d+/],["HHmmss,SSSS",/\d\d\d\d\d\d,\d+/],["HHmmss",/\d\d\d\d\d\d/],["HHmm",/\d\d\d\d/],["HH",/\d\d/]],ii=/^\/?Date\((\-?\d+)/i;e.createFromInputFallback=v("moment construction falls back to js Date. This is discouraged and will be removed in upcoming major release. Please refer to https://github.com/moment/moment/issues/1407 for more info.",function(e){e._d=new Date(e._i+(e._useUTC?" UTC":""))}),I("Y",0,0,function(){var e=this.year();return 9999>=e?""+e:"+"+e}),I(0,["YY",2],0,function(){return this.year()%100}),I(0,["YYYY",4],0,"year"),I(0,["YYYYY",5],0,"year"),I(0,["YYYYYY",6,!0],0,"year"),H("year","y"),q("Y",Rs),q("YY",Ys,Ms),q("YYYY",Ts,Ds),q("YYYYY",Ps,ks),q("YYYYYY",Ps,ks),X(["YYYYY","YYYYYY"],Vs),X("YYYY",function(t,n){n[Vs]=2===t.length?e.parseTwoDigitYear(t):g(t)}),X("YY",function(t,n){n[Vs]=e.parseTwoDigitYear(t)}),X("Y",function(e,t){t[Vs]=parseInt(e,10)}),e.parseTwoDigitYear=function(e){return g(e)+(g(e)>68?1900:2e3)};var ri=F("FullYear",!0);e.ISO_8601=function(){};var ai=v("moment().min is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548",function(){var e=Le.apply(null,arguments);return this.isValid()&&e.isValid()?this>e?this:e:h()}),oi=v("moment().max is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548",function(){var e=Le.apply(null,arguments);return this.isValid()&&e.isValid()?e>this?this:e:h()}),ui=function(){return Date.now?Date.now():+new Date};Ne("Z",":"),Ne("ZZ",""),q("Z",Cs),q("ZZ",Cs),X(["Z","ZZ"],function(e,t,n){n._useUTC=!0,n._tzm=Ie(Cs,e)});var li=/([\+\-]|\d\d)/gi;e.updateOffset=function(){};var di=/^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?\d*)?$/,hi=/^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;st.fn=Ae.prototype;var ci=ut(1,"add"),fi=ut(-1,"subtract");e.defaultFormat="YYYY-MM-DDTHH:mm:ssZ",e.defaultFormatUtc="YYYY-MM-DDTHH:mm:ss[Z]";var mi=v("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.",function(e){return void 0===e?this.localeData():this.locale(e)});I(0,["gg",2],0,function(){return this.weekYear()%100}),I(0,["GG",2],0,function(){return this.isoWeekYear()%100}),Et("gggg","weekYear"),Et("ggggg","weekYear"),Et("GGGG","isoWeekYear"),Et("GGGGG","isoWeekYear"),H("weekYear","gg"),H("isoWeekYear","GG"),q("G",Rs),q("g",Rs),q("GG",Ys,Ms),q("gg",Ys,Ms),q("GGGG",Ts,Ds),q("gggg",Ts,Ds),q("GGGGG",Ps,ks),q("ggggg",Ps,ks),K(["gggg","ggggg","GGGG","GGGGG"],function(e,t,n,s){t[s.substr(0,2)]=g(e)}),K(["gg","GG"],function(t,n,s,i){n[i]=e.parseTwoDigitYear(t)}),I("Q",0,"Qo","quarter"),H("quarter","Q"),q("Q",vs),X("Q",function(e,t){t[As]=3*(g(e)-1)}),I("w",["ww",2],"wo","week"),I("W",["WW",2],"Wo","isoWeek"),H("week","w"),H("isoWeek","W"),q("w",Ys),q("ww",Ys,Ms),q("W",Ys),q("WW",Ys,Ms),K(["w","ww","W","WW"],function(e,t,n,s){t[s.substr(0,1)]=g(e)});var _i={dow:0,doy:6};I("D",["DD",2],"Do","date"),H("date","D"),q("D",Ys),q("DD",Ys,Ms),q("Do",function(e,t){return e?t._ordinalParse:t._ordinalParseLenient}),X(["D","DD"],Es),X("Do",function(e,t){t[Es]=g(e.match(Ys)[0],10)});var yi=F("Date",!0);I("d",0,"do","day"),I("dd",0,0,function(e){return this.localeData().weekdaysMin(this,e)}),I("ddd",0,0,function(e){return this.localeData().weekdaysShort(this,e)}),I("dddd",0,0,function(e){return this.localeData().weekdays(this,e)}),I("e",0,0,"weekday"),I("E",0,0,"isoWeekday"),H("day","d"),H("weekday","e"),H("isoWeekday","E"),q("d",Ys),q("e",Ys),q("E",Ys),q("dd",function(e,t){return t.weekdaysMinRegex(e)}),q("ddd",function(e,t){return t.weekdaysShortRegex(e)}),q("dddd",function(e,t){return t.weekdaysRegex(e)}),K(["dd","ddd","dddd"],function(e,t,n,s){var i=n._locale.weekdaysParse(e,s,n._strict);null!=i?t.d=i:l(n).invalidWeekday=e}),K(["d","e","E"],function(e,t,n,s){t[s]=g(e)});var gi="Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),pi="Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),wi="Su_Mo_Tu_We_Th_Fr_Sa".split("_"),vi=Ls,Mi=Ls,Si=Ls;I("DDD",["DDDD",3],"DDDo","dayOfYear"),H("dayOfYear","DDD"),q("DDD",bs),q("DDDD",Ss),X(["DDD","DDDD"],function(e,t,n){n._dayOfYear=g(e)}),I("H",["HH",2],0,"hour"),I("h",["hh",2],0,_n),I("k",["kk",2],0,yn),I("hmm",0,0,function(){return""+_n.apply(this)+N(this.minutes(),2)}),I("hmmss",0,0,function(){return""+_n.apply(this)+N(this.minutes(),2)+N(this.seconds(),2)}),I("Hmm",0,0,function(){return""+this.hours()+N(this.minutes(),2)}),I("Hmmss",0,0,function(){return""+this.hours()+N(this.minutes(),2)+N(this.seconds(),2)}),gn("a",!0),gn("A",!1),H("hour","h"),q("a",pn),q("A",pn),q("H",Ys),q("h",Ys),q("HH",Ys,Ms),q("hh",Ys,Ms),q("hmm",Os),q("hmmss",xs),q("Hmm",Os),q("Hmmss",xs),X(["H","HH"],Ns),X(["a","A"],function(e,t,n){n._isPm=n._locale.isPM(e),n._meridiem=e}),X(["h","hh"],function(e,t,n){t[Ns]=g(e),l(n).bigHour=!0}),X("hmm",function(e,t,n){var s=e.length-2;t[Ns]=g(e.substr(0,s)),t[Is]=g(e.substr(s)),l(n).bigHour=!0}),X("hmmss",function(e,t,n){var s=e.length-4,i=e.length-2;t[Ns]=g(e.substr(0,s)),t[Is]=g(e.substr(s,2)),t[js]=g(e.substr(i)),l(n).bigHour=!0}),X("Hmm",function(e,t,n){var s=e.length-2;t[Ns]=g(e.substr(0,s)),t[Is]=g(e.substr(s))}),X("Hmmss",function(e,t,n){var s=e.length-4,i=e.length-2;t[Ns]=g(e.substr(0,s)),t[Is]=g(e.substr(s,2)),t[js]=g(e.substr(i))});var Di=/[ap]\.?m?\.?/i,ki=F("Hours",!0);I("m",["mm",2],0,"minute"),H("minute","m"),q("m",Ys),q("mm",Ys,Ms),X(["m","mm"],Is);var Yi=F("Minutes",!1);I("s",["ss",2],0,"second"),H("second","s"),q("s",Ys),q("ss",Ys,Ms),X(["s","ss"],js);var Oi=F("Seconds",!1);I("S",0,0,function(){return~~(this.millisecond()/100)}),I(0,["SS",2],0,function(){return~~(this.millisecond()/10)}),I(0,["SSS",3],0,"millisecond"),I(0,["SSSS",4],0,function(){return 10*this.millisecond()}),I(0,["SSSSS",5],0,function(){return 100*this.millisecond()}),I(0,["SSSSSS",6],0,function(){return 1e3*this.millisecond()}),I(0,["SSSSSSS",7],0,function(){return 1e4*this.millisecond()}),I(0,["SSSSSSSS",8],0,function(){return 1e5*this.millisecond()}),I(0,["SSSSSSSSS",9],0,function(){return 1e6*this.millisecond()}),H("millisecond","ms"),q("S",bs,vs),q("SS",bs,Ms),q("SSS",bs,Ss);var xi;for(xi="SSSS";xi.length<=9;xi+="S")q(xi,Ws);for(xi="S";xi.length<=9;xi+="S")X(xi,Mn);var bi=F("Milliseconds",!1);I("z",0,0,"zoneAbbr"),I("zz",0,0,"zoneName");var Ti=m.prototype;Ti.add=ci,Ti.calendar=dt,Ti.clone=ht,Ti.diff=pt,Ti.endOf=Pt,Ti.format=St,Ti.from=Dt,Ti.fromNow=kt,Ti.to=Yt,Ti.toNow=Ot,Ti.get=E,Ti.invalidAt=Vt,Ti.isAfter=ct,Ti.isBefore=ft,Ti.isBetween=mt,Ti.isSame=_t,Ti.isSameOrAfter=yt,Ti.isSameOrBefore=gt,Ti.isValid=Gt,Ti.lang=mi,Ti.locale=xt,Ti.localeData=bt,Ti.max=oi,Ti.min=ai,Ti.parsingFlags=Ft,Ti.set=E,Ti.startOf=Tt,Ti.subtract=fi,Ti.toArray=Ct,Ti.toObject=Ht,Ti.toDate=Ut,Ti.toISOString=Mt,Ti.toJSON=Lt,Ti.toString=vt,Ti.unix=Rt,Ti.valueOf=Wt,Ti.creationData=At,Ti.year=ri,Ti.isLeapYear=we,Ti.weekYear=Nt,Ti.isoWeekYear=It,Ti.quarter=Ti.quarters=qt,Ti.month=oe,Ti.daysInMonth=ue,Ti.week=Ti.weeks=Xt,Ti.isoWeek=Ti.isoWeeks=Kt,Ti.weeksInYear=Zt,Ti.isoWeeksInYear=jt,Ti.date=yi,Ti.day=Ti.days=on,Ti.weekday=un,Ti.isoWeekday=ln,Ti.dayOfYear=mn,Ti.hour=Ti.hours=ki,Ti.minute=Ti.minutes=Yi,Ti.second=Ti.seconds=Oi,Ti.millisecond=Ti.milliseconds=bi,Ti.utcOffset=ze,Ti.utc=qe,Ti.local=Be,Ti.parseZone=Je,Ti.hasAlignedHourOffset=Qe,Ti.isDST=Xe,Ti.isDSTShifted=Ke,Ti.isLocal=et,Ti.isUtcOffset=tt,Ti.isUtc=nt,Ti.isUTC=nt,Ti.zoneAbbr=Sn,Ti.zoneName=Dn,Ti.dates=v("dates accessor is deprecated. Use date instead.",yi),Ti.months=v("months accessor is deprecated. Use month instead",oe),Ti.years=v("years accessor is deprecated. Use year instead",ri),Ti.zone=v("moment().zone is deprecated, use moment().utcOffset instead. https://github.com/moment/moment/issues/1779",$e);var Pi=Ti,Wi={sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},Ri={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},Ui="Invalid date",Ci="%d",Hi=/\d{1,2}/,Li={future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},Gi=O.prototype;Gi._calendar=Wi,Gi.calendar=On,Gi._longDateFormat=Ri,Gi.longDateFormat=xn,Gi._invalidDate=Ui,Gi.invalidDate=bn,Gi._ordinal=Ci,Gi.ordinal=Tn,Gi._ordinalParse=Hi,Gi.preparse=Pn,Gi.postformat=Pn,Gi._relativeTime=Li,Gi.relativeTime=Wn,Gi.pastFuture=Rn,Gi.set=k,Gi.months=ne,Gi._months=Bs,Gi.monthsShort=se,Gi._monthsShort=Js,Gi.monthsParse=re,Gi._monthsRegex=Xs,Gi.monthsRegex=de,Gi._monthsShortRegex=Qs,Gi.monthsShortRegex=le,Gi.week=Bt,Gi._week=_i,Gi.firstDayOfYear=Qt,Gi.firstDayOfWeek=Jt,Gi.weekdays=tn,Gi._weekdays=gi,Gi.weekdaysMin=sn,Gi._weekdaysMin=wi,Gi.weekdaysShort=nn,Gi._weekdaysShort=pi,Gi.weekdaysParse=an,Gi._weekdaysRegex=vi,Gi.weekdaysRegex=dn,Gi._weekdaysShortRegex=Mi,Gi.weekdaysShortRegex=hn,Gi._weekdaysMinRegex=Si,Gi.weekdaysMinRegex=cn,Gi.isPM=wn,Gi._meridiemParse=Di,Gi.meridiem=vn,P("en",{ordinalParse:/\d{1,2}(th|st|nd|rd)/,ordinal:function(e){var t=e%10,n=1===g(e%100/10)?"th":1===t?"st":2===t?"nd":3===t?"rd":"th";return e+n}}),e.lang=v("moment.lang is deprecated. Use moment.locale instead.",P),e.langData=v("moment.langData is deprecated. Use moment.localeData instead.",U);var Fi=Math.abs,Vi=Qn("ms"),Ai=Qn("s"),Ei=Qn("m"),Ni=Qn("h"),Ii=Qn("d"),ji=Qn("w"),Zi=Qn("M"),zi=Qn("y"),$i=Kn("milliseconds"),qi=Kn("seconds"),Bi=Kn("minutes"),Ji=Kn("hours"),Qi=Kn("days"),Xi=Kn("months"),Ki=Kn("years"),er=Math.round,tr={s:45,m:45,h:22,d:26,M:11},nr=Math.abs,sr=Ae.prototype;sr.abs=En,sr.add=In,sr.subtract=jn,sr.as=Bn,sr.asMilliseconds=Vi,sr.asSeconds=Ai,sr.asMinutes=Ei,sr.asHours=Ni,sr.asDays=Ii,sr.asWeeks=ji,sr.asMonths=Zi,sr.asYears=zi,sr.valueOf=Jn,sr._bubble=zn,sr.get=Xn,sr.milliseconds=$i,sr.seconds=qi,sr.minutes=Bi,sr.hours=Ji,sr.days=Qi,sr.weeks=es,sr.months=Xi,sr.years=Ki,sr.humanize=is,sr.toISOString=rs,sr.toString=rs,sr.toJSON=rs,sr.locale=xt,sr.localeData=bt,sr.toIsoString=v("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)",rs),sr.lang=mi,I("X",0,0,"unix"),I("x",0,0,"valueOf"),q("x",Rs),q("X",Hs),X("X",function(e,t,n){n._d=new Date(1e3*parseFloat(e,10))}),X("x",function(e,t,n){n._d=new Date(g(e))}),e.version="2.13.0",t(Le),e.fn=Pi,e.min=Fe,e.max=Ve,e.now=ui,e.utc=o,e.unix=kn,e.months=Ln,e.isDate=s,e.locale=P,e.invalid=h,e.duration=st,e.isMoment=_,e.weekdays=Fn,e.parseZone=Yn,e.localeData=U,e.isDuration=Ee,e.monthsShort=Gn,e.weekdaysMin=An,e.defineLocale=W,e.updateLocale=R,e.locales=C,e.weekdaysShort=Vn,e.normalizeUnits=L,e.relativeTimeThreshold=ss,e.prototype=Pi;var ir=e;return ir});;;
!function(t,n){"function"==typeof define&&define.amd?define(["moment"],function(e){return t.DateRange=n(e)}):"object"==typeof exports?module.exports=n(require("moment")):t.DateRange=n(moment)}(this,function(t){function n(n,e){var r,s=n,i=e;1!==arguments.length&&void 0!==e||("object"==typeof n&&2===n.length?(s=n[0],i=n[1]):"string"==typeof n&&(r=n.split("/"),s=r[0],i=r[1])),this.start=t(null===s?-864e13:s),this.end=t(null===i?864e13:i)}function e(n,e,r){for(var s=t(this.start);this.contains(s,r);)e.call(this,s.clone()),s.add(1,n)}function r(n,e,r){var s=this/n,i=Math.floor(s);if(i!==1/0){i===s&&r&&i--;for(var o=0;i>=o;o++)e.call(this,t(this.start.valueOf()+n.valueOf()*o))}}var s={year:!0,month:!0,week:!0,day:!0,hour:!0,minute:!0,second:!0};return n.prototype.constructor=n,n.prototype.clone=function(){return t().range(this.start,this.end)},n.prototype.contains=function(t,e){var r=this.start,s=this.end;return t instanceof n?r<=t.start&&(s>t.end||s.isSame(t.end)&&!e):t>=r&&(s>t||s.isSame(t)&&!e)},n.prototype.overlaps=function(t){return null!==this.intersect(t)},n.prototype.intersect=function(t){var e=this.start,r=this.end;return e<=t.start&&t.start<r&&r<t.end?new n(t.start,r):t.start<e&&e<t.end&&t.end<=r?new n(e,t.end):t.start<e&&r>=e&&r<t.end?this:e<=t.start&&t.start<=t.end&&t.end<=r?t:null},n.prototype.add=function(e){return this.overlaps(e)?new n(t.min(this.start,e.start),t.max(this.end,e.end)):null},n.prototype.subtract=function(t){var e=this.start,r=this.end;return null===this.intersect(t)?[this]:t.start<=e&&r>e&&r<=t.end?[]:t.start<=e&&e<t.end&&t.end<r?[new n(t.end,r)]:e<t.start&&t.start<r&&r<=t.end?[new n(e,t.start)]:e<t.start&&t.start<t.end&&t.end<r?[new n(e,t.start),new n(t.end,r)]:e<t.start&&t.start<r&&t.end<r?[new n(e,t.start),new n(t.start,r)]:void 0},n.prototype.toArray=function(t,n){var e=[];return this.by(t,function(t){e.push(t)},n),e},n.prototype.by=function(t,n,s){return"string"==typeof t?e.call(this,t,n,s):r.call(this,t,n,s),this},n.prototype.toString=function(){return this.start.format()+"/"+this.end.format()},n.prototype.valueOf=function(){return this.end-this.start},n.prototype.center=function(){var n=this.start+this.diff()/2;return t(n)},n.prototype.toDate=function(){return[this.start.toDate(),this.end.toDate()]},n.prototype.isSame=function(t){return this.start.isSame(t.start)&&this.end.isSame(t.end)},n.prototype.diff=function(t){return this.end.diff(this.start,t)},t.range=function(e,r){return e in s?new n(t(this).startOf(e),t(this).endOf(e)):new n(e,r)},t.range.constructor=n,t.fn.range=t.range,t.fn.within=function(t){return t.contains(this._d)},n});;;
!window.XMLHttpRequest||window.FileAPI&&FileAPI.shouldLoad||(window.XMLHttpRequest.prototype.setRequestHeader=function(e){return function(t,n){if("__setXHR_"===t){var r=n(this);r instanceof Function&&r(this)}else e.apply(this,arguments)}}(window.XMLHttpRequest.prototype.setRequestHeader));var ngFileUpload=angular.module("ngFileUpload",[]);ngFileUpload.version="12.0.4",ngFileUpload.service("UploadBase",["$http","$q","$timeout",function(e,t,n){function r(r){function i(e){u.notify&&u.notify(e),f.progressFunc&&n(function(){f.progressFunc(e)})}function l(e){return null!=r._start&&o?{loaded:e.loaded+r._start,total:r._file&&r._file.size||e.total,type:e.type,config:r,lengthComputable:!0,target:e.target}:e}function s(){e(r).then(function(e){o&&r._chunkSize&&!r._finished&&r._file?(i({loaded:r._end,total:r._file&&r._file.size,config:r,type:"progress"}),a.upload(r,!0)):(r._finished&&delete r._finished,u.resolve(e))},function(e){u.reject(e)},function(e){u.notify(e)})}r.method=r.method||"POST",r.headers=r.headers||{};var u=r._deferred=r._deferred||t.defer(),f=u.promise;return r.disableProgress||(r.headers.__setXHR_=function(){return function(e){e&&e.upload&&e.upload.addEventListener&&(r.__XHR=e,r.xhrFn&&r.xhrFn(e),e.upload.addEventListener("progress",function(e){e.config=r,i(l(e))},!1),e.upload.addEventListener("load",function(e){e.lengthComputable&&(e.config=r,i(l(e)))},!1))}}),o?r._chunkSize&&r._end&&!r._finished?(r._start=r._end,r._end+=r._chunkSize,s()):r.resumeSizeUrl?e.get(r.resumeSizeUrl).then(function(e){r.resumeSizeResponseReader?r._start=r.resumeSizeResponseReader(e.data):r._start=parseInt((null==e.data.size?e.data:e.data.size).toString()),r._chunkSize&&(r._end=r._start+r._chunkSize),s()},function(e){throw e}):r.resumeSize?r.resumeSize().then(function(e){r._start=e,s()},function(e){throw e}):(r._chunkSize&&(r._start=0,r._end=r._start+r._chunkSize),s()):s(),f.success=function(e){return f.then(function(t){e(t.data,t.status,t.headers,r)}),f},f.error=function(e){return f.then(null,function(t){e(t.data,t.status,t.headers,r)}),f},f.progress=function(e){return f.progressFunc=e,f.then(null,null,function(t){e(t)}),f},f.abort=f.pause=function(){return r.__XHR&&n(function(){r.__XHR.abort()}),f},f.xhr=function(e){return r.xhrFn=function(t){return function(){t&&t.apply(f,arguments),e.apply(f,arguments)}}(r.xhrFn),f},a.promisesCount++,f["finally"](function(){a.promisesCount--}),f}function i(e){var t={};for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n]);return t}var a=this;a.promisesCount=0,this.isResumeSupported=function(){return window.Blob&&window.Blob.prototype.slice};var o=this.isResumeSupported();this.isUploadInProgress=function(){return a.promisesCount>0},this.rename=function(e,t){return e.ngfName=t,e},this.jsonBlob=function(e){null==e||angular.isString(e)||(e=JSON.stringify(e));var t=new window.Blob([e],{type:"application/json"});return t._ngfBlob=!0,t},this.json=function(e){return angular.toJson(e)},this.isFile=function(e){return null!=e&&(e instanceof window.Blob||e.flashId&&e.name&&e.size)},this.upload=function(e,t){function n(t,n){if(t._ngfBlob)return t;if(e._file=e._file||t,null!=e._start&&o){e._end&&e._end>=t.size&&(e._finished=!0,e._end=t.size);var r=t.slice(e._start,e._end||t.size);return r.name=t.name,r.ngfName=t.ngfName,e._chunkSize&&(n.append("_chunkSize",e._chunkSize),n.append("_currentChunkSize",e._end-e._start),n.append("_chunkNumber",Math.floor(e._start/e._chunkSize)),n.append("_totalSize",e._file.size)),r}return t}function l(t,r,i){if(void 0!==r)if(angular.isDate(r)&&(r=r.toISOString()),angular.isString(r))t.append(i,r);else if(a.isFile(r)){var o=n(r,t),s=i.split(",");s[1]&&(o.ngfName=s[1].replace(/^\s+|\s+$/g,""),i=s[0]),e._fileKey=e._fileKey||i,t.append(i,o,o.ngfName||o.name)}else if(angular.isObject(r)){if(r.$$ngfCircularDetection)throw"ngFileUpload: Circular reference in config.data. Make sure specified data for Upload.upload() has no circular reference: "+i;r.$$ngfCircularDetection=!0;try{for(var u in r)if(r.hasOwnProperty(u)&&"$$ngfCircularDetection"!==u){var f=null==e.objectKey?"[i]":e.objectKey;r.length&&parseInt(u)>-1&&(f=null==e.arrayKey?f:e.arrayKey),l(t,r[u],i+f.replace(/[ik]/g,u))}}finally{delete r.$$ngfCircularDetection}}else t.append(i,r)}function s(){e._chunkSize=a.translateScalars(e.resumeChunkSize),e._chunkSize=e._chunkSize?parseInt(e._chunkSize.toString()):null,e.headers=e.headers||{},e.headers["Content-Type"]=void 0,e.transformRequest=e.transformRequest?angular.isArray(e.transformRequest)?e.transformRequest:[e.transformRequest]:[],e.transformRequest.push(function(t){var n,r=new window.FormData;t=t||e.fields||{},e.file&&(t.file=e.file);for(n in t)if(t.hasOwnProperty(n)){var i=t[n];e.formDataAppender?e.formDataAppender(r,n,i):l(r,i,n)}return r})}return t||(e=i(e)),e._isDigested||(e._isDigested=!0,s()),r(e)},this.http=function(t){return t=i(t),t.transformRequest=t.transformRequest||function(t){return window.ArrayBuffer&&t instanceof window.ArrayBuffer||t instanceof window.Blob?t:e.defaults.transformRequest[0].apply(this,arguments)},t._chunkSize=a.translateScalars(t.resumeChunkSize),t._chunkSize=t._chunkSize?parseInt(t._chunkSize.toString()):null,r(t)},this.translateScalars=function(e){if(angular.isString(e)){if(e.search(/kb/i)===e.length-2)return parseFloat(1024*e.substring(0,e.length-2));if(e.search(/mb/i)===e.length-2)return parseFloat(1048576*e.substring(0,e.length-2));if(e.search(/gb/i)===e.length-2)return parseFloat(1073741824*e.substring(0,e.length-2));if(e.search(/b/i)===e.length-1)return parseFloat(e.substring(0,e.length-1));if(e.search(/s/i)===e.length-1)return parseFloat(e.substring(0,e.length-1));if(e.search(/m/i)===e.length-1)return parseFloat(60*e.substring(0,e.length-1));if(e.search(/h/i)===e.length-1)return parseFloat(3600*e.substring(0,e.length-1))}return e},this.urlToBlob=function(n){var r=t.defer();return e({url:n,method:"get",responseType:"arraybuffer"}).then(function(e){var t=new Uint8Array(e.data),n=e.headers("content-type")||"image/WebP",i=new window.Blob([t],{type:n});r.resolve(i)},function(e){r.reject(e)}),r.promise},this.setDefaults=function(e){this.defaults=e||{}},this.defaults={},this.version=ngFileUpload.version}]),ngFileUpload.service("Upload",["$parse","$timeout","$compile","$q","UploadExif",function(e,t,n,r,i){function a(e,t,n){var i=[s.emptyPromise()];return angular.forEach(e,function(r,a){0===r.type.indexOf("image/jpeg")&&s.attrGetter("ngfFixOrientation",t,n,{$file:r})&&i.push(s.happyPromise(s.applyExifRotation(r),r).then(function(t){e.splice(a,1,t)}))}),r.all(i)}function o(e,t,n){var i=s.attrGetter("ngfResize",t,n);if(!i||!s.isResizeSupported()||!e.length)return s.emptyPromise();if(!(i instanceof Function))return l(i,e,t,n);var a=r.defer();i(e).then(function(r){l(r,e,t,n).then(function(e){a.resolve(e)},function(e){a.reject(e)})},function(e){a.reject(e)})}function l(e,t,n,i){function a(r,a){if(0===r.type.indexOf("image")){if(e.pattern&&!s.validatePattern(r,e.pattern))return;var l=s.resize(r,e.width,e.height,e.quality,e.type,e.ratio,e.centerCrop,function(e,t){return s.attrGetter("ngfResizeIf",n,i,{$width:e,$height:t,$file:r})},e.restoreExif!==!1);o.push(l),l.then(function(e){t.splice(a,1,e)},function(e){r.$error="resize",r.$errorParam=(e?(e.message?e.message:e)+": ":"")+(r&&r.name)})}}for(var o=[s.emptyPromise()],l=0;l<t.length;l++)a(t[l],l);return r.all(o)}var s=i;return s.getAttrWithDefaults=function(e,t){if(null!=e[t])return e[t];var n=s.defaults[t];return null==n?n:angular.isString(n)?n:JSON.stringify(n)},s.attrGetter=function(t,n,r,i){var a=this.getAttrWithDefaults(n,t);if(!r)return a;try{return i?e(a)(r,i):e(a)(r)}catch(o){if(t.search(/min|max|pattern/i))return a;throw o}},s.shouldUpdateOn=function(e,t,n){var r=s.attrGetter("ngModelOptions",t,n);return r&&r.updateOn?r.updateOn.split(" ").indexOf(e)>-1:!0},s.emptyPromise=function(){var e=r.defer(),n=arguments;return t(function(){e.resolve.apply(e,n)}),e.promise},s.rejectPromise=function(){var e=r.defer(),n=arguments;return t(function(){e.reject.apply(e,n)}),e.promise},s.happyPromise=function(e,n){var i=r.defer();return e.then(function(e){i.resolve(e)},function(e){t(function(){throw e}),i.resolve(n)}),i.promise},s.updateModel=function(n,r,i,l,u,f,c){function d(a,o,u,c,d){r.$$ngfPrevValidFiles=a,r.$$ngfPrevInvalidFiles=o;var g=a&&a.length?a[0]:null,h=o&&o.length?o[0]:null;n&&(s.applyModelValidation(n,a),n.$setViewValue(d?g:a)),l&&e(l)(i,{$files:a,$file:g,$newFiles:u,$duplicateFiles:c,$invalidFiles:o,$invalidFile:h,$event:f});var p=s.attrGetter("ngfModelInvalid",r);p&&t(function(){e(p).assign(i,d?h:o)}),t(function(){})}function g(){function e(e,t){return e.name===t.name&&(e.$ngfOrigSize||e.size)===(t.$ngfOrigSize||t.size)&&e.type===t.type}function t(t){var n;for(n=0;n<$.length;n++)if(e(t,$[n]))return!0;for(n=0;n<y.length;n++)if(e(t,y[n]))return!0;return!1}if(u){v=[],b=[];for(var n=0;n<u.length;n++)t(u[n])?b.push(u[n]):v.push(u[n])}}function h(e){return angular.isArray(e)?e:[e]}function p(){U=[],w=[],angular.forEach(v,function(e){e.$error?w.push(e):U.push(e)})}function m(){function e(){t(function(){d(x?$.concat(U):U,x?y.concat(w):w,u,b,S)},_&&_.debounce?_.debounce.change||_.debounce:0)}o(D?v:U,r,i).then(function(){D?s.validate(v,$.length,n,r,i).then(function(){p(),e()}):e()},function(e){throw"Could not resize files "+e})}var v,$,y,b=[],w=[],U=[];$=r.$$ngfPrevValidFiles||[],y=r.$$ngfPrevInvalidFiles||[],n&&n.$modelValue&&($=h(n.$modelValue));var x=s.attrGetter("ngfKeep",r,i);v=(u||[]).slice(0),"distinct"!==x&&s.attrGetter("ngfKeepDistinct",r,i)!==!0||g(r,i);var S=!x&&!s.attrGetter("ngfMultiple",r,i)&&!s.attrGetter("multiple",r);if(!x||v.length){s.attrGetter("ngfBeforeModelChange",r,i,{$files:u,$file:u&&u.length?u[0]:null,$newFiles:v,$duplicateFiles:b,$event:f});var D=s.attrGetter("ngfValidateAfterResize",r,i),_=s.attrGetter("ngModelOptions",r,i);s.validate(v,$.length,n,r,i).then(function(){c?d(v,[],u,b,S):(_&&_.allowInvalid||D?U=v:p(),s.attrGetter("ngfFixOrientation",r,i)&&s.isExifSupported()?a(U,r,i).then(function(){m()}):m())})}},s}]),ngFileUpload.directive("ngfSelect",["$parse","$timeout","$compile","Upload",function(e,t,n,r){function i(e){var t=e.match(/Android[^\d]*(\d+)\.(\d+)/);if(t&&t.length>2){var n=r.defaults.androidFixMinorVersion||4;return parseInt(t[1])<4||parseInt(t[1])===n&&parseInt(t[2])<n}return-1===e.indexOf("Chrome")&&/.*Windows.*Safari.*/.test(e)}function a(e,t,n,r,a,l,s,u){function f(){return"input"===t[0].tagName.toLowerCase()&&n.type&&"file"===n.type.toLowerCase()}function c(){return y("ngfChange")||y("ngfSelect")}function d(t){if(u.shouldUpdateOn("change",n,e)){for(var i=t.__files_||t.target&&t.target.files,a=[],o=0;o<i.length;o++)a.push(i[o]);u.updateModel(r,n,e,c(),a.length?a:null,t)}}function g(e){if(t!==e)for(var n=0;n<t[0].attributes.length;n++){var r=t[0].attributes[n];"type"!==r.name&&"class"!==r.name&&"style"!==r.name&&(null!=r.value&&""!==r.value||("required"===r.name&&(r.value="required"),"multiple"===r.name&&(r.value="multiple")),e.attr(r.name,"id"===r.name?"ngf-"+r.value:r.value))}}function h(){if(f())return t;var e=angular.element('<input type="file">');g(e);var n=angular.element("<label>upload</label>");return n.css("visibility","hidden").css("position","absolute").css("overflow","hidden").css("width","0px").css("height","0px").css("border","none").css("margin","0px").css("padding","0px").attr("tabindex","-1"),o.push({el:t,ref:n}),document.body.appendChild(n.append(e)[0]),e}function p(n){if(t.attr("disabled"))return!1;if(!y("ngfSelectDisabled",e)){var r=m(n);if(null!=r)return r;v(n);try{f()||document.body.contains(U[0])||(o.push({el:t,ref:U.parent()}),document.body.appendChild(U.parent()[0]),U.bind("change",d))}catch(a){}return i(navigator.userAgent)?setTimeout(function(){U[0].click()},0):U[0].click(),!1}}function m(e){var t=e.changedTouches||e.originalEvent&&e.originalEvent.changedTouches;if("touchstart"===e.type)return w=t?t[0].clientY:0,!0;if(e.stopPropagation(),e.preventDefault(),"touchend"===e.type){var n=t?t[0].clientY:0;if(Math.abs(n-w)>20)return!1}}function v(t){u.shouldUpdateOn("click",n,e)&&U.val()&&(U.val(null),u.updateModel(r,n,e,c(),null,t,!0))}function $(e){if(U&&!U.attr("__ngf_ie10_Fix_")){if(!U[0].parentNode)return void(U=null);e.preventDefault(),e.stopPropagation(),U.unbind("click");var t=U.clone();return U.replaceWith(t),U=t,U.attr("__ngf_ie10_Fix_","true"),U.bind("change",d),U.bind("click",$),U[0].click(),!1}U.removeAttr("__ngf_ie10_Fix_")}var y=function(e,t){return u.attrGetter(e,n,t)};u.registerModelChangeValidator(r,n,e);var b=[];b.push(e.$watch(y("ngfMultiple"),function(){U.attr("multiple",y("ngfMultiple",e))})),b.push(e.$watch(y("ngfCapture"),function(){U.attr("capture",y("ngfCapture",e))})),b.push(e.$watch(y("ngfAccept"),function(){U.attr("accept",y("ngfAccept",e))})),n.$observe("accept",function(){U.attr("accept",y("accept"))}),b.push(function(){n.$$observers&&delete n.$$observers.accept});var w=0,U=t;f()||(U=h()),U.bind("change",d),f()?t.bind("click",v):t.bind("click touchstart touchend",p),-1!==navigator.appVersion.indexOf("MSIE 10")&&U.bind("click",$),r&&r.$formatters.push(function(e){return null!=e&&0!==e.length||U.val()&&U.val(null),e}),e.$on("$destroy",function(){f()||U.parent().remove(),angular.forEach(b,function(e){e()})}),l(function(){for(var e=0;e<o.length;e++){var t=o[e];document.body.contains(t.el[0])||(o.splice(e,1),t.ref.remove())}}),window.FileAPI&&window.FileAPI.ngfFixIE&&window.FileAPI.ngfFixIE(t,U,d)}var o=[];return{restrict:"AEC",require:"?ngModel",link:function(i,o,l,s){a(i,o,l,s,e,t,n,r)}}}]),function(){function e(e){return"img"===e.tagName.toLowerCase()?"image":"audio"===e.tagName.toLowerCase()?"audio":"video"===e.tagName.toLowerCase()?"video":/./}function t(t,n,r,i,a,o,l,s){function u(e){var o=t.attrGetter("ngfNoObjectUrl",a,r);t.dataUrl(e,o)["finally"](function(){n(function(){var t=(o?e.$ngfDataUrl:e.$ngfBlobUrl)||e.$ngfDataUrl;s?i.css("background-image","url('"+(t||"")+"')"):i.attr("src",t),t?i.removeClass("ng-hide"):i.addClass("ng-hide")})})}n(function(){var n=r.$watch(a[o],function(n){var r=l;if("ngfThumbnail"===o&&(r||(r={width:i[0].clientWidth,height:i[0].clientHeight}),0===r.width&&window.getComputedStyle)){var a=getComputedStyle(i[0]);r={width:parseInt(a.width.slice(0,-2)),height:parseInt(a.height.slice(0,-2))}}return angular.isString(n)?(i.removeClass("ng-hide"),s?i.css("background-image","url('"+n+"')"):i.attr("src",n)):void(!n||!n.type||0!==n.type.search(e(i[0]))||s&&0!==n.type.indexOf("image")?i.addClass("ng-hide"):r&&t.isResizeSupported()?t.resize(n,r.width,r.height,r.quality).then(function(e){u(e)},function(e){throw e}):u(n))});r.$on("$destroy",function(){n()})})}ngFileUpload.service("UploadDataUrl",["UploadBase","$timeout","$q",function(e,t,n){var r=e;return r.base64DataUrl=function(e){if(angular.isArray(e)){var t=n.defer(),i=0;return angular.forEach(e,function(n){r.dataUrl(n,!0)["finally"](function(){if(i++,i===e.length){var n=[];angular.forEach(e,function(e){n.push(e.$ngfDataUrl)}),t.resolve(n,e)}})}),t.promise}return r.dataUrl(e,!0)},r.dataUrl=function(e,i){if(!e)return r.emptyPromise(e,e);if(i&&null!=e.$ngfDataUrl||!i&&null!=e.$ngfBlobUrl)return r.emptyPromise(i?e.$ngfDataUrl:e.$ngfBlobUrl,e);var a=i?e.$$ngfDataUrlPromise:e.$$ngfBlobUrlPromise;if(a)return a;var o=n.defer();return t(function(){if(window.FileReader&&e&&(!window.FileAPI||-1===navigator.userAgent.indexOf("MSIE 8")||e.size<2e4)&&(!window.FileAPI||-1===navigator.userAgent.indexOf("MSIE 9")||e.size<4e6)){var n=window.URL||window.webkitURL;if(n&&n.createObjectURL&&!i){var a;try{a=n.createObjectURL(e)}catch(l){return void t(function(){e.$ngfBlobUrl="",o.reject()})}t(function(){if(e.$ngfBlobUrl=a,a){o.resolve(a,e),r.blobUrls=r.blobUrls||[],r.blobUrlsTotalSize=r.blobUrlsTotalSize||0,r.blobUrls.push({url:a,size:e.size}),r.blobUrlsTotalSize+=e.size||0;for(var t=r.defaults.blobUrlsMaxMemory||268435456,i=r.defaults.blobUrlsMaxQueueSize||200;(r.blobUrlsTotalSize>t||r.blobUrls.length>i)&&r.blobUrls.length>1;){var l=r.blobUrls.splice(0,1)[0];n.revokeObjectURL(l.url),r.blobUrlsTotalSize-=l.size}}})}else{var s=new FileReader;s.onload=function(n){t(function(){e.$ngfDataUrl=n.target.result,o.resolve(n.target.result,e),t(function(){delete e.$ngfDataUrl},1e3)})},s.onerror=function(){t(function(){e.$ngfDataUrl="",o.reject()})},s.readAsDataURL(e)}}else t(function(){e[i?"$ngfDataUrl":"$ngfBlobUrl"]="",o.reject()})}),a=i?e.$$ngfDataUrlPromise=o.promise:e.$$ngfBlobUrlPromise=o.promise,a["finally"](function(){delete e[i?"$$ngfDataUrlPromise":"$$ngfBlobUrlPromise"]}),a},r}]),ngFileUpload.directive("ngfSrc",["Upload","$timeout",function(e,n){return{restrict:"AE",link:function(r,i,a){t(e,n,r,i,a,"ngfSrc",e.attrGetter("ngfResize",a,r),!1)}}}]),ngFileUpload.directive("ngfBackground",["Upload","$timeout",function(e,n){return{restrict:"AE",link:function(r,i,a){t(e,n,r,i,a,"ngfBackground",e.attrGetter("ngfResize",a,r),!0)}}}]),ngFileUpload.directive("ngfThumbnail",["Upload","$timeout",function(e,n){return{restrict:"AE",link:function(r,i,a){var o=e.attrGetter("ngfSize",a,r);t(e,n,r,i,a,"ngfThumbnail",o,e.attrGetter("ngfAsBackground",a,r))}}}]),ngFileUpload.config(["$compileProvider",function(e){e.imgSrcSanitizationWhitelist&&e.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|local|file|data|blob):/),e.aHrefSanitizationWhitelist&&e.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|local|file|data|blob):/)}]),ngFileUpload.filter("ngfDataUrl",["UploadDataUrl","$sce",function(e,t){return function(n,r,i){if(angular.isString(n))return t.trustAsResourceUrl(n);var a=n&&((r?n.$ngfDataUrl:n.$ngfBlobUrl)||n.$ngfDataUrl);return n&&!a?(!n.$ngfDataUrlFilterInProgress&&angular.isObject(n)&&(n.$ngfDataUrlFilterInProgress=!0,e.dataUrl(n,r)),""):(n&&delete n.$ngfDataUrlFilterInProgress,(n&&a?i?t.trustAsResourceUrl(a):a:n)||"")}}])}(),ngFileUpload.service("UploadValidate",["UploadDataUrl","$q","$timeout",function(e,t,n){function r(e){var t="",n=[];if(e.length>2&&"/"===e[0]&&"/"===e[e.length-1])t=e.substring(1,e.length-1);else{var i=e.split(",");if(i.length>1)for(var a=0;a<i.length;a++){var o=r(i[a]);o.regexp?(t+="("+o.regexp+")",a<i.length-1&&(t+="|")):n=n.concat(o.excludes)}else 0===e.indexOf("!")?n.push("^((?!"+r(e.substring(1)).regexp+").)*$"):(0===e.indexOf(".")&&(e="*"+e),t="^"+e.replace(new RegExp("[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]","g"),"\\$&")+"$",t=t.replace(/\\\*/g,".*").replace(/\\\?/g,"."))}return{regexp:t,excludes:n}}function i(e,t){null==t||e.$dirty||(e.$setDirty?e.$setDirty():e.$dirty=!0)}var a=e;return a.validatePattern=function(e,t){if(!t)return!0;var n=r(t),i=!0;if(n.regexp&&n.regexp.length){var a=new RegExp(n.regexp,"i");i=null!=e.type&&a.test(e.type)||null!=e.name&&a.test(e.name)}for(var o=n.excludes.length;o--;){var l=new RegExp(n.excludes[o],"i");i=i&&(null==e.type||l.test(e.type))&&(null==e.name||l.test(e.name))}return i},a.ratioToFloat=function(e){var t=e.toString(),n=t.search(/[x:]/i);return t=n>-1?parseFloat(t.substring(0,n))/parseFloat(t.substring(n+1)):parseFloat(t)},a.registerModelChangeValidator=function(e,t,n){e&&e.$formatters.push(function(r){e.$dirty&&(r&&!angular.isArray(r)&&(r=[r]),a.validate(r,0,e,t,n).then(function(){a.applyModelValidation(e,r)}))})},a.applyModelValidation=function(e,t){i(e,t),angular.forEach(e.$ngfValidations,function(t){e.$setValidity(t.name,t.valid)})},a.getValidationAttr=function(e,t,n,r,i){var o="ngf"+n[0].toUpperCase()+n.substr(1),l=a.attrGetter(o,e,t,{$file:i});if(null==l&&(l=a.attrGetter("ngfValidate",e,t,{$file:i}))){var s=(r||n).split(".");l=l[s[0]],s.length>1&&(l=l&&l[s[1]])}return l},a.validate=function(e,n,r,i,o){function l(t,n,l){if(e){for(var s=e.length,u=null;s--;){var f=e[s];if(f){var c=a.getValidationAttr(i,o,t,n,f);null!=c&&(l(f,c,s)||(f.$error=t,(f.$errorMessages=f.$errorMessages||{})[t]=!0,f.$errorParam=c,e.splice(s,1),u=!1))}}null!==u&&r.$ngfValidations.push({name:t,valid:u})}}function s(n,l,s,f,c){function d(e,t,r){null!=r?f(t,r).then(function(i){c(i,r)?e.resolve():(t.$error=n,(t.$errorMessages=t.$errorMessages||{})[n]=!0,t.$errorParam=r,e.reject())},function(){u("ngfValidateForce",{$file:t})?(t.$error=n,(t.$errorMessages=t.$errorMessages||{})[n]=!0,t.$errorParam=r,e.reject()):e.resolve()}):e.resolve()}var g=[a.emptyPromise()];return e?(e=void 0===e.length?[e]:e,angular.forEach(e,function(e){var r=t.defer();return g.push(r.promise),!s||null!=e.type&&0===e.type.search(s)?void("dimensions"===n&&null!=a.attrGetter("ngfDimensions",i)?a.imageDimensions(e).then(function(t){d(r,e,u("ngfDimensions",{$file:e,$width:t.width,$height:t.height}))},function(){r.reject()}):"duration"===n&&null!=a.attrGetter("ngfDuration",i)?a.mediaDuration(e).then(function(t){d(r,e,u("ngfDuration",{$file:e,$duration:t}))},function(){r.reject()}):d(r,e,a.getValidationAttr(i,o,n,l,e))):void r.resolve()}),t.all(g).then(function(){r.$ngfValidations.push({name:n,valid:!0})},function(){r.$ngfValidations.push({name:n,valid:!1})})):void 0}r=r||{},r.$ngfValidations=r.$ngfValidations||[],angular.forEach(r.$ngfValidations,function(e){e.valid=!0});var u=function(e,t){return a.attrGetter(e,i,o,t)};if(null==e||0===e.length)return a.emptyPromise(r);e=void 0===e.length?[e]:e.slice(0),l("maxFiles",null,function(e,t,r){return t>n+r}),l("pattern",null,a.validatePattern),l("minSize","size.min",function(e,t){return e.size+.1>=a.translateScalars(t)}),l("maxSize","size.max",function(e,t){return e.size-.1<=a.translateScalars(t)});var f=0;if(l("maxTotalSize",null,function(t,n){return f+=t.size,f>a.translateScalars(n)?(e.splice(0,e.length),!1):!0}),l("validateFn",null,function(e,t){return t===!0||null===t||""===t}),!e.length)return a.emptyPromise(r,r.$ngfValidations);var c=t.defer(),d=[];return d.push(a.happyPromise(s("maxHeight","height.max",/image/,this.imageDimensions,function(e,t){return e.height<=t}))),d.push(a.happyPromise(s("minHeight","height.min",/image/,this.imageDimensions,function(e,t){return e.height>=t}))),d.push(a.happyPromise(s("maxWidth","width.max",/image/,this.imageDimensions,function(e,t){return e.width<=t}))),d.push(a.happyPromise(s("minWidth","width.min",/image/,this.imageDimensions,function(e,t){return e.width>=t}))),d.push(a.happyPromise(s("dimensions",null,/image/,function(e,t){return a.emptyPromise(t)},function(e){return e}))),d.push(a.happyPromise(s("ratio",null,/image/,this.imageDimensions,function(e,t){for(var n=t.toString().split(","),r=!1,i=0;i<n.length;i++)Math.abs(e.width/e.height-a.ratioToFloat(n[i]))<1e-4&&(r=!0);return r}))),d.push(a.happyPromise(s("maxRatio","ratio.max",/image/,this.imageDimensions,function(e,t){return e.width/e.height-a.ratioToFloat(t)<1e-4}))),d.push(a.happyPromise(s("minRatio","ratio.min",/image/,this.imageDimensions,function(e,t){return e.width/e.height-a.ratioToFloat(t)>-1e-4}))),d.push(a.happyPromise(s("maxDuration","duration.max",/audio|video/,this.mediaDuration,function(e,t){return e<=a.translateScalars(t)}))),d.push(a.happyPromise(s("minDuration","duration.min",/audio|video/,this.mediaDuration,function(e,t){return e>=a.translateScalars(t)}))),d.push(a.happyPromise(s("duration",null,/audio|video/,function(e,t){return a.emptyPromise(t)},function(e){return e}))),d.push(a.happyPromise(s("validateAsyncFn",null,null,function(e,t){return t},function(e){return e===!0||null===e||""===e}))),t.all(d).then(function(){c.resolve(r,r.$ngfValidations)})},a.imageDimensions=function(e){if(e.$ngfWidth&&e.$ngfHeight){var r=t.defer();return n(function(){r.resolve({width:e.$ngfWidth,height:e.$ngfHeight})}),r.promise}if(e.$ngfDimensionPromise)return e.$ngfDimensionPromise;var i=t.defer();return n(function(){return 0!==e.type.indexOf("image")?void i.reject("not image"):void a.dataUrl(e).then(function(t){function r(){var t=l[0].clientWidth,n=l[0].clientHeight;l.remove(),e.$ngfWidth=t,e.$ngfHeight=n,i.resolve({width:t,height:n})}function a(){l.remove(),i.reject("load error")}function o(){n(function(){l[0].parentNode&&(l[0].clientWidth?r():s>10?a():o())},1e3)}var l=angular.element("<img>").attr("src",t).css("visibility","hidden").css("position","fixed").css("max-width","none !important").css("max-height","none !important");l.on("load",r),l.on("error",a);var s=0;o(),angular.element(document.getElementsByTagName("body")[0]).append(l)},function(){i.reject("load error")})}),e.$ngfDimensionPromise=i.promise,e.$ngfDimensionPromise["finally"](function(){delete e.$ngfDimensionPromise}),e.$ngfDimensionPromise},a.mediaDuration=function(e){if(e.$ngfDuration){var r=t.defer();return n(function(){r.resolve(e.$ngfDuration)}),r.promise}if(e.$ngfDurationPromise)return e.$ngfDurationPromise;var i=t.defer();return n(function(){return 0!==e.type.indexOf("audio")&&0!==e.type.indexOf("video")?void i.reject("not media"):void a.dataUrl(e).then(function(t){function r(){var t=l[0].duration;e.$ngfDuration=t,l.remove(),i.resolve(t)}function a(){l.remove(),i.reject("load error")}function o(){n(function(){l[0].parentNode&&(l[0].duration?r():s>10?a():o())},1e3)}var l=angular.element(0===e.type.indexOf("audio")?"<audio>":"<video>").attr("src",t).css("visibility","none").css("position","fixed");l.on("loadedmetadata",r),l.on("error",a);var s=0;o(),angular.element(document.body).append(l)},function(){i.reject("load error")})}),e.$ngfDurationPromise=i.promise,e.$ngfDurationPromise["finally"](function(){delete e.$ngfDurationPromise}),e.$ngfDurationPromise},a}]),ngFileUpload.service("UploadResize",["UploadValidate","$q",function(e,t){var n=e,r=function(e,t,n,r,i){var a=i?Math.max(n/e,r/t):Math.min(n/e,r/t);return{width:e*a,height:t*a,marginX:e*a-n,marginY:t*a-r}},i=function(e,i,a,o,l,s,u,f){var c=t.defer(),d=document.createElement("canvas"),g=document.createElement("img");return g.onload=function(){if(null!=f&&f(g.width,g.height)===!1)return void c.reject("resizeIf");try{if(s){var e=n.ratioToFloat(s),t=g.width/g.height;e>t?(i=g.width,a=i/e):(a=g.height,i=a*e)}i||(i=g.width),a||(a=g.height);var h=r(g.width,g.height,i,a,u);d.width=Math.min(h.width,i),d.height=Math.min(h.height,a);var p=d.getContext("2d");p.drawImage(g,Math.min(0,-h.marginX/2),Math.min(0,-h.marginY/2),h.width,h.height),c.resolve(d.toDataURL(l||"image/WebP",o||.934))}catch(m){c.reject(m)}},g.onerror=function(){c.reject()},g.src=e,c.promise};return n.dataUrltoBlob=function(e,t,n){for(var r=e.split(","),i=r[0].match(/:(.*?);/)[1],a=atob(r[1]),o=a.length,l=new Uint8Array(o);o--;)l[o]=a.charCodeAt(o);var s=new window.Blob([l],{type:i});return s.name=t,s.$ngfOrigSize=n,s},n.isResizeSupported=function(){var e=document.createElement("canvas");return window.atob&&e.getContext&&e.getContext("2d")&&window.Blob},n.isResizeSupported()&&Object.defineProperty(window.Blob.prototype,"name",{get:function(){return this.$ngfName},set:function(e){this.$ngfName=e},configurable:!0}),n.resize=function(e,r,a,o,l,s,u,f,c){if(0!==e.type.indexOf("image"))return n.emptyPromise(e);var d=t.defer();return n.dataUrl(e,!0).then(function(t){i(t,r,a,o,l||e.type,s,u,f).then(function(r){if("image/jpeg"===e.type&&c)try{r=n.restoreExif(t,r)}catch(i){setTimeout(function(){throw i},1)}try{var a=n.dataUrltoBlob(r,e.name,e.size);d.resolve(a)}catch(i){d.reject(i)}},function(t){"resizeIf"===t&&d.resolve(e),d.reject(t)})},function(e){d.reject(e)}),d.promise},n}]),function(){function e(e,n,r,i,a,o,l,s,u,f){function c(){return n.attr("disabled")||v("ngfDropDisabled",e)}function d(t,n){s.updateModel(i,r,e,v("ngfChange")||v("ngfDrop"),t,n)}function g(t,n){if(!s.shouldUpdateOn(t,r,e)||!n)return s.rejectPromise([]);var i=[];n.replace(/<(img src|img [^>]* src) *=\"([^\"]*)\"/gi,function(e,t,n){i.push(n)});var a=[],o=[];if(i.length){angular.forEach(i,function(e){a.push(s.urlToBlob(e).then(function(e){o.push(e)}))});var l=f.defer();return f.all(a).then(function(){l.resolve(o)},function(e){l.reject(e)}),l.promise}return s.emptyPromise()}function h(e,t,n,r){var i=v("ngfDragOverClass",e,{$event:n}),a="dragover";if(angular.isString(i))a=i;else if(i&&(i.delay&&(w=i.delay),i.accept||i.reject)){var o=n.dataTransfer.items;if(null!=o&&o.length)for(var l=i.pattern||v("ngfPattern",e,{$event:n}),u=o.length;u--;){if(!s.validatePattern(o[u],l)){a=i.reject;break}a=i.accept}else a=i.accept}r(a)}function p(t,n,i,a){function o(e,t){var n=f.defer();if(null!=e)if(e.isDirectory){var r=[s.emptyPromise()];if(d){var i={type:"directory"};i.name=i.path=(t||"")+e.name+e.name,g.push(i)}var a=e.createReader(),l=[],p=function(){a.readEntries(function(i){try{i.length?(l=l.concat(Array.prototype.slice.call(i||[],0)),p()):(angular.forEach(l.slice(0),function(n){g.length<=u&&c>=h&&r.push(o(n,(t?t:"")+e.name+"/"))}),f.all(r).then(function(){n.resolve()},function(e){n.reject(e)}))}catch(a){n.reject(a)}},function(e){n.reject(e)})};p()}else e.file(function(e){try{e.path=(t?t:"")+e.name,d&&(e=s.rename(e,e.path)),g.push(e),h+=e.size,n.resolve()}catch(r){n.reject(r)}},function(e){n.reject(e)});return n.promise}var u=s.getValidationAttr(r,e,"maxFiles")||Number.MAX_VALUE,c=s.getValidationAttr(r,e,"maxTotalSize")||Number.MAX_VALUE,d=v("ngfIncludeDir",e),g=[],h=0,p=[s.emptyPromise()];if(t&&t.length>0&&"file"!==l.protocol())for(var m=0;m<t.length;m++){if(t[m].webkitGetAsEntry&&t[m].webkitGetAsEntry()&&t[m].webkitGetAsEntry().isDirectory){var $=t[m].webkitGetAsEntry();if($.isDirectory&&!i)continue;null!=$&&p.push(o($))}else{var y=t[m].getAsFile();null!=y&&(g.push(y),h+=y.size)}if(g.length>u||h>c||!a&&g.length>0)break}else if(null!=n)for(var b=0;b<n.length;b++){var w=n.item(b);if((w.type||w.size>0)&&(g.push(w),h+=w.size),g.length>u||h>c||!a&&g.length>0)break}var U=f.defer();return f.all(p).then(function(){if(a||d||!g.length)U.resolve(g);else{for(var e=0;g[e]&&"directory"===g[e].type;)e++;U.resolve([g[e]])}},function(e){U.reject(e)}),U.promise}var m=t(),v=function(e,t,n){return s.attrGetter(e,r,t,n)};if(v("dropAvailable")&&o(function(){e[v("dropAvailable")]?e[v("dropAvailable")].value=m:e[v("dropAvailable")]=m}),!m)return void(v("ngfHideOnDropNotAvailable",e)===!0&&n.css("display","none"));null==v("ngfSelect")&&s.registerModelChangeValidator(i,r,e);var $,y=null,b=a(v("ngfStopPropagation")),w=1;n[0].addEventListener("dragover",function(t){if(!c()&&s.shouldUpdateOn("drop",r,e)){if(t.preventDefault(),b(e)&&t.stopPropagation(),navigator.userAgent.indexOf("Chrome")>-1){var i=t.dataTransfer.effectAllowed;t.dataTransfer.dropEffect="move"===i||"linkMove"===i?"move":"copy"}o.cancel(y),$||($="C",h(e,r,t,function(r){$=r,n.addClass($),v("ngfDrag",e,{$isDragging:!0,$class:$,$event:t})}))}},!1),n[0].addEventListener("dragenter",function(t){!c()&&s.shouldUpdateOn("drop",r,e)&&(t.preventDefault(),b(e)&&t.stopPropagation())},!1),n[0].addEventListener("dragleave",function(t){!c()&&s.shouldUpdateOn("drop",r,e)&&(t.preventDefault(),b(e)&&t.stopPropagation(),y=o(function(){$&&n.removeClass($),$=null,v("ngfDrag",e,{$isDragging:!1,$event:t})},w||100))},!1),n[0].addEventListener("drop",function(t){if(!c()&&s.shouldUpdateOn("drop",r,e)){t.preventDefault(),b(e)&&t.stopPropagation(),$&&n.removeClass($),$=null;var i,a=t.dataTransfer.items;try{i=t.dataTransfer&&t.dataTransfer.getData&&t.dataTransfer.getData("text/html")}catch(o){}p(a,t.dataTransfer.files,v("ngfAllowDir",e)!==!1,v("multiple")||v("ngfMultiple",e)).then(function(e){e.length?d(e,t):g("dropUrl",i).then(function(e){d(e,t)})})}},!1),n[0].addEventListener("paste",function(t){if(navigator.userAgent.toLowerCase().indexOf("firefox")>-1&&v("ngfEnableFirefoxPaste",e)&&t.preventDefault(),!c()&&s.shouldUpdateOn("paste",r,e)){var n=[],i=t.clipboardData||t.originalEvent.clipboardData;if(i&&i.items)for(var a=0;a<i.items.length;a++)-1!==i.items[a].type.indexOf("image")&&n.push(i.items[a].getAsFile());n.length?d(n,t):g("pasteUrl",i).then(function(e){d(e,t)})}},!1),navigator.userAgent.toLowerCase().indexOf("firefox")>-1&&v("ngfEnableFirefoxPaste",e)&&(n.attr("contenteditable",!0),n.on("keypress",function(e){e.metaKey||e.ctrlKey||e.preventDefault()}))}function t(){var e=document.createElement("div");return"draggable"in e&&"ondrop"in e&&!/Edge\/12./i.test(navigator.userAgent)}ngFileUpload.directive("ngfDrop",["$parse","$timeout","$location","Upload","$http","$q",function(t,n,r,i,a,o){
return{restrict:"AEC",require:"?ngModel",link:function(l,s,u,f){e(l,s,u,f,t,n,r,i,a,o)}}}]),ngFileUpload.directive("ngfNoFileDrop",function(){return function(e,n){t()&&n.css("display","none")}}),ngFileUpload.directive("ngfDropAvailable",["$parse","$timeout","Upload",function(e,n,r){return function(i,a,o){if(t()){var l=e(r.attrGetter("ngfDropAvailable",o));n(function(){l(i),l.assign&&l.assign(i,!0)})}}}])}(),ngFileUpload.service("UploadExif",["UploadResize","$q",function(e,t){function n(e,t,n,r){switch(t){case 2:return e.transform(-1,0,0,1,n,0);case 3:return e.transform(-1,0,0,-1,n,r);case 4:return e.transform(1,0,0,-1,0,r);case 5:return e.transform(0,1,1,0,0,0);case 6:return e.transform(0,1,-1,0,r,0);case 7:return e.transform(0,-1,-1,0,r,n);case 8:return e.transform(0,-1,1,0,0,n)}}function r(e){for(var t="",n=new Uint8Array(e),r=n.byteLength,i=0;r>i;i++)t+=String.fromCharCode(n[i]);return window.btoa(t)}var i=e;return i.isExifSupported=function(){return window.FileReader&&(new FileReader).readAsArrayBuffer&&i.isResizeSupported()},i.readOrientation=function(e){var n=t.defer(),r=new FileReader,i=e.slice?e.slice(0,65536):e;return r.readAsArrayBuffer(i),r.onerror=function(e){return n.reject(e)},r.onload=function(e){var t={orientation:1},r=new DataView(this.result);if(65496!==r.getUint16(0,!1))return n.resolve(t);for(var i=r.byteLength,a=2;i>a;){var o=r.getUint16(a,!1);if(a+=2,65505===o){if(1165519206!==r.getUint32(a+=2,!1))return n.resolve(t);var l=18761===r.getUint16(a+=6,!1);a+=r.getUint32(a+4,l);var s=r.getUint16(a,l);a+=2;for(var u=0;s>u;u++)if(274===r.getUint16(a+12*u,l)){var f=r.getUint16(a+12*u+8,l);return f>=2&&8>=f&&(r.setUint16(a+12*u+8,1,l),t.fixedArrayBuffer=e.target.result),t.orientation=f,n.resolve(t)}}else{if(65280!==(65280&o))break;a+=r.getUint16(a,!1)}}return n.resolve(t)},n.promise},i.applyExifRotation=function(e){if(0!==e.type.indexOf("image/jpeg"))return i.emptyPromise(e);var a=t.defer();return i.readOrientation(e).then(function(t){return t.orientation<2||t.orientation>8?a.resolve(e):void i.dataUrl(e,!0).then(function(o){var l=document.createElement("canvas"),s=document.createElement("img");s.onload=function(){try{l.width=t.orientation>4?s.height:s.width,l.height=t.orientation>4?s.width:s.height;var o=l.getContext("2d");n(o,t.orientation,s.width,s.height),o.drawImage(s,0,0);var u=l.toDataURL(e.type||"image/WebP",.934);u=i.restoreExif(r(t.fixedArrayBuffer),u);var f=i.dataUrltoBlob(u,e.name);a.resolve(f)}catch(c){return a.reject(c)}},s.onerror=function(){a.reject()},s.src=o},function(e){a.reject(e)})},function(e){a.reject(e)}),a.promise},i.restoreExif=function(e,t){var n={};return n.KEY_STR="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",n.encode64=function(e){var t,n,r,i,a,o="",l="",s="",u=0;do t=e[u++],n=e[u++],l=e[u++],r=t>>2,i=(3&t)<<4|n>>4,a=(15&n)<<2|l>>6,s=63&l,isNaN(n)?a=s=64:isNaN(l)&&(s=64),o=o+this.KEY_STR.charAt(r)+this.KEY_STR.charAt(i)+this.KEY_STR.charAt(a)+this.KEY_STR.charAt(s),t=n=l="",r=i=a=s="";while(u<e.length);return o},n.restore=function(e,t){e.match("data:image/jpeg;base64,")&&(e=e.replace("data:image/jpeg;base64,",""));var n=this.decode64(e),r=this.slice2Segments(n),i=this.exifManipulation(t,r);return"data:image/jpeg;base64,"+this.encode64(i)},n.exifManipulation=function(e,t){var n=this.getExifArray(t),r=this.insertExif(e,n);return new Uint8Array(r)},n.getExifArray=function(e){for(var t,n=0;n<e.length;n++)if(t=e[n],255===t[0]&225===t[1])return t;return[]},n.insertExif=function(e,t){var n=e.replace("data:image/jpeg;base64,",""),r=this.decode64(n),i=r.indexOf(255,3),a=r.slice(0,i),o=r.slice(i),l=a;return l=l.concat(t),l=l.concat(o)},n.slice2Segments=function(e){for(var t=0,n=[];;){if(255===e[t]&218===e[t+1])break;if(255===e[t]&216===e[t+1])t+=2;else{var r=256*e[t+2]+e[t+3],i=t+r+2,a=e.slice(t,i);n.push(a),t=i}if(t>e.length)break}return n},n.decode64=function(e){var t,n,r,i,a,o="",l="",s=0,u=[],f=/[^A-Za-z0-9\+\/\=]/g;f.exec(e)&&console.log("There were invalid base64 characters in the input text.\nValid base64 characters are A-Z, a-z, 0-9, NaNExpect errors in decoding."),e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");do r=this.KEY_STR.indexOf(e.charAt(s++)),i=this.KEY_STR.indexOf(e.charAt(s++)),a=this.KEY_STR.indexOf(e.charAt(s++)),l=this.KEY_STR.indexOf(e.charAt(s++)),t=r<<2|i>>4,n=(15&i)<<4|a>>2,o=(3&a)<<6|l,u.push(t),64!==a&&u.push(n),64!==l&&u.push(o),t=n=o="",r=i=a=l="";while(s<e.length);return u},n.restore(e,t)},i}]);;;
!function(e,t){"use strict";"function"==typeof define&&define.amd?define(["angular"],t):e.hasOwnProperty("angular")?t(e.angular):"object"==typeof exports&&(module.exports=t(require("angular")))}(this,function(e){"use strict";function t(t){return function(){var n="ngStorage-";this.setKeyPrefix=function(e){if("string"!=typeof e)throw new TypeError("[ngStorage] - "+t+"Provider.setKeyPrefix() expects a String.");n=e};var r=e.toJson,o=e.fromJson;this.setSerializer=function(e){if("function"!=typeof e)throw new TypeError("[ngStorage] - "+t+"Provider.setSerializer expects a function.");r=e},this.setDeserializer=function(e){if("function"!=typeof e)throw new TypeError("[ngStorage] - "+t+"Provider.setDeserializer expects a function.");o=e},this.get=function(e){return o(window[t].getItem(n+e))},this.set=function(e,o){return window[t].setItem(n+e,r(o))},this.$get=["$rootScope","$window","$log","$timeout","$document",function(i,a,s,c,u){function f(e){var t;try{t=a[e]}catch(n){t=!1}if(t&&"localStorage"===e){var r="__"+Math.round(1e7*Math.random());try{localStorage.setItem(r,r),localStorage.removeItem(r)}catch(n){t=!1}}return t}var l,d,p=n.length,g=f(t)||(s.warn("This browser does not support Web Storage!"),{setItem:e.noop,getItem:e.noop,removeItem:e.noop}),y={$default:function(t){for(var n in t)e.isDefined(y[n])||(y[n]=e.copy(t[n]));return y.$sync(),y},$reset:function(e){for(var t in y)"$"===t[0]||delete y[t]&&g.removeItem(n+t);return y.$default(e)},$sync:function(){for(var e,t=0,r=g.length;r>t;t++)(e=g.key(t))&&n===e.slice(0,p)&&(y[e.slice(p)]=o(g.getItem(e)))},$apply:function(){var t;if(d=null,!e.equals(y,l)){t=e.copy(l),e.forEach(y,function(o,i){e.isDefined(o)&&"$"!==i[0]&&(g.setItem(n+i,r(o)),delete t[i])});for(var o in t)g.removeItem(n+o);l=e.copy(y)}}};return y.$sync(),l=e.copy(y),i.$watch(function(){d||(d=c(y.$apply,100,!1))}),a.addEventListener&&a.addEventListener("storage",function(t){if(t.key){var r=u[0];r.hasFocus&&r.hasFocus()||n!==t.key.slice(0,p)||(t.newValue?y[t.key.slice(p)]=o(t.newValue):delete y[t.key.slice(p)],l=e.copy(y),i.$apply())}}),a.addEventListener&&a.addEventListener("beforeunload",function(){y.$apply()}),y}]}}return e=e&&e.module?e:window.angular,e.module("ngStorage",[]).provider("$localStorage",t("localStorage")).provider("$sessionStorage",t("sessionStorage"))});;;
module.controller('LoginCtrl', ['$log', '$q', '$rootScope', 'LoginService', 'UserService', '$scope', '$state', '$atajoUiPopup', '$atajoUiHistory',
    function($log, $q, $rootScope, LoginService, UserService, $scope, $state, $atajoUiPopup, $atajoUiHistory) {
        $scope.buttonText = 'SIGN IN';

        $scope.userCredentials = {
            userId: ''
        }

        $scope.login = function() {
            $scope.buttonText = 'SIGNING IN...';
            if ($scope.userCredentials.userId == '') {
                showAlert('Enter Your User ID!', 'Please enter your User ID, before signing in.');
                $scope.buttonText = 'SIGN IN';
                return;
            }

            if ($scope.userCredentials.token) {
                $atajoUiHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go('dash');
            } else {
                atajo.api.auth($scope.userCredentials, function(result, data) {
                    $scope.buttonText = 'SIGN IN';

                    if (result) {
                        $scope.userCredentials.token = data.token;

                        $scope.buttonText = 'OK';
                        $atajoUiHistory.nextViewOptions({
                            historyRoot: true
                        });
                        $state.go('dash');
                    } else {
                        showAlert('Signin Failed', 'Your signin attempt failed.');
                    }
                });
            }
        };

        function showAlert(title, message) {
            $atajoUiPopup.alert({
                title: title,
                template: message,
                okType: 'button-royal'
            });
        }
    }
]);;;
module.factory('LoginService', ['HandlerAPI', function(HandlerAPI) {
    var handlerName = 'account';
    return {
        login: function(credentials) {
            return HandlerAPI.promiseAuth(credentials);
        },

        changePassword: function(data) {
            return HandlerAPI.promiseRequest(handlerName, 'changePassword', { account: data });
        }
    }
}]);;;

(function() {
  /**
   * Decimal adjustment of a number.
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
   * 
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */
  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }
})();;;
module.controller('ModeCtrl', [
    '$log', '$q', '$rootScope', 'LoginService', 'UserService', '$scope', '$state', '$atajoUiPopup', '$atajoUiHistory',
    function($log, $q, $rootScope, LoginService, UserService, $scope, $state, $atajoUiPopup, $atajoUiHistory) {
        var ctrl = this;

        $scope.startTracking = function(mode) {
            //persist mode
            $atajoUiHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('track', {
                mode: mode
            });
        }

    }
]);;;
module.controller('MoreCtrl', ['$scope', '$rootScope', '$state', '$atajoUiActionSheet', '$atajoUiHistory',
    function($scope, $rootScope, $state, $atajoUiActionSheet, $atajoUiHistory) {


        $scope.isAndroid = function() {
            return atajoui.Platform.isAndroid();
        };

        $scope.openLiveTracking = function() {
            var url = "https://Admin:Ch3ddl3t0n@www.dimensiondata.live/dash/index.html?load=/dash/saved_dashboards/dash_20160608.json";
            var inAppBrowserRef = undefined;
            inAppBrowserRef = cordova.InAppBrowser.open(url, '_blank', 'location=no,enableViewportScale=yes,presentationstyle=pagesheet,suppressesIncrementalRendering=yes,toolbarposition=top');
        };

        //-------------------
        $scope.openLogoutSheet = function() {
            $atajoUiActionSheet.show({
                titleText: 'Do you want to logout?',
                cancelText: 'Cancel',
                destructiveText: !atajoui.Platform.isIOS() ? '<i class="icon ion-log-out assertive"></i> Log Out' : 'Log Out',
                cancel: function() {},
                destructiveButtonClicked: function() {
                    $rootScope.clearProfile();
                    $atajoUiHistory.clearHistory();
                    $atajoUiHistory.clearCache();
                    $state.go('login');
                    return true;
                }
            });
        };
    }
]);;;

module.service('dataService', function() {


    this.currentCatalogue = {};
    this.currentService = {};


    this.getCredentials = function() {


        try {

            return JSON.parse(window.localStorage.getItem('credentials'));

        } catch (e) {

            return {
         	 	 username : '',
         	 	 password : '',
         	 }

        }

    }

    this.setCredentials = function(credentials) {

        window.localStorage.setItem('credentials', JSON.stringify(credentials));


    }


    this.getCurrentCatalogue = function()
    {

       return this.currentCatalogue;

    };

     this.getCurrentService = function()
    {


       return this.currentService;

    };



    this.setCurrentCatalogue = function(catalogue)
    {

       this.currentCatalogue = catalogue;

    };


    this.setCurrentService = function(service)
    {
       atajo.log.d("SETTING SERVICE : "+JSON.stringify(service));
       this.currentService = service;

    };

    this.setCurrentCollateral = function(collateral)
    {

       this.currentCollateral = collateral;
    }

    this.getCurrentCollateral = function()
    {

       return this.currentCollateral;
    }










});
;;

module.service('syncService', function() {

  /*
  "SERVICES":
      [
          {
            "service"  : "menu",
            "label"    : "Barista's Menu",
            "key"      : "id",
            "handler"  : "menuHandler"
          },
          {
            "service"  : "appusers",
            "label"    : "User List",
            "key"      : "username",
            "handler"  : "usersHandler"
          },
           {
            "service"  : "customers",
            "label"    : "Customers",
            "key"      : "id",
            "handler"  : "getCustomers",
            "indexes"  : [ "code" ]
          },
      ],
  */

    this.SERVICES = atajo.config.get('SERVICES', []);

    this.getKey = function(service)
    {
        var _ = this;
        for(var i in _.SERVICES)
        {
           var service = _.SERVICES[i];
           if(service.service == service)
           {
             return service.key;
           }
           return false;
        }

    };

    this.getServices = function(cb)
     {
        var _ = this;
        atajo.sync.getRegister(function(services) { _.SERVICES = services; cb(services); });


     };


    this.fetch = function(service, refresh, cb)
    {
      var _ = this;
      var key = _.getKey(service) || 'id';
      atajo.sync.fetch(service, key, refresh, cb);


    }





});
;;

module.factory('Utils', function() {
    return {
        deepIndex: function(object, key) {
            var indices = key.split(/\./);
            var item = object[indices[0]];
            for (var i = 1; i < indices.length; i++)
                item = item[indices[i]];
            return item;
        }
    };
});

module.factory('TableUtils', function() {
    return {
        subSet: function(data, page, limit) {
            var start = limit * (page - 1);
            var end = limit * (page);
            return data.filter(function(elem, index) {
                return (index >= start && index < end);
            });
        },

        inSubSet: function(size, page, limit, index) {
            var start = limit * (page - 1);
            var end = limit * (page);
            end = end > size ? size : end;
            return (index >= start && index < end);
        }
    };
});

/**
 * This is to generate a report from data based on a certain specification
 * The underlying working of the spec uses filter, map and reduce functions 
 */
module.factory('ReportGenerator', ['Utils', function(Utils) {
    return {
        generate: function(data, spec) {
            //per section
            return spec.sections.reduce(function(report, section) {
                //------------------------- SECTION OPERATIONS -------------------------
                var filterOperations = Object.keys(section.filter).map(function(elem) {
                    var operation = Object.keys(section.filter[elem])[0];
                    return {
                        key: elem,
                        operation: operation,
                        operand: section.filter[elem][operation]
                    }
                });
                var mapOperations = Object.keys(section.map).map(function(elem) {
                    var operation = Object.keys(section.map[elem])[0];
                    return {
                        key: elem,
                        operation: operation,
                        operand: section.map[elem][operation]
                    }
                });
                //----------------------------------------------------------------------
                //----------------------------------------------------------------------
                var sectionData = JSON.parse(JSON.stringify(data))
                    .filter(function(item) {
                        return filterOperations.map(function(elem) {
                            //apply single filter operation to item
                            switch (elem.operation) {
                                case 'eq':
                                    return Utils.deepIndex(item, elem.key) == elem.operand; //check equality
                                case 'neq':
                                    return Utils.deepIndex(item, elem.key) != elem.operand; //check non-equality
                                case 'gt':
                                    return Utils.deepIndex(item, elem.key) > elem.operand; //check greater than
                                case 'gte':
                                    return Utils.deepIndex(item, elem.key) >= elem.operand; //check greater or equal to
                                case 'lt':
                                    return Utils.deepIndex(item, elem.key) < elem.operand; //check less than
                                case 'lte':
                                    return Utils.deepIndex(item, elem.key) <= elem.operand; //check less or equal to
                                default:
                                    return false;
                            }
                        }).reduce(function(accumFilter, singleFilter) {
                            return accumFilter && singleFilter; //filter is successful if all individual filters are successfull
                        }, true);
                    })
                    .map(function(item) {
                        //normal map
                        mapOperations.map(function(elem) {
                            switch (elem.operation) {
                                case 'set': //set to another property
                                    item[elem.key] = Utils.deepIndex(item, elem.operand);
                                    break;
                                case 'default': //set to static default value
                                    item[elem.key] = elem.operand;
                                    break;
                                case 'date': //set into date text using specified (moment) format 
                                    item[elem.key] = moment(Utils.deepIndex(item, elem.operand.key)).format(elem.operand.format);
                                    break;
                            }
                            return true; //dummy (not needed/used)
                        });
                        //concat map (may be dependant on fields just mapped)
                        mapOperations.map(function(elem) {
                            if (elem.operation == 'concat') {
                                item[elem.key] = elem.operand.reduce(function(strConcat, key) {
                                    if (/^\$/.test(key)) { //check if prefixed by dollar (therefore points to property of obj)
                                        return strConcat + Utils.deepIndex(item, key.replace(/^\$/, ""));
                                    } else {
                                        return strConcat + key; //add as it is
                                    }
                                }, "");
                            }
                            return true; //dummy (not needed/used)
                        });
                        return item;
                    });
                //console.log(">>> section | "+sectionData.length);
                //console.log(JSON.stringify(sectionData));
                //console.log("***********************************");
                //----------------------------------------------------------------------
                //concatenate with report
                return report.concat(sectionData);
            }, []);
        }
    };
}])

module.factory('WebAPI', ['$q', function($q) {
    return {
        promiseRequest: function(httpPromise) {
            var deferred = $q.defer();
            httpPromise.then(function(resp) {
                var data = resp.data;
                if (!data.error) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            }, function(err) {
                deferred.reject({ error: true, msg: "Network Error. Please check your network and try again." });
            });
            return deferred.promise;
        }
    };
}]);

module.factory('HandlerAPI', ['$q', function($q) {
    return {
        promiseRequest: function(name, method, handlerData) {
            //complete data obj
            handlerData = handlerData || {};
            handlerData.method = method;
            //----------------
            var deferred = $q.defer();
            atajo.api.get(name, handlerData, function(data) {
                if (!data.error) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            });
            return deferred.promise;
        },

        promiseAuth: function(credentials) {
            var deferred = $q.defer();
            atajo.api.auth(credentials, function(valid, data) {
                atajo.log.d("AUTH: " + valid + " / " + JSON.stringify(data));
                if (valid) {
                    deferred.resolve({ error: false, data: data });
                } else {
                    deferred.reject({ error: true, data: data, msg: 'Invalid Credentials\n\nPlease try again.' });
                }
            });
            return deferred.promise;
        }
    };
}]);

module.factory('CSVGenerator', function() {
    //this helps with indexing on multiple layers (e.g. obj['a']['b'] as opposed to obj['a.b'])
    var deepIndex = function(object, key) {
        var indices = key.split('.');
        var item = object[indices[0]];
        for (var i = 1; i < indices.length; i++)
            item = item[indices[i]];
        return item;
    };

    var getArray = function(tableData, keys, headers) {
        var mat = [];
        if (headers) {
            mat.push(headers);
        }

        for (var i = 0; i < tableData.length; i++) {
            var row = [];
            for (var j = 0; j < keys.length; j++) {
                var item = deepIndex(tableData[i], keys[j]);
                //check if number
                // if (!isNaN(parseFloat(item)) && isFinite(item) && keys[j] != 'user.username') {
                //     item = Math.round(Number(item) * 100) / 100; //all numbers to two decimal digits
                // }
                if (typeof item == 'number')
                    item = Math.round10(item, -2); //two decimals
                row.push(item);
            }

            mat.push(row);
        }

        return mat;
    };

    var makeFieldSeperatedString = function(data, xSep, ySep) {
        var result = [];
        for (var i = 0; i < data.length; i++) {
            result.push(data[i].join(xSep));
        }
        return result.join(ySep);
    };

    return {
        generateCsv: function(tableData, keys, headers) {
            var csvString = makeFieldSeperatedString(getArray(tableData, keys, headers), ',', '\n');
            return new Blob([csvString], { type: 'text/csv;charset=utf-8' });
        },

        generateTsv: function(tableData, keys, headers) {
            var csvString = makeFieldSeperatedString(getArray(tableData, keys, headers), '\t', '\n');
            return new Blob([csvString], { type: 'text/tab-separated-values;charset=utf-8' });
        }
    };
});

/*
 * Helper methods for dealing with files
 */
module.factory('FileUtils', ['$q', function($q) {
    return {
        getExtension: function(fileUrl) {
            var url = fileUrl.split('/').pop(); //only need filename in current folder (otherwise hostname with periods can affect this)
            return (/[.]/.test(url)) ? url.split(/\.(?=[^.]*$)/).pop() : 'unknown';
        },

        isImage: function(url) {
            var deferred = $q.defer();

            var image = new Image();
            image.onerror = function() {
                deferred.resolve(false);
            };
            image.onload = function() {
                deferred.resolve(true);
            };
            image.src = url;

            return deferred.promise;
        }

    };
}])
;;
module.controller('syncCtrl', function(syncService, $scope) {

    /*
    "SERVICES":
        [
            {
              "service"  : "menu",
              "label"    : "Barista's Menu",
              "key"      : "id",
              "handler"  : "menuHandler"
            },
            {
              "service"  : "appusers",
              "label"    : "User List",
              "key"      : "username",
              "handler"  : "usersHandler"
            }
        ],
    */

    $scope.services = [];

    $scope.refresh = function() {

        syncService.getServices(function(syncRegister) {

            for (var i in syncRegister) {
                var item = syncRegister[i]
                switch (item.status) {
                    case 'NOT SYNCED':
                        item.icon = 'remove';
                        item.color = 'red';
                        break;
                    case 'BUSY':
                        item.icon = 'refresh';
                        item.color = 'orange';
                        break;
                    case 'DONE':
                        item.icon = 'check';
                        item.color = 'green';
                        break;

                    default:
                        item.icon = 'refresh';
                }
            }

            $scope.services = syncRegister;


        });


    }

    $scope.syncService = function(service) {
        atajo.log.d("SYNCING " + service);

        syncService.fetch(service,
            function() {

                atajo.log.d('refresh');
                $scope.refresh();
                $scope.$apply();

            },
            function() {

                atajo.log.d('done');
                $scope.refresh();
                $scope.$apply();

            });

    }

    $scope.refresh();


});

;;

module.controller('TrackCtrl', ['$log', '$q', '$timeout', '$scope', '$state', '$stateParams', '$interval', 'TrackFactory', '$atajoUiPopup', '$atajoUiHistory', '$atajoUiLoading',
    function($log, $q, $timeout, $scope, $state, $stateParams, $interval, TrackFactory, $atajoUiPopup, $atajoUiHistory, $atajoUiLoading) {
        var ctrl = this;
        $scope.countingdown = true;
        $scope.paused = false;
        $scope.count = 3;
        $scope.tripDistance = '0.00';

        var subcriptionId;
        var startTime;
        var endTime;
        var totalElapsedMs = 0;
        var elapsedMs = 0;
        var timerPromise;
        var mode;
        $scope.udCounter = 0;

        $scope.waiting = false;

        $scope.pause = function() {
            $scope.paused = true;
            TrackFactory.pauseTrip();
            stopTimer();
        }

        $scope.resume = function() {
            $scope.paused = false;
            TrackFactory.resumeTrip();
            startTimer();
        }

        $scope.end = function() {
            $atajoUiLoading.show();
            TrackFactory.saveTrip(new Date());
            $atajoUiLoading.hide();
            $log.debug("######## TS:: ENDED");
            $atajoUiHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('dash');

        }

        $scope.changeMode = function() {
            TrackFactory.setElapsedMiliSecs(totalElapsedMs);

            $atajoUiHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('mode');
        }

        $scope.getFromattedTime = function() {
            var ms = totalElapsedMs + elapsedMs;
            var duration = moment.duration(ms, 'milliseconds');
            var h = duration.hours();
            var m = duration.minutes();
            var s = duration.seconds();

            h = ((h + "").length == 1) ? '0' + h : h;
            m = ((m + "").length == 1) ? '0' + m : m;
            s = ((s + "").length == 1) ? '0' + s : s;

            return h + ':' + m + ':' + s;
        }

        function subscribeToGeo() {
            $log.debug("SUBSCRIBING TO GEO!!! ");

            subcriptionId = atajo.events.subscribe('atajo.geo.trip.status', function(topic, result) {
                atajo.log.d('--->' + JSON.stringify(result));
                $log.debug("UPDATING VIEW------------------------>: " + result.data.distance);
                $scope.tripDistance = formatDistance(result.data.distance);
                $scope.udCounter++;
                TrackFactory.setUpdateCounter($scope.udCounter);
                $scope.$apply()
            });
        }

        function showAlert(title, message) {
            $atajoUiPopup.alert({
                title: title,
                template: message,
                okType: 'button-royal'
            });
        }

        function formatDistance(kilometers) {
            return kilometers.toFixed(2);
        }

        function startTimer() {
            if (!timerPromise) {
                startTime = new Date();
                timerPromise = $interval(function() {
                    var now = new Date();
                    elapsedMs = now.getTime() - startTime.getTime();
                }, 1000);
            }
        }

        function stopTimer() {
            if (timerPromise) {
                $interval.cancel(timerPromise);
                timerPromise = undefined;
                totalElapsedMs += elapsedMs;
                elapsedMs = 0;
            }
        };

        function startCountdown() {
            $timeout(function() {
                if ($scope.count > 1) {
                    $scope.count--;
                    startCountdown();
                } else {
                    $scope.countingdown = false;
                    startTimer();
                    $scope.count = 3;
                }
            }, 1000);
        }

        function init() {

            TrackFactory.getTripProgress(function(result) {

                $log.debug("######## TC - getTRIPRESULT:: " + JSON.stringify(result));

                if (result.state == 'CLEAN') {
                    $scope.paused = false;
                    $scope.countingdown = true;
                    mode = $stateParams.mode;
                    $scope.modeObject = TrackFactory.getIcon(mode);
                    $scope.waiting = true;
                    TrackFactory.startTrip(new Date(), mode, function(canGo, msg) {

                          $scope.waiting = false;

                        if (canGo) {
                            totalElapsedMs = TrackFactory.getElapsedMiliSecs();
                            $scope.count = '3';
                            startCountdown();
                        } else {

                            showAlert('FAILED', msg);
                            $state.go('dash');


                        }

                    });

                } else if (result.state == 'PAUSED') {
                    $scope.paused = true;
                    $scope.countingdown = false;
                    $log.debug("######## TC - Setting Distance :: " + result.distance);
                    $scope.tripDistance = formatDistance(result.distance);
                    if ($stateParams.mode == 'none') {
                        if (result.mode != '') {
                            mode = result.mode;
                            $scope.modeObject = TrackFactory.getIcon(mode);
                            totalElapsedMs = TrackFactory.getElapsedMiliSecs();
                        }
                    } else {
                        mode = $stateParams.mode;
                        $scope.modeObject = TrackFactory.getIcon(mode);
                        TrackFactory.addMode(mode, new Date());
                        totalElapsedMs = TrackFactory.getElapsedMiliSecs();
                    }
                    $scope.$apply();

                } else if (result.state == 'STARTED') {
                    $scope.countingdown = false;
                    $scope.paused = false;
                    $log.debug("######## TC - Setting Distance - > 0:: " + result.distance);
                    $scope.tripDistance = formatDistance(result.distance);
                    totalElapsedMs = TrackFactory.getElapsedMiliSecs();
                    mode = result.mode;
                    $scope.modeObject = TrackFactory.getIcon(mode);
                    startTimer();
                    $scope.$apply();
                }

                $scope.udCounter = TrackFactory.getUpdateCounter();
                subscribeToGeo();

            });
        }

        $scope.$on("$atajoUiView.beforeEnter", function(event, data) {
            init();
        });

        $scope.$on("$atajoUiView.beforeLeave", function(event, data) {
            $log.debug("######## TC:: LEAVING SCREEN");
            atajo.events.unsubscribe(subcriptionId);
            $scope.paused = false;
        });
    }
]);;;
module.factory('TrackFactory', ['$log', function($log) {

    var icons = {
        'bicycle': {
            label: 'Bicycle',
            icon: 'bicycle_icon_white'
        },
        'bus': {
            label: 'Bus',
            icon: 'bus_icon_white'
        },
        'ferry': {
            label: 'Ferry',
            icon: 'ferry_icon_white'
        },
        'lightrail': {
            label: 'Light Rail',
            icon: 'lightrail_icon_white'
        },
        'motorbike': {
            label: 'Motor Bike',
            icon: 'motorbike_icon_white'
        },
        'carpvt': {
            label: 'Private Car',
            icon: 'pvtcar_icon_white'
        },
        'carshare': {
            label: 'Share Car',
            icon: 'sharecar_icon_white'
        },
        'taxi': {
            label: 'Taxi',
            icon: 'taxi_icon_white'
        },
        'rail': {
            label: 'Rail',
            icon: 'rail_icon_white'
        },
        'walk': {
            label: 'Walk',
            icon: 'walk_icon_white'
        }
    };

    var tripObject = {
        "startTime": "",
        "endTime": "",
        "modes": []
    };

    var updateCounter = 0;

    function getUpdateCounter() {
        return updateCounter;
    }

    function setUpdateCounter(count) {
        updateCounter = count;
        storeTempTrip();
    }

    function resetUpdateCounter() {
        updateCounter = 0;
    }

    var tempTripid = 'TT' + new Date();

    function getIcon(type) {
        $log.debug("######## TF:: GETTING ICON " + type);
        return icons[type];
    }

    var modes = [];
    var tripStartTime;
    var elapsedMiliSecs = 0;
    var startAt = 0;
    var tripId = null;

    function getTripProgress(cb) {

        var stateObj = {
            "state": 'CLEAN',
            "distance": 0,
            "startTime": 0,
            "mode": ''
        }

        var trip = atajo.geo.trip.status(function(trip) {
            //STARTED / PAUSED / ENDED

            $log.debug("######## RF - TRIP:: " + JSON.stringify(trip));

            if (!trip.error) {
                $log.debug("######## RF - CHECKING STATUS:: " + trip.status);
                tripStartTime = new Date(trip.data.startAt);
                startAt = trip.data.startAt;
                stateObj.state = trip.status;
                stateObj.distance = trip.data.distance;
                getModes(function() {
                    if (modes.length > 0)
                        stateObj.mode = modes.reverse()[0].type;
                    else
                        mode = '';
                    return cb(stateObj);
                });
            } else {
                $log.debug("######## RF - CHECKING STATUS:: CLEAN");
                return cb(stateObj);
            }
        });
    }

    function getElapsedMiliSecs() {
        var now = new Date();
        var elapsed = now.getTime() - startAt;
        $log.debug("######## RF - ELAPSED MS:: " + elapsed);
        return elapsed;
    }

    function setElapsedMiliSecs(ms) {
        elapsedMiliSecs = ms;
    }

    function addMode(type, startTime) {
        modes.push({
            type: type,
            startTime: startTime
        });
        $log.debug("######## TF:: MODES: " + JSON.stringify(modes));
        storeTempTrip();
    }

    function startTrip(startTime, mode, cb) {
        $log.debug("######## TF:: STARTING TRIP: " + startTime + ' : ' + mode);


        atajo.geo.trip.start(function(result) {
            tripStartTime = startTime;
            startAt = startTime.getTime();
            addMode(mode, startTime);

            $log.debug("######## TF:: ATAJO-GEO START Status: err: " + result.error + ' msg: ' + result.msg);
            cb(!result.error, result.msg);
            storeTempTrip();

        });

    }

    function pauseTrip() {
        $log.debug("######## TF:: PAUSING TRIP");
        modes[modes.length - 1].endTime = new Date();
        $log.debug("######## TF:: MODES " + JSON.stringify(modes));

        storeTempTrip();

        atajo.geo.trip.pause(function(result) {
            $log.debug("######## TF:: ATAJO-GEO PAUSE Status: err: " + result.error + ' msg: ' + result.msg);
        });
    }

    function resumeTrip() {
        $log.debug("######## TF:: RESUMING TRIP");

        atajo.geo.trip.resume(function(result) {
            $log.debug("######## TF:: ATAJO-GEO RESUME Status: err: " + result.error + ' msg: ' + result.msg);
        });
    }

    function saveTrip(endTime) {
        $log.debug("########## TF:: SAVING TRIP");

        atajo.geo.trip.end(function(result) {
            $log.debug("########## TF:: ATAJO-GEO END Status: err: " + result.error + ' msg: ' + result.msg);
        });

        tripObject.startTime = tripStartTime;
        tripObject.endTime = endTime;
        tripObject.modes = modes;

        $log.debug("######## TF:: UPLOADING JOURNEY");

        var jid = atajo.queue.add('uploadJourney', {
            data: tripObject
        }, {
            name: 'Journey Upload'
        });

        tripStartTime = 0;
        modes = [];
        elapsedMiliSecs = 0;
        resetUpdateCounter();
        atajo.database.nuke('tempTrip');
    }

    function storeTempTrip() {
        $log.debug("######## TF:: SAVING TEMP TRIP ::" + tempTripid);
        atajo.database.set('tempTrip', {
            trip: {
                "startTime": tripStartTime,
                "modes": modes,
                "udCounter": updateCounter
            },
            key: tempTripid
        }, function(result) {
            $log.debug("######## TF:: RETRIEVE TEMP TRIP TABLE:: " + JSON.stringify(result));
        });
    }

    function getModes(cb) {
        atajo.database.getAll('tempTrip', function(r) {
            $log.debug("######## TF:: RETRIEVE TEMP TRIP TABLE:: " + JSON.stringify(r));
            if (r.length > 0) {
                var result = r.reverse()[0];
                modes = result.trip.modes;
                updateCounter = result.trip.udCounter;
            } else
                modes = [];
            return cb();
        });
    }

    return {
        getIcon: getIcon,
        saveTrip: saveTrip,
        addMode: addMode,
        startTrip: startTrip,
        getElapsedMiliSecs: getElapsedMiliSecs,
        setElapsedMiliSecs: setElapsedMiliSecs,
        pauseTrip: pauseTrip,
        resumeTrip: resumeTrip,
        getTripProgress: getTripProgress,
        getUpdateCounter: getUpdateCounter,
        setUpdateCounter: setUpdateCounter,
    }
}]);;;
module.controller('GuestCtrl', [
    '$log', '$q', 'UserService', '$rootScope', '$scope', '$state', '$localStorage',
    function($log, $q, UserService, $rootScope, $scope, $state, $localStorage) {
        var ctrl = this;
        $scope.isLoading = false;
        $scope.profile = $rootScope.getProfile();
        $scope.types = [];

        $scope.openUserDetail = function(user) {
            $localStorage.tempNavigationUser = JSON.parse(JSON.stringify(user));
            $state.go('tab.guest-detail', { id: user._id });
        };

        $scope.doRefresh = function() {
            $scope.$broadcast('scroll.refreshComplete'); //mock (normally you will call this after loading -but we will use our custom loader instead)
            $scope.isLoading = true;
            UserService.getAllInGroups().then(function(data) {
                $scope.types.map(function(type) {
                    type.users = data.data.filter(function(user) {
                        return user.role == type.role;
                    }).map(function(user) {
                        if ($rootScope.getProfileId() == user._id)
                            user.isMe = true;
                        if (user.image)
                            user.image.url = UserService.profileImageLocation(user.image.path);
                        return user;
                    });
                    return type;
                });
                $scope.isLoading = false;
            }, function(err) {
                $scope.isLoading = false;
            });
        };

        ctrl.init = function() {
            $scope.isLoading = true;
            $scope.types = [{
                role: 'guest_ebc',
                title: 'Full Experience'
            }, {
                role: 'guest_race',
                title: 'Race Experience'
            }];
            UserService.getAllInGroups().then(function(data) {
                $scope.types.map(function(type) {
                    type.users = data.data.filter(function(user) {
                        return user.role == type.role;
                    }).map(function(user) {
                        if ($rootScope.getProfileId() == user._id)
                            user.isMe = true;
                        if (user.image)
                            user.image.url = UserService.profileImageLocation(user.image.path);
                        return user;
                    });
                    return type;
                });
                $scope.isLoading = false;
            }, function(err) {
                $scope.isLoading = false;
            });
        };

        //---------------------------------------
        //---------------- INIT -----------------
        ctrl.init();
        //---------------------------------------
    }
]);

module.controller('HostCtrl', [
    '$log', '$q', 'UserService', '$rootScope', '$scope', '$state', '$localStorage',
    function($log, $q, UserService, $rootScope, $scope, $state, $localStorage) {
        var ctrl = this;
        $scope.isLoading = false;
        $scope.profile = $rootScope.getProfile();
        $scope.types = [];

        $scope.openUserDetail = function(user) {
            $localStorage.tempNavigationUser = JSON.parse(JSON.stringify(user));
            $state.go('tab.speaker-detail', { id: user._id });
        };

        $scope.doRefresh = function() {
            $scope.$broadcast('scroll.refreshComplete'); //mock (normally you will call this after loading -but we will use our custom loader instead)
            $scope.isLoading = true;
            UserService.getAllInGroups().then(function(data) {
                $scope.types.map(function(type) {
                    type.users = data.data.filter(function(user) {
                        return user.role == type.role;
                    }).map(function(user) {
                        if ($rootScope.getProfileId() == user._id)
                            user.isMe = true;
                        if (user.image)
                            user.image.url = UserService.profileImageLocation(user.image.path);
                        return user;
                    });
                    return type;
                });
                $scope.isLoading = false;
            }, function(err) {
                $scope.isLoading = false;
            });
        };

        ctrl.init = function() {
            $scope.isLoading = true;

            $scope.types = [{
                role: 'host_guest',
                title: 'Executive Hosts'
            }, {
                role: 'host_ebc',
                title: 'Client Experience Centre Hosts'
            }, {
                role: 'host_race',
                title: 'Race Experience Hosts'
            }];

            UserService.getAllInGroups().then(function(data) {
                $scope.types.map(function(type) {
                    type.users = data.data.filter(function(user) {
                        return user.role == type.role;
                    }).map(function(user) {
                        if ($rootScope.getProfileId() == user._id)
                            user.isMe = true;
                        if (user.image)
                            user.image.url = UserService.profileImageLocation(user.image.path);
                        return user;
                    });
                    return type;
                });
                $scope.isLoading = false;
            }, function(err) {
                $scope.isLoading = false;
            });
        };

        //---------------------------------------
        //---------------- INIT -----------------
        ctrl.init();
        //---------------------------------------
    }
]);

module.controller('ProfileCtrl', [
    '$log', '$q', 'UserService', '$rootScope', '$scope', '$state',
    function($log, $q, UserService, $rootScope, $scope, $state) {
        var ctrl = this;
        $scope.isLoading = false;
        $scope.profile = $rootScope.getProfile();

        $rootScope.$on('CYCLE_PROFILE_UPDATED', function() {
            $scope.profile = $rootScope.getProfile();
        });

        ctrl.init = function() {
            $scope.isLoading = true;
            $scope.isLoading = false;
        };

        //---------------------------------------
        //---------------- INIT -----------------
        ctrl.init();
        //---------------------------------------
    }
]);

module.controller('EditProfileCtrl', [
    '$log', '$q', 'UserService', '$rootScope', '$scope', '$state', '$atajoUiHistory', '$atajoUiPopup',
    function($log, $q, UserService, $rootScope, $scope, $state, $atajoUiHistory, $atajoUiPopup) {
        var ctrl = this;
        $scope.isLoading = false;
        $scope.profile = $rootScope.getProfile();
        $scope.updateProfile = JSON.parse(JSON.stringify($scope.profile));

        $scope.submitUpdate = function() {
            $scope.isLoading = true;
            UserService.update($rootScope.getProfileId(), $scope.updateProfile).then(function(data) {
                $rootScope.saveProfile(data.data);
                $rootScope.$emit('CYCLE_PROFILE_UPDATED');
                var alertPopup = $atajoUiPopup.alert({
                    title: 'Profile Updated',
                    okType: 'button-royal'
                });
                alertPopup.then(function(res) {
                    $atajoUiHistory.goBack();
                });
                $scope.isLoading = false;
            }, function(err) {
                var alertPopup = $atajoUiPopup.alert({
                    title: 'Problem updating your profile',
                    template: err.msg,
                    okType: 'button-royal'
                });
                alertPopup.then(function(res) {
                    $atajoUiHistory.goBack();
                });

                $scope.isLoading = false;
            })
        };

        ctrl.init = function() {
            $scope.isLoading = true;
            $scope.isLoading = false;
        };

        //---------------------------------------
        //---------------- INIT -----------------
        ctrl.init();
        //---------------------------------------
    }
]);

module.controller('UserCtrl', [
    '$log', '$q', 'UserService', '$rootScope', '$scope', '$state', '$localStorage',
    function($log, $q, UserService, $rootScope, $scope, $state, $localStorage) {
        var ctrl = this;
        $scope.isLoading = false;
        $scope.profile = $localStorage.tempNavigationUser;

        $scope.getFullName = function() {
            return $scope.profile.firstName + " " + $scope.profile.lastName;
        };

        ctrl.init = function() {
            $scope.isLoading = true;
            $scope.isLoading = false;
        };

        //---------------------------------------
        //---------------- INIT -----------------
        ctrl.init();
        //---------------------------------------
    }
]);;;

module.factory('UserService', ['HandlerAPI', '$rootScope', function(HandlerAPI, $rootScope) {
    var handlerName = "user";
    var baseUrl =  'http://za.ws.atajo.co.za:8080/api/'+ 'user/';
    return {
        get: function(email) {
            return HandlerAPI.promiseRequest(handlerName, 'get', { email: email });
        },

        update: function(id, data) {
            return HandlerAPI.promiseRequest(handlerName, 'update', { id: id, data: data });
        },

        getAllInGroups: function() {
            return HandlerAPI.promiseRequest(handlerName, 'getAllInGroups', { groups: $rootScope.getGroupIds() });
        },

        profileImageLocation: function(fileId) {
            return baseUrl + 'profile/image/' + fileId;
        },
    }
}]);
;;