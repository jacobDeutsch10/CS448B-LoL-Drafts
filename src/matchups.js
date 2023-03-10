
function blue_side_winrate(data, role){
    const data_filt = filter_on_champs(data, role, true);
    return d3.mean(
        data_filt,
        d=> +d[`result_Blue`]);
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
function check_role_side_specific(d, zip, stat){
    return zip.map(
        function(x){
            if (x[2] == 'Either'){
                if (d[`champion_Red_${x[1]}`] === x[0]){
                    return [true, d[`${stat}_Red_${x[1]}`]];
                }
                else if((d[`champion_Blue_${x[1]}`] === x[0])){
                    return [true, d[`${stat}_Blue_${x[1]}`]];
                }
                else{
                    return[false, null];
                }
            }
            else{
                return [d[`champion_${x[2]}_${x[1]}`] === x[0], d[`${stat}_${x[2]}_${x[1]}`]];
            }
            
        } 
        
    );
}
function check_role_specific(d, zip, stat){
    return zip.map(
        function (x){
            if (d[`champion_Red_${x[1]}`] === x[0]){
                return [true, d[`${stat}_Red_${x[1]}`]];
            }
            else if((d[`champion_Blue_${x[1]}`] === x[0])){
                return [true, d[`${stat}_Blue_${x[1]}`]];
            }
            else{
                return[false, null]
            } 

        } 
    );
}
function reduce_data(data, stat, champs, roles, sides, side_specific){
    var data_reduced = null;
    var valid_indices = [];
    var curr_index = 0;
    if (side_specific){
        let zip = champs.map((x, i) => [x, roles[i], sides[i]])
        
        data_reduced = data.reduce(function(filtered, d) {
            let result = check_role_side_specific(d, zip, stat)
            
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
            let result = check_role_specific(d, zip, stat)
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
function head_to_head_bar(blue_wr, role){
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

    wr_bars.append('rect')
        .attr('x', 0)
        .attr('y', "20%")
        .attr('width', blue_wr * 100 + '%')
        .attr('height', '50%')
        .style('fill', 'steelblue')

    wr_bars.append('rect')
        .attr('x', blue_wr * 100 + '%')
        .attr('y', "20%")
        .attr('width', (1 - blue_wr) * 100 + '%')
        .attr('height', '50%')
        .style('fill', "#ff6666")

    wr_bars.append('text')
        .text((blue_wr*100).toFixed(1) + "%")
        .attr('x', 100*blue_wr/2 + '%')
        .attr('y', '45%')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('fill', 'white')
        .style('font-size', '16px');
    
    wr_bars.append('text')
        .text(((1 - blue_wr)*100).toFixed()+"%")
        .attr('x', 100*(blue_wr + (1-blue_wr)/2) + '%')
        .attr('y', '45%')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('fill', 'white')
        .style('font-size', '16px');
}


function head_to_head_over_time(data, role){
    console.log(reduce_data(df, 'csdiffat15', ['Aatrox', 'Akali'], ['top', 'top'], [], false));
    const selection = d3.selectAll(".matchup-stats")
    .filter(
        function(){
            return d3.select(this).attr('id') == `${role}-stats`;
        }
    );
    // https://d3-graph-gallery.com/graph/barplot_stacked_basicWide.html

    bs_wr_by_year = d3.rollup(
        filter_on_champs(data, role),
        v => d3.mean(v, d=> +d[`result_Blue`]),
        d=>d.year
    )
    console.log(bs_wr_by_year)
    var margin = {top: 10, right: 30, bottom: 20, left: 50},
    width = 400 - margin.left - margin.right,
    height = 95 - margin.top - margin.bottom;
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
    svg.append("g")
    .call(d3.axisLeft(y).ticks(5));
    svg.selectAll("bluebar")
    // Enter in the stack data = loop key per key = group per group
    .data(bs_wr_by_year.keys())
    .enter()
    .append("rect")
    .attr("x", function(d) { return x(d); })
    .attr("y", function(d) { return y(bs_wr_by_year.get(d)); })
    .attr("height",function(d) { return height - y(bs_wr_by_year.get(d));})
    .attr("width",x.bandwidth())
    .attr("fill", 'steelblue')
    svg.selectAll("redbar")
    // Enter in the stack data = loop key per key = group per group
    .data(bs_wr_by_year.keys())
    .enter()
    .append("rect")
    .attr("x", function(d) { return x(d); })
    .attr("y", function(d) { return y(1)})
    .attr("height",function(d) { return height -y(1-bs_wr_by_year.get(d));})
    .attr("width",x.bandwidth())
    .attr("fill", "#ff6666")
}