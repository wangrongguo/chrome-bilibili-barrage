let isRunning = false;

document.addEventListener('DOMContentLoaded', function() {
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const messagesTextarea = document.getElementById('messages');
  const intervalInput = document.getElementById('interval');
  const statusDiv = document.getElementById('status');
  const messageCountSpan = document.getElementById('messageCount');
  
  // 从storage恢复上次的设置
  chrome.storage.local.get(['messages', 'interval'], function(result) {
    if (result.messages) {
      messagesTextarea.value = result.messages;
      updateMessageCount();
    }
    if (result.interval) {
      intervalInput.value = result.interval;
    }
  });
  
  // 保存设置到storage
  function saveSettings() {
    chrome.storage.local.set({
      messages: messagesTextarea.value,
      interval: intervalInput.value
    });
  }
  
  // 更新消息计数
  function updateMessageCount() {
    const count = messagesTextarea.value.trim().split('\n').filter(msg => msg.trim()).length;
    messageCountSpan.textContent = count;
  }
  
  // 更新界面状态
  function updateUIState(running) {
    isRunning = running;
    startButton.disabled = running;
    stopButton.disabled = !running;
    messagesTextarea.disabled = running;
    intervalInput.disabled = running;
    
    if (running) {
      statusDiv.className = 'status-container running';
      statusDiv.textContent = '当前状态：正在发送';
    } else {
      statusDiv.className = 'status-container stopped';
      statusDiv.textContent = '当前状态：已停止';
    }
  }
  
  messagesTextarea.addEventListener('input', () => {
    updateMessageCount();
    saveSettings();
  });
  
  intervalInput.addEventListener('change', saveSettings);
  
  // 检查当前标签页是否是B站直播页面
  async function checkCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab.url.startsWith('https://live.bilibili.com/');
  }
  
  // 发送ping消息检查content script是否已加载
  async function checkContentScript() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
      return response && response.success;
    } catch (error) {
      console.error('Content script not ready:', error);
      return false;
    }
  }
  
  // 开始发送按钮点击事件
  startButton.addEventListener('click', async function() {
    if (!await checkCurrentTab()) {
      alert('请在B站直播页面使用此功能！');
      return;
    }
    
    const messages = messagesTextarea.value.trim().split('\n').filter(msg => msg.trim());
    if (messages.length === 0) {
      alert('请输入要发送的弹幕内容！');
      return;
    }
    
    const interval = parseInt(intervalInput.value);
    if (interval < 1) {
      alert('发送间隔必须大于等于1秒！');
      return;
    }
    
    const contentScriptReady = await checkContentScript();
    if (!contentScriptReady) {
      alert('请刷新页面后重试！');
      return;
    }
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, {
      action: 'startSending',
      messages: messages,
      interval: interval
    });
    
    updateUIState(true);
  });
  
  // 停止发送按钮点击事件
  stopButton.addEventListener('click', async function() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'stopSending' });
    updateUIState(false);
  });
  
  // 初始化界面状态
  updateUIState(false);
  updateMessageCount();
}); 