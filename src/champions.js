let champData = null;
const championsData = d3.csv('./data/champ_links.csv').then(function(champions) {
    champData=champions;
    console.log(position_icons)
    const container = d3.select('#champion-container');
    container
        .selectAll('img')
        .data(champions)
        .enter()
        .append('img')
        .attr('src', d => d.url)
        .attr('alt', d => d.name)
        .attr('class', 'champion-portrait')
        .on('click', function(e, d){
            var selectedChamp = d3.select(this);
            var selectedChampName = selectedChamp.attr('alt');
            var selectedRole = null;
            var selectedSide = null;
            if (selectedChamp.attr('class') == 'champion-portrait'){
                var position = d3.select('.selected');
                selectedRole = position.attr('alt');
                selectedSide = position.property('side');
                console.log(position)
                console.log(selectedRole);
                if(position.attr('champion')!=null){
                    delete champs_to_roles[position.attr('champion')];
                    d3.selectAll(".champion-portrait")
                    .filter(
                        function(){
                            return d3.select(this).attr('alt') == position.attr('champion');
                        }
                    ).classed('selected-champ', false);
                }
                position
                    .attr('src', d.url)
                    .attr('champion', selectedChampName);
                matchups[selectedSide][selectedRole] = selectedChampName;
                champs_to_roles[selectedChampName] = selectedRole;
                console.log(matchups)
                console.log(champs_to_roles)
                selectedChamp.classed('selected-champ', true)
                console.log(matchups[other_side[selectedSide]][selectedRole])
                if (matchups[other_side[selectedSide]][selectedRole]){
                    const wr = blue_side_winrate(
                        df, 
                        selectedRole);
                    console.log(wr)
                    head_to_head_bar(wr[0], wr[1], selectedRole)
                    head_to_head_over_time(df, selectedRole)
                }
                update_inspector_champion_dropdowns();  
            }
        });
    // Create container for the blue team
    
});
//updates the champion dropdowns in the inspector when a new champion is selected
function update_inspector_champion_dropdowns(){
    var championdd_1 = d3.select('#champ1-dropdown');
    var champ1_current = championdd_1.property('value');

    var championdd_2 = d3.select('#champ2-dropdown');
    var champ2_current = championdd_2.property('value');
    var red_heroes = Object.values(matchups['Red']).filter(d=>d!=null);
    var blue_heroes = Object.values(matchups['Blue']).filter(d=>d!=null);
    // add options to the dropdowns
    championdd_1.selectAll('option').remove();
    championdd_1.selectAll('Options')
    .data(blue_heroes.concat(red_heroes))
    .enter()
    .append('option')
    .attr('value', d => d)
    .text(d => d);
    championdd_2.selectAll('option').remove();
    championdd_2.selectAll('option')
    .data(red_heroes.concat(blue_heroes))
    .enter()
    .append('option')
    .attr('value', d => d)
    .text(d => d);

    // update the dropdowns
    if (!champ1_current && blue_heroes.length > 0){
        champ1_current = blue_heroes[0];
    }

    if ( !champ2_current && red_heroes.length > 0){
        champ2_current = red_heroes[0];
    }


    championdd_1.property('value', champ1_current);
    championdd_2.property('value', champ2_current);
}