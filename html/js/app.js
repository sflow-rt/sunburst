$(function() {
  var restPath = '../scripts/metrics.js/';
  var enableFlowBrowserURL = '../../../app/browse-flows/status';
  var browseFlowsPage = '../../browse-flows/html/index.html';

  var selected;
  function setNav(target) {
    $('.navbar .nav-item a[href="'+target+'"]').parent().addClass('active').siblings().removeClass('active');
    $(target).show().siblings().hide();
    window.sessionStorage.setItem('sunburst_nav',target);
    window.history.replaceState(null,'',target);
    selected = target.slice(1);
  }

  var hash = window.location.hash;
  if(hash && $('.navbar .nav-item a[href="'+hash+'"]').length == 1) setNav(hash);
  else setNav(window.sessionStorage.getItem('sunburst_nav') || $('.navbar .nav-item a').first().attr('href'));

  $('.navbar .nav-link').on('click', function(e) {
    var selected = $(this).attr('href');
    setNav(selected);
  });

  $('a[href^="#"]').on('click', function(e) {
    e.preventDefault();
  });

  var browseFlows = false;

  $.ajax({
    url: enableFlowBrowserURL,
    dataType:'text',
    contentType:'text/plain',
    success: function(status) {
      browseFlows = true;
    },
    error: function(result,status,errorThrown) {
      browseFlows = false;
    },
    complete: function() {
      initialize();
    },
    timeout: 10000
  });

  function initialize() {
    var _data = {};
    var clickable = browseFlows;
    var widget = $('#sunburst').sunburst({clickable:clickable});
    if(clickable) {
      widget.on('sunburstclick', function(e,val) {
        console.log(val);
        if(_data.flow && val && val.filter) {
          if(browseFlows) window.location.href=browseFlowsPage+'?keys=stack&value=fps&filter='+encodeURIComponent(val.filter);
        }
      });
    }

    function draw(data) {
      _data = data;
      widget.sunburst('draw',_data);
      if(_data.description) $('#caption').text(_data.description);
    }
    function redraw() {
      widget.sunburst('draw',_data);
    }

    $(window).resize(redraw);

    (function pollData() {
      $.ajax({
        url: restPath + selected + '/json',
        success: function(data) {
          draw(data);
        },
        error: function(result,status,errorThrown) {
          draw({});
        },
        complete: function() {
          setTimeout(pollData,1000);
        },
        timeout: 60000
      });
    })();
  }
});
