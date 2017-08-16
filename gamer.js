window.onload = init;

function init() {
    // add event handlers for the buttons
     var song = document.getElementById("myAudio");
     var toggleButton = document.getElementById("toggleButton");
     var status = document.getElementById("status");
     
     toggleButton.onclick = function (e) {
         if (song.paused) {
             song.play();
             toggleButton.innerHTML = "Disable Music";
             status.innerHTML = "Playing " + song.currentSrc;
         } else {
             song.pause();
             toggleButton.innerHTML = "Play Music";
             status.innerHTML = "Paused " + song.currentSrc;
         }
     }    
}
//router
angular.module('gridDropApp', ['ui.router'])
.config(function($stateProvider, $urlRouterProvider) {
    
    $stateProvider
      .state('home', {
        url: '/',
        views: {
          'content': {
            templateUrl: 'templates/main.html',
            controller: 'MainController'
          }
        }
      });
  
    $urlRouterProvider.otherwise('/');
  })
.controller('MainController', function($scope, RandomContent, $timeout) {
    $scope.initial = RandomContent.getRandomContent();
    $scope.totalScore = 0;
    $scope.gameOver = false;
    $scope.counter = 100;
    var mytimeout = null; // the current timeoutID
    $scope.savedScore = 0;

      // actual timer method, counts down every second, stops on zero
    $scope.onTimeout = function() {
        if($scope.counter ===  0) {
            $scope.$broadcast('timer-stopped', 0);
            $timeout.cancel(mytimeout);
            return;
        }
        $scope.counter--;
        mytimeout = $timeout($scope.onTimeout, 1000);
    };

     $scope.startTimer = function() {
        mytimeout = $timeout($scope.onTimeout, 1000);
    };
 
    // stops and resets the current timer
    $scope.stopTimer = function() {
        $scope.$broadcast('timer-stopped', $scope.counter);
       // $scope.counter = 30;
        $timeout.cancel(mytimeout);
    };
 
       // triggered, when the timer stops
    $scope.$on('timer-stopped', function(event, remaining) {
        if(remaining === 0) {
            console.log('your time ran out!');
            alert("Your time is up!");
            $scope.gameOver = true;
            
        }
    });
    //Save the score to local storage
    $scope.saveGame = function () {
        console.log($scope.totalScore);
        if(localStorage.getItem('topScore') !== null){
            if ($scope.totalScore > localStorage.getItem($scope.totalScore))
              window.localStorage.setItem('topScore', $scope.totalScore);
        }
        else{
            window.localStorage.setItem('topScore', $scope.totalScore);
        }
      
       
      }
    //Now since we have in local storage check to see if exist then display top score
    if (localStorage.getItem("topScore") != null){
        $scope.savedScore = window.localStorage.getItem('topScore');
    }

    $scope.contents = [];

    $scope.shapes = [
      {
        displayName: 'Square',
        displayClass: 'grid-cell'
      },
      {
        displayName: 'Circle',
        displayClass: 'grid-cell-circle'
      }
    ];
    $scope.currentShape = $scope.shapes[0];
  
    $scope.resetGame = function() {
      $scope.contents = [];
      for(var i = 0; i < 3; ++i) {
        var contentRow = [];
        for(var j = 0; j < 3; ++j) {
          contentRow.push({ score: 0, color: 'lightgrey', displayClass: $scope.shapes[0].displayClass });
        }
        $scope.contents.push(contentRow);
      }
      $scope.totalScore = 0;
      $scope.gameOver = false;

    };
  
    $scope.resetGame();
  
    $scope.updateCells = function() {
      angular.forEach($scope.contents, function(row) {
        angular.forEach(row, function(content) {
          content.displayClass = $scope.currentShape.displayClass;
        })
      });
      $scope.initial.displayClass = $scope.currentShape.displayClass;
    };

    $scope.$watch('initial', function(drag) {
      drag.displayClass = $scope.currentShape.displayClass;
    });


    $scope.$on('grid-drop-change', function(event, position) {      
      $scope.clearMatches($scope.contents, position.dropPositionX, position.dropPositionY);
      if($scope.isGameOver()) {
        $scope.gameOver = true;
      }
    });

    $scope.isGameOver = function() {
      var gameOver = true;
      angular.forEach($scope.contents, function(rows) {
        angular.forEach(rows, function(el) {
          if(el.color === 'lightgrey') {
            gameOver = false;
          }
        })
      });
      return gameOver;
    };

    $scope.gameOver = $scope.isGameOver();

    $scope.clearMatches = function(grid, x, y) {
      var initialScore = $scope.totalScore;
      
      $scope.clearAdjacentMatches(grid, x, y);
      
      if($scope.scoreChanged(initialScore)) {
        $scope.reset(grid[x][y]);
      }
    };
  
    $scope.clearAdjacentMatches = function(grid, x, y) {
      $scope.clearCellIfPossible(grid[x][y], $scope.getCellFromCoordinates(grid, x-1, y-1)); // top left
      $scope.clearCellIfPossible(grid[x][y], $scope.getCellFromCoordinates(grid, x-1, y)); // top
      $scope.clearCellIfPossible(grid[x][y], $scope.getCellFromCoordinates(grid, x-1, y+1)); // top right
      $scope.clearCellIfPossible(grid[x][y], $scope.getCellFromCoordinates(grid, x, y-1)); // mid left
      $scope.clearCellIfPossible(grid[x][y], $scope.getCellFromCoordinates(grid, x, y+1)); // mid right
      $scope.clearCellIfPossible(grid[x][y], $scope.getCellFromCoordinates(grid, x+1, y-1)); // bottom left
      $scope.clearCellIfPossible(grid[x][y], $scope.getCellFromCoordinates(grid, x+1, y)); // bottom
      $scope.clearCellIfPossible(grid[x][y], $scope.getCellFromCoordinates(grid, x+1, y+1)); // bottom right
    };

    $scope.clearCellIfPossible = function(original, adjacent) {
      if($scope.isMatch(original, adjacent)) {
        $scope.reset(adjacent);
      }
    };
  
    $scope.isMatch = function(original, gridElement) {
      return original.color === gridElement.color;
    };

    $scope.reset = function(gridElement) {
      gridElement.color = 'lightgrey';
      $scope.totalScore += gridElement.score;
      gridElement.score = 0;
    };

    $scope.getCellFromCoordinates = function(grid, x, y) {
      if($scope.outOfBounds(x, y, grid.length)) {
        return {}
      }
      return grid[x][y];
    };
  
    $scope.outOfBounds = function(x, y, gridSize) {
      return x < 0 || y < 0 || x >= gridSize || y >= gridSize;
    };

    $scope.scoreChanged = function(initialScore) {
      return initialScore !== $scope.totalScore;
    }
  })
.factory('DragAndDropHelper', function() {
        var content;

        return {
            setContent: function(content) {
                this.content = content;
            },

            getContent: function() {
                return this.content;
            }
        }
    })
.factory('RandomContent', function() {

        var colors = [
            'red',
            'blue',
            'green',
            'orange',
            'purple',
            'yellow',
            'brown',
            'pink'
        ];

        var currentShape = 'grid-cell';

        return {
            getRandomContent: function () {
                return {
                    score: Math.floor((Math.random() * 100) + 1),
                    color: colors[Math.floor(Math.random() * colors.length)],
                    displayClass: currentShape
                }
            },

            randomColor: function () {
                var letters = '0123456789ABCDEF'.split('');
                var color = '#';
                for (var i = 0; i < 6; i++) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
            }
        }
    })
.directive('gridDropSquare', function() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                size: '=',
                content: '=',
                isPalette: '=',
                gridDropX: '=',
                gridDropY: '='
            },
            controller: ['$scope', function($scope) {
                this.getGridDropX = function() {
                    return $scope.gridDropX;
                };

                this.getGridDropY = function() {
                    return $scope.gridDropY;
                };

                this.getContent = function() {
                    return $scope.content;
                };

                this.setContent = function(content) {
                    $scope.content = content;
                };

                this.isPalette = function() {
                    return $scope.isPalette;
                };

                $scope.$watch('content.displayClass', function(displayClass) {
                    $scope.chosenClass = 'grid-size-' + $scope.size + ' ' + displayClass;
                })
            }],
            link: function(scope, el, attrs, ctrl) {},
            templateUrl: 'templates/grid-drop-square.html'
        }
    })
.directive('dragTarget', ['DragAndDropHelper', 'RandomContent', function(DragAndDropHelper, RandomContent) {
        return {
            restrict: 'A',
            replace: true,
            require: 'gridDropSquare',
            link: function(scope, el, attrs, ctrl) {
                angular.element(el).attr("draggable", attrs['dragTarget']);


                el.bind('dragstart', function(e) {
                    var transferObject = e.originalEvent ? e.originalEvent.dataTransfer : e.dataTransfer;

                    transferObject.effectAllowed = attrs['dragTarget'] === 'true' ? 'move' : 'none';


                   
                    transferObject.setData('text/plain', 'stop');


                    DragAndDropHelper.setContent(ctrl.getContent());
                    angular.element(e.target).addClass('dragged');
                });

                el.bind('dragend', function(e) {
                    if(ctrl.isPalette()) {
                        ctrl.setContent(RandomContent.getRandomContent())
                    }
                    angular.element(e.target).removeClass('dragged');
                    scope.$apply();
                })
            }
        }
    }])
.directive('dropTarget', ['DragAndDropHelper', function(DragAndDropHelper) {
        return {
            restrict: 'A',
            require: 'gridDropSquare',
            link: function(scope, el, attrs, ctrl) {
                el.bind('drop', function(e) {
                    if(e.preventDefault) {
                        e.preventDefault();
                    }
                    if(e.stopPropagation) {
                        e.stopPropagation();
                    }
                    if(ctrl.getContent().color === 'lightgrey') {
                        ctrl.setContent(DragAndDropHelper.getContent());
                    }
                    scope.$apply();
                    angular.element(e.currentTarget).removeClass('hover');
                    scope.$emit('grid-drop-change', {
                        dropPositionX: ctrl.getGridDropX(),
                        dropPositionY: ctrl.getGridDropY()
                    });
                });

                el.bind('dragover', function(e) {
                    if(e.preventDefault) {
                        e.preventDefault();
                    }

                    return false;
                });

                el.bind('dragenter', function(e) {
                    angular.element(e.currentTarget).addClass('hover');
                });

                el.bind('dragleave', function(e) {
                    angular.element(e.currentTarget).removeClass('hover');
                });
            }
        }
    }])