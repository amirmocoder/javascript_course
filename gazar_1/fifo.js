// push function adds an item into first index of given array
var push = function(givenItem,givenArray){
    for (var i = givenArray.length - 1; i >= 0; i--){
        givenArray[i + 1] = givenArray[i]
    }
    givenArray[0] = givenItem
}

// pull function pops the last item of given array and prints it
var pull = function(givenArray){
    console.log(givenArray[givenArray.length - 1])
    givenArray.length--
}

// initialize and call functions

var arr = [1,2,3,4]
var item = 10

push(item,arr)
pull(arr)