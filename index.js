import Visualization from 'zeppelin-vis'
import ColumnselectorTransformation from 'zeppelin-tabledata/columnselector'

import Highcharts from 'highcharts/highcharts'
require('highcharts/highcharts-more')(Highcharts);
require('highcharts/modules/exporting')(Highcharts);
require('highcharts/highcharts-3d')(Highcharts);

export default class m3dChart extends Visualization {
    constructor(targetEl, config) {
        super(targetEl, config)

        this.props = [
            { name: 'xAxis', },
            { name: 'yAxis', },
            { name: 'zAxis', },
            { name: 'category', },
        ]

        this.transformation = new ColumnselectorTransformation(
            config, this.props)
    }

    /**
     * @param tableData {Object} includes cols and rows. For example,
     *                           `{columns: Array[2], rows: Array[11], comment: ""}`
     *
     * Each column includes `aggr`, `index`, `name` fields.
     *  For example, `{ aggr: "sum", index: 0, name: "age"}`
     *
     * Each row is an array including values.
     *  For example, `["19", "4"]`
     */
    render(tableData) {
        const conf = this.config

        /** can be rendered when all axises are defined */
        if (!conf.xAxis || !conf.yAxis || !conf.zAxis || !conf.category) {
            return
        }

        const rows = tableData.rows

        const [ xAxisName, xAxisIndex, ] = [ conf.xAxis.name, conf.xAxis.index, ]
        const [ yAxisName, yAxisIndex, ] = [ conf.yAxis.name, conf.yAxis.index, ]
        const [ zAxisName, zAxisIndex, ] = [ conf.zAxis.name, conf.zAxis.index, ]
        const [ categoryName, categoryIndex, ] = [ conf.category.name, conf.category.index, ]

        const data = createDataStructure(xAxisIndex, yAxisIndex, zAxisIndex, categoryIndex, rows)
        const chartOption = createHighchartOption(xAxisName, yAxisName, zAxisName, categoryName, data);

        Highcharts.chart(this.targetEl[0].id, chartOption);

    }

    getTransformation() {
        return this.transformation
    }
}

/**
 * creates data structure by converting Zeppelin tabledata.rows
 *
 * @return {Array<Object>}
 *
 * See also: * http://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/demo/bubble/
 */
export function createDataStructure(xAxisIndex, yAxisIndex, zAxisIndex,
                                    categoryIndex, rows) {
    const data = []
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const xAxisValue = parseFloat(row[xAxisIndex])
        const yAxisValue = parseFloat(row[yAxisIndex])
        const zAxisValue = parseFloat(row[zAxisIndex])
        const categoryValue = row[categoryIndex]

        data.push({
            x: xAxisValue,
            y: yAxisValue,
            z: zAxisValue,
            _category: categoryValue, /** highchart doens't allow `category` variable in row */
        });
    }

    return data
}

export function createHighchartOption(xAxisName, yAxisName, zAxisName,
                                      categoryName, data) {
    return {
        chart: {
            margin: 100,
            type: 'scatter',
            options3d: {
                enabled: true,
                alpha: 10,
                beta: 30,
                depth: 250,
                viewDistance: 5,
                frame: {
                    bottom: { size: 1, color: 'rgba(0,0,0,0.02)' },
                    back: { size: 1, color: 'rgba(0,0,0,0.04)' },
                    side: { size: 1, color: 'rgba(0,0,0,0.06)' }
                }
            },
       title: {
            text: '3D散点图'
        },
        subtitle: {
            text: '单击并拖动鼠标可旋转绘图区'
        },

        xAxis: {
            gridLineWidth: 1,
            min: 0,
            max: 10,
            title: { text: xAxisName, },
        },

        yAxis: {
            min: 0,
            max: 10,
            startOnTick: false,
            endOnTick: false,
            title: { text: yAxisName, },
            maxPadding: 0.2,
        },
        zAxis: {
            min: 0,
            max: 10
        },
        tooltip: {
            useHTML: true,
            headerFormat: '<table>',
            pointFormat: '<tr><th colspan="2"><h3>{point._category}</h3></th></tr>' +
            `<tr><th>${xAxisName}:</th><td>{point.x}</td></tr>` +
            `<tr><th>${yAxisName}:</th><td>{point.y}</td></tr>` +
            `<tr><th>${zAxisName}:</th><td>{point.z}</td></tr>`,
            footerFormat: '</table>',
            followPointer: true
        },

        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    format: '{point._category}'
                }
            }
            scatter: {
                width: 10,
                height: 10,
                depth: 10
            }
        },
        legend: {
            enabled: false
        },
        series: [{ name: zAxisName, data: data, }]
    }

    // for point look like 3d
    Highcharts.getOptions().colors = $.map(Highcharts.getOptions().colors, function (color) {
        return {
            radialGradient: {
                cx: 0.4,
                cy: 0.3,
                r: 0.5
            },
            stops: [
                [0, color],
                [1, Highcharts.Color(color).brighten(-0.2).get('rgb')]
            ]
        };
    });
   
    // Add mouse events for rotation
    $(chart.container).bind('mousedown.hc touchstart.hc', function (e) {
        e = chart.pointer.normalize(e);
        var posX = e.pageX,
            posY = e.pageY,
            alpha = chart.options.chart.options3d.alpha,
            beta = chart.options.chart.options3d.beta,
            newAlpha,
            newBeta,
            sensitivity = 5; // lower is more sensitive
        $(document).bind({
            'mousemove.hc touchdrag.hc': function (e) {
                // Run beta
                newBeta = beta + (posX - e.pageX) / sensitivity;
                newBeta = Math.min(100, Math.max(-100, newBeta));
                chart.options.chart.options3d.beta = newBeta;
                // Run alpha
                newAlpha = alpha + (e.pageY - posY) / sensitivity;
                newAlpha = Math.min(100, Math.max(-100, newAlpha));
                chart.options.chart.options3d.alpha = newAlpha;
                chart.redraw(false);
            },
            'mouseup touchend': function () {
                $(document).unbind('.hc');
            }
        });
    });
}
