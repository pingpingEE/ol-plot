# openlayers 扩展军事标绘

> 军事标绘功能，支持openlayers3+ 以上。

> 基于ilocation的plot4ol3修改。 [原地址](http://git.oschina.net/ilocation/plot)

## build

> 重要: Github 仓库的 /dist 文件夹只有在新版本发布时才会更新。如果想要使用 Github 上最新的源码，你需要自己构建。

---

```bash
git clone https://github.com/sakitam-fdd/ol-plot.git
npm install
gulp compact-js
gulp compact-css
```

## Use

> `new olPlot.PlotDraw(map) 初始化标绘绘制工具`
> `new olPlot.PlotEdit(map) 初始化标绘编辑工具`

## Examples

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="renderer" content="webkit">
  <meta name="HandheldFriendly" content="True">
  <meta name="MobileOptimized" content="320">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <title>军事标绘(ol3)</title>
  <link rel="stylesheet" href="../lib/ol.css" type="text/css">
  <link rel="stylesheet" href="../dist/ol-plot.min.css">
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
      font-family: "Microsoft YaHei";
    }
    .user-tool {
      position: absolute;
      top: 10px;
      left: calc(50% - (50% - 50px));
    }
    .ol-viewport {
      position: inherit!important;
    }
    .btn {
      display: inline-block;
      padding: 6px 12px;
      margin-bottom: 0;
      margin-bottom: 10px;
      font-size: 14px;
      font-weight: normal;
      line-height: 1.42857143;
      text-align: center;
      white-space: nowrap;
      vertical-align: middle;
      -ms-touch-action: manipulation;
      touch-action: manipulation;
      cursor: pointer;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      background-image: none;
      border: 1px solid transparent;
      border-radius: 4px;
    }
    .btn:focus,
    .btn:active:focus,
    .btn.active:focus,
    .btn.focus,
    .btn:active.focus,
    .btn.active.focus {
      outline: 5px auto -webkit-focus-ring-color;
      outline-offset: -2px;
    }
    .btn:hover,
    .btn:focus,
    .btn.focus {
      color: #333;
      text-decoration: none;
    }
    .btn:active,
    .btn.active {
      background-image: none;
      outline: 0;
      -webkit-box-shadow: inset 0 3px 5px rgba(0, 0, 0, .125);
      box-shadow: inset 0 3px 5px rgba(0, 0, 0, .125);
    }
    .btn-success {
      color: #fff;
      background-color: #5cb85c;
      border-color: #4cae4c;
    }
  </style>
</head>
<body>
<div id="map"></div>
<div class="user-tool">
  <button class="btn btn-success" onclick="activate('marker')">测试画点</button>
  <button class="btn btn-success" onclick="activate('polyline')">测试画线</button>
  <button class="btn btn-success" onclick="activate('curve')">测试画曲线</button>
  <button class="btn btn-success" onclick="activate('arc')">测试画弓形</button>
  <button class="btn btn-success" onclick="activate('circle')">测试画圆</button>

  <button class="btn btn-success" onclick="activate('freehandline')">测试画自由线</button>
  <button class="btn btn-success" onclick="activate('rectangle')">测试画矩形</button>
  <button class="btn btn-success" onclick="activate('ellipse')">测试椭圆</button>
  <button class="btn btn-success" onclick="activate('lune')">测试弓形</button>
  <button class="btn btn-success" onclick="activate('sector')">测试画扇形</button>
  <button class="btn btn-success" onclick="activate('closedcurve')">测试画闭合曲面</button>
  <button class="btn btn-success" onclick="activate('polygon')">测试多边形</button>
  <button class="btn btn-success" onclick="activate('freehandpolygon')">测试自由面</button>
  <button class="btn btn-success" onclick="activate('gatheringplace')">测试集结地</button>

  <button class="btn btn-success" onclick="activate('doublearrow')">测试双箭头</button>
  <button class="btn btn-success" onclick="activate('straightarrow')">测试细直箭头</button>
  <button class="btn btn-success" onclick="activate('finearrow')">测试粗单尖头箭头</button>
  <button class="btn btn-success" onclick="activate('attackarrow')">测试进攻方向</button>
  <button class="btn btn-success" onclick="activate('assaultdirection')">测试粗单直箭头</button>
  <button class="btn btn-success" onclick="activate('tailedattackarrow')">测试进攻方向（尾）</button>
  <button class="btn btn-success" onclick="activate('squadcombat')">测试分队战斗行动</button>
  <button class="btn btn-success" onclick="activate('tailedsquadcombat')">测试分队战斗行动（尾）</button>
</div>
<script src="../lib/ol.js"></script>
<script src="../lib/source/GaoDe.js"></script>
<script src="../dist/ol-plot.js"></script>
<script type="text/javascript">
  var gaodeMapLayer = new ol.layer.Tile({
    source: new ol.source.GAODE({
      url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}'
    })
  });
  var map = new ol.Map({
    layers: [gaodeMapLayer],
    view: new ol.View({
      center: [108.93, 34.27],
      projection: 'EPSG:4326',
      zoom: 5
    }),
    target: 'map'
  });
  map.on('click', function (e) {
    if (plotDraw.isDrawing()) {
      return false
    }
    var feature = map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
      return feature;
    });
    if (feature) {
      // 开始编辑
      plotEdit.activate(feature);
    } else {
      // 结束编辑
      plotEdit.deactivate();
    }
  });

  // 初始化标绘绘制工具，添加绘制结束事件响应
  plotDraw = new olPlot.PlotDraw(map);
  plotDraw.on(olPlot.Event.EventType.DRAW_END, onDrawEnd, this);

  // 初始化标绘编辑工具
  plotEdit = new olPlot.PlotEdit(map);

  // 设置标绘符号显示的默认样式
  var stroke = new ol.style.Stroke({color: '#7DC826', width: 2.5});
  var fill = new ol.style.Fill({color: 'rgba(158, 255, 232, 1)'});
  var icon = new ol.style.Icon({
    anchor: [0.5, 1],
    anchorXUnits: 'fraction',
    anchorYUnits: 'fraction',
    opacity: 0.75,
    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADQ0lEQVRYR8VXTVIaURD+evABi0BYWhVJdJEEVsETBE8gngA4QfAEkhMIJ9CcQDyB4wkkK0w2EjFVWSJkAfPgderNODplzb+LvO3MdH+vv6/76yH850MvyT/axHZ+genOFNO0cRIBuCmhtCyKJoAWQLVnScfEbJJC/8NvOYwLKBYAO3FBHIGoYwdm/g6GyQbZNyfFJRDqIPr08NxkKdvVPxhHAYkE8KOcaTAZJwCVmPkSUrZ04NHWRp0MJ2FG8fD93epSUwIhTonoM8BTYtX+OFkPwkCEAhiVRYuITpxLczs/lwOrII6ZqOUXlJhPs3N5uCiIhvsd8fogDEQggJ9vRE1l6MpNnlEYqgwudCXCy8pTY429tYGaA4KnuZncCRJqIIBRWZh2KRX3eSV7lBVX0cldaDxlS+5CiC4RNZn5W3Ui/avmdxuH98wZwPe5mdxeFMTA4TXBYTZzc3mwLIoxQK/Zsnb8ROlbgest0YNBXzTyjELPpSJBevtVY827awMdXQWADyu3svc8hi8At/xaQIoyNQKOkia3tQN8BfNYa0F3UHUi64kAsFJ7REYHhP00AMA4Z1Y9MoyL1ABApIWUjP8HtPbcYO6mAaCHSdOuAKih9ZCqArqDwIPEAK7fig5Ax1o4zJi6QyUpCD28iFCyYynuV+6kM8o9x1+Em9imbPYG4GFuJvfcVkoGwGnhZUGY2iN0R/iZVNggeqQBhlFP2gl2ByhlhpXfNrKgWzlmY1y4VVgURM/p5+ij50d+LjvLotCju6a1VL1bmb7+ERZuVLadrQnGIDe32stXohspSMX93F/ZdZPrVqxMrEZQnlA3fFhA7FGqK8GWPLDLtiH0bPD6v7MfrJxJR1lx5iwsjg7CNqaY+4D2Bedoy2WoQWWyPvfeSvsHYOx7rTrKikM14A3+SEU0/U9vRJT+8UJxYmoqFsXskIB3cd5n4Fd+ZtXiLKuRFLgJvQtKFIgw1ccaREEJniZkMATd/9VbqxsFMhEF3mDX5ewgyB2DHC8MTGwK3CBBekjCuxdQYgD6Y0cPMJ35oA/fG2vUk/yQpKbA/fD5yl6dyNO4vL+4Am4AvTvqv6MkontRF6S5YdQ3qTQQFTTJ83/+27ww2VdnUwAAAABJRU5ErkJggg=='
  })
  drawStyle = new ol.style.Style({
    fill: fill,
    stroke: stroke,
    image: icon
  });

  // 绘制好的标绘符号，添加到FeatureOverlay显示。
  drawOverlay = new ol.layer.Vector({
    source: new ol.source.Vector()
  });
  drawOverlay.setStyle(drawStyle);
  drawOverlay.setMap(map);

  // 绘制结束后，添加到FeatureOverlay显示。
  function onDrawEnd (event) {
    var feature = event.feature;
    // 开始编辑
    plotEdit.activate(feature);
    drawOverlay.getSource().addFeature(feature);
  }

  // 指定标绘类型，开始绘制。
  function activate (type) {
    plotEdit.deactivate();
    plotDraw.activate(type);
  }
</script>
</body>
</html>

其他示例请参看example文件夹

#### plotDraw Methods

##### `active()`

> 激活标绘工具

##### `deactivate()`

> 结束标绘

##### `setMap(map)`

> 设置当前地图实例

###### Parameters:

| key | type | desc |
| :--- | :--- | :---------- |
| `map` | `ol.Map` | 地图实例 |


#### plotEdit Methods

##### `active()`

> 激活标绘编辑工具

##### `deactivate()`

> 结束编辑

##### `setMap(map)`

> 设置当前地图实例

###### Parameters:

| key | type | desc |
| :--- | :--- | :---------- |
| `map` | `ol.Map` | 地图实例 |
