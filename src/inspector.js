function update_plot(){
    const selection = d3.selectAll("#draft-inspector")
    selection
    .select('.inspector-svg')
    .remove();
    console.log(champData)
    // get values from x and y dropdowns
    var x_type = d3.select('#x-axis-dropdown').property('value');
    var y_type = d3.select('#y-axis-dropdown').property('value');
    var champs = [
        d3.select('#champ1-dropdown').property('value'), 
        d3.select('#champ2-dropdown').property('value')
    ];
    var sides = [
        d3.select('input[name="champ1-side"]:checked').property('value'), 
        d3.select('input[name="champ2-side"]:checked').property('value')
    ];

    var roles = [champs_to_roles[champs[0]], champs_to_roles[champs[1]]];
    var stat = y_type;
    var data = reduce_data(df, stat, champs, roles, sides, true);
    // if data
    const data_roll = d3.rollup(
        data[0],
        v => champs.map( c => d3.mean(v, d=> +d[c])),
        d=>d[x_type]
    )
    const data_roll_count = d3.rollup(
        data[0],
        v => v.length,
        d=>d[x_type]
    )
    var valid_idx = data[1];
    var margin = {top: 40, right: 100, bottom: 100, left: 100},
        width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
        chart_height = 500;
        chart_width = 700;
    var svg =  selection.append('svg')
        .attr('class', 'inspector-svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    // Add X axis --> it is a date format
    var x = d3.scaleBand()
            .range([ 0, width])
            .domain(data_roll.keys())
            .padding(0.2);
        svg.append("g")
      .attr("transform", "translate(0," + (height + 4) + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")  
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

    // Add Y axis
    var y = d3.scaleLinear()
    .domain([
        d3.min(data_roll.keys(), function(d) { return Math.min(...data_roll.get(d)); }), 
        d3.max(data_roll.keys(), function(d) {return Math.max(...data_roll.get(d)); })
    ])
    .range([ height, 0 ]);
    svg.append("g")
    .call(d3.axisLeft(y));

    // add a scale to make the circles scale with the number of occurences
    var r = d3.scaleLinear()
    .domain([0, d3.max(data_roll_count.values())])
    .range([0, 10]);



    // Add the line
    svg.append("path")
    .datum(data_roll.keys())
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
    .x(function(d) {  return x(d)+x.bandwidth()/2 })
    .y(function(d) { return y(data_roll.get(d)[0]) })
    )

    // add a tooltip using d3tip library that shows the value of the line at that point and the number of occurences
    var tip1 = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d, i) {
        let url = champData.reduce((a, c, i/*Current index*/) => {
            if (c.name == champs[0]) a.push(c.url); 
            return a;
          }, []/*Accumulator to store the found indexes.*/)[0];
        return "<div><img  src='"+ url + "'style='width: 50px; height: 50px;'></div>" +
        "<strong>Value:</strong> <span style='color:red'>" +
        data_roll.get(d)[0].toFixed(2) + "</span><br>" + 
        "<strong>Count:</strong> <span style='color:red'>" + data_roll_count.get(d) + "</span>";

    });
    svg.call(tip1);
    svg.selectAll(".circles1")
    .data(data_roll.keys())
    .join('circle')
    .attr("fill", "steelblue")
    .attr("r", function(d) { return r(data_roll_count.get(d)) })
    .attr("cx", function(d) { return x(d) +x.bandwidth()/2})
    .attr("cy", function(d) {  return y(data_roll.get(d)[0]) })
    .on("mouseover",function(event, d) { tip1.show(d, this)})
    .on("mouseout", function(event, d) { tip1.hide(d, this)});
    
    svg.append("path")
    .datum(data_roll.keys())
    .attr("fill", "none")
    .attr("stroke", "#ff6666")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
    .x(function(d) {return x(d)+x.bandwidth()/2 })
    .y(function(d) { return y(data_roll.get(d)[1]) })
    )
    // add a tooltip using d3tip library that shows the value of the line at that point and the number of occurences
    var tip2 = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d, i) {
        let url = champData.reduce((a, c, i/*Current index*/) => {
            if (c.name == champs[1]) a.push(c.url); //Add the found index.
            return a;
          }, []/*Accumulator to store the found indexes.*/)[0];
        return "<div><img  src='"+ url + "'style='width: 50px; height: 50px;'></div>" +
        "<strong>Value:</strong> <span style='color:red'>" +
        data_roll.get(d)[1].toFixed(2) + "</span><br>" + 
        "<strong>Count:</strong> <span style='color:red'>" + data_roll_count.get(d) + "</span>";
    });
    
    svg.call(tip2);
    svg.selectAll(".circles2")
    .data(data_roll.keys())
    .join('circle')
    .attr("fill", "#ff6666")
    .attr("r", function(d) { return r(data_roll_count.get(d))})
    .attr("cx", function(d) { return x(d) +x.bandwidth()/2})
    .attr("cy", function(d) {  return y(data_roll.get(d)[1]) })
    .on("mouseover",function(event, d) { tip2.show(d, this)})
    .on("mouseout", function(event, d) { tip2.hide(d, this)});
    // adds a tooltip using d3tip library that shows the value of the line at that point and the number of occurences
    
    

    // add x-axis title
    svg.append("text")
    .attr("class", "axisElements")
    .attr("x", width/2)
    .attr("y", height + 70 )
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .text(`${x_type}`);
    // add y-axis title
    svg.append("text")
    .attr("class", "axisElements")
    .attr("x", -(height / 2))
    .attr("y", -60)
    .attr("font-size", "20px")
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text(`${stat}`);
    // add a legend for the two lines
    svg.append("circle").attr("cx", 720).attr("cy", 0).attr("r", 6).style("fill", "steelblue")
    svg.append("circle").attr("cx", 720).attr("cy", 20).attr("r", 6).style("fill", "#ff6666")
    svg.append("text").attr("x", 740).attr("y", 0).text(champs[0]).style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 740).attr("y", 20).text(champs[1]).style("font-size", "15px").attr("alignment-baseline","middle")
    // add a title to the plot
    svg.append("text")
    .attr("class", "axisElements")
    .attr("x", width/2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .text(`Mean of ${stat} vs ${x_type}`);
     
   

}
const x_axis_options = [
    'patch',
    'year',
];
const y_axis_options = [
    'monsterkillsenemyjungle',
    'killsat15',
    'xpdiffat15',
    'wardsplaced',
    'earned gpm',
    'damageshare',
    'deathsat10',
    'monsterkills',
    'visionscore',
    'dpm',
    'monsterkillsownjungle',
    'csdiffat10',
    'killsat10',
    'firstbloodassist',
    'opp_killsat15',
    'xpat10',
    'opp_csat15',
    'opp_assistsat15',
    'csdiffat15',
    'golddiffat15',
    'assistsat10',
    'damagetochampions',
    'damagetakenperminute',
    'deathsat15',
    'wpm',
    'totalgold',
    'minionkills',
    'opp_goldat15',
    'opp_xpat10',
    'opp_assistsat10',
    'deaths',
    'cspm',
    'triplekills',
    'csat10',
    'opp_xpat15',
    'wcpm',
    'goldspent',
    'opp_deathsat10',
    'vspm',
    'firstblood',
    'earnedgoldshare',
    'opp_csat10',
    'goldat10',
    'opp_killsat10',
    'opp_goldat10',
    'controlwardsbought',
    'damagemitigatedperminute',
    'csat15',
    'xpat15',
    'opp_deathsat15',
    'golddiffat10',
    'assistsat15',
    'xpdiffat10',
    'kills',
    'assists',
    'total cs',
    'goldat15',
];
//uses d3 to create dropdown menus for x and y axis setting default values
function create_dropdowns(){
    var x_axis_dropdown = d3.select('#x-axis-dropdown').attr('class', 'dropdown')
    var y_axis_dropdown = d3.select('#y-axis-dropdown').attr('class', 'dropdown')
    x_axis_dropdown.selectAll('Options')
    .data(x_axis_options)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button
    x_axis_dropdown.on("change", function(d) {
        update_plot()
    }) //set default values 
    x_axis_dropdown.property('value', 'year')
    y_axis_dropdown.selectAll('Options')
    .data(y_axis_options)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button
    y_axis_dropdown.on("change", function(d) {
        update_plot()
    })
    y_axis_dropdown.property('value', 'kills')
    d3.select('#champ1-dropdown').on("change", function(d) {
        update_plot()
    });
    d3.select('#champ2-dropdown').on("change", function(d) {
        update_plot()
    });
    d3.selectAll('input[name="champ1-side"]').on('change', function() {
        update_plot()
    });
    d3.selectAll('input[name="champ2-side"]').on('change', function() {
        update_plot()
    });
    
    

}
create_dropdowns();