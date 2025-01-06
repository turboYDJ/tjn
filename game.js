class Game {
  constructor() {
    console.log('Game constructor called')
    // 初始化游戏画布
    this.canvas = wx.createCanvas()
    this.ctx = this.canvas.getContext('2d')
    
    // 获取屏幕尺寸并设置画布
    const { windowWidth, windowHeight } = wx.getSystemInfoSync()
    this.canvas.width = windowWidth
    this.canvas.height = windowHeight
    
    // 启动首页
    const Index = require('./js/pages/main').default
    new Index(this.ctx, windowWidth, windowHeight)
  }
}

// 创建游戏实例
wx.game = new Game()
