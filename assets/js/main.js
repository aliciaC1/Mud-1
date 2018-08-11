//prevents non registered user from entering the application
var mainApp = {};

(function(){
    var firebase = app_fireBase;
    //used so that if the user is not logged in it is set to null and page gets redirected to login.html
    var uid = null;
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in.
            uid = user.uid;
        }else{
            //redirect to login page
            uid = null;
            window.location.replace("index.html");
        }
      });

    //signs out the user
    function logOut(){
        firebase.auth().signOut();
    }

    mainApp.logOut = logOut;
})()