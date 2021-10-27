$(function() {
  var restPath = '../scripts/metrics.js/';
  var dataURL = restPath + 'json';

  var widget = $('#sunburst').sunburst();
  widget.bind('click',function(e,entry) {
    console.log(entry);
  });

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
});
