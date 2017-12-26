var arr = [{ some: 3, another: 1}];
arr = JSON.stringify(arr);

console.log(arr);

arr = JSON.parse(arr);
console.log(arr);

arr.push({
    onemore: 2
});

console.log(arr);

arr = JSON.stringify(arr);
console.log(arr);

