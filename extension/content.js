// Smart Notes - AI 对话提取插件
// 支持: DeepSeek, Kimi, ChatGPT, Claude, 豆包, 通义千问, 文心一言, 讯飞星火

(function() {
  // 检测当前平台
  function detectPlatform() {
    const host = location.hostname
    if (host.includes('deepseek')) return 'DeepSeek'
    if (host.includes('kimi') || host.includes('moonshot')) return 'Kimi'
    if (host.includes('chatgpt') || host.includes('openai')) return 'ChatGPT'
    if (host.includes('claude') || host.includes('anthropic')) return 'Claude'
    if (host.includes('doubao') || host.includes('bytedance')) return '豆包'
    if (host.includes('tongyi') || host.includes('aliyun')) return '通义千问'
    if (host.includes('yiyan') || host.includes('baidu')) return '文心一言'
    if (host.includes('xinghuo') || host.includes('xfyun')) return '讯飞星火'
    return '未知平台'
  }

  // 提取对话内容（通用方法）
  function extractConversation() {
    const platform = detectPlatform()
    let messages = []

    // 通用策略：查找所有看起来像对话消息的元素
    // 每个平台使用不同的选择器

    switch(platform) {
      case 'DeepSeek':
        messages = extractDeepSeek()
        break
      case 'Kimi':
        messages = extractKimi()
        break
      case 'ChatGPT':
        messages = extractChatGPT()
        break
      case 'Claude':
        messages = extractClaude()
        break
      case '豆包':
        messages = extractDoubao()
        break
      case '通义千问':
        messages = extractTongyi()
        break
      default:
        messages = extractGeneric()
    }

    if (messages.length === 0) {
      messages = extractGeneric()
    }

    return {
      platform,
      messages,
      text: formatMessages(messages, platform),
      url: location.href
    }
  }

  // DeepSeek
  function extractDeepSeek() {
    const msgs = []
    // DeepSeek 使用 div 标记对话
    document.querySelectorAll('[class*="message"], [class*="chat"]').forEach(el => {
      const text = el.innerText?.trim()
      if (!text || text.length < 10) return
      const isUser = el.querySelector('[class*="user"]') || el.closest('[class*="user"]')
      msgs.push({ role: isUser ? 'user' : 'assistant', text })
    })
    return deduplicate(msgs)
  }

  // Kimi
  function extractKimi() {
    const msgs = []
    document.querySelectorAll('[class*="message"], [class*="segment"]').forEach(el => {
      const text = el.innerText?.trim()
      if (!text || text.length < 10) return
      const isUser = el.querySelector('[class*="user"]') ||
                     el.closest('[class*="user"]') ||
                     el.getAttribute('data-testid')?.includes('user')
      msgs.push({ role: isUser ? 'user' : 'assistant', text })
    })
    return deduplicate(msgs)
  }

  // ChatGPT
  function extractChatGPT() {
    const msgs = []
    document.querySelectorAll('[data-message-author-role]').forEach(el => {
      const role = el.getAttribute('data-message-author-role')
      const text = el.innerText?.trim()
      if (text) msgs.push({ role, text })
    })
    if (msgs.length === 0) {
      document.querySelectorAll('.text-base').forEach(el => {
        const text = el.innerText?.trim()
        if (!text || text.length < 5) return
        const isUser = el.closest('[data-testid*="user"]')
        msgs.push({ role: isUser ? 'user' : 'assistant', text })
      })
    }
    return deduplicate(msgs)
  }

  // Claude
  function extractClaude() {
    const msgs = []
    document.querySelectorAll('[data-testid*="message"], .font-claude-message, .human-turn').forEach(el => {
      const text = el.innerText?.trim()
      if (!text) return
      const isHuman = el.classList.contains('human-turn') ||
                      el.getAttribute('data-testid')?.includes('human')
      msgs.push({ role: isHuman ? 'user' : 'assistant', text })
    })
    return deduplicate(msgs)
  }

  // 豆包
  function extractDoubao() {
    const msgs = []
    document.querySelectorAll('[class*="message"], [class*="chat-item"]').forEach(el => {
      const text = el.innerText?.trim()
      if (!text || text.length < 10) return
      const isUser = el.querySelector('[class*="user"]') || el.classList.toString().includes('user')
      msgs.push({ role: isUser ? 'user' : 'assistant', text })
    })
    return deduplicate(msgs)
  }

  // 通义千问
  function extractTongyi() {
    const msgs = []
    document.querySelectorAll('[class*="message"], [class*="chat-bubble"]').forEach(el => {
      const text = el.innerText?.trim()
      if (!text || text.length < 10) return
      const isUser = el.classList.toString().includes('user') || el.querySelector('[class*="user"]')
      msgs.push({ role: isUser ? 'user' : 'assistant', text })
    })
    return deduplicate(msgs)
  }

  // 通用提取 - 作为兜底方案
  function extractGeneric() {
    const msgs = []
    const allElements = document.querySelectorAll('div, article, section')

    for (const el of allElements) {
      const text = el.innerText?.trim()
      if (!text || text.length < 20) continue
      if (el.children.length > 10) continue // 太多子元素，跳过

      // 检查是否包含"用户/AI"标识
      const classStr = el.className?.toString().toLowerCase() || ''
      const isUser = classStr.includes('user') || classStr.includes('human') || classStr.includes('提问')
      const isAI = classStr.includes('assistant') || classStr.includes('bot') || classStr.includes('ai') || classStr.includes('answer')

      if (isUser || isAI) {
        msgs.push({ role: isUser ? 'user' : 'assistant', text })
      }
    }
    return deduplicate(msgs)
  }

  // 去重
  function deduplicate(msgs) {
    const seen = new Set()
    return msgs.filter(m => {
      const key = m.text.slice(0, 100)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // 格式化为文本
  function formatMessages(messages, platform) {
    if (messages.length === 0) return ''
    return messages.map(m => {
      const label = m.role === 'user' ? '用户' : platform
      return `【${label}】\n${m.text}`
    }).join('\n\n---\n\n')
  }

  // 创建悬浮提取按钮
  function createExtractButton() {
    if (document.getElementById('smartnotes-extract-btn')) return

    const btn = document.createElement('button')
    btn.id = 'smartnotes-extract-btn'
    btn.innerHTML = '📝 提取对话'
    btn.title = '提取当前对话并保存到 Smart Notes'
    btn.onclick = async () => {
      btn.innerHTML = '⏳ 提取中...'
      btn.disabled = true

      try {
        const data = extractConversation()
        if (!data.text) {
          btn.innerHTML = '❌ 未找到对话'
          setTimeout(() => { btn.innerHTML = '📝 提取对话'; btn.disabled = false }, 2000)
          return
        }

        // 发送到 Smart Notes 后端
        const resp = await fetch('http://localhost:3001/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `${data.platform} 对话 - ${new Date().toLocaleDateString('zh-CN')}`,
            original_text: data.text,
            source_url: data.url
          })
        })

        if (resp.ok) {
          btn.innerHTML = '✅ 已保存!'
        } else {
          btn.innerHTML = '❌ 保存失败'
        }
      } catch (err) {
        btn.innerHTML = '❌ 请先启动 Smart Notes'
      }

      setTimeout(() => { btn.innerHTML = '📝 提取对话'; btn.disabled = false }, 2000)
    }

    document.body.appendChild(btn)
  }

  // 页面加载完成后创建按钮
  if (document.readyState === 'complete') {
    createExtractButton()
  } else {
    window.addEventListener('load', createExtractButton)
  }

  // 监听来自 popup 的消息
  chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'extract') {
      const data = extractConversation()
      sendResponse(data)
    }
    return true
  })
})()
