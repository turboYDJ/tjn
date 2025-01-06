import ActivationPage from './activation'

export default class MainGame {
  constructor(ctx, width, height) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.unit = Math.min(width, height) / 375
    
    // 调整各种尺寸以适配屏幕
    this.headerHeight = 60 * this.unit
    this.avatarSize = 40 * this.unit
    this.padding = 15 * this.unit
    this.fontSize = 16 * this.unit
    
    this.touchHandler = null  // 保存事件处理函数的引用
    
    // 玩家数据
    this.playerData = {
      avatar: wx.createImage(), // 玩家头像
      scriptures: 0, // 经书数量
    }
    this.playerData.avatar.src = 'images/userhead.png'
    
    // 添加错误处理
    this.playerData.avatar.onerror = () => {
      console.error('用户头像加载失败')
      // 加载失败时使用默认头像
      this.createDefaultAvatar()
      loadedImages++  // 即使失败也要计数，确保能进入init
    }
    
    // 初始化排行榜数据
    this.rankingData = {
      currentTab: 'local',  // 默认显示地区排行
      tabs: [
        { id: 'local', name: '地区排行' },
        { id: 'books', name: '经书排行' },
        { id: 'level', name: '等级排行' }
      ],
      data: {
        local: [
          { rank: 1, name: '玩家1', region: '广州' },
          { rank: 2, name: '玩家2', region: '深圳' },
          { rank: 3, name: '玩家3', region: '北京' },
          { rank: 4, name: '玩家4', region: '上海' },
          { rank: 5, name: '玩家5', region: '成都' }
        ],
        books: [
          { rank: 1, name: '玩家A', books: 100 },
          { rank: 2, name: '玩家B', books: 80 },
          { rank: 3, name: '玩家C', books: 60 },
          { rank: 4, name: '玩家D', books: 40 },
          { rank: 5, name: '玩家E', books: 20 }
        ],
        level: [
          { rank: 1, name: '玩家甲', level: 50 },
          { rank: 2, name: '玩家乙', level: 45 },
          { rank: 3, name: '玩家丙', level: 40 },
          { rank: 4, name: '玩家丁', level: 35 },
          { rank: 5, name: '玩家戊', level: 30 }
        ]
      }
    }
    
    // 排行榜显示状态
    this.showRanking = false
    
    // 徒弟数据
    this.disciples = [
      { id: 'wukong', name: '孙悟空', avatar: wx.createImage(), isActive: true },
      { id: 'bajie', name: '猪八戒', avatar: wx.createImage(), isActive: false },
      { id: 'wujing', name: '沙悟净', avatar: wx.createImage(), isActive: false },
      { id: 'dragon', name: '白龙马', avatar: wx.createImage(), isActive: false }
    ]
    
    // 加载背景图片
    this.bgImage = wx.createImage()
    this.bgImage.src = 'images/main_bg.png'
    
    // 加载所有图片
    let loadedImages = 0
    const totalImages = 6  // 背景 + 玩家头像 + 4个徒弟头像
    
    const onImageLoad = () => {
      loadedImages++
      if (loadedImages === totalImages) {
        this.init()
      }
    }
    
    // 绑定加载事件
    this.bgImage.onload = onImageLoad
    this.playerData.avatar.onload = onImageLoad
    
    // 加载徒弟头像
    this.disciples.forEach(disciple => {
      disciple.avatar.src = `images/${disciple.id}.png`
      disciple.avatar.onload = onImageLoad
    })
  }

  init() {
    // 初始化界面
    this.drawBackground()
    this.drawHeader()
    this.drawDungeonEntrance()
    this.drawDisciplesList()
    // 绑定事件
    this.bindEvents()
  }

  createDefaultAvatar() {
    // 使用红色圆形作为默认头像
    const defaultAvatar = wx.createCanvas()
    const ctx = defaultAvatar.getContext('2d')
    defaultAvatar.width = 60
    defaultAvatar.height = 60
    
    // 绘制圆形头像
    ctx.beginPath()
    ctx.arc(30, 30, 28, 0, Math.PI * 2)
    ctx.fillStyle = '#e94560'
    ctx.fill()
    
    // 添加边框
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 添加用户图标
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(30, 22, 10, 0, Math.PI * 2)  // 头部
    ctx.fill()
    ctx.beginPath()
    ctx.arc(30, 45, 16, Math.PI * 1.2, Math.PI * 1.8)  // 身体
    ctx.fill()
    
    this.playerData.avatar = defaultAvatar
  }

  drawBackground() {
    // 绘制背景图片
    this.ctx.drawImage(this.bgImage, 0, 0, this.width, this.height)
    
    // 添加暗色遮罩使UI更清晰
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  drawHeader() {
    // 绘制玩家信息面板
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.drawRoundRect(10 * this.unit, 70 * this.unit,
                      180 * this.unit, 80 * this.unit, 10)
    
    // 绘制玩家头像
    this.ctx.drawImage(this.playerData.avatar, 
                      20 * this.unit, 80 * this.unit, 
                      60 * this.unit, 60 * this.unit)
    
    // 绘制经书数量
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = `bold ${this.fontSize}px Arial`
    this.ctx.fillText(`经书：${this.playerData.scriptures}`, 
                      90 * this.unit, 110 * this.unit)

    // 绘制排行榜按钮
    // 古风按钮样式
    this.ctx.fillStyle = 'rgba(139, 69, 19, 0.8)'
    this.rankingBtn = {
      x: 20 * this.unit,
      y: 20 * this.unit,
      width: 100 * this.unit,
      height: 40 * this.unit
    }
    this.drawRoundRect(this.rankingBtn.x, this.rankingBtn.y, 
                      this.rankingBtn.width, this.rankingBtn.height, 10)
    // 添加金色边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.strokeRect(this.rankingBtn.x, this.rankingBtn.y, 
                      this.rankingBtn.width, this.rankingBtn.height)
    
    // 绘制排行榜文字
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '16px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('排行榜', this.rankingBtn.x + this.rankingBtn.width / 2, 
                      this.rankingBtn.y + this.rankingBtn.height / 2 + 6)
  }

  drawDungeonEntrance() {
    // 绘制副本入口
    const centerX = this.width / 2
    const centerY = this.height / 2
    
    this.dungeonBtn = {
      x: centerX - 100,
      y: centerY - 50,
      width: 200,
      height: 100
    }
    
    // 绘制古风门户样式
    this.ctx.fillStyle = this.hasActiveDisciple() ? 
      'rgba(220, 20, 60, 0.8)' : 'rgba(102, 102, 102, 0.8)'
    this.drawRoundRect(this.dungeonBtn.x, this.dungeonBtn.y,
                      this.dungeonBtn.width, this.dungeonBtn.height, 15)
    
    // 添加门户装饰
    if (this.hasActiveDisciple()) {
      this.ctx.strokeStyle = '#FFD700'
      this.ctx.lineWidth = 3
      this.ctx.strokeRect(this.dungeonBtn.x + 5, this.dungeonBtn.y + 5,
                         this.dungeonBtn.width - 10, this.dungeonBtn.height - 10)
    }
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.textAlign = 'center'
    this.ctx.font = 'bold 24px Arial'
    this.ctx.fillText('进入副本', centerX, centerY + 10)
    
    if (!this.hasActiveDisciple()) {
      this.ctx.font = '14px Arial'
      this.ctx.fillText('(需要至少激活一个徒弟)', centerX, centerY + 35)
    }
  }

  drawDisciplesList() {
    // 计算底部区域的高度和布局
    const bottomHeight = 120 * this.unit
    const discipleSize = 80 * this.unit
    const gap = (this.width - discipleSize * 4) / 5  // 平均分配间距
    
    // 绘制徒弟列表背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.fillRect(0, this.height - bottomHeight, this.width, bottomHeight)
    
    this.disciples.forEach((disciple, index) => {
      const x = gap + (gap + discipleSize) * index
      const startY = this.height - bottomHeight + (bottomHeight - discipleSize) / 2
      
      // 绘制徒弟头像框
      this.ctx.strokeStyle = disciple.isActive ? '#FFD700' : '#666666'
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(x, startY, discipleSize, discipleSize)
      this.ctx.drawImage(disciple.avatar, x, startY, discipleSize, discipleSize)
      
      if (!disciple.isActive) {
        // 未激活状态显示灰色遮罩
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        this.ctx.fillRect(x, startY, discipleSize, discipleSize)
        // 添加锁定图标
        this.ctx.fillStyle = '#666666'
        this.ctx.beginPath()
        this.ctx.arc(x + discipleSize/2, startY + discipleSize/2, 15 * this.unit, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.fillStyle = '#ffffff'
        this.ctx.font = `${14 * this.unit}px Arial`
        this.ctx.textAlign = 'center'
        this.ctx.fillText('未激活', x + discipleSize/2, startY + discipleSize/2 + 5 * this.unit)
      }
      
      // 保存点击区域
      disciple.clickArea = { x, y: startY, width: discipleSize, height: discipleSize }
      
      // 绘制徒弟名称
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = `${14 * this.unit}px Arial`
      this.ctx.fillText(disciple.name, 
       x + discipleSize/2, 
       startY + discipleSize + 20 * this.unit
      )
    })
  }

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

  bindEvents() {
    this.touchHandler = (e) => {
      const touch = e.touches[0]
      const x = touch.clientX
      const y = touch.clientY
      
      // 如果排行榜显示中，处理排行榜相关点击
      if (this.showRanking) {
        // 检查关闭按钮点击
        if (this.checkButtonClick(this.rankingCloseBtn, x, y)) {
          this.showRanking = false
          this.render()
          return
        }
        
        // 检查标签点击
        this.rankingData.tabs.forEach(tab => {
          if (tab.clickArea && this.checkButtonClick(tab.clickArea, x, y)) {
            this.rankingData.currentTab = tab.id
            this.render()
            return
          }
        })
        return
      }
      
      // 检查排行榜按钮点击
      if (this.checkButtonClick(this.rankingBtn, x, y)) {
        this.toggleRanking()
        return
      }
      
      // 检查副本入口点击
      if (this.checkButtonClick(this.dungeonBtn, x, y)) {
        this.enterDungeon()
        return
      }
      
      // 检查徒弟点击
      this.disciples.forEach(disciple => {
        if (this.checkButtonClick(disciple.clickArea, x, y)) {
          this.onDiscipleClick(disciple)
        }
      })
    }
    wx.onTouchStart(this.touchHandler)
  }

  checkButtonClick(btn, x, y) {
    return (
      x >= btn.x && 
      x <= btn.x + btn.width && 
      y >= btn.y && 
      y <= btn.y + btn.height
    )
  }

  hasActiveDisciple() {
    return this.disciples.some(d => d.isActive)
  }

  toggleRanking() {
    this.showRanking = !this.showRanking
    this.render()
  }

  enterDungeon() {
    if (this.hasActiveDisciple()) {
      // TODO: 实现进入副本逻辑
      console.log('进入副本')
    } else {
      console.log('需要至少激活一个徒弟')
    }
  }

  onDiscipleClick(disciple) {
    if (disciple.isActive) {
      // 跳转到历练界面
      console.log(`进入${disciple.name}的历练界面`)
    } else {
      this.cleanup()
      new ActivationPage(this.ctx, this.width, this.height, disciple)
    }
  }

  // 随机事件系统
  checkRandomEvent() {
    if (this.hasActiveDisciple() && Math.random() < 0.1) { // 10%概率触发
      this.showRandomEvent()
    }
  }

  showRandomEvent() {
    // TODO: 实现随机事件显示逻辑
    console.log('触发随机事件')
  }

  cleanup() {
    console.log('MainGame cleanup called')
    if (this.touchHandler) {
      wx.offTouchStart(this.touchHandler)
      this.touchHandler = null
    }
  }

  drawRanking() {
    if (!this.showRanking) return;

    // 绘制半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.width, this.height)

    // 绘制排行榜面板
    const panelWidth = this.width * 0.9
    const panelHeight = this.height * 0.8
    const panelX = (this.width - panelWidth) / 2
    const panelY = (this.height - panelHeight) / 2

    // 绘制面板背景
    this.ctx.fillStyle = 'rgba(26, 26, 46, 0.95)'
    this.drawRoundRect(panelX, panelY, panelWidth, panelHeight, 20)

    // 绘制金色边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(panelX + 5, panelY + 5, panelWidth - 10, panelHeight - 10)

    // 绘制标题
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 24px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('修仙排行榜', this.width / 2, panelY + 40)

    // 绘制分类标签
    const tabWidth = panelWidth / 3
    const tabY = panelY + 70
    this.rankingData.tabs.forEach((tab, index) => {
      const tabX = panelX + tabWidth * index
      this.ctx.fillStyle = tab.id === this.rankingData.currentTab ? '#e94560' : 'rgba(255, 255, 255, 0.6)'
      this.drawRoundRect(tabX + 10, tabY, tabWidth - 20, 40, 10)
      
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = '16px Arial'
      this.ctx.fillText(tab.name, tabX + tabWidth / 2, tabY + 25)
      
      // 保存标签点击区域
      tab.clickArea = { x: tabX + 10, y: tabY, width: tabWidth - 20, height: 40 }
    })

    // 绘制排行榜内容
    const listY = tabY + 60
    const itemHeight = 50
    const currentList = this.rankingData.data[this.rankingData.currentTab]

    currentList.forEach((item, index) => {
      const itemY = listY + itemHeight * index
      
      // 绘制排名背景
      this.ctx.fillStyle = index % 2 === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'
      this.ctx.fillRect(panelX + 10, itemY, panelWidth - 20, itemHeight)

      // 绘制排名
      this.ctx.fillStyle = index < 3 ? '#FFD700' : '#ffffff'
      this.ctx.font = 'bold 20px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(item.rank, panelX + 50, itemY + 32)

      // 绘制玩家名称
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = '16px Arial'
      this.ctx.textAlign = 'left'
      this.ctx.fillText(item.name, panelX + 100, itemY + 32)

      // 绘制地区/经书数/等级
      this.ctx.textAlign = 'right'
      switch (this.rankingData.currentTab) {
        case 'local':
          this.ctx.fillText(item.region, panelX + panelWidth - 30, itemY + 32)
          break
        case 'books':
          this.ctx.fillText(`${item.books}本`, panelX + panelWidth - 30, itemY + 32)
          break
        case 'level':
          this.ctx.fillText(`${item.level}级`, panelX + panelWidth - 30, itemY + 32)
          break
      }
    })

    // 绘制关闭按钮
    const closeBtn = {
      x: panelX + panelWidth - 40,
      y: panelY + 10,
      width: 30,
      height: 30
    }
    this.ctx.fillStyle = '#e94560'
    this.ctx.beginPath()
    this.ctx.arc(closeBtn.x + 15, closeBtn.y + 15, 15, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 20px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('×', closeBtn.x + 15, closeBtn.y + 22)
    
    // 保存关闭按钮点击区域
    this.rankingCloseBtn = closeBtn
  }

  render() {
    // 绘制基础界面
    this.drawBackground()
    this.drawHeader()
    this.drawDungeonEntrance()
    this.drawDisciplesList()
    
    // 绘制排行榜（如果显示）
    if (this.showRanking) {
      this.drawRanking()
    }
  }
} 