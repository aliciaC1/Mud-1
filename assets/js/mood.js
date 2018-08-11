//#region google maps API 
// This example uses the autocomplete feature of the Google Places API.
// It allows the user to find locations in a given place, within a given
// country. It then displays markers for all the hotels returned,
// with on-click details for each hotel.

// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
var emotionSearchType;
var map, places, infoWindow;
var markers = [];
var autocomplete;
var countryRestrict = {'country': 'us'};
var MARKER_PATH = 'https://developers.google.com/maps/documentation/javascript/images/marker_green';
var hostnameRegexp = new RegExp('^https?://.+?/');

var countries = {
  'au': {
    center: {lat: -25.3, lng: 133.8},
    zoom: 4
  },
  'br': {
    center: {lat: -14.2, lng: -51.9},
    zoom: 3
  },
  'ca': {
    center: {lat: 62, lng: -110.0},
    zoom: 3
  },
  'fr': {
    center: {lat: 46.2, lng: 2.2},
    zoom: 5
  },
  'de': {
    center: {lat: 51.2, lng: 10.4},
    zoom: 5
  },
  'mx': {
    center: {lat: 23.6, lng: -102.5},
    zoom: 4
  },
  'nz': {
    center: {lat: -40.9, lng: 174.9},
    zoom: 5
  },
  'it': {
    center: {lat: 41.9, lng: 12.6},
    zoom: 5
  },
  'za': {
    center: {lat: -30.6, lng: 22.9},
    zoom: 5
  },
  'es': {
    center: {lat: 40.5, lng: -3.7},
    zoom: 5
  },
  'pt': {
    center: {lat: 39.4, lng: -8.2},
    zoom: 6
  },
  'us': {
    center: {lat: 37.1, lng: -95.7},
    zoom: 3
  },
  'uk': {
    center: {lat: 54.8, lng: -4.6},
    zoom: 5
  }
};

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: countries['us'].zoom,
    center: countries['us'].center,
    mapTypeControl: false,
    panControl: false,
    zoomControl: false,
    streetViewControl: false
  });

  infoWindow = new google.maps.InfoWindow({
    content: document.getElementById('info-content')
  });

  // Create the autocomplete object and associate it with the UI input control.
  // Restrict the search to the default country, and to place type "cities".
  autocomplete = new google.maps.places.Autocomplete(
      /** @type {!HTMLInputElement} */ (
          document.getElementById('autocomplete')), {
        types: ['address'],
        componentRestrictions: countryRestrict
      });
  places = new google.maps.places.PlacesService(map);

  autocomplete.addListener('place_changed', onPlaceChanged);

  // Add a DOM event listener to react when the user selects a country.
  document.getElementById('country').addEventListener(
      'change', setAutocompleteCountry);
}

// When the user selects a city, get the place details for the city and
// zoom the map in on the city.
function onPlaceChanged() {
  var place = autocomplete.getPlace();
  if (place.geometry) {
    map.panTo(place.geometry.location);
    map.setZoom(14);
    search(emotionSearchType);
  } else {
    document.getElementById('autocomplete').placeholder = 'Enter Your Location';
  }
}

// Search for hotels in the selected city, within the viewport of the map.
function search(types) {
  var search = {
    bounds: map.getBounds(),
    types: [types]
  };

  places.nearbySearch(search, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      clearResults();
      clearMarkers();
      // Create a marker for each hotel found, and
      // assign a letter of the alphabetic to each marker icon.
      for (var i = 0; i < results.length; i++) {
        var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
        var markerIcon = MARKER_PATH + markerLetter + '.png';
        // Use marker animation to drop the icons incrementally on the map.
        markers[i] = new google.maps.Marker({
          position: results[i].geometry.location,
          animation: google.maps.Animation.DROP,
          icon: markerIcon
        });
        // If the user clicks a hotel marker, show the details of that hotel
        // in an info window.
        markers[i].placeResult = results[i];
        google.maps.event.addListener(markers[i], 'click', showInfoWindow);
        setTimeout(dropMarker(i), i * 100);
        addResult(results[i], i);
      }
    }
  });
}

function clearMarkers() {
  for (var i = 0; i < markers.length; i++) {
    if (markers[i]) {
      markers[i].setMap(null);
    }
  }
  markers = [];
}

// Set the country restriction based on user input.
// Also center and zoom the map on the given country.
function setAutocompleteCountry() {
  var country = document.getElementById('country').value;
  if (country == 'all') {
    autocomplete.setComponentRestrictions({'country': []});
    map.setCenter({lat: 15, lng: 0});
    map.setZoom(2);
  } else {
    autocomplete.setComponentRestrictions({'country': country});
    map.setCenter(countries[country].center);
    map.setZoom(countries[country].zoom);
  }
  clearResults();
  clearMarkers();
}

function dropMarker(i) {
  return function() {
    markers[i].setMap(map);
  };
}

function addResult(result, i) {
  var results = document.getElementById('results');
  var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
  var markerIcon = MARKER_PATH + markerLetter + '.png';

  var tr = document.createElement('tr');
  tr.style.backgroundColor = (i % 2 === 0 ? '#F0F0F0' : '#FFFFFF');
  tr.onclick = function() {
    google.maps.event.trigger(markers[i], 'click');
  };

  var iconTd = document.createElement('td');
  var nameTd = document.createElement('td');
  var icon = document.createElement('img');
  icon.src = markerIcon;
  icon.setAttribute('class', 'placeIcon');
  icon.setAttribute('className', 'placeIcon');
  var name = document.createTextNode(result.name);
  iconTd.appendChild(icon);
  nameTd.appendChild(name);
  tr.appendChild(iconTd);
  tr.appendChild(nameTd);
  results.appendChild(tr);
}

function clearResults() {
  var results = document.getElementById('results');
  while (results.childNodes[0]) {
    results.removeChild(results.childNodes[0]);
  }
}

// Get the place details for a hotel. Show the information in an info window,
// anchored on the marker for the hotel that the user selected.
function showInfoWindow() {
  var marker = this;
  places.getDetails({placeId: marker.placeResult.place_id},
      function(place, status) {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          return;
        }
        infoWindow.open(map, marker);
        buildIWContent(place);
      });
}

// Load the place information into the HTML elements used by the info window.
function buildIWContent(place) {
  document.getElementById('iw-icon').innerHTML = '<img class="hotelIcon" ' +
      'src="' + place.icon + '"/>';
  document.getElementById('iw-url').innerHTML = '<b><a href="' + place.url +
      '" target="_blank">' + place.name + '</a></b>';
  document.getElementById('iw-address').textContent = place.vicinity;

  if (place.formatted_phone_number) {
    document.getElementById('iw-phone-row').style.display = '';
    document.getElementById('iw-phone').textContent =
        place.formatted_phone_number;
  } else {
    document.getElementById('iw-phone-row').style.display = 'none';
  }

  // Assign a five-star rating to the hotel, using a black star ('&#10029;')
  // to indicate the rating the hotel has earned, and a white star ('&#10025;')
  // for the rating points not achieved.
  if (place.rating) {
    var ratingHtml = '';
    for (var i = 0; i < 5; i++) {
      if (place.rating < (i + 0.5)) {
        ratingHtml += '&#10025;';
      } else {
        ratingHtml += '&#10029;';
      }
    document.getElementById('iw-rating-row').style.display = '';
    document.getElementById('iw-rating').innerHTML = ratingHtml;
    }
  } else {
    document.getElementById('iw-rating-row').style.display = 'none';
  }

  // The regexp isolates the first part of the URL (domain plus subdomain)
  // to give a short URL for displaying in the info window.
  if (place.website) {
    var fullUrl = place.website;
    var website = hostnameRegexp.exec(place.website);
    if (website === null) {
      website = 'http://' + place.website + '/';
      fullUrl = website;
    }
    document.getElementById('iw-website-row').style.display = '';
    document.getElementById('iw-website').textContent = website;
  } else {
    document.getElementById('iw-website-row').style.display = 'none';
  }


//    // Display distance of input location to selected spot on info window
//     if (place.website) {
//       var fullUrl = place.website;
//       var website = hostnameRegexp.exec(place.website);
//       if (website === null) {
//         website = 'http://' + place.distance + '/';
//         fullUrl = website;
//       }
//       document.getElementById('iw-distance-row').style.display = '';
//       document.getElementById('iw-distance').textContent = distance;
//     } else {
//       document.getElementById('iw-distance-row').style.display = 'none';
//     }
}
//#endregion google maps API
//#region get current date 
var d = new Date();
document.getElementById("year").innerHTML = d.getFullYear();
var dm = new Date();
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
document.getElementById("month").innerHTML = months[d.getMonth()]; 
var day = new Date();
document.getElementById("day").innerHTML = d.getDate();
//#endregion current date
//#region upload images to pg
document.getElementById('getval').addEventListener('change', readURL, true);
function readURL(){
    var file = document.getElementById("getval").files[0];
    var reader = new FileReader();
    reader.onloadend = function(){
        document.getElementById('clock').style.backgroundImage = "url(" + reader.result + ")";        
    }
    if(file){
        reader.readAsDataURL(file);
    }else{
    }
}
//#endregion upload img to pg 
//#region Jquery
$(document).ready(function(){

// #region Youtube API: 
  // Global variables
  var key = "AIzaSyCZlxos7BEyrDxX2vIhha0WM0xjNHm-DA8";
  var playlistId = "PL-qpR0uYyvkba0mx8SOpoh-jlZOl4SvBk";
  var URL = "https://www.googleapis.com/youtube/v3/playlistItems";
  var options = {
      part:"snippet",
      key: key,
      maxResults: 20,
      playlistId: playlistId,
  }

  loadVids();

  function loadVids() {
      $.getJSON(URL, options, function(data) {
          console.log(data);
          var id = data.items[0].snippet.resourceId.videoId;
          ytPlayer(id);
          resultsLoop(data);
      });
  } 

  function ytPlayer(id) {
      $(".player").html(`
      <iframe width="560" 
          height="315" 
          src="https://www.youtube.com/embed/${id}" 
          frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
      </iframe>`);
  }

  function resultsLoop(data) {
      $.each(data.items, function (i, item) {

          var thumb = item.snippet.thumbnails.medium.url;
          var title = item.snippet.title;
          var description = item.snippet.description.substring(0, 150);
          var vid = item.snippet.resourceId.videoId;

          $(".part-two").append(`
          <article class="vids" data-key="${vid}">

              <img src="${thumb}" 
              alt="thumbnail" 
              class="thumb">
  
          <div class="text">
              <h6 class="title">${title}</h6>
              <p class="description">${description}</p>
          </div>
          </article>`
          );
       }); 
    }

  $(".part-two").on("click", 'article', function () {
      var newId = $(this).attr("data-key");
      console.log(newId);
      ytPlayer(newId);
      });

// #endregion YT API
// #region Initalize Materliaze Jquery functions: 
  M.AutoInit();
// #endregion materalize 
// #region Mood Board Draggable / resizeable functions 
 $('.mood-container').hide();

    $('.resizeDiv')
	.draggable()
  .resizable();
$('.current-mood').draggable()
.resizable();
  // $( function() {
  //   $( ".video-resize" ).resizable({
  //     aspectRatio: 16 / 9
  //   });
  // } );

  $('.map-resize')
	.draggable()
  .resizable();


  $('.video-resize')
	.draggable()
  .resizable();

  $('.music-resize')
	.draggable()
  .resizable();

  $('.quote-resize')
	.draggable()
  .resizable();

  $('.text')
	.draggable()
  .resizable();


  $('.date-resize').draggable()
  .resizable();


  $('.text-resize').draggable()
  .resizable();
  

  $('.tags-resize').draggable()
  .resizable();

  $('.gif-resize').draggable()
  .resizable();

  $('.image-resize').draggable()
  .resizable();

  $('#resize-todayImg').draggable()
  .resizable();
  
  $('.add-imgbtn').draggable()
  .resizable();

// #endregion

// #region Mood Board switch emotion 
var currentMood;

//   // Initialize Firebase
   var config = {
    apiKey: "AIzaSyAJL8x08SRMEYMMtn13bD69hZHjWZC_zmM",
    authDomain: "mud-4e9fe.firebaseapp.com",
    databaseURL: "https://mud-4e9fe.firebaseio.com",
    projectId: "mud-4e9fe",
    storageBucket: "mud-4e9fe.appspot.com",
    messagingSenderId: "350533286927"
};
firebase.initializeApp(config);
var database = firebase.database();

// retreiving from Firebase 
  database.ref().on("value", function(snapshot) {

  var sv = snapshot.val();
    console.log(sv);
    console.log(sv.currentMood);
    currentMood = sv.currentMood;
    console.log("happiness: " + sv.currentMood.happiness);
    console.log("sadness: " + sv.currentMood.sadness);
    console.log("fear: " + sv.currentMood.fear);
    console.log("anger: " + sv.currentMood.anger);
    console.log("disgust: " + sv.currentMood.disgust);
    console.log("surprise: " + sv.currentMood.surprise);

 
}, function(errorObject) {
  console.log("Errors handled: " + errorObject.code);
});

function findMaxMood(currentMood){
  var maxMood = 0;
  mainEmotion = "";
  delete currentMood.dateAdded;
  for ( var property1 in currentMood) {
    if (currentMood.hasOwnProperty(property1)) {
    if (currentMood[property1] > maxMood){
      mainEmotion = property1
      maxMood = currentMood[property1];
    }  
    }
  }
}


// Emotion Content Arrays & Selecting Content 
var songArray = ['song1', 'song2', 'song3'];

var songSelect = songArray[Math.floor(Math.random()*songArray.length)];
console.log(songSelect);

var quoteArray = ['quote1', 'quote2', 'quote3'];
var quoteSelect = quoteArray[Math.floor(Math.random()*quoteArray.length)];
console.log(quoteSelect);

emoArray = [{
    emotion: "happiness", 
    bckColor: '#FFC107', 
    types:'night_club', 
    songArray: ["https://open.spotify.com/embed?uri=spotify:playlist:37i9dQZF1DX6Rl8uES4jYu", "https://open.spotify.com/embed?uri=spotify:playlist:37i9dQZF1DX9XIFQuFvzM4", "https://open.spotify.com/embed?uri=spotify:playlist:37i9dQZF1DX6Rl8uES4jYu"], 
    ytPlaylist: ["PL-qpR0uYyvkba0mx8SOpoh-jlZOl4SvBk"],  
    quoteArray: ['“No medicine cures what happiness cannot.” ― Gabriel García Márquez', '"Happiness Looks Gorgeous On You"', '"Happiness is the highest level of Success"']
},{
    emotion: "sadness", 
    bckColor: '#006ded', 
    types:'bar', 
    songArray: ["https://open.spotify.com/embed?uri=spotify:playlist:37i9dQZF1DXbvABJXBIyiY", "https://open.spotify.com/embed?uri=spotify:playlist:37i9dQZF1DX6xZZEgC9Ubl", "https://open.spotify.com/embed?uri=spotify:playlist:37i9dQZF1DWVV27DiNWxkR"], 
    ytPlaylist: ["PL-qpR0uYyvkbhP5F1vwrwbUtFSlwC4-pz"],  
    quoteArray: ['“You cannot be happy unless you are unhappy sometimes.” ― Lauren Oliver, Delirium', '"Heavy hearts, like heavy clouds in the sky, are best relieved by the letting of a little water." - Christopher Morley', '"First, accept sadness. Realize that without losing, winning is not so great."-Alyssa Milano']
},{
    emotion: "angry", 
    bckColor: '#c81d11', 
    types:'gym', 
    songArray: ["https://open.spotify.com/embed?uri=spotify:playlist:37i9dQZF1DWYMvTygsLWlG", "https://open.spotify.com/embed?uri=spotify:playlist:37i9dQZF1DWSqBruwoIXkA", "https://open.spotify.com/embed?uri=spotify:playlist:37i9dQZF1DX2pSTOxoPbx9"],
    ytPlaylist: ["PL-qpR0uYyvkZAdu0mhZltbpv1eBNOCKGn"],  
    quoteArray: ['"He who angers you conquers you." -Elizabeth Kenny', '"Whatever is begun in anger ends in shame." - Benjamin Franklin', '"The opposite of anger is not calmness, its empathy." - Mehmet Oz']
}]





//   console.log( "window loaded" );
// });
$( window ).on( "load", function() {
  // $("#add-emo").on("click", function(event) {
    event.preventDefault();

    // window.location.replace("./mood.html");
    findMaxMood(currentMood);
    console.log(mainEmotion);
    $('.loading-gif').hide();
    $('.mood-container').show();





     function showContent(i) { 
       
        var songSelect = emoArray[i].songArray[Math.floor(Math.random()* songArray.length)];
        console.log(songSelect);
        var quoteSelect = emoArray[i].quoteArray[Math.floor(Math.random()* quoteArray.length)];
        console.log(quoteSelect);
        console.log(mainEmotion);
        $('body').css('background-color', emoArray[i].bckColor);
        $('#quote').text(quoteSelect);
        $('#spotify-player').attr('src',songSelect);
        $('.current-mood').text(mainEmotion);
        console.log(songSelect);
        emotionSearchType = emoArray[i].types;
        playlistId = emoArray[i].ytPlaylist;
        console.log(emoArray[i].ytPlaylist);
        console.log(playlistId);
        console.log(emoArray[i].types);
    };


 if (mainEmotion === 'happiness' || mainEmotion === 'neutral') {
     showContent(0); 
 } else if (mainEmotion === 'sadness' || mainEmotion === 'surprise') {
     showContent(1);
 } else if (mainEmotion === 'anger') {
     showContent(2);
 } 
 
});




// #endregion Mood Board switch emotion 

// #region Capturing tags, and text input & sending to Firebase database
  
    // var comment = "";
    // var tags = "";
    // $("#add-comment").on("click", function(event) {
    //     event.preventDefault();

    // comment = $("#add-comment").val().trim();
    // tags = $("#add-tag").val().trim();

    // database.ref().push({

    //   comment: comment,
    //   tags: tags,
    //   dateAdded: firebase.database.ServerValue.TIMESTAMP
    //   });
    // });

    // database.ref().on("child_added", function(snapshot){
    //   var sv= snapshot.val()
    //   console.log(sv.comment);
    //   console.log(sv.tags);
    // })



//#end-region Capturing tags, and text input & sending to Firebase database

  // #region photo log summary graph 
  // Add squares
  // const squares = document.querySelector('.squares');
  //   for (var i = 1; i < 365; i++) {
  //     const level = Math.floor(Math.random() * 6);  
  //     squares.insertAdjacentHTML('beforeend', `<li data-level="${level}"></li>`);
  //   };
    // #endregion

    (function() {
      'use strict';
  
      // constants
      var API_URL = 'https://api-us.faceplusplus.com/facepp/v3';
      var API_KEY = 'MgfOZx5IZCuocbZ5wMmKCdZkd7P0mPhs';//填写你的APIKey
      var API_SECRET = 'ymFeQjguF6lGA8oLlneuAHMtdhq1QSA0';//填写你的APISecret
  
      // Initialize Firebase
      var config = {
          apiKey: "AIzaSyAJL8x08SRMEYMMtn13bD69hZHjWZC_zmM",
          authDomain: "mud-4e9fe.firebaseapp.com",
          databaseURL: "https://mud-4e9fe.firebaseio.com",
          projectId: "mud-4e9fe",
          storageBucket: "mud-4e9fe.appspot.com",
          messagingSenderId: "350533286927"
      };
      firebase.initializeApp(config);
      var database = firebase.database();
  
  
      var photoCounter = 0;
      var lastImage = [];
      var imageArrayFromDb;
      var data;
  
      // on start run these functions and get all images back
      getImageArrayFromDB();
      setTimeout(getPicsForGallery, 1000);
  
      function getImageArrayFromDB(){
  
          //this will give back everything from the db
          database.ref().on("value", function(snapshot) {
              data = snapshot.val();
              // console.log(data);
              //this is the Array *****
              imageArrayFromDb = data.imageArray;
              // console.log("This is the image Array from realtime DB: ");
              // console.log(imageArrayFromDb);
              // console.log(data);
  
  
          }, function (errorObject) {
              console.log("The read failed: " + errorObject.code);
          });
      }
      
      function getPicsForGallery(){
  
          //*********************  need to put this chunk here for sequence***************** */
          // imageArrayFromDb needs to not be undefined
          if(imageArrayFromDb != undefined){
              lastImage = imageArrayFromDb.slice(-1)[0];
              console.log(lastImage);
              console.log("Image Array in not undefined");
          }else {
              console.log("Image Array is undefined, so now making it an empty array");
          };
          //******************************************************************************** */
  
          if(imageArrayFromDb != undefined){
              photoCounter = imageArrayFromDb.length;
              console.log("The DB has this many photos: " + photoCounter);
  
              var storage = firebase.storage();
              // Create a storage reference from our storage service
              var storageRef = storage.ref();
  
              storageRef.child('Emotion Photos/' + lastImage).getDownloadURL().then(function(url) {
                  var responseBase64;
      
                  var xhrFirebase = new XMLHttpRequest();
                  //want to get text back not a blob
                  xhrFirebase.responseType = 'text';
                  xhrFirebase.onload = function(event) {
                      //This is the base64 string back from the db
                      responseBase64 = xhrFirebase.response;
                      // console.log(responseBase64);
  
                      var image = $("#todayImg");
                      image.attr("src", responseBase64);
                      
                  };
                  xhrFirebase.open('GET', url);
                  xhrFirebase.send();
      
              }).catch(function(error) {
              // Handle any errors
              });
          }
  
  
      }
  
  })();
});



