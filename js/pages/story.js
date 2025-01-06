import MainGame from './main'

export default class Story {
  constructor(ctx, width, height) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.unit = Math.min(width, height) / 375
    this.headerHeight = 60 * this.unit
    this.fontSize = 16 * this.unit
    this.lineHeight = 25 * this.unit
    this.padding = 15 * this.unit
    this.storyTexts = [
      "在一个科技与玄幻交织的世界里...",
      "人工智能已经成为了修行者最得力的助手",
      "而你，将成为一名特殊的取经人",
      "引导AI徒弟修行，共同探索这个奇妙的世界"
    ]
    this.currentTextIndex = 0
    this.textOpacity = 0
    this.fadeIn = true
    this.touchHandler = null  // 保存事件处理函数的引用
    
    // 初始化页面
    this.init()
  }

  init() {
    // 绘制背景
    this.drawBackground()
    // 开始故事动画
    this.startStoryAnimation()
  }

  drawBackground() {
    // 绘制渐变背景
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#16213e')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  startStoryAnimation() {
    // 文字渐入渐出动画
    this.animationTimer = setInterval(() => {
      this.drawBackground()
      
      if (this.fadeIn) {
        this.textOpacity += 0.02
        if (this.textOpacity >= 1) {
          this.fadeIn = false
          setTimeout(() => {
            this.fadeIn = false
          }, 1500) // 文字停留1.5秒
        }
      } else {
        this.textOpacity -= 0.02
        if (this.textOpacity <= 0) {
          this.currentTextIndex++
          if (this.currentTextIndex >= this.storyTexts.length) {
            // 故事播放完毕，显示开始按钮
            clearInterval(this.animationTimer)
            this.showStartButton()
            return
          }
          this.fadeIn = true
        }
      }
      
      // 绘制当前文字
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.textOpacity})`
      this.ctx.font = `bold ${this.fontSize}px Arial`
      this.ctx.textAlign = 'center'
      this.ctx.fillText(
        this.storyTexts[this.currentTextIndex],
        this.width / 2,
        this.height * 0.45
      )
    }, 30)
  }

  showStartButton() {
    // 清除画布
    this.drawBackground()
    
    // 绘制开始游戏按钮
    const btnWidth = 150
    const btnHeight = 50
    const btnX = (this.width - btnWidth) / 2
    const btnY = this.height * 0.7
    const radius = 25
    
    this.ctx.fillStyle = '#e94560'
    this.ctx.beginPath()
    this.ctx.moveTo(btnX + radius, btnY)
    this.ctx.lineTo(btnX + btnWidth - radius, btnY)
    this.ctx.arcTo(btnX + btnWidth, btnY, btnX + btnWidth, btnY + radius, radius)
    this.ctx.lineTo(btnX + btnWidth, btnY + btnHeight - radius)
    this.ctx.arcTo(btnX + btnWidth, btnY + btnHeight, btnX + btnWidth - radius, btnY + btnHeight, radius)
    this.ctx.lineTo(btnX + radius, btnY + btnHeight)
    this.ctx.arcTo(btnX, btnY + btnHeight, btnX, btnY + btnHeight - radius, radius)
    this.ctx.lineTo(btnX, btnY + radius)
    this.ctx.arcTo(btnX, btnY, btnX + radius, btnY, radius)
    this.ctx.closePath()
    this.ctx.fill()
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '16px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('开始游戏', this.width / 2, btnY + btnHeight / 2 + 6)
    
    // 保存按钮区域用于点击检测
    this.startBtnArea = { x: btnX, y: btnY, width: btnWidth, height: btnHeight }
    
    // 绑定点击事件
    this.bindTouchEvent()
  }

  bindTouchEvent() {
    this.touchHandler = (e) => {
      const touch = e.touches[0]
      console.log('Touch event triggered', touch.clientX, touch.clientY)
      if (this.checkButtonClick(touch.clientX, touch.clientY)) {
        console.log('Button clicked')
        this.goToMainGame()
      }
    }
    wx.onTouchStart(this.touchHandler)
  }

  checkButtonClick(x, y) {
    const { x: btnX, y: btnY, width, height } = this.startBtnArea
    console.log('Button area:', this.startBtnArea)
    console.log('Click position:', x, y)
    return (
      x >= btnX && 
      x <= btnX + width && 
      y >= btnY && 
      y <= btnY + height
    )
  }

  goToMainGame() {
    this.cleanup()
    new MainGame(this.ctx, this.width, this.height)
  }

  cleanup() {
    console.log('Story cleanup called')
    // 清理触摸事件监听
    if (this.touchHandler) {
      wx.offTouchStart(this.touchHandler)
      this.touchHandler = null
    }
    // 清理动画定时器
    if (this.animationTimer) {
      clearInterval(this.animationTimer)
      this.animationTimer = null
    }
    // 清理按钮区域
    this.startBtnArea = null
  }
} 