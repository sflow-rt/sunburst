$(function() {
  var restPath = '../scripts/metrics.js/';
  var dataURL = restPath + 'json';
  var enableFlowBrowserURL = '../../../app/browse-flows/status';
  var browseFlowsPage = '../../browse-flows/html/index.html';

  var clickable = false;

  $.get(enableFlowBrowserURL, function(res) { console.log(JSON.stringify(res)); });
  
  $.ajax({
    url: enableFlowBrowserURL,
    dataType:'text',
    contentType:'text/plain',
    success: function(status) {
      clickable = true;
    },
    error: function(result,status,errorThrown) {
      clickable = false;
    },
    complete: function() {
      initialize(); 
    },
    timeout: 10000
  });

  function initialize() {
    var widget = $('#sunburst').sunburst({clickable:clickable});
    if(clickable) {
      widget.on('sunburstclick', function(e,val) {
        if(val && val.filter) {
          window.location.href=browseFlowsPage+'?keys=stack&value=fps&filter='+encodeURIComponent(val.filter);
        }
      });
    }

    var _data = {};
    function draw(data) {
      _data = data;
      widget.sunburst('draw',_data);
    }
    function redraw() {
      widget.sunburst('draw',_data);
    }

    $(window).resize(redraw);

    (function pollData() {
      $.ajax({
        url: dataURL,
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
