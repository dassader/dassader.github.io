(function(d){var p={},e,a,h=document,i=window,f=h.documentElement,j=d.expando;d.event.special.inview={add:function(a){p[a.guid+"-"+this[j]]={data:a,$element:d(this)}},remove:function(a){try{delete p[a.guid+"-"+this[j]]}catch(d){}}};d(i).bind("scroll resize",function(){e=a=null});!f.addEventListener&&f.attachEvent&&f.attachEvent("onfocusin",function(){a=null});setInterval(function(){var k=d(),j,n=0;d.each(p,function(a,b){var c=b.data.selector,d=b.$element;k=k.add(c?d.find(c):d)});if(j=k.length){var b;
if(!(b=e)){var g={height:i.innerHeight,width:i.innerWidth};if(!g.height&&((b=h.compatMode)||!d.support.boxModel))b="CSS1Compat"===b?f:h.body,g={height:b.clientHeight,width:b.clientWidth};b=g}e=b;for(a=a||{top:i.pageYOffset||f.scrollTop||h.body.scrollTop,left:i.pageXOffset||f.scrollLeft||h.body.scrollLeft};n<j;n++)if(d.contains(f,k[n])){b=d(k[n]);var l=b.height(),m=b.width(),c=b.offset(),g=b.data("inview");if(!a||!e)break;c.top+l>a.top&&c.top<a.top+e.height&&c.left+m>a.left&&c.left<a.left+e.width?
(m=a.left>c.left?"right":a.left+e.width<c.left+m?"left":"both",l=a.top>c.top?"bottom":a.top+e.height<c.top+l?"top":"both",c=m+"-"+l,(!g||g!==c)&&b.data("inview",c).trigger("inview",[!0,m,l])):g&&b.data("inview",!1).trigger("inview",[!1])}}},250)})(jQuery);
(function () {
    var app = angular.module("app", [
        "ngRoute",
        "firebase",
        "toastr",
        "ui.bootstrap"
    ]);
}());
(function () {
    var app = angular.module("app");

    var config = function ($routeProvider) {
        $routeProvider.otherwise({redirectTo: '/'});

        $routeProvider.when('/', {
            title: 'Kulikova Elena',
            templateUrl: '/template/main-page/main-page.html',
            controller: 'MainPageCtrl',
            controllerAs: 'MainPageCtrl'
        });

        $routeProvider.when('/admin', {
            title: 'Admin page',
            templateUrl: '/template/admin-page/admin-page.html',
            controller: 'AdminPageCtrl',
            controllerAs: 'AdminPageCtrl'
        });
    };

    config.$inject = ["$routeProvider"];

    app.config(config);

    app.constant({
        "Firebase":new Firebase("https://seamstress.firebaseio.com/")
    });

    var run = function ($rootScope, $route) {
        $rootScope.$on('$routeChangeSuccess', function() {
            document.title = $route.current.title;
        });
    };

    run.$inject = ["$rootScope", "$route"];

    app.run(run);
}());
(function () {
    var app = angular.module("app");
    var SAVED = "Сохранено";
    var SAVED_MESSAGE = "Данные успешно обновлены";
    var ERROR = "Ошибка";
    var ERROR_MESSAGE = "Данные не могут быть сохранены";

    var SYSTEM_PROPERTY = ["$$conf", "$id", "$priority"];

    function copyFieldValues(from, to, ignoreArray) {
        if (to == undefined) {
            to = {};
        }

        for (var fieldName in from) {
            if(ignoreArray != undefined) {
                if (ignoreArray.indexOf(fieldName) != -1) {
                    continue;
                }
            }

            if(typeof from[fieldName] === "function") {
                continue;
            } else if (from[fieldName] instanceof Array) {
                to[fieldName] = angular.copy(from[fieldName]);
            } else if (from[fieldName] instanceof Object) {
                if (to[fieldName] == undefined) {
                    to[fieldName] = {};
                }
                copyFieldValues(from[fieldName], to[fieldName]);
            } else {
                to[fieldName] = from[fieldName];
            }
        }

        return to;
    }

    function getResizedImage(fileRes, MAX_WIDTH, MAX_HEIGHT, _cb) {
        var reader = new FileReader();
        reader.onload = function(param) {
            var img = document.createElement("img");
            img.src = param.target.result;

            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            var width = img.width;
            var height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            _cb(canvas.toDataURL());
        };
        reader.readAsDataURL(fileRes);
    }

    var AdminPageCtrl = function ($scope, AuthSrvc, DataSrvc, toastr) {
        $scope.dataModel = {};

        $scope.collapse = {
            header: true,
            about_me: true,
            about_me_description: true,
            about_me_starts: true,
            about_me_information: true,
            about_me_photo: true
        };

        var self = this;
        self.hidePage = true;

        $scope.save = function () {
            copyFieldValues($scope.dataModel, self.data, SYSTEM_PROPERTY);

            self.data.$save().then(function () {
                toastr.success(SAVED, SAVED_MESSAGE);
            }, function () {
                toastr.error(ERROR, ERROR_MESSAGE);
            })
        };

        $scope.loadBackgroundHeader = function (element) {
            getResizedImage(element.files[0], 100, 100, function (imageBase64) {
                console.log(imageBase64);
                self.data.header.background = imageBase64;
                //self.data.$save().then(function () {
                //    toastr.success(SAVED, SAVED_MESSAGE);
                //}, function () {
                //    toastr.error(ERROR, ERROR_MESSAGE);
                //});
            });
        };

        $scope.loadPhoto = function (element) {
            var fileReader = new FileReader();
            fileReader.onload = function (res) {
                self.data.about_me.photo = res.target.result;
                self.data.$save().then(function () {
                    toastr.success(SAVED, SAVED_MESSAGE);
                }, function () {
                    toastr.error(ERROR, ERROR_MESSAGE);
                });
            };
            fileReader.readAsDataURL(element.files[0]);
        };

        AuthSrvc.doAuth(function () {
            AuthSrvc.isHasAccess(function (result) {
                if(result) {
                    self.hidePage = false;

                    DataSrvc.getData(function (data) {
                        self.data = data;
                        $scope.dataModel = copyFieldValues(self.data, $scope.dataModel, SYSTEM_PROPERTY);

                        delete $scope.dataModel.header.background;
                        delete $scope.dataModel.about_me.photo;
                    });
                }
            });
        });
    };


    AdminPageCtrl.$inject = ["$scope", "AuthSrvc", "DataSrvc", "toastr"];

    app.controller("AdminPageCtrl", AdminPageCtrl);
}());
(function () {
    var app = angular.module("app");

    var AuthSrvc = function ($location, $firebaseAuth, Firebase, $firebaseObject) {
        return {
            doAuth: function (_cb) {
                if ($firebaseAuth(Firebase).$getAuth()) {
                    _cb();
                    return;
                }

                $firebaseAuth(Firebase).$authWithOAuthPopup("google").then(function () {
                    _cb();
                }, function () {
                    window.location = "#/";
                });
            },
            isHasAccess: function (_cb) {
                var target = $firebaseObject(Firebase.child("access"));

                target.$loaded().then(function (data) {
                    _cb(true);
                }, function () {
                    _cb(false);
                });
            }
        }
    };

    AuthSrvc.$inject = ["$location", "$firebaseAuth", "Firebase", "$firebaseObject"];

    app.service("AuthSrvc", AuthSrvc);
}());
(function () {
    var app = angular.module("app");

    var DescriptionCtrl = function ($scope) {
        var self = this;

        $scope.dataModel = $scope.$parent.dataModel;

        self.remove = function (index) {
            $scope.dataModel.about_me.descrioption.splice(index, 1);
            $scope.$parent.save();
        };

        self.add = function () {
            $scope.dataModel.about_me.descrioption.push(
                {
                    title:"",
                    text:""
                }
            );
            $scope.$parent.save();
        }
    };

    DescriptionCtrl.$inject = ["$scope"];

    app.controller("DescriptionCtrl", DescriptionCtrl);
}());
(function () {
    var app = angular.module("app");

    var InformationCtrl = function ($scope) {
        var self = this;

        $scope.dataModel = $scope.$parent.dataModel;

        self.remove = function (index) {
            $scope.dataModel.about_me.information.splice(index, 1);
            $scope.$parent.save();
        };

        self.add = function () {
            $scope.dataModel.about_me.information.push(
                {
                    key:"",
                    value:""
                }
            );
            $scope.$parent.save();
        }
    };

    InformationCtrl.$inject = ["$scope"];

    app.controller("InformationCtrl", InformationCtrl);
}());
(function () {
    var app = angular.module("app");

    var StarsCtrl = function ($scope) {
        var self = this;
        $scope.dataModel = $scope.$parent.dataModel;

        self.add = function () {
            $scope.dataModel.about_me.stars.push(
                {
                    title:""
                }
            );
            $scope.$parent.save();
        };

        self.remove = function (index) {
            $scope.dataModel.about_me.stars.splice(index, 1);
            $scope.$parent.save();
        };
    };

    StarsCtrl.$inject = ["$scope"];

    app.controller("StarsCtrl", StarsCtrl);
}());
(function () {
    var app = angular.module("app");

    var DataSrvc = function ($firebaseObject, Firebase) {
        var target = $firebaseObject(Firebase.child("data"));

        return {
            getData: function (_cb) {
                target.$loaded().then(function (data) {
                    _cb(data);
                });
            }
        }
    };

    DataSrvc.$inject = ["$firebaseObject", "Firebase"];

    app.service("DataSrvc", DataSrvc);
}());
(function () {
    function init() {
        $(window).ready(function() {
            //$('#pre-status').fadeOut();
            //$('#tt-preloader').delay(350).fadeOut('slow');
        });




        // -------------------------------------------------------------
        // Animated scrolling / Scroll Up
        // -------------------------------------------------------------

        (function () {
            $('a[href*=#]').bind("click", function(e){
                var anchor = $(this);
                $('html, body').stop().animate({
                    scrollTop: $(anchor.attr('href')).offset().top
                }, 1000);
                e.preventDefault();
            });
        }());



        // -------------------------------------------------------------
        // Full Screen Slider
        // -------------------------------------------------------------
        (function () {
            $(".tt-fullHeight").height($(window).height());

            $(window).resize(function(){
                $(".tt-fullHeight").height($(window).height());
            });

        }());


        // -------------------------------------------------------------
        // Sticky Menu
        // -------------------------------------------------------------

        (function () {
            $('.header').sticky({
                topSpacing: 0
            });

            $('body').scrollspy({
                target: '.navbar-custom',
                offset: 70
            })
        }());




        // -------------------------------------------------------------
        // Back To Top
        // -------------------------------------------------------------

        (function () {
            $(window).scroll(function() {
                if ($(this).scrollTop() > 100) {
                    $('.scroll-up').fadeIn();
                } else {
                    $('.scroll-up').fadeOut();
                }
            });
        }());


        // -------------------------------------------------------------
        // Countup
        // -------------------------------------------------------------
        $('.count-wrap').bind('inview', function(event, visible, visiblePartX, visiblePartY) {
            if (visible) {
                $(this).find('.timer').each(function () {
                    var $this = $(this);
                    $({ Counter: 0 }).animate({ Counter: $this.text() }, {
                        duration: 2000,
                        easing: 'swing',
                        step: function () {
                            $this.text(Math.ceil(this.Counter));
                        }
                    });
                });
                $(this).unbind('inview');
            }
        });


        // -------------------------------------------------------------
        // Progress Bar
        // -------------------------------------------------------------

        $('.skill-progress').bind('inview', function(event, visible, visiblePartX, visiblePartY) {
            if (visible) {
                $.each($('div.progress-bar'),function(){
                    $(this).css('width', $(this).attr('aria-valuenow')+'%');
                });
                $(this).unbind('inview');
            }
        });

        // -------------------------------------------------------------
        // More skill
        // -------------------------------------------------------------
        $('.more-skill').bind('inview', function(event, visible, visiblePartX, visiblePartY) {
            if (visible) {
                $('.chart').easyPieChart({
                    //your configuration goes here
                    easing: 'easeOut',
                    delay: 3000,
                    barColor:'#68c3a3',
                    trackColor:'rgba(255,255,255,0.2)',
                    scaleColor: false,
                    lineWidth: 8,
                    size: 140,
                    animate: 2000,
                    onStep: function(from, to, percent) {
                        this.el.children[0].innerHTML = Math.round(percent);
                    }

                });
                $(this).unbind('inview');
            }
        });


        // -------------------------------------------------------------
        // Shuffle
        // -------------------------------------------------------------

        (function () {

            var $grid = $('#grid');

            $grid.shuffle({
                itemSelector: '.portfolio-item'
            });

            /* reshuffle when user clicks a filter item */
            $('#filter a').click(function (e) {
                e.preventDefault();

                // set active class
                $('#filter a').removeClass('active');
                $(this).addClass('active');

                // get group name from clicked item
                var groupName = $(this).attr('data-group');

                // reshuffle grid
                $grid.shuffle('shuffle', groupName );
            });


        }());


        // -------------------------------------------------------------
        // Magnific Popup
        // -------------------------------------------------------------

        (function () {
            $('.image-link').magnificPopup({

                gallery: {
                    enabled: true
                },
                removalDelay: 300, // Delay in milliseconds before popup is removed
                mainClass: 'mfp-with-zoom', // this class is for CSS animation below
                type:'image'

            });

        }());

        // -------------------------------------------------------------
        // STELLAR FOR BACKGROUND SCROLLING
        // -------------------------------------------------------------

        $(window).load(function() {

            if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {

            }else {
                $.stellar({
                    horizontalScrolling: false,
                    responsive: true
                });
            }

        });


        // -------------------------------------------------------------
        // WOW JS -------------------------------------------------------------

        (function () {

            new WOW({

                mobile:  false

            }).init();

        }());
    }

    var app = angular.module("app");
    
    var MainPageCtrl = function (DataSrvc, $scope) {
        init();

        DataSrvc.getData(function (data) {
            $scope.data = data;
            $('#pre-status').fadeOut();
            $('#tt-preloader').delay(350).fadeOut('slow');
        });
    };

    MainPageCtrl.$inject = ["DataSrvc", "$scope"];
    
    app.controller("MainPageCtrl", MainPageCtrl);
}());
(function () {
    var app = angular.module("app");
    
    var AboutMeCtrl = function () {
        
    };

    AboutMeCtrl.$inject = [];
    
    app.controller("AboutMeCtrl", AboutMeCtrl);
}());