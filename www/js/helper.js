
/************************************/
/******** HELPER FUNCTIONS **********/
/************************************/
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

function generateUUID(){
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function server() {
    var server;

    if (localStorage.getItem("useAuth") === "true") {
        server = "http://"+localStorage.getItem("remoteIP")+":"+localStorage.getItem("remotePort");
    } else {
        server = "http://"+localStorage.getItem("ip")+":"+localStorage.getItem("port");
    }
    return server;
};

function initLocalStorage() {
    if (localStorage.getItem("useAuth") == null)
        localStorage.setItem("useAuth", false);
    if (localStorage.getItem("ip") == null)
        localStorage.setItem("ip", "0.0.0.0");
    if (localStorage.getItem("remoteIP") == null)
        localStorage.setItem("remoteIP", "0.0.0.0");
    if (localStorage.getItem("port") == null)
        localStorage.setItem("port", "0");
    if (localStorage.getItem("remotePort") == null)
        localStorage.setItem("remotePort", "0");
    if (localStorage.getItem("transcoding") == null)
        localStorage.setItem("transcoding", "0");
    if (localStorage.getItem("user") == null)
        localStorage.setItem("user", "");
    if (localStorage.getItem("password") == null)
        localStorage.setItem("password", "");
    if (localStorage.getItem("UUID") == null)
        localStorage.setItem("UUID", generateUUID());
    if (localStorage.getItem("switchView") == null)
        localStorage.setItem("switchView", false);
    if (localStorage.getItem("plexServerVersion") == null)
        localStorage.setItem("plexServerVersion", 0);
    if (localStorage.getItem("playList") == null)
    {
        var playList = [];
        localStorage.setItem("playList", JSON.stringify(playList));
    }
    if (localStorage.getItem("currentTitle") == null)
        localStorage.setItem("currentTitle", "");
}

function openInfoDialog(UI, infoText) {
    document.getElementById("infoDialogText").innerHTML = infoText;
    UI.dialog("infoDialog").show();
}

function toHHMMSS (timerSeconds) {
    var sec_num = parseInt(timerSeconds, 10);
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    //if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
};

function dropAnimation(id, elem) {
    var dropElem = document.getElementById(id); 
    var pos = elem.position().top == 0 ? 75 : elem.position().top+75;
    
    dropElem.style.height = elem.css("height");
    dropElem.style.top = pos+"px";
    dropElem.style.display = "block";
    
    var dropId = setInterval(frame, 30);
    function frame() {
      if (pos > $("#player-container").position().top) {
        clearInterval(dropId);
        dropElem.style.display = "none";
        dropElem.style.top = "50px";
      } else {
        pos=pos+50;
        dropElem.style.top = pos +"px"; 
      }
    }
  }