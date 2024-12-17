let sendingInterval = null;
let currentIndex = 0;
let messages = [];
let isStopRequested = false;

// 监听消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('收到消息:', request);
  try {
    if (request.action === 'startSending') {
      messages = request.messages;
      console.log('开始发送弹幕, 消息列表:', messages);
      isStopRequested = false;
      startSending(request.interval);
      sendResponse({success: true});
    } else if (request.action === 'stopSending') {
      console.log('停止发送弹幕');
      isStopRequested = true;
      stopSending();
      sendResponse({success: true});
    } else if (request.action === 'ping') {
      console.log('收到ping');
      sendResponse({success: true});
    }
  } catch (error) {
    console.error('处理消息时出错:', error);
    sendResponse({success: false, error: error.message});
  }
  return true;
});

function simulateUserInput(element, text) {
  if (isStopRequested) return;
  
  // 聚焦元素
  element.focus();
  
  // 设置值
  element.value = text;
  
  // 创建输入事件
  const inputEvent = new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: text,
    composed: true
  });
  
  // 触发合成事件（模拟输入法）
  element.dispatchEvent(new Event('compositionstart', { bubbles: true }));
  element.dispatchEvent(new Event('compositionend', { bubbles: true }));
  
  // 触发输入事件
  element.dispatchEvent(inputEvent);
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function startSending(interval) {
  if (sendingInterval) {
    clearInterval(sendingInterval);
  }
  
  currentIndex = 0;
  console.log('设置发送间隔:', interval, '秒');
  
  sendingInterval = setInterval(() => {
    if (isStopRequested) {
      stopSending();
      return;
    }
    
    console.log('尝试发送第', currentIndex + 1, '条消息');
    
    // 使用提供的选择器查找元素
    const chatInput = document.querySelector('textarea.chat-input.border-box');
    const sendButton = document.querySelector('button.bl-button.live-skin-highlight-button-bg.live-skin-button-text.bl-button--primary.bl-button--small');
    
    console.log('DOM元素状态:', {
      chatInput: chatInput ? {
        tagName: chatInput.tagName,
        className: chatInput.className,
        value: chatInput.value,
        placeholder: chatInput.placeholder
      } : null,
      sendButton: sendButton ? {
        tagName: sendButton.tagName,
        className: sendButton.className,
        disabled: sendButton.disabled,
        text: sendButton.textContent
      } : null
    });
    
    if (chatInput && sendButton) {
      const message = messages[currentIndex];
      console.log('当前要发送的消息:', message);
      
      // 模拟真实的用户输入
      simulateUserInput(chatInput, message);
      
      // 等待一段时间让B站的JS检测到输入变化
      const timeoutId = setTimeout(() => {
        if (isStopRequested) {
          clearTimeout(timeoutId);
          return;
        }
        
        console.log('发送按钮状态:', {
          disabled: sendButton.disabled,
          className: sendButton.className
        });
        
        // 检查按钮是否可用
        if (!sendButton.disabled && !sendButton.className.includes('disabled')) {
          console.log('尝试点击发送按钮');
          
          // 创建并触发鼠标事件序列
          ['mousedown', 'mouseup', 'click'].forEach(eventType => {
            if (isStopRequested) return;
            
            const mouseEvent = new MouseEvent(eventType, {
              bubbles: true,
              cancelable: true,
              view: window,
              detail: 1,
              screenX: 0,
              screenY: 0,
              clientX: 0,
              clientY: 0,
              ctrlKey: false,
              altKey: false,
              shiftKey: false,
              metaKey: false,
              button: 0,
              buttons: 1,
              relatedTarget: null
            });
            sendButton.dispatchEvent(mouseEvent);
          });
          
          if (!isStopRequested) {
            // 更新消息索引
            currentIndex = (currentIndex + 1) % messages.length;
            console.log('更新消息索引为:', currentIndex);
            
            // 清空输入框
            setTimeout(() => {
              if (!isStopRequested) {
                chatInput.value = '';
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }, 100);
          }
        } else {
          console.log('发送按钮不可用，可能需要登录或输入有效内容');
        }
      }, 500);
    } else {
      console.log('未找到输入框或发送按钮，请确认是否在直播间页面');
    }
  }, interval * 1000);
}

function stopSending() {
  isStopRequested = true;
  
  if (sendingInterval) {
    clearInterval(sendingInterval);
    sendingInterval = null;
    console.log('已清除发送定时器');
  }
  
  // 清理可能正在进行的输入
  const chatInput = document.querySelector('textarea.chat-input.border-box');
  if (chatInput) {
    chatInput.value = '';
    chatInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  console.log('停止发送完成');
}

// 页面加载完成时输出提示
console.log('B站直播弹幕助手已加载');

// 页面卸载时确保停止发送
window.addEventListener('unload', stopSending);
