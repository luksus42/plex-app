
/************************************/
/*** PREPARE HTML5 STREAM PLAYER ****/
/************************************/
function addToPlaylist(list_infos)
{
    var playList = JSON.parse(localStorage.getItem("playList"));
    //console.debug("playList=", playList);

    var alreadyInPlaylist = false;
    
    playList.forEach(function(elem, idx, array) {
        if(elem.key === list_infos.key)
        {
            alreadyInPlaylist = true;
            return;
        }
    });

    if(alreadyInPlaylist)
        return;

    playList.push(list_infos)-1;
    localStorage.setItem("playList", JSON.stringify(playList));

    
    //update gui
    var el=list_infos.UI.list("#playList").append(
        (list_infos.artist != "" && list_infos.mediatype == "track" ? list_infos.artist + " - ": "") + list_infos.title,
        null,
        list_infos.key.replace(/\//g, ''),
        null,
        null
    );
    el.className = "playListTitle";

    $(el).find("a").bind("click", function() {
        play(list_infos);
    });

    // add remove Button and click-Listener
    var rmButton = addRemovePlaylistButton(list_infos.key);
    el.appendChild(rmButton);
}

function play(list_infos) {
    //console.debug(list_infos);
    var player = document.getElementById("player");   
    var server = list_infos.server;

    // stop player and remove source, with workaround that the "download-session" will be closed
    if (player) {
        var source = document.getElementById("playerSource");
        player.pause();
        source.src = "";
        player.load();
    }

    // prepare stream and add new player after clicked list-element
    prepareStream(player, list_infos, server);
    createControls(player, list_infos, server);

    //set player style
    if(list_infos.mediatype == "movie" || list_infos.mediatype == "episode")
        player.className = "videoPlayer";
    else
        player.className = "audioPlayer";

    // open player
    if($("#playerBox").css("display") === "none") {
        $("#switchPlayerVisability").trigger("click");
    }

    // colorize the active track in playlist
    var selector = "#"+list_infos.key.replace(/\//g, '');
    $(selector).addClass("playingTitle");
    // && remove color from others
    var playList = JSON.parse(localStorage.getItem("playList"));
    playList.forEach(function(elem, idx, array) {
        var id = "";
        if(elem.key !== list_infos.key)
        {
            id = "#"+elem.key.replace(/\//g, '');
            $(id).removeClass("playingTitle");
        }
    });

    // store the current played title
    localStorage.setItem("currentTitle", JSON.stringify(list_infos));
}

function prepareStream(player, list_infos, server) {

    //console.debug("localStorage.transcoding Setting: ", localStorage.getItem("transcoding"));

    var directPlay = (localStorage.getItem("transcoding") === "0")? 1 : 0; // stream without any transcoding

    //var player = (list_infos.mediatype === "track")? document.createElement("audio") : document.createElement("video");
    //var player = document.getElementById("player");
    var source = document.createElement("source");

    $("#playerSource").remove();

    source.id = "playerSource";
    player.id = "player";
    player.controls = false;
    player.autoplay = true;
    player.height = ($(window).width()*9)/16;

    //direct stream without transcoding, when directplay is set or file is an audiotrack
    if (directPlay === 1 || list_infos.mediatype === "track") {
        source.src = server
            +list_infos.download
            +(localStorage.getItem("useAuth") === "true"? "?X-Plex-Token="+localStorage.getItem("authToken") : "");
    } else {
        // transcode
        source.src = server+streamOptions(list_infos, 0);
    }


    // set mediatype for html-video player, depending on kind of given media
    switch(list_infos.mediatype) {
        case "track":
            player.className = "audioPlayer";
            source.setAttribute("type", "audio/"+list_infos.container);
            break;
        case "movie":
            player.className = "videoPlayer";
            if (list_infos.container === "mkv" || directPlay === 0) {
                source.setAttribute("type", "video/mp4");
            } else {
                source.setAttribute("type", "video/"+list_infos.container);
            }
            break;
        case "episode":
            player.className = "videoPlayer";
            if (list_infos.container === "mkv" || directPlay === 0) {
                source.setAttribute("type", "video/mp4");
            } else {
                source.setAttribute("type", "video/"+list_infos.container);
            }
            break;
        default:
            break;
    }

    player.appendChild(source);
    player.style.background = 'url(img/ajax-loader.gif) no-repeat center #000000';

    //return player;
};


/************************************/
/**** STREAM TRANSCODING OPTIONS ****/
/************************************/
function streamOptions(list_infos, offset) {
    var transcodeOption = (localStorage.getItem("transcoding"));
    var directPlay = (transcodeOption === "0" || list_infos.mediatype === "track")? 1 : 0; // stream without any transcoding
    var directStream = (transcodeOption === "1")? 1 : 0; // direct stream codecs, but transcode container (also dts transcoding)
    var fulltranscode = (transcodeOption >= "2")? 1 : 0; // transcode with v-Settings
    var vBitrate;
    var vQuali;
    var vRes;

    switch(transcodeOption) {
        case "2":
            vBitrate = 2000;
            vQuali = 80;
            vRes = "1280x720";
            break;
        case "3":
            vBitrate = 1500;
            vQuali = 60;
            vRes = "740x480";
            break;
        case "4":
            vBitrate = 720;
            vQuali = 60;
            vRes = "640x360";
            break;
        case "5":
            vBitrate = 320;
            vQuali = 50;
            vRes = "640x360";
            break;
        default:
            vBitrate = 1500;
            vQuali = 60;
            vRes = "740x480";
    }

    var transcodeParams = "/"+(list_infos.mediatype === 'track'? "audio" : "video")
        +"/:/transcode/universal/start?path="+list_infos.key
        +"&protocol=http&offset="+offset
        +"&fastSeek=1&directPlay="+directPlay
        +"&directStream="+directStream
        +(fulltranscode === 1? "&maxVideoBitrate="+vBitrate : "")
        +(fulltranscode === 1? "&videoQuality="+vQuali : "")
        +(fulltranscode === 1? "&videoResolution="+vRes  : "")
        +"&X-Plex-Platform=Chrome"
        +(localStorage.getItem("useAuth") === "true"? "&X-Plex-Token="+localStorage.getItem("authToken") : "");

    return transcodeParams;
};


/************************************/
/***** INIT PLAYER CONTROLS *********/
/************************************/
function initPlayerControls() {
    // Volume Controls
    var volume = document.getElementById("volume");
    //volume.type = "range";
    volume.min = "0";
    volume.max = "1";
    volume.step = "0.01";
    volume.value = "1";
    volume.className = "custom-controls";

    volume.addEventListener("input", function() {
        player.volume = volume.value;
    });
    
    var muteBtn = document.getElementById("muteBtn");
    //muteBtn.id = "muteBtn";
    muteBtn.className = "unmuted custom-controls";
    muteBtn.title = "mute";

    muteBtn.addEventListener("click", function() {
        if(!player.muted) {
            player.muted = true;
            muteBtn.className = "muted custom-controls";
        } else {
            player.muted = false;
            muteBtn.className = "unmuted custom-controls";
        }
    });

    // REGISTER PLAYER FULLSCREEN EVENTS:
    var player = document.getElementById("player");
    // fade controls in fullscreenmode
    document.addEventListener("webkitfullscreenchange", function() {
        if(document.webkitIsFullScreen) {
            $("#playerControls").fadeOut();
        } else {
            $("#playerControls").fadeIn();
        }
    });

    // fade controls in fullscreenmode
    player.addEventListener("click", function() {
        console.log("click fullscreenmode");
        if(document.webkitIsFullScreen && $("#playerControls").css("display") === "none") {
            $("#playerControls").fadeIn();
        } else if(document.webkitIsFullScreen) {
            $("#playerControls").fadeOut();
        }
    });
}

function resetPlayerControls()
{
    // player
    document.getElementById("player").currentTime = 0;
    // timer
    document.getElementById("timer").innerHTML = "0:00:00";
    // progressbar
    var progressbar = document.getElementById("progressBar");
    progressbar.value = "0";
    $(progressbar).unbind();
}

/************************************/
/*** CREATE PLAYER CONTROLS *********/
/************************************/
function createControls(player, list_infos, server) {

    var controls = document.getElementById("playerControls");

    // Play/Pause button
    document.getElementById("playPauseBtn").remove();
    var playPauseBtn = document.createElement("button");
    playPauseBtn.id = "playPauseBtn";
    playPauseBtn.className = "pause custom-controls";
    playPauseBtn.title = "play";

    playPauseBtn.addEventListener("click", function() {
        if(player.paused || player.ended) {
            playPauseBtn.className = "pause custom-controls";
            playPauseBtn.title = "pause";
            player.style.background = 'url(img/ajax-loader.gif) no-repeat center #000000';
            player.play();
        } else {
            playPauseBtn.className = "play custom-controls";
            playPauseBtn.title = "play";
            player.style.background = '#000000';
            player.pause();
        }
    });

    // timer
    document.getElementById("timer").remove();
    var timer = document.createElement("span");
    timer.id = "timer";
    timer.innerHTML = "0:00:00";
    timer.className = "custom-controls";

    // Progressbar aka timeline
    document.getElementById("progressBar").remove();
    var progressBar = document.createElement("progress");
    progressBar.id = "progressBar";
    progressBar.min = "0";
    progressBar.max = "100";
    progressBar.value = "0";
    progressBar.className = "custom-controls";

    player.addEventListener("timeupdate", function() {
        var percent = (100 / list_infos.duration * (list_infos.duration-player.duration+player.currentTime)).toFixed(2);
        progressBar.value = (isNaN(percent)? progressBar.value : percent);
        progressBar.innerHTML = percent + '% played';
        if(list_infos.mediatype === "track") {
            timer.innerHTML = toHHMMSS(player.currentTime);
        } else if (!isNaN((list_infos.duration-player.duration+player.currentTime).toFixed(2))) {
            timer.innerHTML = toHHMMSS((list_infos.duration-player.duration+player.currentTime).toFixed(2));
        }
    });

    
    $(progressBar).bind("click", function(e) {
        var directPlay = (localStorage.getItem("transcoding") === "0")? true : false;
        var percent = e.offsetX / this.offsetWidth;
        if(list_infos.mediatype === "track" || directPlay) {
            player.currentTime = percent * player.duration;
        } else {
            var source = document.getElementById("playerSource");
            source.src = server+streamOptions(list_infos, percent * list_infos.duration);
            player.load();
            playPauseBtn.click();
        }
    });

    // Fullscreen Button
    document.getElementById("fullscreenBtn").remove();
    var fullscreenBtn = document.createElement("button");
    fullscreenBtn.id = "fullscreenBtn";
    fullscreenBtn.title = "Fullscreen";
    fullscreenBtn.className = "start-fullscreen custom-controls";

    fullscreenBtn.addEventListener("click", function() {
        if (!document.webkitIsFullScreen) {
            controls.className = "fullscreen-controls";
            fullscreenBtn.className = "end-fullscreen custom-controls";
            player.webkitRequestFullscreen(); // Chrome and Safari
        } else {
            controls.className = "";
            fullscreenBtn.className = "start-fullscreen custom-controls";
            document.webkitExitFullscreen(); // Chrome and Safari
            $("#playerControls").fadeIn();
        }
    });

    // add all elements to control element
    controls.appendChild(playPauseBtn);
    controls.appendChild(progressBar);
    controls.appendChild(timer);
    controls.appendChild(muteBtn);
    controls.appendChild(volume);
    controls.appendChild(fullscreenBtn);

    //return controls;
}

// Init playlist automation and eventListeners
function initPlaylistFunctions(UI)
{
    // Player: eventListener for switching to next title in playList, when previous title has been finished
    document.getElementById("player").addEventListener("ended", function(){
        var currentTitle = JSON.parse(localStorage.getItem("currentTitle"));
        var playList = JSON.parse(localStorage.getItem("playList"));

        var currentIdx = playList.findIndex(function(elem, index, array){
            return elem.key == currentTitle.key;
        });

        if(currentIdx+1 < playList.length)
            play(playList[currentIdx+1]);
        else
            play(playList[0]);
    });

    // "clear-PlayList" -event-listener
    document.getElementById("clearPlayList").addEventListener("click", function(){
        localStorage.setItem("playList", JSON.stringify([]));
        UI.list("#playList").removeAllItems();

        // stop and reset player
        var player = document.getElementById("player");
        var source = document.getElementById("playerSource");
        player.pause();
        source.src = "";
        player.load();

        player.className = "audioPlayer";
        resetPlayerControls();
    });
}

function initPlayListGui(UI)
{
    // init GUI-playList
    var playList = JSON.parse(localStorage.getItem("playList"));
    playList.forEach(function(elem, idx, array){
        if(typeof(elem.key) !== "undefined")
        {
            var el = UI.list("#playList").append(
                (elem.artist != "" ? elem.artist + " - ": "") + elem.title,
                null,
                elem.key.replace(/\//g, ''),
                null,
                null
            );
            el.className = "playListTitle";

            $(el).find("a").bind("click", function() {
                play(elem);
            });
            
            // add remove Button and click-Listener
            var rmButton = addRemovePlaylistButton(elem.key);

            el.appendChild(rmButton);
        }
    });
}

function addRemovePlaylistButton(elementKey)
{
    var rmButton = document.createElement("div");
    rmButton.className = "removeFromPlaylist";
    rmButton.addEventListener("click", function(e){
        
        // update storage playlist
        var thisPlayList = JSON.parse(localStorage.getItem("playList"));
        var newPlayList = thisPlayList.filter(function(el) {
            return el.key !== elementKey;
        });
        localStorage.setItem("playList", JSON.stringify(newPlayList));
        
        // update GUI playlist
        var id = "#"+elementKey.replace(/\//g, '');
        $(id).remove();

        // if playing title is removed, stop and reset player
        var currentTitle = JSON.parse(localStorage.getItem("currentTitle"));
        if(currentTitle.key == elementKey)
        {
            var player = document.getElementById("player");
            var source = document.getElementById("playerSource");
            player.pause();
            source.src = "";
            player.load();

            if(currentTitle.mediatype === "movie" || currentTitle.mediatype === "episode")
            {
                player.className = "audioPlayer";
            }

            resetPlayerControls();
        }
    });

    return rmButton;
}