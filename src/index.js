import './scss/index.scss'
import PlotDraw from './core/PlotDraw'
import PlotEdit from './core/PlotEdit'
class olPlot {
  constructor (map) {
    this.plotDraw = new PlotDraw(map)
    this.plotEdit = new PlotEdit(map)
  }
}

export default olPlot
