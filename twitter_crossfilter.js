var chartParty = dc.rowChart('#chart-one');
var chartMentions = dc.barChart('#chart-two');
var retweetDisplay = dc.numberDisplay('#retweet-chart');
var favDisplay = dc.numberDisplay('#fav-chart');
var monthChart = dc.barChart('#month-chart');
var tweetTable = dc.dataTable('#data-table');
var tweetCount = dc.dataCount('.dc-data-count');
var ndx;
  
d3.csv(window.CrossFilter.config.dataUrl, function (data) {

  var numberFormat = d3.format('.1f');
  
  var reducerRT = reductio()
    .median(function(d) { return +d.retweet_count; });

  var reducerF = reductio()
    .median(function(d) { return +d.favorite_count; });
  
  data.forEach(function (d) {
        d.dd = new Date(d.datecreated);
    });

  //### Create Crossfilter Dimensions and Groups
  ndx = crossfilter(data);
  var all = ndx.groupAll();

  var partyDimension = ndx.dimension(function (d) {
      return d.party;
  });
  
  var mentionsDimension = ndx.dimension(function (d) {
      return d.mentions;
  });

  var retweetDimension = ndx.dimension(function (d) {
        return d;
    });
    
  var favDimension = ndx.dimension(function (d) {
        return d;
    });
    
  var monthDimension = ndx.dimension(function (d) {
       return d3.time.month(d.dd);
  })

  
  var partyGroup = partyDimension.group().reduceCount(function (d) {
      return d.party;
  });
  
  var mentionsGroup = mentionsDimension.group().reduceCount(function (d) {
      return d;
  });
  
  var rt2group = retweetDimension.group();
  reducerRT(rt2group);
  
  var fav2group = favDimension.group();
  reducerF(fav2group);
  
  var monthGroup = monthDimension.group().reduceCount(function (d) {
      return d;
  })

  //### Define Chart Attributes

  retweetDisplay
    .group(rt2group)
    .formatNumber(numberFormat)
    .valueAccessor( 
        function(d) { 
            return d.value.median; });
  favDisplay
    .group(fav2group)
    .formatNumber(numberFormat)
    .valueAccessor( 
        function(d) { 
            return d.value.median; });
            
  monthChart
    .width(400)
    .height(210)
    .margins({top: 20, right: 20, bottom: 40, left: 40})
    .dimension(monthDimension)
    .group(monthGroup)
    .x(d3.time.scale().domain([new Date(2016, 2, 15), new Date(2016, 8, 15)]))
    .xUnits(d3.time.months)
    .barPadding(0.2)
    .outerPadding(0.05)
    .centerBar(true)
    .elasticY(true)
    .ordinalColors(['#525252'])

  chartParty
    .width(300)
    .height(210)
    .margins({top: 20, left: 10, right: 20, bottom: 40})
    .ordinalColors(['#3690c0','#ef3b2c'])
    .elasticX(true)
    .dimension(partyDimension)
    .group(partyGroup)
    .xAxis().ticks(5);

  chartMentions 
    .width(450)
    .height(250)
    .x(d3.scale.ordinal())
    .xUnits(dc.units.ordinal)
    .margins({top: 20, left: 50, right: 50, bottom: 80})
    .group(mentionsGroup)
    .dimension(mentionsDimension)
    .barPadding(0.1)
    .outerPadding(0.05)
    .brushOn(false)
    .colors(d3.scale.ordinal().domain(["other","something"])
                                .range(["#252525","#807dba"]))
    .colorAccessor(function(d) { 
            if(d.key == 'Other') 
                return "other"
            return "something";})
    .y(d3.scale.sqrt())
    .elasticY(true)
    .yAxis().ticks(4);

  tweetCount
    .dimension(ndx)
    .group(all)
  
  tweetTable
    .dimension(monthDimension)
    .group(function (d) {var monthFormat = d3.time.format("%B %Y");
                            return monthFormat(d.dd);})
    .size(Infinity)
    .columns([
        function (d) {
            var dateFormat = d3.time.format("%B %d, %H:%M");
            return dateFormat(d.dd);},
        function(d) {return '@'+d.screen_name;},
        function(d) {return d.party;},
        function(d) {return d.text;},
        function(d) {return d.retweet_count;},
        function(d) {return d.favorite_count;},
        function(d) { return '<a href=\"https://twitter.com/statuses/' + d.id_str + '/"' + 'target=\"_blank\"' + '>Tweet Link</a>'}])

    .sortBy(function (d) {
            return d.datecreated;
        })
    .order(d3.ascending);
  update();
  dc.renderAll();  
})
var ofs = 1, pag = 20;
  function display() {
      d3.select('#begin')
          .text(ofs);
      d3.select('#end')
          .text(ofs+pag-1);
      d3.select('#last')
          .attr('disabled', ofs-pag<0 ? 'true' : null);
      d3.select('#next')
          .attr('disabled', ofs+pag>=ndx.size() ? 'true' : null);
      d3.select('#size').text(ndx.size());
  }
  function update() {
      tweetTable.beginSlice(ofs);
      tweetTable.endSlice(ofs+pag);
      display();
  }
  function next() {
      ofs += pag;
      update();
  }
  function last() {
      ofs -= pag;
      update();
  }