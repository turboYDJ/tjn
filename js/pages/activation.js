import MainGame from './main'

export default class ActivationPage {
  constructor(ctx, width, height, disciple) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.unit = Math.min(width, height) / 375
    this.disciple = disciple
    this.touchHandler = null
    
    // 首先初始化基础尺寸
    // 获取系统信息，包括安全区域和菜单按钮位置
    const systemInfo = wx.getSystemInfoSync()
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect()
    this.statusBarHeight = systemInfo.statusBarHeight || 20  // 状态栏高度
    // 计算顶部安全区域，考虑菜单按钮的位置
    this.topSafeArea = Math.max(
      menuButtonInfo.bottom + 10,  // 菜单按钮底部位置加上间距
      this.statusBarHeight + 44    // 状态栏高度加上基础高度
    )
    
    this.headerHeight = 44 * this.unit  // 减小头部高度
    this.inputHeight = 60 * this.unit
    this.avatarSize = 40 * this.unit
    this.padding = 15 * this.unit
    this.fontSize = 16 * this.unit
    this.lineHeight = 25 * this.unit
    
    // 加载背景图片
    this.bgImage = wx.createImage()
    this.bgImage.src = 'images/activation_bg.png'
    
    // 加载孙悟空头像
    this.discipleAvatar = wx.createImage()
    this.discipleAvatar.src = `images/${disciple.id}.png`
    
    // 加载用户头像
    this.userAvatar = wx.createImage()
    this.userAvatar.src = 'images/userhead.png'
    
    // 等待所有图片加载完成
    let loadedImages = 0
    const totalImages = 3  // 增加用户头像
    
    const onImageLoad = () => {
      loadedImages++
      if (loadedImages === totalImages) {
        this.init()
      }
    }
    
    this.bgImage.onload = onImageLoad
    this.discipleAvatar.onload = onImageLoad
    this.userAvatar.onload = onImageLoad

    // 聊天记录
    this.chatHistory = [
      {
        type: 'system',
        content: '你来到了五指山下，看到一只猴子被压在山下...',
        timestamp: Date.now()
      },
      {
        type: 'ai',
        content: '哼！又来了一个凡人？',
        timestamp: Date.now()
      }
    ]

    // 预设的AI回复
    this.mockResponses = [
      {
        keywords: ['你好', '在吗', '打扰'],
        response: '哼！又来了一个凡人，想要揭开这五指山？'
      },
      {
        keywords: ['救你', '帮你', '出来'],
        response: '五百年了，我被压在这五指山下整整五百年了！你真的能帮我？'
      },
      {
        keywords: ['能', '可以', '一定'],
        response: '就凭你？不过...如果你真能帮我离开这里，我就认你做主人！'
      },
      {
        keywords: ['怎么', '如何', '方法'],
        response: '要解开这五指山，需要找到观音菩萨的咒语才行...'
      },
      {
        keywords: ['咒语', '菩萨', '观音'],
        response: '等等！你手上拿的是什么？那个咒语！',
        isLast: true
      }
    ]
    this.conversationStage = 0  // 对话阶段
    this.lastResponse = null    // 上一次的回复

    // 输入框状态
    this.inputActive = false
    this.inputText = ''

    // 返回按钮区域
    this.backBtn = {
      x: 15 * this.unit,
      y: menuButtonInfo.top + (menuButtonInfo.height - 40 * this.unit) / 2,  // 与菜单按钮垂直居中对齐
      width: 60 * this.unit,
      height: 40 * this.unit
    }

    // 添加聊天区域的滚动位置
    this.chatScrollY = 0
    // 每条消息的高度
    this.messageHeight = 60
    // 聊天区域的高度
    this.chatAreaHeight = this.height - this.topSafeArea - this.headerHeight - this.inputHeight

    // 聊天模式
    this.chatMode = 'bubble'   // 默认使用气泡模式
    // 气泡显示时间（毫秒）
    this.bubbleDisplayTime = 5000  // 增加显示时间到5秒
    // 当前显示的气泡消息
    this.activeBubbles = [
      {
        type: 'system',
        content: '你来到了五指山下，看到一只猴子被压在山下...',
        timestamp: Date.now()
      },
      {
        type: 'ai',
        content: '哼！又来了一个凡人？',
        timestamp: Date.now() + 100  // 稍微延迟显示AI回复
      }
    ]

    // 添加模式切换按钮
    this.modeToggleBtn = {
      x: menuButtonInfo.left - (60 * this.unit),  // 在菜单按钮左侧留出足够空间
      y: menuButtonInfo.top + (menuButtonInfo.height - 40 * this.unit) / 2,  // 与菜单按钮垂直居中对齐
      width: 40 * this.unit,
      height: 40 * this.unit
    }

    // 输入区域
    this.inputArea = {
      input: {
        x: 20 * this.unit,
        y: this.height - this.inputHeight + (this.inputHeight - 40 * this.unit) / 2,  // 垂直居中
        width: this.width - 100 * this.unit,
        height: 40 * this.unit
      },
      send: {
        x: this.width - 70 * this.unit,
        y: this.height - this.inputHeight + (this.inputHeight - 40 * this.unit) / 2,  // 垂直居中
        width: 50 * this.unit,
        height: 40 * this.unit
      }
    }
  }

  init() {
    // 确保键盘隐藏
    wx.hideKeyboard()
    wx.offKeyboardInput()
    wx.offKeyboardConfirm()
    
    // 确保清理之前可能存在的事件监听
    if (this.touchHandler) {
      wx.offTouchStart(this.touchHandler)
    }
    if (this.touchMoveHandler) {
      wx.offTouchMove(this.touchMoveHandler)
    }
    if (this.touchStartHandler) {
      wx.offTouchStart(this.touchStartHandler)
    }
    
    this.drawBackground()
    this.drawHeader()
    this.drawChatArea()
    this.drawInputArea()
    this.bindEvents()
  }

  drawBackground() {
    // 绘制背景图片
    this.ctx.drawImage(this.bgImage, 0, 0, this.width, this.height)
    
    // 顶部预留空间
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(0, 0, this.width, 60)

    // 添加暗色遮罩使UI更清晰
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    this.ctx.fillRect(0, 60, this.width, this.height - 60)
  }

  drawHeader() {
    // 绘制顶部栏背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.fillRect(0, 0, this.width, this.topSafeArea)

    // 绘制返回按钮
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = `${this.fontSize}px Arial`
    this.ctx.textAlign = 'center'
    this.ctx.fillText('返回', 
      this.backBtn.x + this.backBtn.width/2, 
      this.backBtn.y + this.backBtn.height/2 + 6)

    // 绘制标题
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = `bold ${this.fontSize * 1.1}px Arial`
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`激活徒弟 - ${this.disciple.name}`, 
      this.width / 2, 
      this.backBtn.y + this.backBtn.height/2 + 6)  // 与按钮文字对齐

    // 绘制模式切换按钮
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.drawRoundRect(
      this.modeToggleBtn.x, 
      this.modeToggleBtn.y,
      this.modeToggleBtn.width, 
      this.modeToggleBtn.height, 
      10
    )
    
    // 绘制按钮文字
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = `${this.fontSize * 0.8}px Arial`
    this.ctx.textAlign = 'center'
    this.ctx.fillText(
      this.chatMode === 'history' ? '气泡' : '历史',
      this.modeToggleBtn.x + this.modeToggleBtn.width/2,
      this.modeToggleBtn.y + this.modeToggleBtn.height/2 + 6
    )
  }

  drawChatArea() {
    if (this.chatMode === 'history') {
      this.drawHistoryMode()
    } else {
      this.drawBubbleMode()
    }
  }

  drawHistoryMode() {
    // 绘制聊天区域背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    const chatY = this.topSafeArea + this.headerHeight
    this.ctx.fillRect(0, chatY, this.width, this.height - chatY - this.inputHeight)

    // 保存当前环境
    this.ctx.save()
    // 设置裁剪区域，只显示聊天区域内的内容
    this.ctx.beginPath()
    this.ctx.rect(0, chatY, this.width, this.height - chatY - this.inputHeight)
    this.ctx.clip()

    // 计算总内容高度
    let totalContentHeight = 0
    this.chatHistory.forEach(chat => {
      if (chat.type === 'system') {
        totalContentHeight += 40  // 系统消息高度
      } else {
        // 计算消息气泡的实际高度
        const lines = this.getWrappedLines(chat.content, this.width * 0.6)
        totalContentHeight += lines.length * 25 + 30 + 20  // 文字高度 + padding + 间距
      }
    })

    const maxScrollY = Math.max(0, totalContentHeight - this.chatAreaHeight)

    // 确保滚动位置在有效范围内
    this.chatScrollY = Math.min(0, Math.max(-maxScrollY, this.chatScrollY))

    // 绘制聊天记录
    let y = 160 + this.chatScrollY  // 从顶部开始显示
    
    // 从第一条消息开始向下绘制
    this.chatHistory.forEach(chat => {
      if (chat.type === 'system') {
        // 系统消息样式
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        this.ctx.font = '14px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(chat.content, this.width / 2, y)
        y += 40  // 系统消息固定高度
      } else if (chat.type === 'ai') {
        // AI消息样式
        const bubbleHeight = this.drawAIMessage(chat.content, y)
        y += bubbleHeight + 20  // 消息高度 + 间距
      } else {
        // 玩家消息样式
        const bubbleHeight = this.drawPlayerMessage(chat.content, y)
        y += bubbleHeight + 20  // 消息高度 + 间距
      }
    })

    // 恢复环境
    this.ctx.restore()
    
    // 绘制滚动条
    this.drawScrollbar()
  }

  drawAIMessage(content, y) {
    // 绘制徒弟头像
    this.ctx.drawImage(this.discipleAvatar, 20, y, 40, 40)
    
    // 添加金色边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(20, y, 40, 40)

    const padding = 15  // 文本框内边距
    const lineHeight = 25  // 行高
    const maxWidth = this.width * 0.6  // 最大宽度

    // 计算文字换行
    const lines = this.getWrappedLines(content, maxWidth)
    const textHeight = lines.length * lineHeight
    const bubbleHeight = textHeight + padding * 2  // 气泡总高度 = 文字高度 + 上下内边距
    
    // 计算气泡宽度
    const textWidth = Math.max(...lines.map(line => this.ctx.measureText(line).width))
    const bubbleWidth = textWidth + padding * 2  // 气泡总宽度 = 文字宽度 + 左右内边距
    
    // 绘制消息气泡
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    const bubbleX = 70  // 气泡起始X坐标
    this.drawMessageBubble(bubbleX, y, bubbleWidth, bubbleHeight, 'left')

    // 绘制消息文本
    this.ctx.fillStyle = '#000000'
    this.ctx.font = '16px Arial'
    this.ctx.textAlign = 'left'
    lines.forEach((line, index) => {
      const textX = bubbleX + padding
      const textY = y + padding + lineHeight * (index + 0.5)
      this.ctx.fillText(line, textX, textY)
    })
    
    return bubbleHeight
  }

  drawPlayerMessage(content, y) {
    // 绘制玩家头像
    this.ctx.drawImage(this.userAvatar, this.width - 60, y, 40, 40)

    const padding = 15  // 文本框内边距
    const lineHeight = 25  // 行高
    const maxWidth = this.width * 0.6  // 最大宽度

    // 计算文字换行
    const lines = this.getWrappedLines(content, maxWidth)
    const textHeight = lines.length * lineHeight
    const bubbleHeight = textHeight + padding * 2  // 气泡总高度 = 文字高度 + 上下内边距
    
    // 计算气泡宽度
    const textWidth = Math.max(...lines.map(line => this.ctx.measureText(line).width))
    const bubbleWidth = textWidth + padding * 2  // 气泡总宽度 = 文字宽度 + 左右内边距
    
    // 绘制消息气泡
    this.ctx.fillStyle = 'rgba(233, 69, 96, 0.9)'
    const bubbleX = this.width - 70 - bubbleWidth  // 气泡起始X坐标
    this.drawMessageBubble(bubbleX, y, bubbleWidth, bubbleHeight, 'right')

    // 绘制消息文本
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '16px Arial'
    this.ctx.textAlign = 'left'
    lines.forEach((line, index) => {
      const textX = bubbleX + padding
      const textY = y + padding + lineHeight * (index + 0.5)
      this.ctx.fillText(line, textX, textY)
    })
    
    return bubbleHeight
  }

  drawMessageBubble(x, y, width, height, align) {
    const bubbleHeight = height

    this.ctx.beginPath()
    if (align === 'left') {
      // 左侧气泡
      this.drawRoundRect(x, y, width, bubbleHeight, 10)
    } else {
      // 右侧气泡
      this.drawRoundRect(x, y, width, bubbleHeight, 10)
    }
    this.ctx.fill()
  }

  drawInputArea() {
    // 绘制输入区域背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.fillRect(0, this.height - 60, this.width, 60)

    // 保存输入区域的点击范围
    this.inputArea = {
      input: {
        x: 20 * this.unit,
        y: this.height - this.inputHeight + (this.inputHeight - 40 * this.unit) / 2,  // 垂直居中
        width: this.width - 100 * this.unit,
        height: 40 * this.unit
      },
      send: {
        x: this.width - 70 * this.unit,
        y: this.height - this.inputHeight + (this.inputHeight - 40 * this.unit) / 2,  // 垂直居中
        width: 50 * this.unit,
        height: 40 * this.unit
      }
    }

    // 绘制输入框
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    this.drawRoundRect(
      this.inputArea.input.x,
      this.inputArea.input.y,
      this.inputArea.input.width,
      this.inputArea.input.height,
      20
    )

    // 绘制发送按钮
    this.ctx.fillStyle = '#e94560'
    this.drawRoundRect(
      this.inputArea.send.x,
      this.inputArea.send.y,
      this.inputArea.send.width,
      this.inputArea.send.height,
      20
    )
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '16px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('发送', this.width - 45, this.height - 25)

    // 绘制输入的文本
    if (this.inputText) {
      this.ctx.fillStyle = '#000000'
      this.ctx.font = '16px Arial'
      this.ctx.textAlign = 'left'
      this.ctx.fillText(this.inputText, 30, this.height - 25)
    }
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
    // 先清理之前可能存在的事件
    if (this.touchHandler) {
      wx.offTouchStart(this.touchHandler)
    }
    if (this.touchMoveHandler) {
      wx.offTouchMove(this.touchMoveHandler)
    }
    if (this.touchStartHandler) {
      wx.offTouchStart(this.touchStartHandler)
    }

    this.touchHandler = (e) => {
      const touch = e.touches[0]
      const x = touch.clientX
      const y = touch.clientY

      // 检查返回按钮点击
      if (this.checkButtonClick(this.backBtn, x, y)) {
        this.goBack()
        return
      }

      // 检查模式切换按钮点击
      if (this.checkButtonClick(this.modeToggleBtn, x, y)) {
        this.toggleChatMode()
        return
      }

      // 检查输入区域点击
      if (this.inputArea) {
        if (this.checkButtonClick(this.inputArea.send, x, y)) {
          this.sendMessage()
        } else if (this.checkButtonClick(this.inputArea.input, x, y)) {
          this.showKeyboard()
        }
      }
    }

    this.touchMoveHandler = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0]
        const deltaY = touch.clientY - this.lastTouchY
        
        // 计算总内容高度
        let totalHeight = 0
        this.chatHistory.forEach(chat => {
          if (chat.type === 'system') {
            totalHeight += 40
          } else {
            const lines = this.getWrappedLines(chat.content, this.width * 0.6)
            totalHeight += lines.length * 25 + 30 + 20
          }
        })
        
        // 计算最大滚动范围
        const maxScrollY = totalHeight - this.chatAreaHeight
        
        // 更新滚动位置
        this.chatScrollY += deltaY
        
        // 限制滚动范围，确保不会滚动过头
        if (this.chatScrollY > 0) {
          this.chatScrollY = 0
        } else if (this.chatScrollY < -maxScrollY) {
          this.chatScrollY = -maxScrollY
        }

        this.render()
        this.lastTouchY = touch.clientY
      }
    }

    this.touchStartHandler = (e) => {
      if (e.touches.length === 1) {
        this.lastTouchY = e.touches[0].clientY
      }
    }

    wx.onTouchStart(this.touchHandler)
    wx.onTouchMove(this.touchMoveHandler)
    wx.onTouchStart(this.touchStartHandler)
  }

  checkButtonClick(btn, x, y) {
    return (
      x >= btn.x && 
      x <= btn.x + btn.width && 
      y >= btn.y && 
      y <= btn.y + btn.height
    )
  }

  handleInputClick(x, y) {
    // 处理输入相关的点击
    if (this.checkButtonClick(this.inputArea.send, x, y)) {
      // 点击发送按钮
      this.sendMessage()
    } else if (this.checkButtonClick(this.inputArea.input, x, y)) {
      // 点击输入框
      this.showKeyboard()
    }
  }

  showKeyboard() {
    this.inputActive = true
    // 先清理之前的键盘事件监听
    wx.offKeyboardInput()
    wx.offKeyboardConfirm()
    
    wx.showKeyboard({
      defaultValue: this.inputText,
      maxLength: 100,
      multiple: false,
      confirmHold: true,
      confirmType: 'send',
      success: () => {
        // 只绑定一次键盘输入事件
        wx.onKeyboardInput(res => {
          this.inputText = res.value
          this.render()
        })
        // 只绑定一次确认事件
        wx.onKeyboardConfirm(res => {
          this.inputText = res.value
          this.sendMessage()
        })
      }
    })
  }

  sendMessage() {
    if (!this.inputText) return
    
    const messageText = this.inputText
    
    const message = {
      type: 'player',
      content: messageText,
      timestamp: Date.now()
    }
    this.chatHistory.push(message)
    
    if (this.chatMode === 'bubble') {
      // 清理旧的气泡
      this.activeBubbles = []
      this.activeBubbles.push(message)
    }

    this.inputText = ''
    wx.hideKeyboard()
    
    // 自动滚动到最新消息
    this.scrollToBottom()
    
    // 处理AI响应
    this.handleAIResponse(messageText)
    
    // 只在最后渲染一次
    this.render()
  }

  scrollToBottom() {
    if (this.chatMode === 'history') {
      // 计算总内容高度
      let totalHeight = 0
      this.chatHistory.forEach(chat => {
        if (chat.type === 'system') {
          totalHeight += 40  // 系统消息高度
        } else {
          // 计算消息气泡的实际高度
          const lines = this.getWrappedLines(chat.content, this.width * 0.6)
          totalHeight += lines.length * 25 + 30 + 20  // 文字高度 + padding + 间距
        }
      })
      
      // 设置滚动位置到底部，确保最后一条消息完全可见
      const maxScrollY = totalHeight - this.chatAreaHeight
      if (maxScrollY > 0) {
        this.chatScrollY = -maxScrollY
      } else {
        this.chatScrollY = 0
      }
    }
  }

  handleAIResponse(playerInput) {
    // 立即选择响应
    let response = this.selectResponse(playerInput)
    
    // 延迟显示AI的回复
    setTimeout(() => {
      if (response) {
        const message = {
          type: 'ai',
          content: response.content,
          timestamp: Date.now()
        }
        this.chatHistory.push(message)
        
        if (this.chatMode === 'bubble') {
          // 清理旧的气泡
          this.activeBubbles = []
          this.activeBubbles.push(message)
        }

        // 自动滚动到最新消息
        this.scrollToBottom()

        if (response.isLast) {
          setTimeout(() => {
            const systemMessage = {
              type: 'system',
              content: '你已获得收服孙悟空的机会！',
              timestamp: Date.now()
            }
            this.chatHistory.push(systemMessage)
            if (this.chatMode === 'bubble') {
              this.activeBubbles.push(systemMessage)
            }
            // 自动滚动到最新消息
            this.scrollToBottom()
            this.showActivateButton = true
          }, 1000)
        }
      } else {
        const defaultMessage = {
          type: 'ai',
          content: this.getDefaultResponse(),
          timestamp: Date.now()
        }
        this.chatHistory.push(defaultMessage)
        if (this.chatMode === 'bubble') {
          this.activeBubbles.push(defaultMessage)
        }
        // 自动滚动到最新消息
        this.scrollToBottom()
      }
      // 统一在最后渲染一次
      this.render()
    }, 500)  // 减少延迟时间
  }

  selectResponse(playerInput) {
    // 如果没有输入，返回null
    if (!playerInput) return null
    
    // 将玩家输入转换为小写以便匹配
    const input = playerInput.toLowerCase()
    
    // 遍历所有可能的回复
    for (let response of this.mockResponses) {
      // 检查是否包含关键词
      if (response.keywords.some(keyword => input.includes(keyword))) {
        // 确保不会重复同一个回复
        if (this.lastResponse !== response.response) {
          this.lastResponse = response.response
          return {
            content: response.response,
            isLast: response.isLast || false
          }
        }
      }
    }
    
    return null
  }

  getDefaultResponse() {
    const defaultResponses = [
      '哼！你在说什么？',
      '不要浪费我的时间！',
      '你到底能不能帮我？',
      '说重点！',
      '这么简单的事情都想不明白吗？'
    ]
    
    // 随机选择一个默认回复
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  drawActivateButton() {
    if (!this.showActivateButton) return
    
    // 绘制激活按钮
    const btnWidth = 150
    const btnHeight = 50
    const btnX = (this.width - btnWidth) / 2
    const btnY = this.height - 100
    
    this.ctx.fillStyle = '#e94560'
    this.drawRoundRect(btnX, btnY, btnWidth, btnHeight, 25)
    
    // 添加金色边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(btnX + 2, btnY + 2, btnWidth - 4, btnHeight - 4)
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 18px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('激活徒弟', this.width / 2, btnY + 32)
    
    // 保存按钮区域
    this.activateBtn = { x: btnX, y: btnY, width: btnWidth, height: btnHeight }
  }

  goBack() {
    // 清理所有事件监听
    if (this.touchHandler) {
      wx.offTouchStart(this.touchHandler)
    }
    if (this.touchMoveHandler) {
      wx.offTouchMove(this.touchMoveHandler)
    }
    if (this.touchStartHandler) {
      wx.offTouchStart(this.touchStartHandler)
    }
    
    // 隐藏键盘
    wx.hideKeyboard()
    wx.offKeyboardInput()
    wx.offKeyboardConfirm()
    
    // 清理定时器
    if (this.renderTimer) {
      clearInterval(this.renderTimer)
      this.renderTimer = null
    }
    
    // 重置状态
    this.touchHandler = null
    this.touchMoveHandler = null
    this.touchStartHandler = null
    this.inputActive = false
    this.inputText = ''
    
    new MainGame(this.ctx, this.width, this.height)
  }

  render() {
    this.drawBackground()
    this.drawHeader()
    this.drawChatArea()
    this.drawInputArea()
    this.drawActivateButton()
  }

  activateDisciple() {
    // 这里添加激活徒弟的逻辑
    this.chatHistory.push({
      type: 'system',
      content: '恭喜！孙悟空已成为你的徒弟！'
    })
    this.showActivateButton = false
    this.render()
    
    // 延迟返回主界面
    setTimeout(() => {
      this.goBack()
    }, 2000)
  }

  drawScrollbar() {
    const totalContentHeight = this.chatHistory.length * this.messageHeight
    if (totalContentHeight <= this.chatAreaHeight) return

    const scrollbarHeight = (this.chatAreaHeight / totalContentHeight) * this.chatAreaHeight
    const scrollbarY = 120 + (-this.chatScrollY / totalContentHeight) * this.chatAreaHeight

    // 绘制滚动条背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    this.ctx.fillRect(this.width - 10, 120, 4, this.chatAreaHeight)

    // 绘制滚动条
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    this.ctx.fillRect(this.width - 10, scrollbarY, 4, scrollbarHeight)
  }

  toggleChatMode() {
    this.chatMode = this.chatMode === 'history' ? 'bubble' : 'history'
    
    // 切换到气泡模式时，更新活跃气泡列表
    if (this.chatMode === 'bubble') {
      // 只显示最后两条消息
      const lastMessages = this.chatHistory.slice(-2)
      this.activeBubbles = lastMessages
    }
    
    // 切换到历史模式时，确保滚动到最新消息
    if (this.chatMode === 'history') {
      this.scrollToBottom()
    }
    
    this.render()
  }

  drawBubbleMode() {
    // 分离系统消息和其他消息
    const systemMessages = this.chatHistory.filter(msg => msg.type === 'system')
    const bubbleMessages = this.activeBubbles.filter(msg => msg.type !== 'system')
    
    // 清理过期的气泡（只清理非系统消息）
    const now = Date.now()
    this.activeBubbles = this.activeBubbles.filter(bubble => 
      bubble.type === 'system' || now - bubble.timestamp < this.bubbleDisplayTime
    )
    
    // 绘制系统消息（固定在顶部）
    let systemY = 160  // 从顶部开始
    systemMessages.forEach(message => {
      this.drawSystemBubble(message.content, 1, systemY)  // 使用不透明度1，保持常显
      systemY += 40  // 系统消息间距较小
    })
    
    // 分离AI消息和玩家消息
    const aiMessages = bubbleMessages.filter(msg => msg.type === 'ai')
    const playerMessages = bubbleMessages.filter(msg => msg.type === 'player')
    
    const centerX = this.width / 2  // 屏幕中心点
    
    // AI消息显示在上半部分
    let aiY = this.height * 0.35  // 稍微调整位置
    aiMessages.forEach(bubble => {
      const timePassed = now - bubble.timestamp
      const opacity = 1 - (timePassed / this.bubbleDisplayTime)
      this.drawAIBubble(bubble.content, opacity, aiY)
      // 计算下一个气泡的位置
      const lines = this.getWrappedLines(bubble.content, this.width * 0.7)
      aiY += lines.length * 25 + 90  // 气泡高度 + 间距
    })
    
    // 玩家消息显示在下半部分
    let playerY = this.height * 0.65  // 稍微调整位置
    playerMessages.forEach(bubble => {
      const timePassed = now - bubble.timestamp
      const opacity = 1 - (timePassed / this.bubbleDisplayTime)
      this.drawPlayerBubble(bubble.content, opacity, playerY)
      // 计算下一个气泡的位置
      const lines = this.getWrappedLines(bubble.content, this.width * 0.7)
      playerY -= lines.length * 25 + 90  // 气泡高度 + 间距
    })
  }

  drawSystemBubble(content, opacity, y) {
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'  // 使用金色背景
    this.drawRoundRect(20, y - 20, this.width - 40, 30, 15)
    this.ctx.font = 'bold 16px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillStyle = '#000000'
    this.ctx.fillText(content, this.width / 2, y)
  }

  drawAIBubble(content, opacity, y) {
    this.ctx.globalAlpha = opacity
    
    const centerX = this.width / 2
    
    // 绘制AI头像
    this.ctx.drawImage(this.discipleAvatar, centerX - 20, y - 50, 40, 40)
    
    // 添加金色边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(centerX - 20, y - 50, 40, 40)
    
    // 绘制气泡
    const maxWidth = this.width * 0.7  // 文字最大宽度
    this.ctx.font = '16px Arial'
    
    // 计算文字换行
    const lines = this.getWrappedLines(content, maxWidth)
    const lineHeight = 25  // 行高
    const bubbleHeight = lines.length * lineHeight + 20  // 气泡高度（文字高度 + 上下padding）
    
    // AI消息居中显示
    const bubbleY = y
    
    // 绘制气泡背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'  // 深色背景
    this.ctx.fillRect(0, bubbleY, this.width, bubbleHeight)  // 全宽背景
    
    // 绘制文字
    this.ctx.fillStyle = '#FFFFFF'  // 白色文字
    this.ctx.textAlign = 'center'
    lines.forEach((line, index) => {
      this.ctx.fillText(line, centerX, bubbleY + 25 + (lineHeight * index))
    })
    
    this.ctx.globalAlpha = 1
  }

  drawPlayerBubble(content, opacity, y) {
    this.ctx.globalAlpha = opacity
    
    const centerX = this.width / 2
    
    // 绘制玩家头像
    this.ctx.drawImage(this.userAvatar, centerX - 20, y + 50, 40, 40)
    
    // 添加边框
    this.ctx.strokeStyle = '#e94560'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(centerX - 20, y + 50, 40, 40)
    
    // 绘制气泡
    const maxWidth = this.width * 0.7  // 文字最大宽度
    this.ctx.font = '16px Arial'
    
    // 计算文字换行
    const lines = this.getWrappedLines(content, maxWidth)
    const lineHeight = 25  // 行高
    const bubbleHeight = lines.length * lineHeight + 20  // 气泡高度（文字高度 + 上下padding）
    
    // 玩家消息居中显示
    const bubbleY = y
    
    // 绘制气泡背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'  // 深色背景
    this.ctx.fillRect(0, bubbleY, this.width, bubbleHeight)  // 全宽背景
    
    // 绘制文字
    this.ctx.fillStyle = '#ffffff'
    this.ctx.textAlign = 'center'
    lines.forEach((line, index) => {
      this.ctx.fillText(line, centerX, bubbleY + 25 + (lineHeight * index))
    })
    
    this.ctx.globalAlpha = 1
  }

  // 添加文字换行方法
  getWrappedLines(text, maxWidth) {
    // 首先按照手动换行符分割
    const paragraphs = text.split('\n')
    const lines = []
    
    // 处理每个段落
    paragraphs.forEach(paragraph => {
      const words = paragraph.split('')
      let currentLine = words[0] || ''
      
      for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = this.ctx.measureText(currentLine + word).width
        
        if (width < maxWidth) {
          currentLine += word
        } else {
          lines.push(currentLine)
          currentLine = word
        }
      }
      
      lines.push(currentLine)  // 添加段落的最后一行
    })
    
    return lines
  }
} 