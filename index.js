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
        { name: 'zAxis', }
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
        if (!conf.xAxis || !conf.yAxis || !conf.zAxis ) {
            return
        }

        const rows = tableData.rows

        const [ xAxisName, xAxisIndex, ] = [ conf.xAxis.name, conf.xAxis.index, ]
        const [ yAxisName, yAxisIndex, ] = [ conf.yAxis.name, conf.yAxis.index, ]
        const [ zAxisName, zAxisIndex, ] = [ conf.zAxis.name, conf.zAxis.index, ]
        
        const data = createDataStructure(xAxisIndex, yAxisIndex, zAxisIndex, rows)
        const chartOption = createHighchartOption(xAxisName, yAxisName, zAxisName,data);

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

var chart=new Highcharts.chart(this.targetEl[0].id, chartOption);

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
export function createDataStructure(xAxisIndex, yAxisIndex, zAxisIndex,rows) {
    const data = []
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const xAxisValue = parseFloat(row[xAxisIndex])
        const yAxisValue = parseFloat(row[yAxisIndex])
        const zAxisValue = parseFloat(row[zAxisIndex])

        data.push({
            x: xAxisValue,
            y: yAxisValue,
            z: zAxisValue
        });
    }

    return data
}

export function createHighchartOption(xAxisName, yAxisName, zAxisName,data) {
    console.log(data);
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
                    bottom: { size: 1, color: 'rgba(0,0,0,0.52)' },
                    back: { size: 1, color: 'rgba(0,0,0,0.34)' },
                    side: { size: 1, color: 'rgba(0,0,0,0.46)' }
                }
            }
        },
        title: {
            text: '3D散点图'
        },
        subtitle: {
            text: '单击并拖动鼠标可旋转绘图区'
        },
        plotOptions: {
            scatter: {
                width: 10,
                height: 10,
                depth: 10
            }
        },
        series: [{ name: '测试数据', data: data}]
}
