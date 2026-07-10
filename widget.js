(function () {
  // Replace this with your deployed Vercel URL once you deploy, e.g.:
  // "https://ai-chatbot-api-yourname.vercel.app/api/chat"
  const API_URL = "https://YOUR-PROJECT-NAME.vercel.app/api/chat";

  const style = document.createElement('style');
  style.textContent = `
    #ehc-chat-bubble {
      position: fixed; bottom: 24px; right: 24px;
      width: 58px; height: 58px; border-radius: 50%;
      background: #14294d;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 6px 20px rgba(20,41,77,0.35);
      z-index: 999999; transition: transform 0.15s ease;
    }
    #ehc-chat-bubble:hover { transform: scale(1.06); }
    #ehc-chat-bubble svg { width: 26px; height: 26px; }

    #ehc-chat-window {
      position: fixed; bottom: 94px; right: 24px;
      width: 350px; max-height: 480px;
      background: #ffffff; border-radius: 18px;
      box-shadow: 0 12px 40px rgba(15,23,42,0.18);
      border: 1px solid #eef0f4;
      display: none; flex-direction: column; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Arial, sans-serif;
      z-index: 999999;
    }
    #ehc-chat-window.open { display: flex; }

    #ehc-chat-header {
      background: #14294d; color: #ffffff;
      padding: 16px 18px; font-weight: 600; font-size: 15px;
      display: flex; justify-content: space-between; align-items: center;
    }
    #ehc-chat-header span.sub {
      display: inline-block; font-weight: 500; font-size: 10.5px;
      color: #cfe0ff; margin-top: 4px; letter-spacing: 0.3px;
      background: rgba(255,255,255,0.12); padding: 2px 8px; border-radius: 20px;
    }
    #ehc-chat-close { cursor: pointer; opacity: 0.75; font-size: 20px; line-height:1; }
    #ehc-chat-close:hover { opacity: 1; }

    #ehc-chat-messages {
      flex: 1; padding: 14px; overflow-y: auto;
      background: #f8f9fb; font-size: 13.5px;
    }
    .ehc-msg { margin-bottom: 10px; max-width: 85%; padding: 9px 13px; border-radius: 14px; line-height:1.45; }
    .ehc-msg.user { background: #14294d; color: white; margin-left: auto; border-bottom-right-radius: 4px; }
    .ehc-msg.bot { background: #ffffff; color: #1e293b; border: 1px solid #e9ecf1; margin-right: auto; border-bottom-left-radius: 4px; }

    #ehc-chat-input-row {
      display: flex; border-top: 1px solid #eef0f4; padding: 10px;
      background: white;
    }
    #ehc-chat-input {
      flex: 1; border: 1px solid #e2e6ee; border-radius: 20px; outline: none;
      font-size: 13.5px; padding: 9px 14px; background: #f8f9fb;
    }
    #ehc-chat-input:focus { border-color: #14294d; }
    #ehc-chat-send {
      background: #14294d; color: #ffffff; border: none; border-radius: 20px;
      padding: 0 16px; font-weight: 600; font-size: 13px; cursor: pointer; margin-left: 8px;
    }
    #ehc-chat-send:hover { opacity: 0.88; }
  `;
  document.head.appendChild(style);

  const bubble = document.createElement('div');
  bubble.id = 'ehc-chat-bubble';
  bubble.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#f4e9c9" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  document.body.appendChild(bubble);

  const win = document.createElement('div');
  win.id = 'ehc-chat-window';
  win.innerHTML = `
    <div id="ehc-chat-header">
      <div>Equity Holding Corp<span class="sub">Ask us anything</span></div>
      <div id="ehc-chat-close">&times;</div>
    </div>
    <div id="ehc-chat-messages">
      <div class="ehc-msg bot">Hi, I'm here to help with questions about our trust services. What would you like to know?</div>
    </div>
    <div id="ehc-chat-input-row">
      <input id="ehc-chat-input" placeholder="Type your question..." />
      <button id="ehc-chat-send">Send</button>
    </div>
  `;
  document.body.appendChild(win);

  bubble.addEventListener('click', () => win.classList.toggle('open'));
  document.getElementById('ehc-chat-close').addEventListener('click', () => win.classList.remove('open'));

  const messagesEl = document.getElementById('ehc-chat-messages');
  const inputEl = document.getElementById('ehc-chat-input');

  function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `ehc-msg ${sender}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage() {
    const question = inputEl.value.trim();
    if (!question) return;
    addMessage(question, 'user');
    inputEl.value = '';
    addMessage('Typing...', 'bot');

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      messagesEl.removeChild(messagesEl.lastChild);
      addMessage(data.answer || "Sorry, something went wrong.", 'bot');
    } catch (e) {
      messagesEl.removeChild(messagesEl.lastChild);
      addMessage("Sorry, I couldn't connect. Please try again later.", 'bot');
    }
  }

  document.getElementById('ehc-chat-send').addEventListener('click', sendMessage);
  inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
})();