// set or fetch Time for countdown in second unit
var Time;
var Mins;
var Secs;

if(Cookies.get("TimeMins") && Cookies.get("TimeSecs")){
    Mins = Number(Cookies.get("TimeMins"));
    Secs = Number(Cookies.get("TimeSecs"));
} else {
    // initialize Time
    Time = 120;

    // convert Time into minutes and seconds
    Mins = Math.floor(Time / 60);
    Secs = Time % 60;

    // initialize Cookie
    Cookies.set("TimeMins", Mins);
    Cookies.set("TimeSecs", Secs);
    Cookies.set("EpochMins", Mins);
    Cookies.set("EpochSecs", Secs);
    Cookies.set("status", "init");
}

var Interval = null;

// function to handle countdown minutes and seconds
var Countdown = function(){

    if (Interval !== null) return;

    Interval = setInterval(function () {

        Secs--;

        if (Secs < 0) {
            Mins--;
            Secs = 59;
        }
        if (Mins < 0) {
            clearInterval(Interval);
            Mins = 0;
            Secs = 0;
        }

        UpdateValues();
    }, 1000);
};

// load values on page
var UpdateValues = function () {
    document.getElementById("secholder").innerHTML = Secs;
    document.getElementById("minholder").innerHTML = Mins;
    Cookies.set("TimeMins", Mins);
    Cookies.set("TimeSecs", Secs);
};

// function to handel start button
var ClickOnStart = function(){
    Countdown();
    Cookies.set("status", "started");
    document.getElementsByName("start")[0].disabled = true;
    document.getElementsByName("pause")[0].disabled = false;
    document.getElementsByName("reset")[0].disabled = false;
}

// function to handel pause button
var ClickOnPause = function(){
    if (Interval !== null){
        clearInterval(Interval);
        Interval = null;
    }
    Cookies.set("status", "paused");
    document.getElementsByName("start")[0].disabled = false;
    document.getElementsByName("pause")[0].disabled = true;
    document.getElementsByName("reset")[0].disabled = false;
}

// function to handel reset button
var ClickOnReset = function(){
    if (Interval !== null) {
        clearInterval(Interval);
        Interval = null;
    }
    Cookies.set("status", "reset");
    Mins = Number(Cookies.get("EpochMins"));
    Secs = Number(Cookies.get("EpochSecs"));
    UpdateValues();
    document.getElementsByName("start")[0].disabled = false;
    document.getElementsByName("pause")[0].disabled = true;
    document.getElementsByName("reset")[0].disabled = true;
}

// use values stored in Cookie to handel countdown even when page reloaded
switch(Cookies.get("status")){
    case "reset":
        ClickOnReset();
        break;
    case "started":
        ClickOnStart();
        break;
    case "paused":
        ClickOnPause();
        break;
}