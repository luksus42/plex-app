/*plex.js*/

function getPlexVersion(UI) {
    var xhr = new XMLHttpRequest();
    var url = server();
    var version = "0";

    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 5000;
    if (localStorage.getItem("useAuth") === "true") {
        xhr.setRequestHeader('X-Plex-Token', localStorage.getItem("authToken"));
    }
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            version = response.MediaContainer.version;
            localStorage.setItem("plexServerVersion", version);
            explore("init", UI, server());
        } 
    };
    xhr.ontimeout = function() {
        openInfoDialog(UI, "Timeout: Could not identify your plex-server-version. Please check your connection settings.");
    }
    xhr.send();
}

/************************************/
/********** PLEX TV LOGIN ***********/
/************************************/
function plexLogin(UI) {

    var xhr = new XMLHttpRequest();

    var username = localStorage.getItem("user");
    var password = localStorage.getItem("password");
    var auth = 'Basic ' + btoa(username+':'+password);
    var devices;

    xhr.open('POST', "https://my.plexapp.com/users/sign_in.json", true);
    //xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Authorization', auth);
    xhr.setRequestHeader('X-Plex-Product', 'Plex Local'); // Plex app name, eg Laika, Plex Media Server, Media Link.
    xhr.setRequestHeader('X-Plex-Version', '0.3.1'); // Plex app version number (any string?).
    xhr.setRequestHeader('X-Plex-Client-Identifier', localStorage.getItem("UUID")); // UUID, SN, or other number unique per device.

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 201) {

            var response = JSON.parse(xhr.responseText);
            localStorage.setItem("authToken", response.user.authToken);

            var sxhr = new XMLHttpRequest();

            sxhr.open('GET', "https://plex.tv/api/resources", true);
            sxhr.setRequestHeader('X-Plex-Token', response.user.authToken);
            
            sxhr.onreadystatechange = function() {
                if (sxhr.readyState == 4 && sxhr.status == 200) {

                    var xml = sxhr.responseText;
                    var devices = $(xml).find('Device');

                    selectDevice(UI, devices);
                }
            }
            sxhr.send();

        } else if (xhr.readyState == 4 && xhr.status == 401) {
            openInfoDialog(UI, "Your login data seems to be incorrect!");
        } else if (xhr.readyState == 4) {
            openInfoDialog(UI, "Something is wrong with your connection settings!");
        }
    }
    xhr.send();

    return devices;

};


/************************************/
/******** SELECT PLEX DEVICE ********/
/************************************/
function selectDevice(UI, devices) {

    var deviceList = UI.list("#devices");
    deviceList.removeAllItems();

    for (var i=0; i<devices.length; i++) {
       var el = deviceList.append(
            ($(devices[i]).attr('name')? $(devices[i]).attr('name') : 'Device'+i.toString()),
            null,
            "device"+"-"+i.toString(),
            function(target, params){
                localStorage.setItem("remoteIP", params.remoteIP);
                localStorage.setItem("remotePort", params.remotePort);

                UI.dialog("deviceSelector").hide();

                getPlexVersion(UI);
            },
            {
                "remoteIP":$(devices[i]).find('Connection[local="0"]').attr('address'),
                "remotePort":$(devices[i]).find('Connection[local="0"]').attr('port')
            }
        );
    }

    UI.dialog("deviceSelector").show();  

};