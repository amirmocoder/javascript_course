var originalArray = [5,4,6,1,3,2]

for (var i = 0 ; i < originalArray.length ; i++ ){
    for (var j = 0 ; j < originalArray.length ; j++ ){
        if (originalArray[i] < originalArray[j]){
            var temp = originalArray[j]
            originalArray[j] = originalArray[i]
            originalArray[i] = temp
        }
    }
}

console.log(originalArray)