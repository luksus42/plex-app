/************************************/
/**** CREATE INITIAL ROOT LIST ******/
/************************************/
function explore(action, UI, server) {

    var xhr = new XMLHttpRequest();
    var list = UI.list("#browser");
    var curPage = UI.pagestack.currentPage();
    var url = "/library/sections";

    version = localStorage.getItem("plexServerVersion");

    list.removeAllItems();

    if(action === "init") {
        xhr.open('GET', server+url, true);
        xhr.setRequestHeader('Accept', 'application/json');
        if (localStorage.getItem("useAuth") === "true") {
            xhr.setRequestHeader('X-Plex-Token', localStorage.getItem("authToken"));
        }
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {

                    var response = JSON.parse(xhr.responseText);

                    if(version < 1.3) {
                        for (var i=0; i<response._children.length; i++) {
                            var child = response._children.Directory[i];
                            getRootList(UI, list, child, server, curPage, i);
                        }
                    // newer Plex versions
                    } else {
                        for (var i=0; i<response.MediaContainer.Directory.length; i++) {
                            var child = response.MediaContainer.Directory[i];
                            getRootList(UI, list, child, server, curPage, i);
                        }
                    }

                } else {
                    // set settings from localStorage
                    document.getElementById("serverUrl").value = localStorage.getItem("ip");
                    document.getElementById("port").value = localStorage.getItem("port");

                    // set transcoding option active
                    // set classes of all options to "empty" and add "active" to stored option:
                    document.getElementById("os0").className = "";
                    document.getElementById("os1").className = "";
                    document.getElementById("os2").className = "";
                    document.getElementById("os"+localStorage.getItem("transcoding")).className = "active";

                    UI.pagestack.push("settings");

                    if (localStorage.getItem("useAuth") === "true") {
                        openInfoDialog(UI, "Connection to plex.tv was succesfull, but your server is unreachable!");
                    } else {
                        openInfoDialog(UI, "Something is wrong with your connection settings!");
                    }
                }
            }
        };
        xhr.send();
    }

    document.getElementById("refreshSection").style.display = "block";
};

function getRootList(UI, list, child, server, curPage, i) {
    var el = list.append(
        child.title,
        null,
        curPage+"-"+i.toString(),
        browse,
        {
            "element":"Directory",
            "mediatype":child.type,
            "viewGroup": child.type,
            "key":child.key,
            "title":child.title,
            "url":server+"/library/sections/"+child.key+"/folder",
            "urlAll":server+"/library/sections/"+child.key+"/all?"
                        +(child.key == 3? "type=8" : "type=1"),
            "server":server,
            "UI":UI,
            "ratingKey": child.key
            //"useAuth":localStorage.getItem("useAuth")
        }
    );
    var iconElem = document.createElement("aside");
    var imgElem = document.createElement("img");
    imgElem.setAttribute("src", "img/folder.png");
    iconElem.className = "icon";
    iconElem.appendChild(imgElem);
    el.insertBefore(iconElem, el.firstChild);
}


/************************************/
/******** LIST BROWSER LOGIC ********/
/************************************/
function browse(target, list_infos, fromEvent) {
    //console.debug(target, list_infos);
    var UI = list_infos.UI;

    var xhr = new XMLHttpRequest();

    var title = list_infos.title;
    var url = (localStorage.getItem("viewAll") === "true" && list_infos.viewGroup === "movie"? list_infos.urlAll : list_infos.url);
    var server
    var key = list_infos.key;
    var elementId = (localStorage.getItem("viewAll") === "true" && list_infos.viewGroup === "movie"? "viewAll_"+list_infos.ratingKey : key.split("=")[key.split("=").length-1]);
    var totalSize = list_infos.plexContainerTotalSize;
    var plexContainerSize = 42;
    var loadedSize = list_infos.loadedSize;

    if (!loadedSize) {
        loadedSize = 0;
    }

    if (localStorage.getItem("useAuth") === "true") {
        server = "http://"+localStorage.getItem("remoteIP")+":"+localStorage.getItem("remotePort");
    } else {
        server = "http://"+localStorage.getItem("ip")+":"+localStorage.getItem("port");
    }

    var newPage = document.getElementById(elementId);
    var newList = document.getElementById("browser-"+elementId);

    if (list_infos.element === "Directory") {
        // create new page, only when it not already exists (same page already visited)
        if (newPage === null) {
            newPage = document.createElement("div");
            newPage.setAttribute("data-role", "page");
            newPage.id = elementId;
            newPage.setAttribute("data-title", title);
            document.getElementById("browse-path").appendChild(newPage);

            // EventListener: load more rows when scroll hits the bottom
            $(window).on("scroll.detectBottom", function() {
                if($(window).scrollTop() + $(window).height() == $(document).height() && $(window).scrollTop() != 0
                    && (list_infos.page == UI.pagestack.currentPage())
                ) {
                    setTimeout(browse(target, list_infos, true), 200);
                }
            });
        }

        // only push new page when new Page is requested (todo)
        if(UI.pagestack.currentPage() != newPage.id) {
            UI.pagestack.push(newPage.id);
            document.getElementById("actions_root").style.display = "block";
            document.getElementById("refreshSection").style.display = "none";
        }

        // create new list, only when it not already exists
        if (newList === null) {
            newList = document.createElement("section");
            newList.setAttribute("data-role", "list");
            newList.id = "browser-"+elementId;
            document.getElementById(UI.pagestack.currentPage()).appendChild(newList);
        } else if (fromEvent && (totalSize === -1 || loadedSize < totalSize)) {
            // do nothing
            //console.debug(loadedSize, totalSize);
        } else {
            return;
        }

        // set list for adding new items
        var list = UI.list("#"+newList.id);
        //list.removeAllItems(); 
    }
    
    //console.debug(list_infos.url)

    if (localStorage.getItem("viewAll") === "true" && list_infos.viewGroup === "movie") {
        url = url+"&X-Plex-Container-Start="+loadedSize+"&X-Plex-Container-Size="+plexContainerSize;
    } else if (key.substring(0,8) === "/library") {
        url = server+key+"&X-Plex-Container-Start="+loadedSize+"&X-Plex-Container-Size="+plexContainerSize;
    }

    //console.debug(list_infos.url)
    //console.debug(list_infos.urlAll)

    if (list_infos.element === "Directory") {
        //list.removeAllItems();

        xhr.open('GET', url, true);
        xhr.setRequestHeader('Accept', 'application/json');
        if (localStorage.getItem("useAuth") === "true") {
            xhr.setRequestHeader('X-Plex-Token', localStorage.getItem("authToken"));
        }

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {

                var response = JSON.parse(xhr.responseText);
                var version = localStorage.getItem("plexServerVersion");

                //console.debug(response._children[0].ratingKey);

                if(version < 1.3) {

                    list_infos.plexContainerTotalSize = response.totalSize;
                    list_infos.loadedSize = loadedSize + response._children.length;
                    list_infos.page = newPage.id;


                    if(response._children.length > 0) {
                        $("#addAll").css("display", "block");
                        $("#"+UI.pagestack.currentPage()).addClass("hasFiles");
                    }
                    else {
                        $("#addAll").css("display", "none");
                    }

                    for (var i=0; i<response._children.length; i++) {
                        var genres = "";
                        var child = response._children[i];
                        var details;

                        if (child._elementType !== "Directory") {
                            details = child._children[0];
                            // get list of genres
                           for(var j=0; j<child._children.length; j++) {
                                if(child._children[j]._elementType === "Genre") {
                                    genres = genres + (genres.length > 0? ", " : "") + child._children[j].tag;
                                }
                            }
                        }

                        var el = list.append(
                           child.title,
                           (child._elementType !== "Directory")?
                                details.container : null,
                           elementId+"-"+i.toString(),
                           browse,
                           {
                                "element":child._elementType,
                                "mediatype":child.type,
                                "viewGroup": response.viewGroup,
                                "key":child.key,
                                "ratingKey": child.ratingKey,
                                "title":child.title,
                                "artist": (child.originalTitle ? child.originalTitle : ""),
                                "year": (child.year? child.year : ""),
                                "videoDetails": (details?
                                                    details.container +", "+
                                                    details.videoCodec +", "+
                                                    details.videoResolution +(details.videoResolution === "sd"? "" : "p")
                                                : "nofile"),    
                                "audioDetails": (details?
                                                    (details.audioProfile? (details.audioProfile === "es" ? "dts" : details.audioProfile) : details.audioCodec) +", "+
                                                    details.audioChannels +" channels"
                                                : "nofile"),
                                "genre": (details? genres : ""),
                                "rating": (details? (child.rating? child.rating : "") : ""),
                                "url": url+"/"+child.key+"/"+"folder",
                                "server": server,
                                "UI":UI,
                               // "useAuth":localStorage.getItem("useAuth"),
                                "download":(child._elementType !== "Directory")?
                                    details._children[0].key : "nofile",
                                "container":(child._elementType !== "Directory")?
                                    details._children[0].container : "nofile",
                                "duration":(child._elementType !== "Directory")?
                                    (details._children[0].duration/1000) : 7200,
                                "thumb": server+"/photo/:/transcode?url="+server+child.thumb+"&width=300&height=300",
                                "summary": child.summary
                            }
                        );

                        var iconElem = document.createElement("aside");
                        var imgElem = document.createElement("img");

                        // set filetype icon
                        if(child._elementType !== "Directory") {
                            if (child.type === "track" ||
                                child.type === "movie"  ||
                                child.type === "episode"||
                                child.type === "picture") {

                                imgElem.setAttribute("src", "img/"+child.type+".png");
                            } else {
                                imgElem.setAttribute("src", "img/document.png");
                            }
                        } else {
                            imgElem.setAttribute("src", "img/folder.png");
                        }

                        iconElem.className = "icon";
                        iconElem.appendChild(imgElem);
                        el.insertBefore(iconElem, el.firstChild);
                    }
                } 
                else {
                    var DirectoryLength = (response.MediaContainer.Directory ? response.MediaContainer.Directory.length : 0);
                    var MetadataLength = (response.MediaContainer.Metadata ? response.MediaContainer.Metadata.length : 0);
                    
                    list_infos.plexContainerTotalSize = response.MediaContainer.totalSize;
                    list_infos.page = newPage.id;

                    if(version.substr(0,1) > 0 && version.substr(2,4) > 9) {
                        list_infos.loadedSize = loadedSize + DirectoryLength + MetadataLength;
                        var hasFiles = false;

                        for (var i=0; i<MetadataLength; i++) {
                            child = response.MediaContainer.Metadata[i];
                            if(!child.Media) {
                                // DIRECTORIES
                                putDirectories(child, i, list, elementId, server, UI);
                            } 
                            else {
                                // FILES
                                putFiles(child, i, response, list, elementId, server, UI, url);
                                hasFiles = true;
                            }
                        }

                        if(hasFiles) {
                            $("#addAll").css("display", "block");
                            $("#"+UI.pagestack.currentPage()).addClass("hasFiles");
                        }
                        else {
                            $("#addAll").css("display", "none");
                        }
                    }
                    else {
                        list_infos.loadedSize = loadedSize + DirectoryLength + MetadataLength;

                        if(MetadataLength > 0) {
                            $("#addAll").css("display", "block");
                            $("#"+UI.pagestack.currentPage()).addClass("hasFiles");
                        }
                        else {
                            $("#addAll").css("display", "none");
                        }

                        // DIRECTORIES
                        for (var i=0; i<DirectoryLength; i++) {
                            putDirectories(response.MediaContainer.Directory[i], elementId, server, UI);
                        }
                        // FILES
                        for (var i=0; i<MetadataLength; i++) {
                            putFiles(response.MediaContainer.Metadata[i], response, list, elementId, server, UI);
                        }
                    }

                    // add initital clickhandler for addAll-Button, after loading the list-elements
                    $("#addAll").unbind();
                    $("#addAll").bind("click", function() {
                        $("#"+UI.pagestack.currentPage()).find("li").each(function() {                         
                            if($(this).hasClass("file")) {
                                $(this).trigger("contextmenu");
                            }
                        });
                    });
                }
            } else if (xhr.readyState == 4) {
                openInfoDialog(UI, "Connection lost (?) or something different...");
            }
        };
        xhr.send();

    } else if (list_infos.mediatype !== "picture") {

        if (list_infos.mediatype === "movie") {
            document.getElementById("infoText").innerHTML = list_infos.summary;
            document.getElementById("coverImage").src = list_infos.thumb;
            document.getElementById("titleInfo").innerHTML = list_infos.title;
            document.getElementById("yearInfo").innerHTML = list_infos.year;
            document.getElementById("videoInfo").innerHTML = list_infos.videoDetails;
            document.getElementById("audioInfo").innerHTML = list_infos.audioDetails;
            document.getElementById("genreInfo").innerHTML = list_infos.genre;
            document.getElementById("ratingInfo").innerHTML = list_infos.rating;
            UI.pagestack.push("mediaInfo");


            $("#playMovie").unbind();
            $("#playMovie").bind("click", function() {
                addToPlaylist(list_infos, server);
                play(list_infos);
            });

            // populate audio and sub optionselectors
            setStreamOptions(UI, list_infos.key);

        } else {
            addToPlaylist(list_infos, server);
            play(list_infos);
        }
    }
}

function setStreamOptions(UI, key) {
    var streamDetails;

    // pull media Info
    var xhr = new XMLHttpRequest();
    xhr.open('GET', server()+key, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 3000;
    if (localStorage.getItem("useAuth") === "true") {
        xhr.setRequestHeader('X-Plex-Token', localStorage.getItem("authToken"));
    }
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            streamDetails = response.MediaContainer.Metadata[0].Media[0].Part[0].Stream;
            var partId = response.MediaContainer.Metadata[0].Media[0].Part[0].id;
            
            var audioSelector = $("#audioStreamSelector ul");
            var subSelector = $("#subStreamSelector ul");
            var x = 0;
            var y = 0

            // clear ul
            audioSelector.empty();
            subSelector.empty();

            subSelector.append($("<li>").attr("data-value", y).attr("id", 0)
                            .append($("<p>").text("None"))
            );
            y++;

            for (var i=0; i < streamDetails.length; i++) {
                var stream = streamDetails[i];
                // audio stream
                if(stream.streamType === 2)
                {
                    if(stream.selected)
                        var activeAudioStreamId = stream.id;
                    audioSelector.append($("<li>").attr("data-value", x).attr("id", stream.id)
                                        .append($("<p>").text(stream.displayTitle))
                    );
                    x++;
                }
                // sub stream
                if(stream.streamType === 3)
                {
                    if(stream.selected)
                        var activeSubStreamId = stream.id;
                    subSelector.append($("<li>").attr("data-value", y).attr("id", stream.id)
                                    .append($("<p>").text(stream.displayTitle))
                    );
                    y++;
                }
            }

            // register as option selectors to get "switch active" functionality
            uiAudioSelector = UI.optionselector("audioStreamSelector", true);
            uiSubSelector = UI.optionselector("subStreamSelector", true);

            // set active where stream is selected=true and remove active class at others.
            // to do this in the previous loop does NOT work!!!
            audioSelector = document.getElementById("audioStreamSelector")
                                    .getElementsByTagName("ul")[0];
            subSelector = document.getElementById("subStreamSelector")
                                  .getElementsByTagName("ul")[0];
            audioSelector.querySelectorAll("li").forEach(item => {
                if(item.id == activeAudioStreamId)
                    item.classList.add("active");
                else
                    item.classList.remove("active");
            });
            subSelector.querySelectorAll("li").forEach(item => {
                if(item.id == activeSubStreamId)
                    item.classList.add("active");
                else
                    item.classList.remove("active");
            });

            //action when selecting an option
            uiAudioSelector.onClicked(function(e){
                setStream(2, partId, e.target.id);
            });
            uiSubSelector.onClicked(function(e){
                setStream(3, partId, e.target.id);
            });
        }
    };
    xhr.send();
}

function elData(data) {
    return data;
}

function addAllFiles(data) {
    return data;
}

function putDirectories(child, i, list, elementId, server, UI) {
    var el = list.append(
        child.title,
        null,
        elementId+"-"+i.toString(),
        browse,
        {
                "element":"Directory",
                "mediatype":child.type,
                "viewGroup": child.type,
                "key":child.key,
                "title":child.title,
                "url":server+"/library/sections/"+child.key+"/folder",
                "urlAll":server+"/library/sections/"+child.key+"/all?"
                            +(child.key == 3? "type=8" : "type=1"),
                "server":server,
                "UI":UI,
                "ratingKey": child.key
                //"useAuth":localStorage.getItem("useAuth")
            }
        );

        var iconElem = document.createElement("aside");
        var imgElem = document.createElement("img");

        // set filetype icon
        imgElem.setAttribute("src", "img/folder.png");
        
        iconElem.className = "icon";
        iconElem.appendChild(imgElem);
        el.insertBefore(iconElem, el.firstChild);
}

function putFiles(child, i, response, list, elementId, server, UI, url) {
    var genres = "";
    //var child = response.MediaContainer.Metadata[i];
    var details;

    details = child.Media[0];
    // get list of genres
    var genreLength = child.Genre ? child.Genre.length : 0;
    for(var j=0; j<genreLength; j++) {
        genres = genres + (genres.length > 0? ", " : "") + child.Genre[j].tag;
    }
    
    var elListInfos = {
        "element":child.type,
        "mediatype":child.type,
        "viewGroup": response.viewGroup,
        "key":child.key,
        "ratingKey": child.ratingKey,
        "title":child.title,
        "artist": (child.originalTitle ? child.originalTitle : ""),
        "year": (child.year? child.year : ""),
        "videoDetails": (details?
                            details.container +", "+
                            details.videoCodec +", "+
                            details.videoResolution +(details.videoResolution === "sd"? "" : "p")
                        : "nofile"),    
        "audioDetails": (details?
                            (details.audioProfile? (details.audioProfile === "es" ? "dts" : details.audioProfile) : details.audioCodec) +", "+
                            details.audioChannels +" channels"
                        : "nofile"),
        "genre": (details? genres : ""),
        "rating": (details? (child.rating? child.rating : "") : ""),
        "url": url+"/"+child.key+"/"+"folder",
        "server": server,
        "UI":UI,
        // "useAuth":localStorage.getItem("useAuth"),
        "download":(child.type !== "Directory")?
            details.Part[0].key : "nofile",
        "container":(child.type !== "Directory")?
            details.container : "nofile",
        "duration":(child.type !== "Directory")?
            (details.duration/1000) : 7200,
        "thumb": server+"/photo/:/transcode?url=http://127.0.0.1:"+localStorage.getItem("port")+child.thumb+"&width=300&height=300&X-Plex-Token="+localStorage.getItem("authToken"),
        "summary": child.summary,
        "media": child.Media
    };

    (function(elListInfos){

        var el = list.append(
            child.title,
            details.container,
            elementId+"-"+i.toString(),
            browse,
            elListInfos
        );

        var iconElem = document.createElement("aside");
        var imgElem = document.createElement("img");

        // set filetype icon
        if(child._elementType !== "Directory") {
            if (child.type === "track" ||
                child.type === "movie"  ||
                child.type === "episode"||
                child.type === "picture") {

                imgElem.setAttribute("src", "img/"+child.type+".png");
            } else {
                imgElem.setAttribute("src", "img/document.png");
            }
        } else {
            imgElem.setAttribute("src", "img/folder.png");
        }

        iconElem.className = "icon";
        iconElem.appendChild(imgElem);

        el.insertBefore(iconElem, el.firstChild);

        $(el).addClass("file");

        $(el).on("contextmenu", function(e){
            e.preventDefault();
            addToPlaylist(elData(elListInfos), server);
            dropAnimation(this);
            return false;
        });
    })(elListInfos);
}