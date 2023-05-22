d3.select("body")
    .append("svg");

d3.csv('./chi-demographics-2016-2022.csv', function(data){
    console.log(data);
});