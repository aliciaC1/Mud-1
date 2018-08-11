$(document).ready(function() {
    // Global variables
    var key = "";
    var playlistId = "PL-qpR0uYyvkYitfDZOPmNAivTZPP4pacs";
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
                <h4 class="title">${title}</h4>
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
    });
