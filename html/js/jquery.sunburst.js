// Copyright (c) 2021 InMon Corp. ALL RIGHTS RESERVED

(function ($) {
  function hash(str, seed) {
    var i, l, hval = (seed === undefined) ? 0x811c9dc5 : seed;
    for (i = 0, l = str.length; i < l; i++) {
      hval ^= str.charCodeAt(i);
      hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    return hval >>> 0;
  }

  function draw(ctx, cX, cY, cR, step, depth, startAngle, node, total, options) {
    var keys, start, i, child, end;

    if(!node.children) return;

    keys = Object.keys(node.children).sort();
    start = startAngle;
    for(i = 0; i < keys.length; i++) {
      child = node.children[keys[i]];

      end = start + ((child.value / total) * 2 * Math.PI);
      draw(ctx, cX, cY, cR + step, step, depth + 1, start, child, total, options);

      ctx.beginPath();
      ctx.moveTo(cX,cY);
      ctx.arc(cX,cY,cR + step, start, end);
      ctx.closePath();
      ctx.fillStyle = options.colors[hash(keys[i],options.seed) % options.colors.length];
      ctx.strokeStyle = options.segmentOutlineColor;
      ctx.fill();
      ctx.stroke();

      start = end;
    }
  }

  function label(ctx, cX, cY, cR, step, depth, startAngle, node, total, options) {
    var keys, start, i, child, end, textAngle, textRadius;

    if(!node.children) return;

    keys = Object.keys(node.children).sort();
    start = startAngle;
    for(i = 0; i < keys.length; i++) {
      child = node.children[keys[i]];

      end = start + ((child.value / total) * 2 * Math.PI); 
      label(ctx, cX, cY, cR + step, step, depth + 1, start, child, total, options);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '15px sans-serif';
      textAngle = start + ((end - start) / 2);
      textRadius = cR + (step / 2);
      ctx.fillStyle = options.segmentTextColor;
      ctx.fillText(keys[i], cX + (textRadius * Math.cos(textAngle)), cY + (textRadius * Math.sin(textAngle)));

      start = end; 
    } 
  }

  $.widget('inmon.sunburst', {
    options: {
      centerRadius: 60,
      centerColor: '#ffffff',
      centerOutlineColor: '#000000',
      centerTextColor: '#000000',
      centerFont: '20px sans-serif',
      segmentOutlineColor: '#000000',
      segmentTextColor: '#f8f8ff',
      colors: [
        '#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6',
        '#dd4477', '#66aa00', '#b82e2e', '#316395', '#994499', '#22aa99',
        '#aaaa11', '#6633cc', '#e67300', '#8b0707', '#651067', '#329262',
        '#5574a6', '#3b3eac', '#b77322', '#16d620', '#b91383', '#f4359e',
        '#9c5935', '#a9c413', '#2a778d', '#668d1c', '#bea413', '#0c5922',
        '#743411'
      ]
    },
    _create: function() {
      this.element.addClass('sunburst');
      this._canvas = $('<canvas/>').appendTo(this.element);
    },
    _destroy: function() {
      this.element.removeClass('sunburst');
      this.element.empty();
      delete this._canvas;
    },
    draw: function(data) {
      var canvas, ctx, h, w, ratio, colors, cX, cY, cR, step;
      canvas = this._canvas[0];
      if (!canvas || !canvas.getContext)
        return;

      ctx = canvas.getContext('2d');
      h = this._canvas.height();
      w = this._canvas.width();
      ratio = window.devicePixelRatio;
      if (ratio && ratio > 1) {
        canvas.height = h * ratio;
        canvas.width = w * ratio;
        ctx.scale(ratio, ratio);
      } else {
        canvas.height = h;
        canvas.width = w;
      }

      cX = w / 2;
      cY = h / 2;
      cR = this.options.centerRadius;
      step = (Math.min(cX, cY) - cR) / data.depth;

      draw(ctx, cX, cY, cR, step, 0, 0, data, data.value, this.options);
      label(ctx, cX, cY, cR, step, 0, 0, data, data.value, this.options);

      ctx.beginPath();
      ctx.arc(cX, cY, cR, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = this.options.centerColor;
      ctx.strokeStyle = this.options.centerOutlineColor;
      ctx.fill();
      ctx.stroke();

      if(data.label) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = this.options.centerFont;
        ctx.fillStyle = this.options.centerTextColor;
        ctx.fillText(data.label, cX, cY);
      }
    }
  });
})(jQuery);
