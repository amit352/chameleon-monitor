$(function () {
  var socket = io();
  var totalPoints = 30;

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // emit new user has joined
  socket.emit('newUser', {
    date: Date.now()
  });

  // update uv and temp displays on new-reading
  socket.on('new-reading', function (data) {
    $('#uv').html(data.uv);
    $('#temp').html(data.temp);
  });

  // update led when led:toggled event is emitted
  socket.on('led:toggled', function (data) {
    var state = data.ledState;

    if (state) {
      $('#led').addClass('led-on');
    } else {
      $('#led').removeClass('led-on');
    }
  });

  // click even for toggling led
  $('button.toggleLed').on('click', function () {
    if (socket) {
      socket.emit('toggleLed');
    }
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
    }
  });

  // build chart showing UV and temp readings
  $('#chart').highcharts({
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
    credit: false,
    title: {
      text: 'Sensor Data'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: 500
    },
    yAxis: [{
      title: {
        text: 'Temperature',
        style: {
          font: '13px sans-serif'
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
        text: 'UV Light',
        style: {
          font: '13px sans-serif'
        }
      },
      min: 0,
      max: 1,
      opposite: true,
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }]
    }],
    tooltip: {
      formatter: function () {
        var unitOfMeasurement = this.series.name === 'Temperature' ? ' °F' : ' %';
        return '<b>' + this.series.name + '</b><br/>' +
          Highcharts.numberFormat(this.y, 1) + unitOfMeasurement;
      }
    },
    legend: {
      enabled: true
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'Temperature',
      yAxis: 0,
      data: []
    }, {
      name: 'UV Light',
      yAxis: 1,
      data: []
    }]
  });
});

