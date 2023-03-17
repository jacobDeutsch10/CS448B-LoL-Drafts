
function blue_side_winrate(data, role){
    const data_filt = filter_on_champs(data, role, true);
    return [d3.mean(
        data_filt,
        d=> +d[`result_Blue_${role}`]), data_filt.length];
}
function filter_on_champs(data, role, side_specific){
    var data_filt = null
    if (side_specific){
        data_filt = data.filter(
            d =>
            (d[`champion_Red_${role}`] === matchups['Red'][role]) &&
            (d[`champion_Blue_${role}`] === matchups['Blue'][role])
        );
    }
    else{
        data_filt = data.filter(
            d =>
             ((d[`champion_Red_${role}`] === matchups['Red'][role]) &&
             (d[`champion_Blue_${role}`] === matchups['Blue'][role])) ||
             ((d[`champion_Blue_${role}`] === matchups['Red'][role]) &&
             (d[`champion_Red_${role}`] === matchups['Blue'][role]))
        );
    }
    return data_filt
    
}
function check_role_side_specific(d, zip, stats){
    return zip.map(
        function(x){
            if (x[2] == 'Either'){
                if (d[`champion_Red_${x[1]}`] === x[0]){
                    return [true, stats.map(stat => +d[`${stat}_Red_${x[1]}`])];
                }
                else if((d[`champion_Blue_${x[1]}`] === x[0])){
                    return [true, stats.map(stat => +d[`${stat}_Blue_${x[1]}`])];
                }
                else{
                    return[false, null];
                }
            }
            else{
                return [d[`champion_${x[2]}_${x[1]}`] === x[0], stats.map(stat=> +d[`${stat}_${x[2]}_${x[1]}`])];
            }
            
        } 
        
    );
}
function check_role_specific(d, zip, stats){
    return zip.map(
        function (x){
            if (d[`champion_Red_${x[1]}`] === x[0]){
                return [true, stats.map(stat => +d[`${stat}_Red_${x[1]}`])];
            }
            else if((d[`champion_Blue_${x[1]}`] === x[0])){
                return [true,  stats.map(stat => +d[`${stat}_Blue_${x[1]}`])];
            }
            else{
                return[false, null]
            } 

        } 
    );
}

function reduce_data(data, stats, champs, roles, sides, side_specific){
    var data_reduced = null;
    var valid_indices = [];
    var curr_index = 0;
    if (side_specific){
        let zip = champs.map((x, i) => [x, roles[i], sides[i]])
        console.log(zip)
        data_reduced = data.reduce(function(filtered, d) {
            let result = check_role_side_specific(d, zip, stats);
            
            if (result.every(x=>x[0])) {
                var stat_info = {
                    patch: d.patch,
                    year: d.year
                };
                result.map((x,i)=> stat_info[champs[i]]=x[1]);
                filtered.push(stat_info);
                valid_indices.push(curr_index);
                curr_index += 1;
            }
            return filtered;
        }, []);

    }
    else{
        let zip = champs.map((x, i) => [x, roles[i]])
        data_reduced = data.reduce(function(filtered, d) {
            let result = check_role_specific(d, zip, stats)
            if (result.every(x=>x[0])) {
                var stat_info = {
                    patch: d.patch,
                    year: d.year
                };
                result.map((x,i)=> stat_info[champs[i]]=x[1]);
                filtered.push(stat_info);
                valid_indices.push(curr_index);
                curr_index += 1;
            }
            return filtered;
        }, []);
    }
    return [data_reduced, valid_indices];

}
function head_to_head_bar(blue_wr, count, role){
    const selection = d3.selectAll(".matchup-stats")
    .filter(
        function(){
            return d3.select(this).attr('id') == `${role}-stats`;
        }
    );
    selection
    .select('.wr-bar-svg')
    .remove();
    
    selection
        .append('svg')
        .attr('class', 'wr-bar-svg')
        .attr('width', '33%')
        .attr('height', '90%')
        .style('margin', 5)
        .append('g')
        .attr('class', 'winrate-bars')

    const wr_bars = selection.select('.winrate-bars');
    var champs = [matchups['Red'][role], matchups['Blue'][role]];
    let urlr = champData.reduce((a, c, i/*Current index*/) => {
        if (c.name == champs[0]) a.push(c.url); //Add the found index.
        return a;
      }, []/*Accumulator to store the found indexes.*/)[0];
    
    let urlb = champData.reduce((a, c,) => {
        if (c.name == champs[1]) a.push(c.url); 
        return a;
      }, [])[0];
    
    var tip_r = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .direction('s')
        .html(function(d, i) {

            return "<strong>All Time Head-To-Head</strong>"+ 
            "<div style='display:flex; flex-direction:row; align-items:center;'><img  src='"+ 
            urlr + "'style='width: 50px; height: 50px; border: 5px solid #ff6666;'><strong>V.S.</strong><img  src='"+ 
            urlb + "'style='width: 50px; height: 50px; border: 5px solid steelblue;'></div>" + 
            "<strong>Record:</strong> <span style='color:red'>" + 
            Math.round((1-blue_wr)*count)+ "-" +
            Math.round(blue_wr*count) + 
            "</span><br>"+
            "<strong>Winrate:</strong> <span style='color:red'>" + 
            Math.round((1-blue_wr)*100) + "%"+
            "</span>";
        });
    var tip_b = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .direction('s')
        .html(function(d, i) {

            return "<strong>All Time Head-To-Head</strong>"+
            "<div style='display:flex; flex-direction:row; align-items:center;'><img  src='"+ 
            urlb + "'style='width: 50px; height: 50px; border: 5px solid steelblue;'><strong>V.S.</strong><img  src='"+ 
            urlr + "'style='width: 50px; height: 50px; border: 5px solid #ff6666;'></div>" + 
            "<strong>Record:</strong> <span style='color:red'>" + 
            Math.round(blue_wr*count)+ "-" +
            Math.round((1-blue_wr)*count) + 
            "</span><br>"+
            "<strong>Winrate:</strong> <span style='color:red'>" + 
            Math.round(blue_wr*100) + "%"+
            "</span>";
        });
    wr_bars.call(tip_r);
    wr_bars.call(tip_b);
    wr_bars.append('rect')
        .attr('x', 0)
        .attr('y', "20%")
        .attr('width', blue_wr * 100 + '%')
        .attr('height', '50%')
        .style('fill', 'steelblue')
        .on("mouseover",function(event, d) { tip_b.show(d, this);})
        .on("mouseout", function(event, d) { tip_b.hide(d, this);});

    wr_bars.append('rect')
        .attr('x', blue_wr * 100 + '%')
        .attr('y', "20%")
        .attr('width', (1 - blue_wr) * 100 + '%')
        .attr('height', '50%')
        .style('fill', "#ff6666")
        .on("mouseover",function(event, d) { tip_r.show(d, this);})
        .on("mouseout", function(event, d) { tip_r.hide(d, this);});

    wr_bars.append('text')
        .text((blue_wr*100).toFixed(1) + "%")
        .attr('x', 100*blue_wr/2 + '%')
        .attr('y', '45%')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('fill', 'white')
        .style('font-size', '16px')
        .on("mouseover",function(event, d) { tip_b.show(d, this);})
        .on("mouseout", function(event, d) { tip_b.hide(d, this);});
    
    wr_bars.append('text')
        .text(((1 - blue_wr)*100).toFixed()+"%")
        .attr('x', 100*(blue_wr + (1-blue_wr)/2) + '%')
        .attr('y', '45%')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('fill', 'white')
        .style('font-size', '16px')
        .on("mouseover",function(event, d) { tip_r.show(d, this);})
        .on("mouseout", function(event, d) { tip_r.hide(d, this);});
}


function head_to_head_over_time(data, role){
    const selection = d3.selectAll(".matchup-stats")
    .filter(
        function(){
            return d3.select(this).attr('id') == `${role}-stats`;
        }
    );
    // https://d3-graph-gallery.com/graph/barplot_stacked_basicWide.html

    bs_wr_by_year = d3.rollup(
        filter_on_champs(data, role),
        v => [
            d3.mean(v, d=> +d[`result_Blue_${role}`]),
            v.length
        ],
        d=>d.year
    )
    var margin = {top: 10, right: 30, bottom: 20, left: 50},
    width = 400 - margin.left - margin.right,
    height = 90 - margin.top - margin.bottom;
    selection
    .select('.wr-ot')
    .remove();
    const years = bs_wr_by_year.keys();
    svg = selection
        .append('svg')
        .attr('class', 'wr-ot')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleBand()
          .range([ 0, width])
          .domain(years)
          .padding(0.2);
        svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))


      // Add Y axis
      var y = d3.scaleLinear()
        .domain([0, 1])
        .range([ height, 0 ]);
    var champs = [matchups['Red'][role], matchups['Blue'][role]];
    let urlr = champData.reduce((a, c, i/*Current index*/) => {
        if (c.name == champs[0]) a.push(c.url); //Add the found index.
        return a;
        }, []/*Accumulator to store the found indexes.*/)[0];
    
    let urlb = champData.reduce((a, c,) => {
        if (c.name == champs[1]) a.push(c.url); 
        return a;
        }, [])[0];
    var tip_r = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .direction('s')
        .html(function(d, i) {
            count = bs_wr_by_year.get(d)[1];
            blue_wr = bs_wr_by_year.get(d)[0];
            return `<strong>${d} Head-To-Head</strong>`+ 
            "<div style='display:flex; flex-direction:row; align-items:center;'><img  src='"+ 
            urlr + "'style='width: 50px; height: 50px; border: 5px solid #ff6666;'><strong>V.S.</strong><img  src='"+ 
            urlb + "'style='width: 50px; height: 50px; border: 5px solid steelblue;'></div>" + 
            "<strong>Record:</strong> <span style='color:red'>" + 
            Math.round((1-blue_wr)*count)+ "-" +
            Math.round(blue_wr*count) + 
            "</span><br>"+
            "<strong>Winrate:</strong> <span style='color:red'>" + 
            Math.round((1-blue_wr)*100) + "%"+
            "</span>";
        });
    var tip_b = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .direction('s')
        .html(function(d, i) {
            count = bs_wr_by_year.get(d)[1];
            blue_wr = bs_wr_by_year.get(d)[0];
            return `<strong>${d} Head-To-Head</strong>`+ 
            "<div style='display:flex; flex-direction:row; align-items:center;'><img  src='"+ 
            urlb + "'style='width: 50px; height: 50px; border: 5px solid steelblue;'><strong>V.S.</strong><img  src='"+ 
            urlr + "'style='width: 50px; height: 50px; border: 5px solid #ff6666;'></div>" + 
            "<strong>Record:</strong> <span style='color:red'>" + 
            Math.round(blue_wr*count)+ "-" +
            Math.round((1-blue_wr)*count) + 
            "</span><br>"+
            "<strong>Winrate:</strong> <span style='color:red'>" + 
            Math.round(blue_wr*100) + "%"+
            "</span>";
        });
    svg.call(tip_r);
    svg.call(tip_b);
    //svg.append("g")
    ///.call(d3.axisLeft(y).ticks(4));
    svg.selectAll("bluebar")
    .data(bs_wr_by_year.keys())
    .enter()
    .append("rect")
    .attr("x", function(d) { return x(d); })
    .attr("y", function(d) { return y(bs_wr_by_year.get(d)[0]); })
    .attr("height",function(d) { return height - y(bs_wr_by_year.get(d)[0]);})
    .attr("width",x.bandwidth())
    .attr("fill", 'steelblue')
    .on("mouseover",function(event, d) { tip_b.show(d, this);})
    .on("mouseout", function(event, d) { tip_b.hide(d, this);});
    svg.selectAll("redbar")
    .data(bs_wr_by_year.keys())
    .enter()
    .append("rect")
    .attr("x", function(d) { return x(d); })
    .attr("y", function(d) { return y(1)})
    .attr("height",function(d) { return height -y(1-bs_wr_by_year.get(d)[0]);})
    .attr("width",x.bandwidth())
    .attr("fill", "#ff6666")
    .on("mouseover",function(event, d) { tip_r.show(d, this);})
        .on("mouseout", function(event, d) { tip_r.hide(d, this);});
}