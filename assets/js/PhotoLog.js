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
    var imageArray = [];
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
            console.log("This is the image Array from realtime DB: ");
            console.log(imageArrayFromDb);
            // console.log(data);


        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    }
    
    function getPicsForGallery(){

        //*********************  need to put this chunk here for sequence***************** */
        // imageArrayFromDb needs to not be undefined
        if(imageArrayFromDb != undefined){
            imageArray = imageArrayFromDb;
            console.log("Image Array in not undefined");
        }else {
            imageArray = [];
            console.log("Image Array is undefined, so now making it an empty array");
        };
        //******************************************************************************** */

        if(imageArrayFromDb != undefined){
            photoCounter = imageArrayFromDb.length;
            console.log("The DB has this many photos: " + photoCounter);

            var storage = firebase.storage();
            // Create a storage reference from our storage service
            var storageRef = storage.ref();

            // Loop through the names of the images from the db
            // make sure that the array exists before looping through
            for(var i=0; i<imageArrayFromDb.length; i++){
                // cycle through and get back all image from the db
                // and also create and append new divs for photos
                // based on imageArray.
    
                storageRef.child('Emotion Photos/' + imageArrayFromDb[i]).getDownloadURL().then(function(url) {
                    var responseBase64;
        
                    var xhrFirebase = new XMLHttpRequest();
                    //want to get text back not a blob
                    xhrFirebase.responseType = 'text';
                    xhrFirebase.onload = function(event) {
                        //This is the base64 string back from the db
                        responseBase64 = xhrFirebase.response;
                        // console.log(responseBase64);
    
                        var galleryRow = $(".grid");
        
                        var imgTag = $("<img>");
                        //give it an id to find later
                        imgTag.attr("id", imageArray[i]);
                        //give it the base64 string from db
                        imgTag.attr("src", responseBase64);
                        galleryRow.append(imgTag);
                        var labelDiv = $("<label>");
                        galleryRow.append(labelDiv);
                        var inputTag = $("<input>");
                        inputTag.attr("type", "checkbox");
                        labelDiv.append(inputTag);
                        var spanTag = $("<span>");
                        spanTag.attr("class","new badge white");
                        spanTag.attr("id","emotion-state");
                        labelDiv.append(spanTag);
                        
                    };
                    xhrFirebase.open('GET', url);
                    xhrFirebase.send();
        
                }).catch(function(error) {
                // Handle any errors
                });
            }
        }


    }

})();