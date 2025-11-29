// printJalaliDate function get a DateTime and converts it to "jalali" date format
var printJalaliDate = function(givenDateTime){
    var DateOptions = { year: 'numeric',
                        month: 'long',
                        weekday: 'long',
                        day: 'numeric'
                    }
    var jalaliDate = new Intl.DateTimeFormat('fa-IR', DateOptions).format(givenDateTime);
    console.log(jalaliDate);
}

// call printJalaliDate function with now DateTime to calculate today date in "Jalali" date format
printJalaliDate(new Date())