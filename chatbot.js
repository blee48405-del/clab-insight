/**
 * CLAB 챗봇 위젯
 * - 우하단에 플로팅 버튼으로 표시
 * - 사용자 입력을 Google Apps Script → Google Sheets로 전송
 *
 * 사용법:
 *   1. 아래 APPS_SCRIPT_URL에 배포된 Google Apps Script 웹앱 URL을 입력하세요.
 *   2. <script src="chatbot.js"></script> 를 </body> 앞에 추가하세요.
 */

(function () {
  'use strict';

  // ▼ 여기에 Google Apps Script 배포 URL을 입력하세요
  const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_DEPLOYMENT_URL';

  // ──────────────────────────────────────────────
  // 스타일 주입
  // ──────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    /* 챗봇 토글 버튼 */
    #clab-chat-toggle {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9999;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #FF5C35;
      color: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(255,92,53,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #clab-chat-toggle:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(255,92,53,0.55);
    }
    #clab-chat-toggle .chat-icon-open  { display: flex; }
    #clab-chat-toggle .chat-icon-close { display: none; }
    #clab-chat-toggle.open .chat-icon-open  { display: none; }
    #clab-chat-toggle.open .chat-icon-close { display: flex; }

    /* 알림 뱃지 */
    #clab-chat-badge {
      position: fixed;
      bottom: 72px;
      right: 26px;
      z-index: 10000;
      background: #fff;
      color: #FF5C35;
      font-size: 12px;
      font-weight: 700;
      border-radius: 12px;
      padding: 3px 9px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      pointer-events: none;
      opacity: 1;
      transition: opacity 0.4s;
    }
    #clab-chat-badge.hidden { opacity: 0; }

    /* 챗 패널 */
    #clab-chat-panel {
      position: fixed;
      bottom: 96px;
      right: 28px;
      z-index: 9998;
      width: 360px;
      max-height: 560px;
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.92) translateY(12px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s cubic-bezier(.4,0,.2,1), opacity 0.25s;
    }
    #clab-chat-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }
    @media (max-width: 420px) {
      #clab-chat-panel {
        right: 8px;
        left: 8px;
        width: auto;
        bottom: 88px;
      }
      #clab-chat-toggle { bottom: 16px; right: 16px; }
      #clab-chat-badge  { bottom: 60px; right: 14px; }
    }

    /* 패널 헤더 */
    .clab-chat-header {
      background: #FF5C35;
      color: #fff;
      padding: 18px 20px 14px;
      flex-shrink: 0;
    }
    .clab-chat-header h3 {
      margin: 0 0 2px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    .clab-chat-header p {
      margin: 0;
      font-size: 12px;
      opacity: 0.85;
    }

    /* 메시지 영역 */
    .clab-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 16px 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .clab-msg {
      max-width: 82%;
      font-size: 14px;
      line-height: 1.55;
      padding: 10px 14px;
      border-radius: 14px;
      word-break: break-word;
    }
    .clab-msg.bot {
      background: #f5f5f5;
      color: #222;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .clab-msg.user {
      background: #FF5C35;
      color: #fff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .clab-msg.system {
      background: #fff3f0;
      color: #FF5C35;
      font-size: 12px;
      align-self: center;
      text-align: center;
      border-radius: 10px;
      padding: 6px 12px;
    }

    /* 입력 영역 */
    .clab-chat-footer {
      border-top: 1px solid #ebebeb;
      padding: 12px 14px;
      flex-shrink: 0;
    }
    .clab-input-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }
    .clab-chat-input {
      flex: 1;
      resize: none;
      border: 1px solid #ddd;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 14px;
      font-family: 'Noto Sans KR', -apple-system, sans-serif;
      line-height: 1.4;
      outline: none;
      transition: border-color 0.15s;
      max-height: 100px;
      min-height: 42px;
    }
    .clab-chat-input:focus { border-color: #FF5C35; }
    .clab-chat-send {
      flex-shrink: 0;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #FF5C35;
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.15s;
    }
    .clab-chat-send:hover { opacity: 0.85; }
    .clab-chat-send:disabled { opacity: 0.45; cursor: default; }
    .clab-name-input {
      width: 100%;
      border: 1px solid #ddd;
      border-radius: 12px;
      padding: 8px 14px;
      font-size: 13px;
      font-family: 'Noto Sans KR', -apple-system, sans-serif;
      outline: none;
      margin-bottom: 8px;
      transition: border-color 0.15s;
    }
    .clab-name-input:focus { border-color: #FF5C35; }
    .clab-privacy {
      font-size: 11px;
      color: #bbb;
      text-align: center;
      margin-top: 6px;
    }

    /* 로딩 점 */
    .clab-typing {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 10px 14px;
      background: #f5f5f5;
      border-radius: 14px;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
    }
    .clab-typing span {
      width: 6px;
      height: 6px;
      background: #bbb;
      border-radius: 50%;
      animation: clabDot 1.2s infinite;
    }
    .clab-typing span:nth-child(2) { animation-delay: 0.2s; }
    .clab-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes clabDot {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
      30% { transform: translateY(-4px); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // ──────────────────────────────────────────────
  // DOM 생성
  // ──────────────────────────────────────────────
  const badge = document.createElement('div');
  badge.id = 'clab-chat-badge';
  badge.textContent = '문의하기';

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'clab-chat-toggle';
  toggleBtn.setAttribute('aria-label', '챗봇 열기');
  toggleBtn.innerHTML = `
    <span class="chat-icon-open">💬</span>
    <span class="chat-icon-close">✕</span>
  `;

  const panel = document.createElement('div');
  panel.id = 'clab-chat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'CLAB 문의 챗봇');
  panel.innerHTML = `
    <div class="clab-chat-header">
      <h3>👏 CLAB 문의하기</h3>
      <p>무엇이든 물어보세요. 답변을 드릴게요!</p>
    </div>
    <div class="clab-chat-messages" id="clab-messages"></div>
    <div class="clab-chat-footer">
      <input type="text" class="clab-name-input" id="clab-name" placeholder="이름 (선택)" maxlength="30" />
      <div class="clab-input-row">
        <textarea class="clab-chat-input" id="clab-input" placeholder="메시지를 입력하세요…" rows="1" maxlength="1000"></textarea>
        <button class="clab-chat-send" id="clab-send" aria-label="전송">➤</button>
      </div>
      <div class="clab-privacy">입력 내용은 운영팀에게만 전달됩니다.</div>
    </div>
  `;

  document.body.appendChild(badge);
  document.body.appendChild(toggleBtn);
  document.body.appendChild(panel);

  // ──────────────────────────────────────────────
  // 상태 & 유틸
  // ──────────────────────────────────────────────
  const messagesEl = document.getElementById('clab-messages');
  const inputEl    = document.getElementById('clab-input');
  const sendBtn    = document.getElementById('clab-send');
  const nameEl     = document.getElementById('clab-name');

  let isOpen = false;
  let isSending = false;

  function addMsg(text, role) {
    const div = document.createElement('div');
    div.className = `clab-msg ${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'clab-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    el.id = 'clab-typing-indicator';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() {
    const el = document.getElementById('clab-typing-indicator');
    if (el) el.remove();
  }

  function autoResize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  }

  // ──────────────────────────────────────────────
  // 초기 인사 메시지
  // ──────────────────────────────────────────────
  function initMessages() {
    if (messagesEl.childElementCount === 0) {
      addMsg('안녕하세요! CLAB에 오신 것을 환영합니다 👏\n궁금한 점이나 의견을 남겨주세요. 운영팀이 확인 후 답변드릴게요.', 'bot');
    }
  }

  // ──────────────────────────────────────────────
  // 패널 토글
  // ──────────────────────────────────────────────
  toggleBtn.addEventListener('click', () => {
    isOpen = !isOpen;
    toggleBtn.classList.toggle('open', isOpen);
    panel.classList.toggle('open', isOpen);
    badge.classList.add('hidden');
    if (isOpen) {
      initMessages();
      setTimeout(() => inputEl.focus(), 300);
    }
  });

  // 3초 후 뱃지 표시
  setTimeout(() => {
    if (!isOpen) badge.classList.remove('hidden');
  }, 3000);
  // 처음엔 숨김
  badge.classList.add('hidden');
  setTimeout(() => badge.classList.remove('hidden'), 3000);

  // ──────────────────────────────────────────────
  // 메시지 전송
  // ──────────────────────────────────────────────
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isSending) return;

    const name = nameEl.value.trim() || '익명';
    isSending = true;
    sendBtn.disabled = true;

    addMsg(text, 'user');
    inputEl.value = '';
    inputEl.style.height = 'auto';

    showTyping();

    try {
      const payload = {
        name,
        message: text,
        page: location.href,
        timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      };

      if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_DEPLOYMENT_URL') {
        // URL이 설정되지 않은 경우 — 개발 모드 안내
        await new Promise(r => setTimeout(r, 800));
        hideTyping();
        addMsg('[개발 모드] Apps Script URL이 설정되지 않았습니다.\nchatbot.js 파일의 APPS_SCRIPT_URL을 입력해주세요.', 'system');
      } else {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',           // GAS는 CORS를 지원하지 않으므로 no-cors 사용
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        hideTyping();
        addMsg('메시지가 전달되었습니다! 운영팀이 확인 후 연락드릴게요 😊', 'bot');
      }
    } catch (err) {
      hideTyping();
      addMsg('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'system');
      console.error('[CLAB 챗봇 오류]', err);
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  sendBtn.addEventListener('click', sendMessage);

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  inputEl.addEventListener('input', autoResize);

})();
