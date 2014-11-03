var UI = require('ui');
var ajax = require('ajax');

function sortEventList(list){
  var names = [];
  var events = {};
  for(var i=0;i<list.length;i++){
    names[i] = list[i].name.toUpperCase();
    events[names[i]] = list[i];
  }
  names.sort();
  var eventsSorted = [];
  for(var j=0;j<list.length;j++){
    eventsSorted[j] = events[names[j]];
  }
  return eventsSorted;
}

function sortObjectByKey(obj){
  var keys = [];
  var sorted_obj = {};
  for(var key in obj){
    keys[keys.length] = key;
  }
  keys.sort();
  for(var i=0;i<keys.length;i++){
    sorted_obj[keys[i]] = obj[keys[i]];
  }
  return sorted_obj;
}

function getData(url){
  var d = null;
  ajax(
    {
      url: 'http://www.thebluealliance.com' + url + '?X-TBA-App-Id=JoeyHolliday:PebbleApp:1.0',
      type: 'json',
      async: false
    },
    function(data) {
      d = data;
    },
    function(error) {
      console.log('The ajax request failed: ' + error);
    }
  );
  return d;
}

function numberMenu(e){
  var title = e.item.previous+e.item.title;
  var items = [];
  for(var i=0;i<10;i++){
    items[i] = {
      title: String(i),
      previous: title
    };
  }
  for(var j=title.length;j<4;j++){
    title+='-';
  }
  title = 'Team #' + title;
  return new UI.Menu({
    sections: [{
      title: title,
      items: items
    }]
  });
}

function getTeamCard(num){
  var split = String(num).split('');
  num = '';
  var nonZero = false;
  for(var i=0;i<split.length;i++){
    if(split[i]!='0' && !nonZero){
      nonZero = true;
      num += split[i];
    }else if(nonZero){
      num += split[i];
    }
  }
  var data = getData('/api/v2/team/frc'+num);
  if(data!=null){ //Okay
    var headings = {};
    
    headings['About'] = function(){
      var title = data.nickname;
      var body = '';
      if(!title){
        title = 'Team ' + data.team_number;
      }else{
        body = '#' + data.team_number + '\n' + data.location + '\nRookie Year: ' + data.rookie_year;
      }
      var team = new UI.Card({
        title: title,
        body: body,
        scrollable: true
      });
      team.show();
    };
    
    var years = getData('/api/v2/team/frc' + num + '/years_participated');
    if(years.length>0){
      headings['Events'] = function(){
        var sections = [];
        for(var i=years.length-1;i>=0;i--){
          var year = years[i];
          var items = [];
          var eventList = getData('/api/v2/team/frc' + num + '/' + year + '/events');
          for(var j=0;j<eventList.length;j++){
            var event = eventList[j];
            items[items.length] = {
              title: event.name,
              code: event.key
            };
          }
          sections[sections.length] = {
            title: year,
            items: items
          };
        }
        var events = new UI.Menu({
          sections: sections
        });
        events.on('select', function(e){
          var card = getEventCard(e.item.code);
          card.show();
        });
        events.show();
      };
    
      headings['Awards'] = function(){
        var sections = [];
        for(var i=years.length-1;i>=0;i--){
          var year = years[i];
          var items = [];
          var eventList = getData('/api/v2/team/frc' + num + '/' + year + '/events');
          for(var j=0;j<eventList.length;j++){
            var awardList = getData('/api/v2/team/frc' + num + '/event/' + eventList[j].key + '/awards');
            for(var h=0;h<awardList.length;h++){
              items[items.length] = {
                title: awardList[h].name,
                subtitle: eventList[j].name,
                code: awardList[h].event_key
              };
            }
          }
          sections[sections.length] = {
            title: year,
            items: items
          };
        }
        var awards = new UI.Menu({
          sections: sections
        });
        awards.on('select', function(e){
          var card = getEventCard(e.item.code);
          card.show();
        });
        awards.show();
      };
    }
    
    var items = [];
    for (var k in headings) {
      items[items.length] = {
        title: k,
        func: headings[k] 
      };
    }
    var menu = new UI.Menu({
      sections: [{
        title: data.nickname,
        items: items
      }]
    });
    menu.on('select', function(e) {
      e.item.func();
    });
    return menu;
  }else{
    return new UI.Card({
      title: 'Invalid Team'
    });
  }
}

function getEventCard(code){
  var event = getData('/api/v2/event/'+code);
  var headings = {};
  
  headings['About'] = function() {
    var card = new UI.Card({
        title: event.name,
        body: event.location + '\n' + event.start_date + ' to ' + event.end_date,
        scrollable: true
      });
      card.show();
  };
  
  var teams = getData('/api/v2/event/' + code + '/teams');
  if(teams.length>0){
    headings['Teams'] = function(){
      var items = [];
      for(var i=0;i<teams.length;i++){
        items[items.length] = {
          title: teams[i].team_number
        };
      }
      var teamsMenu = new UI.Menu({
        sections: [{
          title: 'Teams',
          items: items
        }]
      });
      teamsMenu.on('select', function(e){
        var card = getTeamCard(e.item.title);
        card.show();
      });
      teamsMenu.show();
    };
  }
  
  var ranks = getData('/api/v2/event/' + code + '/rankings');
  if(ranks.length>0){
    headings['Rankings'] = function() {
      var items = [];
      for(var i=1;i<ranks.length;i++){
        items[i-1] = {
          title: ranks[i][0] + ': ' + ranks[i][1],
          subtitle: '',
          num: ranks[i][1]
        };
      }
      var rankings = new UI.Menu({
        sections: [{
          title: 'Rankings',
          items: items
        }]
      });
      rankings.on('select', function(e) {
        var team = getTeamCard(e.item.num);
        team.show();
      });
      rankings.show();
    };
  }
  
  var awards = getData('/api/v2/event/' + code + '/awards');
  if(awards.length>0){
    headings['Awards'] = function(){
      var items1 = []; // Okay
      for(var j=0;j<awards.length;j++){ // Okay
        var award = awards[j];
        items1[j] = {
          title: award.name,
          award: award
        };
      }
      var awardsMenu = new UI.Menu({
        sections: [{
          title: 'Awards',
          items: items1
        }]
      });
      awardsMenu.on('select', function(e) {
        var award = e.item.award;
        var winners = [];
        for(var i=0;i<award.recipient_list.length;i++){
          var winner = award.recipient_list[i];
          var title = winner.awardee;
          var subtitle = '';
          if(!title){
            title = winner.team_number;
          }else if(winner.team_number){
            subtitle = winner.team_number;
          }
          winners[i] = {
            title: title,
            subtitle: subtitle,
            num: winner.team_number
          };
        }
        var winnersMenu = new UI.Menu({
          sections: [{
            title: award.name,
            items: winners
          }]
        });
        winnersMenu.on('select', function(e) {
          if(e.item.num){
            var team = getTeamCard(e.item.num);
            team.show();
          }
        });
        winnersMenu.show();
      });
      awardsMenu.show();
    };
  }
  
  var items = [];
  for (var k in headings) {
    items[items.length] = {
      title: k,
      func: headings[k] 
    };
  }
  var menu = new UI.Menu({
    sections: [{
      title: event.name,
      items: items
    }]
  });
  menu.on('select', function(e) {
    e.item.func();
  });
  return menu;
}

var menu = new UI.Menu({
  sections: [{
    title: 'The Blue Alliance',
    items: [{
      title: 'Teams'
    }, {
      title: 'Events'
    }]
  }]
});
menu.on('select', function(e) {
  var selected = e.item.title;
  if(selected=='Teams'){
    var one = numberMenu({
      item: {
        title: '',
        previous: ''
      }
    });
    one.on('select', function(e){
      var two = numberMenu(e);
      two.on('select', function(e) {
        var three = numberMenu(e);
        three.on('select', function(e) {
          var four = numberMenu(e);
          four.on('select', function(e) {
            var card = getTeamCard(e.item.previous+e.item.title);
            card.show();
            four.hide();
            three.hide();
            two.hide();
            one.hide();
          });
          four.show();
        });
        three.show();
      });
      two.show();
    });
    one.show();
  }
  if(selected=='Events'){
    var year = 2014;
    var events = getData('/api/v2/events/'+year);
    var letters = {};
    for(var i=0;i<events.length;i++){
      var event = events[i];
      var c = String(event.name.charAt(0)).toUpperCase();
      if(!(c in letters)){
        letters[c] = [];
      }
      letters[c][letters[c].length] = event;
    }
    letters = sortObjectByKey(letters);
    var items = [];
    var count = 0;
    for(var k in letters){
      console.log(letters[k][0].name);
      letters[k] = sortEventList(letters[k]);
      items[count] = {
        title: k,
        list: letters[k]
      };
      count++;
    }
    var eventsMenu = new UI.Menu({
      sections: [{
        title: 'Events',
        items: items
      }]
    });
    eventsMenu.on('select', function(e) {
      var list = e.item.list;
      var s = [];
      for(var i=0;i<list.length;i++){
        s[i] = {
          title: list[i].name,
          code: list[i].key
        };
      }
      var letter = new UI.Menu({
        sections: [{
          title: 'Events - ' + e.item.title,
          items: s
        }]
      });
      letter.on('select', function(e) {
        var card = getEventCard(e.item.code);
        card.show();
      });
      letter.show();
    });
    eventsMenu.show();
  }
});

menu.show();