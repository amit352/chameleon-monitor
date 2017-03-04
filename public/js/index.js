$(function () {
  var socket = io();
  var totalPoints = 30;

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function updateDrainLevel(data) {
    // if drain level is high disable mister and turn led red
    if (data.drainLevel === 'high') {
      $('#drain > label.drainLevel')
        .removeClass('hide')
        .siblings('label').addClass('hide')
        .siblings('.led').addClass('led-red');
    } else {
      $('#drain > label.drainLevel')
        .addClass('hide')
        .siblings('label').removeClass('hide')
        .siblings('.led').removeClass('led-red');
    }
  }

  // emit new user has joined
  socket.emit('newUser', {
    date: Date.now()
  });

  // update uv and temp displays on new-reading
  socket.on('new-reading', function (data) {
    $('#uv .display-value').html(data.uv);
    $('#temp .display-value').html(Math.round(data.temp));
    updateDrainLevel(data);
  });

  // update led when led:toggled event is emitted
  socket.on('pump:toggled', function (data) {
    if (data.pumpState) {
      $('.led').addClass('led-green');
    } else {
      $('.led').removeClass('led-green');
    }
  });

  // click even for toggling led
  $('#drain').on('click', function (e) {
    if ($(e.target).children('.led').hasClass('.led-red')) {
      // don't toggle pump if drain level is high.
      return;
    }

    if (socket) {
      socket.emit('togglePump');
    }
  });

  // click event for historical data
  $('#temp').on('click', function (e) {
    window.location.href = '/temperature'
  });

  $('#uv').on('click', function (e) {
    window.location.href = '/uv'
  });

  // setting options for HighCharts
  Highcharts.setOptions({
    global: {
      useUTC: false
    },
    plotOptions: {
      series: {
        marker: {
          enabled: false
        }
      }
    },
    tooltip: {
      enabled: true
    },
    colors: ['#762a83', '#1b7837', '#90ed7d', '#f7a35c', '#8085e9',
      '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1']
  });

  // build chart showing UV and temp readings
  window.Chart = Highcharts.chart('chart', {
    chart: {
      type: 'spline',
      events: {
        load: function () {
          var temperatureSeries = this.series[0]
            , lightSeries = this.series[1]
            , pointCount = totalPoints
            , x
            , uvs
            , temperature;

          socket.on('new-reading', function (data) {
            x = data.date;
            uvs = data.uv;
            temperature = data.temp;

            lightSeries.addPoint([x, uvs], false, lightSeries.data.length > pointCount);
            temperatureSeries.addPoint([x, temperature], true, temperatureSeries.data.length > pointCount);
          });
        }
      }
    },
    credits: false,
    title: {
      text: 'Sensor Data',
      style: {
        color: '#4d4d4d'
      }
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: 500
    },
    yAxis: [{
      title: {
        text: 'Temperature',
        style: {
          fontSize: '1.2em',
          color: '#762a83'
        }
      },
      min: 0,
      max: 100,
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }]
    }, {
      title: {
        text: 'UV Index',
        style: {
          fontSize: '1.2em',
          color: '#1b7837'
        }
      },
      min: 0,
      opposite: true,
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }]
    }],
    tooltip: {
      formatter: function () {
        var unitOfMeasurement = this.series.name === 'Temperature' ? ' °F' : '';
        return '<b>' + this.series.name + '</b><br/>' +
          Highcharts.numberFormat(this.y, 1) + unitOfMeasurement;
      }
    },
    legend: {
      enabled: true,
      itemStyle: {
        color: '#4d4d4d',
        fontSize: '1.2em'
      }
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'Temperature',
      yAxis: 0,
      data: []
    }, {
      name: 'UV Index',
      yAxis: 1,
      data: []
    }]
  });

  Chart.reflow();

  function debounce(func, wait, immediate) {
    var timeout;
    return function () {
      var context = this, args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  var GnBu = ["#f7fcf0", "#e0f3db", "#ccebc5", "#a8ddb5", "#7bccc4", "#4eb3d3", "#2b8cbe", "#0868ac", "#084081"];
  var Spectral = ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"];
  var Paired = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"];
  var PRGn = ["#40004b", "#762a83", "#9970ab", "#c2a5cf", "#e7d4e8", "#f7f7f7", "#d9f0d3", "#a6dba0", "#5aae61", "#1b7837", "#00441b"];

  var updateHeaderAndChart = debounce(function () {
    var $header = $('header');

    var pattern = Trianglify({
      height: $header.innerHeight(),
      width: $header.innerWidth(),
      cell_size: 40,
      x_colors: PRGn
    });

    $('#trianglify').html(pattern.canvas());

    if (Chart) {
      Chart.reflow();
    }
  }, 50, false);

  updateHeaderAndChart();

  window.addEventListener('resize', updateHeaderAndChart);
});

