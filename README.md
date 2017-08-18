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
