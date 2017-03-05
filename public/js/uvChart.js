$(function () {
  var socket = io.connect();
  var detailChart, data, bandColor;

  var PRGn = ["#40004b", "#762a83", "#9970ab", "#c2a5cf", "#e7d4e8", "#f7f7f7", "#d9f0d3", "#a6dba0", "#5aae61", "#1b7837", "#00441b"];
  var GnPr = PRGn.reverse();
  // setting options for HighCharts
  Highcharts.setOptions({
    global: {
      useUTC: false
    },
    colors: GnPr
  });

  bandColor = Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0.2).get('rgba');

  // emit new user has joined
  socket.emit('newUser', {
    date: Date.now()
  });

  $('#home').on('click', function () {
    window.location.href = '/';
  });

  // create the detail chart
  function createDetail(masterChart) {
    // rendering last 5,000 readings in detail chart
    var detailData = data.slice(-5000);

    // create a detail chart referenced by a global variable
    detailChart = $('#detail-container').highcharts({
      chart: {
        reflow: true,
        style: {
          fontFamily: 'Source Sans Pro'
        }
      },
      credits: false,
      title: {
        text: 'UV Index Data',
        style: {
          fontSize: '3em',
          color: Highcharts.getOptions().colors[1]
        }
      },
      subtitle: {
        text: 'Select an area by dragging across the <span style="text-decoration: underline">lower</span> chart',
        style: {
          fontSize: '2em'
        }
      },
      xAxis: {
        type: 'datetime'
      },
      yAxis: {
        title: {
          text: null
        },
        maxZoom: .1
      },
      tooltip: {
        formatter: function() {
          var point = this.points[0];
          return '<span>' + Highcharts.dateFormat('%B %e, %Y', this.x) + ': </span>' +
            '<span class="tool-tip-value"><b>' + point.y.toFixed(2) + '</b> UVi </span>';
        },
        style: {
          fontSize: '1.2em',
        },
        shared: true
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        series: {
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: true,
                radius: 3
              }
            }
          }
        }
      },
      series: [{
        name: 'UV Index History',
        data: detailData,
        color: Highcharts.getOptions().colors[1]
      }],

      exporting: {
        enabled: false
      }

    }).highcharts(); // return chart
  }

  // create the master chart
  function createMaster(data) {
    $('#master-container').highcharts({
      chart: {
        reflow: true,
        style: {
          fontFamily: 'Source Sans Pro'
        },
        zoomType: 'x',
        events: {
          // listen to the selection event on the master chart to update the
          // extremes of the detail chart
          selection: function(event) {
            var extremesObject = event.xAxis[0],
              min = extremesObject.min,
              max = extremesObject.max,
              detailData = [],
              xAxis = this.xAxis[0];

            // reverse engineer the last part of the data
            $.each(this.series[0].data, function() {
              if (this.x > min && this.x < max) {
                detailData.push([this.x, this.y]);
              }
            });

            // move the plot bands to reflect the new detail span
            xAxis.removePlotBand('mask-before');
            xAxis.addPlotBand({
              id: 'mask-before',
              from: data[0][0],
              to: min,
              color: bandColor
            });

            xAxis.removePlotBand('mask-after');
            xAxis.addPlotBand({
              id: 'mask-after',
              from: max,
              to: data[data.length - 1][0],
              color: bandColor
            });

            detailChart.series[0].setData(detailData);

            return false;
          }
        }
      },
      title: {
        text: Number(data.length).toLocaleString('en'),
        style: {
          fontSize: '2em',
          color: Highcharts.getOptions().colors[1],
          display: 'none'
        }
      },
      // subtitle: {
      //   text: 'Total Measurements',
      //   style: {
      //     fontSize: '1em'
      //   }
      // },
      xAxis: {
        type: 'datetime',
        showLastTickLabel: true,
        //maxZoom: 14 * 24 * 3600000, // fourteen days
        plotBands: [{
          id: 'mask-before',
          from: data[0][0],
          to: data[data.length - 1][0],
          color: bandColor
        }],
        title: {
          text: null
        }
      },
      yAxis: {
        gridLineWidth: 0,
        labels: {
          enabled: false
        },
        title: {
          text: null
        },
        min: 0.6,
        showFirstLabel: false
      },
      tooltip: {
        formatter: function() {
          return false;
        }
      },
      legend: {
        enabled: false
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        series: {
          fillColor: {
            linearGradient: [0, 0, 0, 10],
            stops: [
              [0, Highcharts.getOptions().colors[2]],
              [1, Highcharts.Color(Highcharts.getOptions().colors[2]).setOpacity(.2).get('rgba')]
            ]
          },
          lineWidth: 1,
          marker: {
            enabled: false
          },
          shadow: false,
          states: {
            hover: {
              lineWidth: 1
            }
          },
          enableMouseTracking: false
        }
      },

      series: [{
        type: 'area',
        name: 'UV Index',
        pointInterval: 24 * 3600 * 1000,
        pointStart: data[0][0],
        data: data,
        color: Highcharts.getOptions().colors[0]
      }],

      exporting: {
        enabled: false
      }

    }, function(masterChart) {
      createDetail(masterChart);
    }).highcharts(); // return chart instance
  }

  $.get('/api/uv', function (measurements) {
    data = measurements;
    // create master and in its callback, create the detail chart
    createMaster(measurements);
  });
});

