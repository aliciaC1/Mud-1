//global variable is exposed
var app_fireBase = {};
//wrapped in a function so everything wrapped in function is private
(function(){
    //Initialize Firebase
var config = {
    apiKey: "AIzaSyAJL8x08SRMEYMMtn13bD69hZHjWZC_zmM",
    authDomain: "mud-4e9fe.firebaseapp.com",
    databaseURL: "https://mud-4e9fe.firebaseio.com",
    projectId: "mud-4e9fe",
    storageBucket: "mud-4e9fe.appspot.com",
    messagingSenderId: "350533286927"
  };
  firebase.initializeApp(config);
  
  app_fireBase = firebase;
})()