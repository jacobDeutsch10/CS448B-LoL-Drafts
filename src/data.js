
var df = null
d3.csv('./data/lol_esports_stats_2019.csv').then(function(d){
    df = d;
});

const other_side ={
    Red: 'Blue',
    Blue: 'Red'
}