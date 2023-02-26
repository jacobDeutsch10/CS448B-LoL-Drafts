
const position_icons = [
    {name:"top",  icon: "./figs/top_icon.webp"}, 
    {name:"jng",  icon: "./figs/jng_icon.webp"},
    {name: "mid", icon: "./figs/mid_icon.webp"},
    {name: "bot", icon: "./figs/bot_icon.webp" },
    {name: "sup", icon: "./figs/sup_icon.webp" },
];
let matchups = {
    Red: {
        top: null,
        jng :null,
        mid :null,
        bot :null,
        sup :null,
    },
    Blue: {
        top: null,
        jng :null,
        mid :null,
        bot :null,
        sup :null,
    }
}
let champs_to_roles = {};
let currentlySelected = null;

d3.selectAll('#red-team-container')
.selectAll('img')
.data(position_icons)
.enter()
.append('img')
.attr('src', d => d.icon)
.attr('alt', d => d.name)
.attr('class', 'position-portrait')
.property('side', 'Red')
.on("click", function(e, d){
// Unselect the previously selected position portrait
if (currentlySelected) {
    currentlySelected.classed("selected", false);
}

// Select the new position portrait
var positionPortrait = d3.select(this);
positionPortrait.classed("selected", true);
currentlySelected = positionPortrait;

console.log("Position selected:", d.name);
});

d3.selectAll('#blue-team-container')
.selectAll('img')
.data(position_icons)
.enter()
.append('img')
.attr('src', d => d.icon)
.attr('alt', d => d.name)
.attr('class', 'position-portrait')
.property('side', 'Blue')
.on("click", function(e, d){
// Unselect the previously selected position portrait
if (currentlySelected) {
    currentlySelected.classed("selected", false);
}

// Select the new position portrait
var positionPortrait = d3.select(this);
positionPortrait.classed("selected", true);
currentlySelected = positionPortrait;

console.log("Position selected:", d.name);
});