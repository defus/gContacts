/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Landry DEFO KUATE (defolandry@yahoo.fr)
*/

function onError(e) {
  console.log(e);
}

// Support du système de fichier ----------------------------------------------------------
var fs = null;
var FOLDERNAME = 'test';

function writeFile(blob) {
  if (!fs) {
    return;
  }

  fs.root.getDirectory(FOLDERNAME, {create: true}, function(dirEntry) {
    dirEntry.getFile(blob.name, {create: true, exclusive: false}, function(fileEntry) {
      // Créer un objet FileWriter pour notre FileEntry, et écrire le blob
      fileEntry.createWriter(function(fileWriter) {
        fileWriter.onerror = onError;
        fileWriter.onwriteend = function(e) {
          console.log('Write completed.');
        };
        fileWriter.write(blob);
      }, onError);
    }, onError);
  }, onError);
}
// -----------------------------------------------------------------------------

var gContactApp = angular.module('gContactApp', []);

gContactApp.factory('gcontacts', function() {
  var gcontacts = {items: []};

  var dnd = new DnDFileController('body', function(files) {
    var chosenEntry = null;
    var $scope = angular.element(this).scope();
    for (var i = 0; i < files.items.length; i++) {
      var item = files.items[i];
      if (item.kind == 'file' &&
          item.type.match('text/*') &&
          item.webkitGetAsEntry()) {
        chosenEntry = item.webkitGetAsEntry();
        break;
      }
    };
    
    Util.readAsText(chosenEntry, function(result) {
      var data = angular.fromJson(result);
      $scope.fetchContacts(data);
    });
  });

  return gcontacts;
});

//Controller principal de l'application
function ContactsController($scope, $http, gcontacts) {
  $scope.contacts = [];

  $scope.fetchContacts = function(resp) {
    var docs = [];

    var totalEntries = resp.items.length;

    resp.items.forEach(function(entry, i) {
      var doc = {
        title: entry.title,
        firstname: entry.firstname,
        lastname: entry.lastname,
        email: entry.email,
        tel: entry.tel,
        updatedDate: Util.formatDate(entry.modifiedDate),
        updatedDateFull: entry.modifiedDate,
        icon: entry.iconLink,
        alternateLink: entry.alternateLink,
        size: entry.fileSize ? '( ' + entry.fileSize + ' bytes)' : null
      };

      // 'http://gstatic.google.com/doc_icon_128.png' -> 'doc_icon_128.png'
      doc.iconFilename = doc.icon.substring(doc.icon.lastIndexOf('/') + 1);

      // Si le fichier existe, il retourne un FileEntry pour l'URL du système de fichier
      // Sinon, nous allons avoir un callback d'erreur qui nous permettra de recupérer le fichier
      // et le stocker dans le système de fichier
      var fsURL = fs.root.toURL() + FOLDERNAME + '/' + doc.iconFilename;
      window.webkitResolveLocalFileSystemURL(fsURL, function(entry) {
        console.log('Recuperation du fichier du systeme de fichier');

        doc.icon = entry.toURL();

        $scope.contacts.push(doc);

        // On souhaite effectuer le tri seulement si on a toutes les données
        if (totalEntries - 1 == i) {
          $scope.contacts.sort(Util.sortByDate);
          $scope.$apply(function($scope) {}); // Informer angular que nous avons effectué les changements
        }
      }, function(e) {

        $http.get(doc.icon, {responseType: 'blob'}).success(function(blob) {
          console.log('Fetched icon via XHR');

          blob.name = doc.iconFilename; // Ajouter la photo dans le blob

          writeFile(blob); // L'écriture est asynchrone, mais c'est OK

          doc.icon = window.URL.createObjectURL(blob);

          $scope.contacts.push(doc);
          if (totalEntries - 1 == i) {
            $scope.contacts.sort(Util.sortByDate);
          }
        });

      });
    });
  };

  $scope.clearContacts = function() {
    $scope.contacts = []; // Vider les anciens résultats
  };

  
}

ContactsController.$inject = ['$scope', '$http', 'gcontacts']; // Pour la minification du code source.

//Initialisation et attachement des Listeners
document.addEventListener('DOMContentLoaded', function(e) {
  var closeButton = document.querySelector('#close-button');
  closeButton.addEventListener('click', function(e) {
    window.close();
  });

  // SUPPORT FILESYSTEM --------------------------------------------------------
  window.webkitRequestFileSystem(TEMPORARY, 1024 * 1024, function(localFs) {
    fs = localFs;
  }, onError);
  // ---------------------------------------------------------------------------
});
