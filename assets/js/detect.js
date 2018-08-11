(function() {
    'use strict';

    // constants
    var API_URL = 'https://api-us.faceplusplus.com/facepp/v3';
    var API_KEY = 'MgfOZx5IZCuocbZ5wMmKCdZkd7P0mPhs';//填写你的APIKey
    var API_SECRET = 'ymFeQjguF6lGA8oLlneuAHMtdhq1QSA0';//填写你的APISecret

    //Global Variables for Emoitions

    var happiness = 0.0;
    var sadness = 0.0;
    var fear = 0.0;
    var anger = 0.0;
    var disgust = 0.0;
    var surprise = 0.0;

    var image64;
    var blob;
    var mainEmotionValue;


    var mainEmotion = "";
    var imageName;
    var photoCounter = 0;
    var imageArray = [];
    var imageArrayFromDb;

    //Get HTML Objects
    var happinessHTML = $(".happiness");
    var sadnessHTML = $(".sadness");
    var fearHTML = $(".fear");
    var angerHTML = $(".anger");
    var disgustHTML = $(".disgust");
    var surpriseHTML = $(".surprise");

    var mainEmotionHTML = $(".mainEmotionLabel");

    // error messages
    var messages = {
        URL_ERROR:   'Invalid URL',
        LOAD_ERROR:  'Failed to Load',
        LOADING:     'Loading...',
        NO_FACE:     'No face detected',
        NO_CAMERA:   'No camera available'
    };

    //Firebase
    //********************************************************************** */
    //********************************************************************** */

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


    //********************************************************************** */
    //********************************************************************** */

    //on start get all images from the db
    // get image array back from DB before loop function to display HTML
    getImageArrayFromDB();
    setTimeout(getPicsForGallery, 1000);


    //#region Face++ Code

    $("#view-dashboard").on("click", function(event) {
        event.preventDefault();
        window.location.replace("./mood.html");
    });
    
    // intialize all Materalize js functions
    M.AutoInit();

    // vendor prefix
    window.URL = window.URL || window.webkitURL;
    navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia;


    function makeDetector(el, options) {
        var container = $(el);
        var photolist = container.find('.photolist');

        // add <img> to photolist
        var images = [];
        for (var i = 0, len = options.imgs.length; i < len; i++) {
            var img = document.createElement('img');
            img.src = options.imgs[i];
            img.width = img.height = 80;
            images.push(img);
        }
        photolist.append(images);

        // paddles
        var sliding = false;
        container.find('.left-paddle').click(function() {
            if (sliding === false) {
                sliding = true;
                photolist.css({ left: '-80px' })
                    .prepend(photolist.children('img:last-child'))
                    .animate({ left: 0 }, 200, 'linear', function() {
                        sliding = false;
                    });
            }
        });
        container.find('.right-paddle').click(function() {
            if (sliding === false) {
                sliding = true;
                photolist.animate({ left: '-80px' }, 200, 'linear', function() {
                    photolist.css({ left: 0 })
                        .append(photolist.children('img:first-child'));
                    sliding = false;
                });
            }
        });

        var canvas = container.find('.canvas').get(0);
        var ctx = canvas.getContext('2d');

        var width = canvas.width,
            height = canvas.height;

        var currentImg = new Image();
        var totalImageCount = 0;
        var facesContainer = container.find('.faces'); // container for face boxes

        function clearCanvas() {
            ctx.fillStyle = '#EEE';
            ctx.fillRect(0, 0, width, height);
        }

        /**
         * Hide button in input bar if feature not available
         */
        function hideInputButton(selector) {
            var btn = container.find(selector);
            var url = container.find('.url-field');
            url.width(btn.outerWidth(true) + url.width());
            btn.hide();
        }

        /**
         * Start loading message
         */
        function startLoading() {
            facesContainer.addClass('loading');
        }

        /**
         * Remove loading message
         */
        function stopLoading() {
            facesContainer.removeClass('loading invalid');
        }

        var restUrl = container.find('.rest-url');

        /**
         * Show error messages or rest url
         */
        function showStatus(text) {
            restUrl.text(text);
        }

        /**
         * Draw face boxes
         *
         * imageInfo:
         * {
         *     width: <image width>
         *     height: <image height>
         *     offsetX: <image offset from canvas>
         *     offsetY: <image offset from canvas>
         *  }
         */
        function drawFaces(imageInfo, faces) {
            startLoading();
            if (faces.length === 0) {
                showStatus(messages.NO_FACE);
            } else {
                for (var i = faces.length - 1; i >= 0; i--) {
                    var face = faces[i];

                    // change box color based on gender
                    var rgbColor,
                        rgbaColor;

                    if (face.attributes.gender.value === 'Male') {
                        rgbColor = '#12BDDC';
                        rgbaColor = 'rgba(0,255,0,0.8)';
                    } else {
                        rgbColor = '#FE007F';
                        rgbaColor = 'rgba(255,0,0,0.8)';
                    }

                    var pointType = ['eye_left', 'eye_right', 'mouth_left', 'mouth_right'];

                    var scale = imageInfo.scale;
                    // draw facial pointType
                    // ctx.fillStyle = rgbColor;
                    // for (var j = pointType.length - 1; j >= 0; j--) {
                    //     ctx.beginPath();
                    //     ctx.arc(imageInfo.offsetX + face[pointType[j]].x * imageInfo.width * 0.01,
                    //             imageInfo.offsetY + face[pointType[j]].y * imageInfo.height * 0.01,
                    //             face.width * 0.01 * 6, 0, Math.PI * 2);
                    //     ctx.fill();
                    // }

                    // create box for highlighting face region
                    var roll = face.attributes.headpose.roll_angle;
                    $('<div/>').css({
                                position: 'absolute',
                                top: imageInfo.offsetY + face.face_rectangle.top * scale - 5,
                                left: imageInfo.offsetX + face.face_rectangle.left * scale - 5,
                                width: face.face_rectangle.width * scale,
                                height: face.face_rectangle.height * scale,
                                border: '2px solid ' + rgbColor,
                                borderColor: rgbaColor,
                                borderRadius: '2px',
                                transform: 'rotate(' + roll + 'deg)'
                            }).
                            // qtip({
                            //     content: '<table>' +
                            //                  '<tr><td>width</td><td>'        + (face.face_rectangle.width).toFixed(2) + '</td></tr>' +
                            //                  '<tr><td>height</td><td>'       + (face.face_rectangle.height).toFixed(2) + '</td></tr>' +
                            //                  '<tr><td>center</td><td>('      + (face.center.x      * 0.01).toFixed(2) + ', ' + (face.center.y      * 0.01).toFixed(2) + ')</td></tr>' +
                            //                  '<tr><td>eye_left</td><td>('    + (face.eye_left.x    * 0.01).toFixed(2) + ', ' + (face.eye_left.y    * 0.01).toFixed(2) + ')</td></tr>' +
                            //                  '<tr><td>eye_right</td><td>('   + (face.eye_right.x   * 0.01).toFixed(2) + ', ' + (face.eye_right.y   * 0.01).toFixed(2) + ')</td></tr>' +
                            //                  '<tr><td>mouth_left</td><td>('  + (face.mouth_left.x  * 0.01).toFixed(2) + ', ' + (face.mouth_left.y  * 0.01).toFixed(2) + ')</td></tr>' +
                            //                  '<tr><td>mouth_right</td><td>(' + (face.mouth_right.x * 0.01).toFixed(2) + ', ' + (face.mouth_right.y * 0.01).toFixed(2) + ')</td></tr>' +
                            //                  '<tr><td>age</td><td>'          + face.attribute.age.value + ' (&#177;' + face.attribute.age.range + ')</td></tr>' +
                            //                  '<tr><td>gender</td><td>'       + face.attribute.gender.value + ' (' + face.attribute.gender.confidence.toFixed(2) + '%)</td></tr>' +
                            //              '</table>',
                            //     style: {
                            //         classes: 'detector-tooltip ui-tooltip-light ui-tooltip-tipify'
                            //     },
                            //     position: {
                            //         my: 'bottom center',
                            //         at: 'top center'
                            //     }
                            // }).
                            appendTo(facesContainer);
                }
            }
            stopLoading();
        }

        /**
         * Start face detection.
         *
         * src <string>: image url or dataURI
         * dataURI <boolean>: whether src is a dataURI
         */
        function detect(src, dataURI) {
            if (src === currentImg.src) { // don't reload if detecting same image
                return;
            }

            //#endregion

            var currentImageCount = ++totalImageCount;

            startLoading();
            clearCanvas();
            // remove all face boxes
            facesContainer.children().remove();

            currentImg.onload = function() {
                var scale = Math.min(width / currentImg.width, height / currentImg.height, 1.0);
                var imageInfo = {
                    scale: scale,
                    width: currentImg.width * scale,
                    height: currentImg.height * scale,
                    offsetX: (width - currentImg.width * scale) / 2,
                    offsetY: (height - currentImg.height * scale) / 2
                };
                ctx.drawImage(
                    currentImg,
                    imageInfo.offsetX,
                    imageInfo.offsetY,
                    imageInfo.width,
                    imageInfo.height
                );

                faceppDetect({
                    img: currentImg.src,
                    type: (dataURI ? 'dataURI' : 'url'),
                    success: function(faces) {
                        if (currentImageCount === totalImageCount) {
                            // display "REST URL"
                            var url = API_URL + '/detect'
                            showStatus(url);

                            var json = JSON.stringify(faces, null, '  ');
                            var resultObject = JSON.parse(json);
                            //THIS IS THE ENTIRE OBJECT
                            // console.log(resultObject);
                            // console.log(resultObject.faces["0"].attributes.emotion);


                            // GET EMOTION VALUES *******************************************
                            //**************************************************************
                            happiness = resultObject.faces["0"].attributes.emotion.happiness;
                            sadness = resultObject.faces["0"].attributes.emotion.sadness;
                            fear = resultObject.faces["0"].attributes.emotion.fear;
                            anger = resultObject.faces["0"].attributes.emotion.anger;
                            disgust = resultObject.faces["0"].attributes.emotion.disgust;
                            surprise = resultObject.faces["0"].attributes.emotion.surprise;

                            //Send Current Mood To DB

                            
                            database.ref().set({
                                currentMood: {
                                    happiness: happiness,
                                    sadness: sadness,
                                    fear: fear,
                                    anger: anger,
                                    disgust: disgust,
                                    surprise: surprise,
                                    dateAdded: firebase.database.ServerValue.TIMESTAMP
                                },
                                imageArray: imageArray
                            });

                            // console.log("happiness: " + happiness);
                            // console.log("sadness: " + sadness);
                            // console.log("fear: " + fear);
                            // console.log("anger: " + anger);
                            // console.log("disgust: " + disgust);
                            // console.log("surprise: " + surprise);

                            // HTML object defined at top
                            // Also add class of data number
                            happinessHTML.text("happiness: " + happiness);
                            sadnessHTML.text("sadness: " + sadness);
                            fearHTML.text("fear: " + fear);
                            angerHTML.text("anger: " + anger);
                            disgustHTML.text("disgust: " + disgust);
                            surpriseHTML.text("surprise: " + surprise);

                            //**************************************************************
                            //**************************************************************

                            //Get Main Emotion (with highest value)
                            var emotionArray = new Array(happiness, sadness, fear, anger, disgust, surprise);
                            // console.log(emotionArray);

                            emotionArray.sort(function(a, b){return b-a});
                            // console.log("sorted: " + emotionArray);
                            // console.log("**************************");
                            mainEmotionValue = emotionArray[0];
                            
                            
                            //Find Which is the Main Emotion
                            if (happinessHTML.text().includes(mainEmotionValue)){
                                mainEmotion = "happiness";
                            } 
                            else if (sadnessHTML.text().includes(mainEmotionValue)) {
                                mainEmotion = "sadness";
                            }
                            else if (fearHTML.text().includes(mainEmotionValue)) {
                                mainEmotion = "fear";
                            }
                            else if (angerHTML.text().includes(mainEmotionValue)) {
                                mainEmotion = "anger";
                            }
                            else if (disgustHTML.text().includes(mainEmotionValue)) {
                                mainEmotion = "disgust";
                            }
                            else if (surpriseHTML.text().includes(mainEmotionValue)) {
                                mainEmotion = "surprise";
                            }

                            console.log("Main Emotion Is: " + mainEmotion);
                            console.log("Main Emotion Value: " + mainEmotionValue);
                            var mainEmotionAllCaps = mainEmotion.toUpperCase();

                            mainEmotionHTML.text("Your Main Emotion is: " + mainEmotionAllCaps);

                            //****************************************************************
                            //****************************************************************
                            try {
                                // highlight json for "Response JSON"
                                Rainbow.color(json, 'javascript', function(html) {
                                    container.find('.result').html(html);
                                });
                            } catch (err) {
                                container.find('.result').text(json);
                            }

                            drawFaces(imageInfo, faces.faces);
                            // console.log(imageInfo);
                        }
                    },
                    error: function() {
                        if (currentImageCount === totalImageCount) {
                            clearCanvas();
                            stopLoading();
                            showStatus(messages.LOAD_ERROR);
                        }
                    }
                });
            };
            currentImg.onerror = function() {
                clearCanvas();
                stopLoading();
                facesContainer.addClass('invalid');
                container.find('.result').html('');
                showStatus(messages.URL_ERROR);
            };
            currentImg.src = src;
        }

        //#region Face++ Code
        // ==================== INPUT ======================

        // URL Input
        container.find('.url-field').
            focus(function() { $(this).select(); }).
            mouseup(function() { return false; });

        container.find('.url-form').on('submit', function() {
            detect($(this).children('.url-field').val());
            return false;
        });

        // Photolist input
        photolist.children('img').click(function() {
            var url = container.find('.url-field');
            url.val(this.src);
            detect(this.src);
        });

        // Webcam Input
        if (navigator.getUserMedia) {
            var webcam = container.find('.webcam');
            if (webcam) {
                webcam.click(function() {
                    $('.camera-modal').show();
                    navigator.getUserMedia({
                            video: true,
                            audio: false
                        },
                        function(localMediaStream) {
                            var video = $('.camera-modal video').get(0);
                            var cameraModal = container.find('.camera-modal');

                            var modalClose = function() {
                                $(video).hide();
                                localMediaStream.getTracks()[0].stop()
                                cameraModal.hide();
                                container.find('.capture').hide();
                                cameraModal.unbind('click');
                            };
                            cameraModal.click(modalClose);

                            video.src = window.URL.createObjectURL(localMediaStream);
                            video.onerror = function() {
                                localMediaStream.getTracks()[0].stop()
                                modalClose();
                            };

                            $([container.find('.capture').get(0), video]).
                                show().
                                unbind('click').
                                click(function() {
                                    startLoading();
                                    var scale = Math.min(width / video.videoWidth, height / video.videoHeight, 1);
                                    // draw video on to canvas
                                    var tmpCanvas = document.createElement('canvas');
                                    tmpCanvas.height = video.videoHeight * scale;
                                    tmpCanvas.width = video.videoWidth * scale;
                                    tmpCanvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth * scale, video.videoHeight * scale);

                                    detect(tmpCanvas.toDataURL('image/jpeg'), true);
                                    modalClose();
                                    return false;
                                });

                        },
                        function() {
                            $('.camera-modal').hide();
                            showStatus(messages.NO_CAMERA);
                            hideInputButton('.webcam');
                        }
                    );
                    return false;
                });
            }
        } else {
            hideInputButton('.webcam');
        }

        // Upload input
        if (window.FileReader) {
            container.find('.upload-file').change(function() {
                if (this.files.length > 0) {
                    startLoading();
                    var reader = new FileReader();
                    reader.onload = function() {
                        detect(reader.result, true);
                    };
                    reader.onerror = function() {
                        stopLoading();
                        facesContainer.addClass('invalid');
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            });
        } else {
            hideInputButton('.upload-file-wrapper');
        }

        // initialize to first image in photlist
        clearCanvas();
        photolist.children('img:first-child').click();
    }


    // =========== utility functions ===========

    /**
     * Reference: http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
     */
    function dataURItoBlob(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var array = [];
        for(var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type: 'image/jpeg' });
    }

    /**
     * options:
     *     {
     *         img:     <string>   URL or Data-URI,
     *         type:    <string>   'url' or 'dataURI',
     *         success: <function> success callback,
     *         error:   <function> error callback
     *     }
     */
    function faceppDetect(options) {
        if ($.support.cors) {
            var xhr = new XMLHttpRequest();
            xhr.timeout = 10 * 1000;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        //THIS IS GIVING RESPONSE IN STRING NOT OBJECT
                        // console.log(xhr);
                        options.success(JSON.parse(xhr.responseText));
                    } else {
                        options.error();
                    }
                }
            };

            //#endregion


            var fd = new FormData();
            fd.append('api_key', API_KEY);
            fd.append('api_secret', API_SECRET);
            fd.append('return_landmark', 1);
            //RETURN ATTRIBUTES ***********************************************/
            fd.append('return_attributes', 'gender,age,headpose,emotion');
            if (options.type === 'dataURI') {
                xhr.open('POST', API_URL + '/detect');
                fd.append('image_file', dataURItoBlob(options.img));
                //**************************************************************/
                //GET IMAGE TO THROW INTO STORAGE DB - base64
                image64 = options.img;
                // console.log(image64);

                var byteNumbers = new Array(image64.length);
                for (var i = 0; i < image64.length; i++) {
                    byteNumbers[i] = image64.charCodeAt(i);
                }
        
                var byteArray = new Uint8Array(byteNumbers);
                var contentType = 'jpg';

                blob = new Blob([byteArray], {type: contentType});
                // console.log(blob);

                imageName = "image_" + photoCounter;
                // console.log("Photo Counter Index: " + photoCounter);

                sendPicToDB();
            
                // getPicFromDB();
                // getPicsForGallery();
                // should use then, or callback
                setTimeout(appendPicToGallery, 1000);
                photoCounter++;
                xhr.send(fd);

            }else if (options.type === 'url') {
                xhr.open('POST', API_URL + '/detect');
                fd.append('image_url', options.img);

                // never gets in here

                xhr.send(fd);
            } else {
                options.error();
            }
        } else { // fallback to jsonp
            if (options.type === 'url') {
                $.ajax({
                    url: API_URL + '/detect',
                    data: {
                        api_key: API_KEY,
                        api_secret: API_SECRET,
                        url: options.img
                    },
                    dataType: 'jsonp',
                    success: options.success,
                    error: options.error,
                    timeout: 10 * 1000
                });
            } else {
                options.error();
            }
        }
    }

    //Floating Action Button JS
    document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.fixed-action-btn');
        var instances = M.FloatingActionButton.init(elems, {
            direction: 'left'
        });
    });

    function sendPicToDB(){
        
        console.log("image name: " + imageName);

        //Create Storage Ref --- give it a file name
        var storageRef = firebase.storage().ref("Emotion Photos/" + imageName);

        // Add image names to array
        imageArray.push(imageName);
        console.log("This is the image array to send to db");
        console.log(imageArray);

        //Upload the Blob to Storage
        storageRef.put(blob);
    }

    var data;

    // get image array first. then wait to get the array back before 
    // looping through the other getPicsFromGallery function
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
    
                        var galleryRow = $(".galleryRow");
        
                        var parentDiv = $("<div>");
                        parentDiv.attr("class", "col s12 m2");
                        galleryRow.append(parentDiv);
                        var cardDiv = $("<div>");
                        cardDiv.attr("class", "card");
                        parentDiv.append(cardDiv);
                        var cardImageDiv = $("<div>");
                        cardImageDiv.attr("class", "card-image");
                        cardDiv.append(cardImageDiv);
                        var imgTag = $("<img>");
                        //give it an id to find later
                        imgTag.attr("id", imageArray[i]);
                        //give it the base64 string from db
                        imgTag.attr("src", responseBase64);
                        cardImageDiv.append(imgTag);
                        var cardTitleDiv = $("<div>");
                        cardTitleDiv.attr("class", "card-title");
                        cardTitleDiv.attr("style", "font-size: 16px;");
                        //give the card some text
                        cardTitleDiv.text(imageArray[i]);
                        cardImageDiv.append(cardTitleDiv);
    
    
                        // var img = document.getElementById('myimg');
                        // img.src = responseBase64;
                    };
                    xhrFirebase.open('GET', url);
                    xhrFirebase.send();
        
                }).catch(function(error) {
                // Handle any errors
                });
            }
        }


    }


    function appendPicToGallery(){

        var storage = firebase.storage();
        var data;
        var imageArrayFromDb;
        // console.log(database);
        // console.log(storage);

        // Create a storage reference from our storage service
        var storageRef = storage.ref();
 
        storageRef.child('Emotion Photos/' + imageName ).getDownloadURL().then(function(url) {
            var responseBase64;

            var xhrFirebase = new XMLHttpRequest();
            //want to get text back not a blob
            xhrFirebase.responseType = 'text';
            xhrFirebase.onload = function(event) {
                //This is the base64 string back from the db
                responseBase64 = xhrFirebase.response;
                // console.log(responseBase64);

                // ADD base64 from Database to HTML HERE*****
                // This is a sequence issue.. image will be undefined 
                // if you do not wait until you get back the base 64 from the db

                //create new divs with image same as bootstrap card.. then five it
                //the image
                var galleryRow = $(".galleryRow");

                var parentDiv = $("<div>");
                parentDiv.attr("class", "col s12 m2");
                galleryRow.append(parentDiv);
                var cardDiv = $("<div>");
                cardDiv.attr("class", "card");
                parentDiv.append(cardDiv);
                var cardImageDiv = $("<div>");
                cardImageDiv.attr("class", "card-image");
                cardDiv.append(cardImageDiv);
                var imgTag = $("<img>");
                //give it an id to find later
                // imgTag.attr("id", imageArray[i]);
                //give it the base64 string from db
                imgTag.attr("src", responseBase64);
                cardImageDiv.append(imgTag);
                var cardTitleDiv = $("<div>");
                cardTitleDiv.attr("class", "card-title");
                cardTitleDiv.attr("style", "font-size: 16px;");
                //give the card some text
                cardTitleDiv.text(mainEmotion + ": " + mainEmotionValue);
                cardImageDiv.append(cardTitleDiv);


                // var img = document.getElementById('myimg');
                // img.src = responseBase64;
            };
            xhrFirebase.open('GET', url);
            xhrFirebase.send();

        }).catch(function(error) {
        // Handle any errors
        });



    }

    $("#view-dashboard").on("click", function(event) {
        event.preventDefault();
        window.location.replace("./mood.html");
    });
 
    // intialize all Materalize js functions
    M.AutoInit();

    
    //#region  Need this function but not doing anything..
    $(function() {
        makeDetector(document.getElementById('detector'), {
            imgs: [
                'https://www.faceplusplus.com.cn/scripts/demoScript/images/demo-pic1.jpg',
                'https://www.faceplusplus.com.cn/scripts/demoScript/images/demo-pic10.jpg',
                'https://www.faceplusplus.com.cn/scripts/demoScript/images/demo-pic8.jpg',
                'https://www.faceplusplus.com.cn/scripts/demoScript/images/demo-pic6.jpg'
            ]
        });
    });

    //#endregion

})();
