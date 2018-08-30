function Application(UIContext) {
    this._uiContextClass = UIContext;
    this._initialized = false;
};
Application.prototype.init = function() {
    if (this._uiContextClass && !this._initialized) {
        this._initialized = true;
        var UI = new this._uiContextClass();
        // overwrite
        UI.__setupPageAction = newSetupPageAction;
        UI.init();

        // init localstorage
        initLocalStorage();

        UI.pagestack.push("root");

        var osTranscode = UI.optionselector("transcodingOptions", true);
        var videoOsTranscode = UI.optionselector("transcodingOptions2", true);
        var browserList = UI.list("#browser");
        var browsePath = UI.pagestack.currentPage();
        var url = "/library/sections";
        var transcodingOption = 0;
        var devices;

        // connection with plex.tv Login?
        if (localStorage.getItem("useAuth") === "true") {
            devices = plexLogin(UI);
        }

        document.querySelector('#switchAuthType').addEventListener('change', function(e, i) {
            if (e.srcElement.checked === true) {
                document.getElementById("local_connection").style.display = "none";
                document.getElementById("plextv_connection").style.display = "block";
                localStorage.setItem("useAuth", true);
            } else {
                document.getElementById("local_connection").style.display = "block";
                document.getElementById("plextv_connection").style.display = "none";
                localStorage.setItem("useAuth", false);
            }
        });

        document.querySelector('#switchView').addEventListener('change', function(e, i) {
            if (e.srcElement.checked === true) {
                localStorage.setItem("viewAll", true);
            } else {
                localStorage.setItem("viewAll", false);
            }
        });

        UI.element('[data-role="back-btn"]').addEventListener("click", function(){
            if(UI.pagestack.currentPage() !== "mediaInfo") { 
                setTimeout(function() {document.getElementById("actions_root").style.display = "block";}, 100);
            }
            if(UI.pagestack.currentPage() == "root") {
                document.getElementById("refreshSection").style.display = "block";
            }
        });

        // check, if "add all titles from directory"-button has to be displayed 
        // and re-add click handler for addAll-Button to trigger the list-elements of the current page:
        UI.pagestack.onPageChanged(function(){
            var page = $("#"+UI.pagestack.currentPage());
            if(page.hasClass("hasFiles")) {
                $("#addAll").css("display", "block");

                $("#addAll").unbind();
                $("#addAll").bind("click", function() {
                    page.find("li").each(function() {
                        if($(this).hasClass("file")) {
                            $(this).trigger("contextmenu");
                        }
                    });
                });
            }
            else {
                $("#addAll").css("display", "none");
            }
            
        });

        UI.button("settingsBtn").click(function () {
            // set settings from localStorage
            document.getElementById("serverUrl").value = localStorage.getItem("ip");
            document.getElementById("port").value = localStorage.getItem("port");
            document.getElementById("user").value = localStorage.getItem("user");
            document.getElementById("password").value = localStorage.getItem("password");

            if (localStorage.getItem("useAuth") === "true") {
                document.getElementById("switchAuthType").checked = true;
                document.getElementById("local_connection").style.display = "none";
                document.getElementById("plextv_connection").style.display = "block";
            } else {
                document.getElementById("switchAuthType").checked = false;
                document.getElementById("local_connection").style.display = "block";
                document.getElementById("plextv_connection").style.display = "none";
            }

            if (localStorage.getItem("viewAll") === "true") {
                document.getElementById("switchView").checked = true;
            } else {
                document.getElementById("switchView").checked = false;
            }

            // set transcoding option active
            // set classes of all options to "empty" and add "active" to stored option:
            document.getElementById("os0").className = "";
            document.getElementById("os1").className = "";
            document.getElementById("os2").className = "";
            document.getElementById("os3").className = "";
            document.getElementById("os4").className = "";
            document.getElementById("os5").className = "";
            document.getElementById("os"+localStorage.getItem("transcoding")).className = "active";

            UI.pagestack.push("settings");

        });

        UI.button("videoSettingsBtn").click(function () {
            // set transcoding option active
            // set classes of all options to "empty" and add "active" to stored option:
            document.getElementById("videoOs0").className = "";
            document.getElementById("videoOs1").className = "";
            document.getElementById("videoOs2").className = "";
            document.getElementById("videoOs3").className = "";
            document.getElementById("videoOs4").className = "";
            document.getElementById("videoOs5").className = "";
            document.getElementById("videoOs"+localStorage.getItem("transcoding")).className = "active";

            UI.pagestack.push("videoSettings");

        });

        UI.button("save").click(function () {

            if (typeof(Storage) !== "undefined") {
                localStorage.setItem("ip", document.getElementById("serverUrl").value);
                localStorage.setItem("port", document.getElementById("port").value);
                localStorage.setItem("transcoding", transcodingOption);
                localStorage.setItem("user", document.getElementById("user").value);
                localStorage.setItem("password", document.getElementById("password").value);
            } else {
                alert("Sorry! No Web Storage support..");
            }
            //settingsDialog.hide();
            UI.pagestack.pop("settings");

            if (localStorage.getItem("useAuth") === "true") {
                browserList.removeAllItems();
                devices = plexLogin(UI);
            } else {
                getPlexVersion(UI);
            }
            
            UI.pagestack.clear();
            UI.pagestack.push("root");
        });

        UI.button("closeDialog").click(function () {
            UI.dialog("infoDialog").hide();
        });

        UI.button("closeDeviceSelector").click(function () {
            UI.dialog("deviceSelector").hide();
        });

        UI.button("refreshSection").click(function () {
            if (localStorage.getItem("useAuth") === "true") {
                if (typeof devices !== "undefined" && devices !== null) {
                    // just reselect device
                    selectDevice(UI, devices);
                } else {
                    // new Login
                    devices = plexLogin(UI);
                }
            } else {
                // local connection setting
                getPlexVersion(UI);
            }
        });

        // UI.button("search").click(function() {
        //     console.log(browserList);
        // });

        osTranscode.onClicked(function(e) {
            transcodingOption = e.values;
        });

        videoOsTranscode.onClicked(function(e) {
            localStorage.setItem("transcoding", e.values);
        });

        // toggle videoplayer visabiltity (jquery animated)
        $("#switchPlayerVisability").on("click", function() {
            var options = {};
            $("#playerBox").toggle("blind", options, 200);

            if ($("#switchPlayerVisability").attr("class") === "image-go-down") {
                $("#switchPlayerVisability").removeClass("image-go-down");
                $("#switchPlayerVisability").addClass("image-go-up");
            } else {
                $("#switchPlayerVisability").addClass("image-go-down");
                $("#switchPlayerVisability").removeClass("image-go-up");
            }
        });

        // button click events for audio and sub selection
        UI.button("selectAudio").click(function() {
            var sSelector = $("#subStreamSelector");
            var aSelector = $("#audioStreamSelector");
            if(aSelector.css("display") == "none") {
                aSelector.css("display", "block");
                sSelector.css("display", "none");
                $(this).addClass("selectButtonActive");
                $("#selectSubtitle").removeClass("selectButtonActive");
            }
            else
            {
                $(this).removeClass("selectButtonActive");
                aSelector.css("display", "none");
            }
        });
        UI.button("selectSubtitle").click(function() {
            var sSelector = $("#subStreamSelector");
            var aSelector = $("#audioStreamSelector");
            if(sSelector.css("display") == "none") {
                sSelector.css("display", "block");
                aSelector.css("display", "none");
                $(this).addClass("selectButtonActive");
                $("#selectAudio").removeClass("selectButtonActive");
            }
            else
            {
                $(this).removeClass("selectButtonActive");
                sSelector.css("display", "none");
            }
        });

        // start browsing immediately, when in settings local connection is enabled:
        if (localStorage.getItem("useAuth") === "false") {
            getPlexVersion(UI);
        }

        initPlayerControls();
        initPlaylistFunctions(UI);
        initPlayListGui(UI);
    }
};
Application.prototype.initialized = function() {
    return this._initialized;
};
