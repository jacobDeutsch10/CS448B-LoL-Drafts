function reduce_data_and_rollup(dataframe, stats, champs, roles, sides, x_type){
    // helper function to grab necessary data
    var data = reduce_data(dataframe, stats, champs, roles, sides, true);
    // if data
    const data_roll = d3.rollup(
        data[0],
        v => champs.map( c => stats.map((x, i ) => d3.mean(v, d=> d[c][i]))),
        d=>d[x_type]
    )
    const data_roll_count = d3.rollup(
        data[0],
        v => v.length,
        d=>d[x_type]
    )
    return [data_roll, data_roll_count];
}

function update_scatter(){
    var x_type = d3.select('#x-axis-dropdown').property('value');
    var y_type = d3.select('#y-axis-dropdown').property('value');
    if (y_type=='winrate'){
        y_type = 'result'
    }
    var champs = [
        d3.select('#champ1-dropdown').property('value'), 
        d3.select('#champ2-dropdown').property('value')
    ];
    var sides = [
        d3.select('input[name="champ1-side"]:checked').property('value'), 
        d3.select('input[name="champ2-side"]:checked').property('value')
    ];
    var roles = [champs_to_roles[champs[0]], champs_to_roles[champs[1]]];
    const selection = d3.selectAll("#draft-inspector-graph")
    selection
    .select('.inspector-svg')
    .remove();
    let url1 = champData.reduce((a, c, i/*Current index*/) => {
        if (c.name == champs[0]) a.push(c.url); //Add the found index.
        return a;
      }, []/*Accumulator to store the found indexes.*/)[0];
    
    let url2 = champData.reduce((a, c, i/*Current index*/) => {
        if (c.name == champs[1]) a.push(c.url); //Add the found index.
        return a;
      }, []/*Accumulator to store the found indexes.*/)[0];
    
    var margin = {top: 40, right: 200, bottom: 100, left: 100},
        width = 1100 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
        chart_height = 500;
        chart_width = 1100;
    var svg =  selection.append('svg')
        .attr('class', 'inspector-svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    var data = reduce_data(df, [x_type, y_type, 'result'], champs, roles, sides, true)[0];
    console.log(data);
    var bins = d3.histogram()
    .value(function(d) {  return d[champs[0]][0]; }) // Use the x value for binning
    .thresholds(d3.select('#bins-slider').property('value')) 
    (data);


    var means = bins.map(function(bin) {
        return {
            x: bin.x0 + (bin.x1 - bin.x0) / 2, // Use the middle x value of the bin
            y: d3.mean(bin, function(d) { return d[champs[0]][1]; }), // Calculate the mean of the y values in the bin
            winrate: d3.mean(bin, function(d) { return d[champs[0]][2]; }),
            count: bin.length
        };
    });
    means = means.filter(d=>d.count>0);
    y_min = d3.min(means, d=>d.y);
    y_max = d3.max(means, d=>d.y);
    x_min = d3.min(means, d=>d.x);
    x_max = d3.max(means, d=>d.x);
    var y = d3.scaleLinear()
        .domain([
            y_min - (y_max-y_min)*0.05,
            y_max + (y_max-y_min)*0.05
        ])
        .range([ height, 0 ]);
    svg.append("g")
        .call(d3.axisLeft(y));
    
    var x = d3.scaleLinear()
        .range([ 0, width])
        .domain([
            x_min - (x_max-x_min)*0.05,
            x_max + (x_max-x_min)*0.05
        ]);

    
    var rad = d3.scaleLog()
        .domain([d3.min(means, d=>d.count), d3.max(means, d=>d.count)])
        .range([7, 15]);


    // color scale for winrate
    // couldnt find a code example that works for this
    color = d=>d3.interpolateTurbo(d);
        
  
    svg.append("g")
        .attr("transform", "translate(0," + (height + 4) + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    var tip1 = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d, i) {

        return "<div style='display:flex; flex-direction:row; align-items:center;'><img  src='"+ 
        url1 + "'style='width: 50px; height: 50px;'><strong>V.S.</strong><img  src='"+ 
        url2 + "'style='width: 50px; height: 50px;'></div>" +
        "<strong>"+x_type+":</strong> <span style='color:red'>" +
        d.x.toFixed(2) + "</span><br>" + 
        "<strong>"+y_type+":</strong> <span style='color:red'>" +
        d.y.toFixed(2) + "</span><br>" + 
        "<strong>Record:</strong> <span style='color:red'>" + 
        Math.round(d.winrate*d.count)+ "-" +
        Math.round((1-d.winrate)*d.count) + 
        "</span><br>"+
        "<strong>Winrate:</strong> <span style='color:red'>" + 
        Math.round(d.winrate.toFixed(2)*100) + "%"+
        "</span>";

    });
    svg.call(tip1);
    console.log('circles')
    svg.selectAll(".circles1")
        .data(means)
        .join('circle')
        .attr("r", d=> rad(d.count))
        .attr("fill",function(d) { color(d.winrate); return color(d.winrate)})
        .attr("cx", function(d) { return x(d.x)})
        .attr("cy", function(d) {  return y(d.y) })
        .on("mouseover",function(event, d) { tip1.show(d, this); d3.select(this).attr("r", rad(d.count) + 2); })
        .on("mouseout", function(event, d) { tip1.hide(d, this); d3.select(this).attr("r", rad(d.count));});
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
    .text(`${y_type}`);
    // add a title to the plot
    svg.append("text")
    .attr("class", "axisElements")
    .attr("x", width/2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .text(`${y_type} vs ${x_type} for ${champs[0]} ${roles[0]}  v.s. ${champs[1]} ${roles[1]}`);
    // add a color legend
    svg.append("text").attr("x", 820).attr("y", 0).text("Winrate:").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("circle").attr("cx", 820).attr("cy", 20).attr("r", 6).style("fill", color(0))
    svg.append("circle").attr("cx", 820).attr("cy", 40).attr("r", 6).style("fill", color(0.25))
    svg.append("circle").attr("cx", 820).attr("cy", 60).attr("r", 6).style("fill", color(0.5))
    svg.append("circle").attr("cx", 820).attr("cy", 80).attr("r", 6).style("fill", color(0.75))
    svg.append("circle").attr("cx", 820).attr("cy", 100).attr("r", 6).style("fill", color(1))
    svg.append("text").attr("x", 830).attr("y", 20).text("0").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 830).attr("y", 40).text("0.25").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 830).attr("y", 60).text("0.5").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 830).attr("y", 80).text("0.75").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 830).attr("y", 100).text("1").style("font-size", "15px").attr("alignment-baseline","middle")
    
}

function update_plot_time(){
    var x_type = d3.select('#x-axis-dropdown').property('value');
    var y_type = d3.select('#y-axis-dropdown').property('value');
    if (y_type=='winrate'){
        y_type = 'result'
    }
    var champs = [
        d3.select('#champ1-dropdown').property('value'), 
        d3.select('#champ2-dropdown').property('value')
    ];
    var sides = [
        d3.select('input[name="champ1-side"]:checked').property('value'), 
        d3.select('input[name="champ2-side"]:checked').property('value')
    ];
    const selection = d3.selectAll("#draft-inspector-graph")
    selection
    .select('.inspector-svg')
    .remove();
    var roles = [champs_to_roles[champs[0]], champs_to_roles[champs[1]]];
    var stat = y_type;
    var data = reduce_data_and_rollup(df, [stat, 'result'], champs, roles, sides, x_type);
    var data_roll = data[0];
    var data_roll_count = data[1];
    var data_c1_other = reduce_data_and_rollup(df, [stat, 'result'], [champs[0]], [roles[0]], [sides[0]], x_type);
    var data_c2_other = reduce_data_and_rollup(df, [stat, 'result'], [champs[1]], [roles[1]], [sides[1]], x_type);
    var data_c1_other_roll = data_c1_other[0];
    var data_c1_other_roll_count = data_c1_other[1];
    var data_c2_other_roll = data_c2_other[0];
    var data_c2_other_roll_count = data_c2_other[1];
    let url1 = champData.reduce((a, c, i) => {
        if (c.name == champs[0]) a.push(c.url); 
        return a;
      }, [])[0];
    
    let url2 = champData.reduce((a, c, i) => {
        if (c.name == champs[1]) a.push(c.url); 
        return a;
      }, [])[0];
    
    var margin = {top: 40, right: 200, bottom: 100, left: 100},
        width = 1100 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
        chart_height = 500;
        chart_width = 1100;
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



    var data_roll_max = d3.max(data_roll.keys(), function(d) { return Math.max(...[data_roll.get(d)[0][0], data_roll.get(d)[1][0]]); })
    var data_roll_min = d3.min(data_roll.keys(), function(d) { return Math.min(...[data_roll.get(d)[0][0], data_roll.get(d)[1][0]]); })
    var data_c1_other_roll_max = d3.max(data_roll.keys(), function(d) { return data_c1_other_roll.get(d)[0][0]; })
    var data_c1_other_roll_min = d3.min(data_roll.keys(), function(d) { return data_c1_other_roll.get(d)[0][0]; })
    var data_c2_other_roll_max = d3.max(data_roll.keys(), function(d) { return data_c2_other_roll.get(d)[0][0]; })
    var data_c2_other_roll_min = d3.min(data_roll.keys(), function(d) { return data_c2_other_roll.get(d)[0][0]; })
    var y_max = Math.max(...[data_roll_max, data_c1_other_roll_max, data_c2_other_roll_max]);
    var y_min = Math.min(...[data_roll_min, data_c1_other_roll_min, data_c2_other_roll_min]);
    console.log(y_max, y_min)
    var y = d3.scaleLinear()
    .domain([
       y_min, 
       y_max
    ])
    .range([ height, 0 ]);
    svg.append("g")
    .call(d3.axisLeft(y));

    // add a scale to make the circles scale with the number of occurences
    console.log(data_roll_count.values());
    console.log(data_c1_other_roll_count.values());
    console.log(data_c2_other_roll_count.values());
    console.log(
        Math.max(...[
            d3.max(data_roll_count.values()), 
            d3.max(data_c1_other_roll_count.values()), 
            d3.max(data_c2_other_roll_count.values())
        ])
    )
    var r = d3.scaleLog()
    .domain([1, 
        Math.max(...[
            d3.max(data_roll_count.values()), 
            d3.max(data_c1_other_roll_count.values()), 
            d3.max(data_c2_other_roll_count.values())
        ])
    ])
    .range([3, 12]);



    // Add the line
    svg.append("path")
    .datum(data_roll.keys())
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
    .x(function(d) {  return x(d)+x.bandwidth()/2 })
    .y(function(d) { return y(data_roll.get(d)[0][0]) })
    )

    // create a tooltip
    var tip1 = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d, i) {

        return "<div style='display:flex; flex-direction:row; align-items:center;'><img  src='"+ 
        url1 + "'style='width: 50px; height: 50px;'><strong>V.S.</strong><img  src='"+ 
        url2 + "'style='width: 50px; height: 50px;'></div>" +
        "<strong>Value:</strong> <span style='color:red'>" +
        data_roll.get(d)[0][0].toFixed(2) + "</span><br>" + 
        "<strong>Record:</strong> <span style='color:red'>" + 
        Math.round(data_roll.get(d)[0][1]*data_roll_count.get(d)) + "-" +
        Math.round((1-data_roll.get(d)[0][1])*data_roll_count.get(d)) + 
        "</span><br>"+
        "<strong>Winrate:</strong> <span style='color:red'>" + 
        Math.round(data_roll.get(d)[0][1].toFixed(2)*100) + "%"+
        "</span>";

    });
    svg.call(tip1);
    svg.selectAll(".circles1")
    .data(data_roll.keys())
    .join('circle')
    .attr("fill", "steelblue")
    .attr("r", function(d) { return r(data_roll_count.get(d)) })
    .attr("cx", function(d) { return x(d) +x.bandwidth()/2})
    .attr("cy", function(d) {  return y(data_roll.get(d)[0][0]) })
    .on("mouseover",function(event, d) { tip1.show(d, this); d3.select(this).attr("r", r(data_roll_count.get(d)) + 2); })
    .on("mouseout", function(event, d) { tip1.hide(d, this); d3.select(this).attr("r", r(data_roll_count.get(d)));});
    // add bars showing +/- 1 std
    /*
    svg.selectAll(".bars1")
    .data(data_roll.keys())
    .join('rect')
    .attr("fill", "steelblue")
    .attr("opacity", 0.5)
    .attr("x", function(d) { return x(d) +x.bandwidth()/2 - r(data_roll_count.get(d))/4})
    .attr("y", function(d) {  return y(data_roll.get(d)[0] + data_roll_dev.get(d)[0]) })
    .attr("width", function(d) { return r(data_roll_count.get(d))/2})
    .attr("height", function(d) { console.log(data_roll.get(d)[0], data_roll_dev.get(d)[0]); return y(data_roll.get(d)[0] - data_roll_dev.get(d)[0]) - y(data_roll.get(d)[0] + data_roll_dev.get(d)[0])  })
    .on("mouseover",function(event, d) { tip1.show(d, this)})
    .on("mouseout", function(event, d) { tip1.hide(d, this)});
    */
    
    
    svg.append("path")
    .datum(data_roll.keys())
    .attr("fill", "none")
    .attr("stroke", "#ff6666")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
    .x(function(d) {return x(d)+x.bandwidth()/2 })
    .y(function(d) { return y(data_roll.get(d)[1][0]) })
    )
    // add a tooltip using d3tip library that shows the value of the line at that point and the number of occurences
    var tip2 = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d, i) {
       
        return "<div style='display:flex; flex-direction:row; align-items:center;'><img  src='"+ 
        url2 + "'style='width: 50px; height: 50px;'><strong>V.S.</strong><img  src='"+ 
        url1 + "'style='width: 50px; height: 50px;'></div>" +
        "<strong>Value:</strong> <span style='color:red'>" +
        data_roll.get(d)[1][0].toFixed(2) + "</span><br>" + 
        "<strong>Record:</strong> <span style='color:red'>" + 
        Math.round(data_roll.get(d)[1][1]*data_roll_count.get(d)) + "-" +
        Math.round((1-data_roll.get(d)[1][1])*data_roll_count.get(d)) + 
        "</span><br>"+
        "<strong>Winrate:</strong> <span style='color:red'>" + 
        Math.round(data_roll.get(d)[1][1].toFixed(2)*100) + "%"+
        "</span>"
    });
    
    svg.call(tip2);
    svg.selectAll(".circles2")
    .data(data_roll.keys())
    .join('circle')
    .attr("fill", "#ff6666")
    .attr("r", function(d) { return r(data_roll_count.get(d))})
    .attr("cx", function(d) { return x(d) +x.bandwidth()/2})
    .attr("cy", function(d) {  return y(data_roll.get(d)[1][0]) })
    .on("mouseover",function(event, d) { tip2.show(d, this); d3.select(this).attr("r", r(data_roll_count.get(d)) + 2); })
    .on("mouseout", function(event, d) { tip2.hide(d, this); d3.select(this).attr("r", r(data_roll_count.get(d)));});
    
    // add line and circles for champion 1 against all champions
    svg.append("path")
    .datum(data_roll.keys())
    .attr("fill", "none")
    .attr("stroke", "#00ff7f")
    .attr("stroke-width", 1.5)
    .attr("opacity", 0.5)
    .attr("d", d3.line()
        .x(function(d) {return x(d)+x.bandwidth()/2 })
        .y(function(d) { return y(data_c1_other_roll.get(d)[0][0]) })
    );
    var tip3 = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d, i) {
       
        return "<div style='display:flex; flex-direction:row; align-items:center;'><img  src='"+ 
        url1 + "'style='width: 50px; height: 50px;'><strong>V.S.</strong><img  src='"+ 
        `./figs/${roles[0]}_icon.webp` + "'style='width: 50px; height: 50px;'></div>" +
        "<strong>Value:</strong> <span style='color:red'>" +
        data_c1_other_roll.get(d)[0][0].toFixed(2) + "</span><br>" + 
        "<strong>Record:</strong> <span style='color:red'>" + 
        Math.round(data_c1_other_roll.get(d)[0][1]*data_c1_other_roll_count.get(d)) + "-" +
        Math.round((1-data_c1_other_roll.get(d)[0][1])*data_c1_other_roll_count.get(d)) + 
        "</span><br>"+
        "<strong>Winrate:</strong> <span style='color:red'>" + 
        Math.round(data_c1_other_roll.get(d)[0][1].toFixed(2)*100) + "%"+
        "</span>"
    });
    
    svg.call(tip3);
    svg.selectAll(".circles3")
    .data(data_roll.keys())
    .join('circle')
    .attr("fill", "#00ff7f")
    .attr("opacity", 0.5)
    .attr("r", function(d) { return r(data_c1_other_roll_count.get(d))})
    .attr("cx", function(d) { return x(d) +x.bandwidth()/2})
    .attr("cy", function(d) {  return y(data_c1_other_roll.get(d)[0][0]) })
    .on("mouseover",function(event, d) { tip3.show(d, this); d3.select(this).attr("r", r(data_c1_other_roll_count.get(d)) + 2); })
    .on("mouseout", function(event, d) { tip3.hide(d, this); d3.select(this).attr("r", r(data_c1_other_roll_count.get(d)));});

    // add line and circles for champion 2 against all champions
    svg.append("path")
    .datum(data_roll.keys())
    .attr("fill", "none")
    .attr("stroke", "#ff7f50")
    .attr('opacity', 0.5)
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
        .x(function(d) {return x(d)+x.bandwidth()/2 })
        .y(function(d) { return y(data_c2_other_roll.get(d)[0][0]) })
    );
    var tip4 = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d, i) {
       
        return "<div style='display:flex; flex-direction:row; align-items:center;'><img  src='"+ 
        url2 + "'style='width: 50px; height: 50px;'><strong>V.S.</strong><img  src='"+ 
        `./figs/${roles[1]}_icon.webp` + "'style='width: 50px; height: 50px;'></div>" +
        "<strong>Value:</strong> <span style='color:red'>" +
        data_c2_other_roll.get(d)[0][0].toFixed(2) +  "</span><br>" + 
        "<strong>Record:</strong> <span style='color:red'>" + 
        Math.round(data_c2_other_roll.get(d)[0][1]*data_c2_other_roll_count.get(d)) + "-" +
        Math.round((1-data_c2_other_roll.get(d)[0][1])*data_c2_other_roll_count.get(d)) + 
        "</span><br>"+
        "<strong>Winrate:</strong> <span style='color:red'>" + 
        Math.round(data_c2_other_roll.get(d)[0][1].toFixed(2)*100) + "%"+
        "</span>"
    });
    
    svg.call(tip4);
    svg.selectAll(".circles4")
    .data(data_roll.keys())
    .join('circle')
    .attr("fill", "#ff7f50")
    .attr("opacity", 0.5)
    .attr("r", function(d) { return r(data_c2_other_roll_count.get(d))})
    .attr("cx", function(d) { return x(d) +x.bandwidth()/2})
    .attr("cy", function(d) {  return y(data_c2_other_roll.get(d)[0][0]) })
    .on("mouseover",function(event, d) { tip4.show(d, this); d3.select(this).attr("r", r(data_c2_other_roll_count.get(d)) + 2); })
    .on("mouseout", function(event, d) { tip4.hide(d, this); d3.select(this).attr("r", r(data_c2_other_roll_count.get(d)));});
    

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
    // add a title to the plot
    svg.append("text")
    .attr("class", "axisElements")
    .attr("x", width/2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .text(`Mean of ${stat} vs ${x_type}`);
    // add a legend for the two lines
    svg.append("circle").attr("cx", 820).attr("cy", 0).attr("r", 6).style("fill", "steelblue")
    svg.append("circle").attr("cx", 820).attr("cy", 40).attr("r", 6).style("fill", "#ff6666")
    svg.append("circle").attr("cx", 820).attr("cy", 20).attr("r", 6).style("fill", "#00ff7f")
    svg.append("circle").attr("cx", 820).attr("cy", 60).attr("r", 6).style("fill", "#ff7f50")
    svg.append("text").attr("x", 840).attr("y", 0).text(`${champs[0]} v.s. ${champs[1]}`).style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 840).attr("y", 40).text(`${champs[1]} v.s. ${champs[0]}`).style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 840).attr("y", 20).text(`${champs[0]} v.s. Any`).style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 840).attr("y", 60).text(`${champs[1]} v.s. Any`).style("font-size", "15px").attr("alignment-baseline","middle")
    
}

function update_plot(){
    
    //console.log(champData)
    // get values from x and y dropdowns
    var x_type = d3.select('#x-axis-dropdown').property('value');
    if (x_type == 'patch' || x_type == 'year'){
        update_plot_time();
    }
    else{
        update_scatter();
    }  

}
const x_axis_options = [
    'patch',
    'year',
    'gamelength',
    'deathsat15',
'csat10',
'assistsat10',
'minionkills',
'wpm',
'xpdiffat10',
'deathsat10',
'total cs',
'assists',
'earnedgoldshare',
'earned gpm',
'goldat15',
'killsat15',
'dpm',
'damageshare',
'wcpm',
'xpat15',
'xpdiffat15',
'csat15',
'controlwardsbought',
'kills',
'golddiffat15',
'golddiffat10',
'earnedgold',
'csdiffat10',
'totalgold',
'dragons',
'wardsplaced',
'vspm',
'assistsat15',
'cspm',
'goldat10',
'deaths',
'damagemitigatedperminute',
'killsat10',
'damagetakenperminute',
'goldspent',
'csdiffat15',
'damagetochampions',
'visionscore',
'xpat10'
];
const y_axis_options = [
    'winrate',
'deathsat15',
'csat10',
'assistsat10',
'minionkills',
'wpm',
'xpdiffat10',
'deathsat10',
'total cs',
'assists',
'earnedgoldshare',
'earned gpm',
'goldat15',
'dragons',
'killsat15',
'dpm',
'damageshare',
'wcpm',
'xpat15',
'xpdiffat15',
'csat15',
'controlwardsbought',
'kills',
'golddiffat15',
'golddiffat10',
'earnedgold',
'csdiffat10',
'totalgold',
'wardsplaced',
'vspm',
'assistsat15',
'cspm',
'goldat10',
'deaths',
'damagemitigatedperminute',
'killsat10',
'damagetakenperminute',
'goldspent',
'csdiffat15',
'damagetochampions',
'visionscore',
'xpat10'
];
//create dropdown menus for x and y axis setting default values
function create_dropdowns(){
    var x_axis_dropdown = d3.select('#x-axis-dropdown').attr('class', 'dropdown')
    var y_axis_dropdown = d3.select('#y-axis-dropdown').attr('class', 'dropdown')
    // add options to dropdowns
    x_axis_dropdown.selectAll('Options')
    .data(x_axis_options)
    .enter()
    .append('option')
    .text(function (d) { return d; }) 
    .attr("value", function (d) { return d; })
    // update the plot on change and set defaults 
    x_axis_dropdown.on("change", function(d) {
        update_plot()
    }) 
    x_axis_dropdown.property('value', 'year')
    y_axis_dropdown.selectAll('Options')
    .data(y_axis_options)
    .enter()
    .append('option')
    .text(function (d) { return d; })
    .attr("value", function (d) { return d; }) 
    y_axis_dropdown.on("change", function(d) {
        update_plot()
    })
    y_axis_dropdown.property('value', 'kills')

    // add event listeners
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
    d3.selectAll('#bins-slider').on('change', function() {
        update_plot()
    });
    
    

}
create_dropdowns();