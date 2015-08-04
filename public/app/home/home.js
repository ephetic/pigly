angular.module('pigly.home', [])

.controller('HomeController', function ($scope, Pics) {
  angular.extend($scope, Pics);
  $scope.getAllPics();
  $scope.$watch('data', function(oldv, newv){}, true)

})

.factory('Pics', function($http, $rootScope){
  var data = {};
  var getAllPics = function(){
    return $http({
      method: 'GET',
      url: '/api/pics'
    })
    .then(function(resp){
      data.pics = resp.data;
    })
  }
  var vote = function(pic, vote){
    if(vote === 'piggy') pic.piggies++;
    if(vote === 'skely') pic.skelies++;
    return $http({
      method: 'POST',
      url: '/api/pics/' + pic.name,
      data: JSON.stringify({vote: vote})
    })
  }

  var upload = function(form){
    console.log('upload', form);
    var reader = new FileReader();
    reader.onload = function(){
      console.log('reader', reader);
      var fd = new FormData(form.form);
      fd.append('file', reader.result, form.files[0].name);
      console.log('fd', fd);
      // $http({
      //   method: 'POST',
      //   url: '/capture',
      //   // contentType: 'image/*',
      //   // body: fd,
      //   data: fd,
      // });

      $http.post('/capture', fd, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      }).then(function(){
        setTimeout(function(){
          // $rootScope.$digest();
          getAllPics();
        }, 1000);
      });
    }
    reader.readAsDataURL(form.files[0]);
    // blog = new Blob(form.files);
  }

  return {
    data: data,
    getAllPics: getAllPics,
    vote: vote,
    upload: upload
  }
})
