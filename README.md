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


其他示例请参看example文件夹

[标绘操作](../../blob/V1.0.0/examples/index.html)

{% raw %}
<link rel="stylesheet" href="./lib/map/HMap.css" type="text/css">
<script src="./lib/map/HMap.js"></script>
<style>
.map {
  width: 100%;
  height: 300px;
}
</style>
<div id="map" class="map"></div>
<script type="text/javascript">
  var Maps = new HMap.Map();
  Maps.initMap('map', {
    view: {
      center: [0, 0],
      enableRotation: true, // 是否允许旋转
      projection: 'EPSG:3857',
      rotation: 0,
      zoom: 5, // resolution
      zoomFactor: 2 // 用于约束分变率的缩放因子（高分辨率设备需要注意）
    },
    logo: {},
    baseLayers: [] // 不传时默认加载OSM地图。
  });
  console.log(Maps);
</script>
{% endraw %}

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
