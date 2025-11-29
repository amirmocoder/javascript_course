// printTodayDate function calculates now date-time and converts it to "jalali" date format
var printTodayDate = function(){
    var DateOptions = { year: 'numeric',
                        month: 'long',
                        weekday: 'long',
                        day: 'numeric'
                    }
    var TodayDate = new Intl.DateTimeFormat('fa-IR', DateOptions).format(new Date());
    console.log(TodayDate);
}

printTodayDate()