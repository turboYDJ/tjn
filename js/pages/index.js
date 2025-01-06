import Story from './story'

export default class Index {
  constructor(ctx, width, height) {
    console.log('Index constructor called')
    this.ctx = ctx
    this.width = width
    this.height = height
    this.touchHandler = null
    // 计算基础单位，用于适配不同屏幕
    this.unit = Math.min(width, height) / 375

    // 开始按钮区域
    this.startBtn = {
      x: (width - 200 * this.unit) / 2,
      y: height - 150 * this.unit,
      width: 200 * this.unit,
      height: 60 * this.unit
    }
    
    // 初始化页面
    this.init()
  }

  // 添加绘制圆角矩形的方法
  drawRoundRect(x, y, width, height, radius) {
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.arcTo(x + width, y, x + width, y + radius, radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.arcTo(x, y + height, x, y + height - radius, radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.arcTo(x, y, x + radius, y, radius)
    this.ctx.closePath()
    this.ctx.fill()
  }

  init() {
    console.log('Index init called')
    // 绘制背景
    this.drawBackground()
    // 绘制标题
    this.drawTitle()
    // 绘制按钮
    this.drawStartButton()
    // 绑定事件
    this.bindTouchEvent()
  }

  drawBackground() {
    console.log('Drawing background')
    // 使用渐变色背景
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#16213e')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    // 添加暗色遮罩使UI更清晰
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  drawTitle() {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 24px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('AI互动剧情游戏', this.width / 2, this.height * 0.4)
  }

  drawStartButton() {
    // 绘制开始按钮
    this.ctx.fillStyle = '#e94560'
    this.drawRoundRect(this.startBtn.x, this.startBtn.y, 
                      this.startBtn.width, this.startBtn.height, 30)
    
    // 绘制按钮文字
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = `bold ${24 * this.unit}px Arial`
    this.ctx.textAlign = 'center'
    this.ctx.fillText('开始游戏', 
                     this.startBtn.x + this.startBtn.width/2, 
                     this.startBtn.y + this.startBtn.height/2 + 8)
  }

  bindTouchEvent() {
    this.touchHandler = (e) => {
      const touch = e.touches[0]
      if (this.checkButtonClick(touch.clientX, touch.clientY)) {
        this.startLoading()
      }
    }
    wx.onTouchStart(this.touchHandler)
  }

  checkButtonClick(x, y) {
    const { x: btnX, y: btnY, width, height } = this.startBtn
    return (
      x >= btnX && 
      x <= btnX + width && 
      y >= btnY && 
      y <= btnY + height
    )
  }

  startLoading() {
    let progress = 0
    let loadingInterval = null
    loadingInterval = setInterval(() => {
      progress += 3
      this.drawLoadingBar(progress)
      
      if (progress >= 100) {
        clearInterval(loadingInterval)
        setTimeout(() => {
          this.cleanup()
          new Story(this.ctx, this.width, this.height)
        }, 200)
      }
    }, 30)
    this.loadingInterval = loadingInterval
  }

  drawLoadingBar(progress) {
    const barWidth = this.width * 0.8
    const barHeight = 10
    const barX = (this.width - barWidth) / 2
    const barY = this.height * 0.8
    
    // 清除原有进度条和文字区域
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(barX - 2, barY - 30, barWidth + 4, barHeight + 35)
    
    // 进度条背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    this.ctx.fillRect(barX, barY, barWidth, barHeight)
    
    // 进度条
    this.ctx.fillStyle = '#e94560'
    this.ctx.fillRect(barX, barY, barWidth * (progress / 100), barHeight)
    
    // 进度文字
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`正在加载 ${progress}%`, this.width / 2, barY - 10)
  }

  cleanup() {
    if (this.touchHandler) {
      wx.offTouchStart(this.touchHandler)
    }
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval)
    }
  }
} 