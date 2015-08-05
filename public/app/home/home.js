angular.module('pigly.home', [])

.controller('HomeController', function ($scope, $location, Pics, Auth) {
  angular.extend($scope, Pics, Auth);
  $scope.getAllPics();
  $scope.$watch('data', function(){}, true)
  if(!Auth.isAuth()) $location.path('/signin');
})

.factory('Pics', function($http, $window){
  var data = {};
  var getAllPics = function(){
    return $http({
      method: 'GET',
      url: '/api/pics'
    })
    .then(function(resp){
      data.pics = resp.data;
      console.log(data.pics);
    })
  }
  var vote = function(img, pic, vote){
    return $http({
      method: 'POST',
      url: '/api/pics/' + pic.name,
      data: JSON.stringify({vote: vote})
    }).then(function(resp){
      if(vote === 'piggy') pic.piggies++;
      if(vote === 'skely') pic.skelies++;
      pic.vote = vote;
    }, function(err){
      console.log('that was probably your fault')
    });
  }

  var upload = function(form){
    var reader = new FileReader();
    reader.onload = function(){
      var fd = new FormData(form.form);
      fd.append('file', reader.result, form.files[0].name);
      $http.post('/capture', fd, {
        transformRequest: angular.identity,
        headers: {
          'Content-Type': undefined,
          'x-access-token': $window.localStorage.getItem('com.pigly'),
        }
      }).then(function(){
        setTimeout(function(){
          getAllPics();
        }, 1000);
      });
    }
    reader.readAsDataURL(form.files[0]);
  }

  return {
    data: data,
    getAllPics: getAllPics,
    vote: vote,
    upload: upload
  }
})
