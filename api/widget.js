module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.status(200).send(`
(function () {
  const API_URL = "https://aiehc.vercel.app/api/chat";

  const style = document.createElement('style');
  style.textContent = [
    '#ehc-chat-bubble{position:fixed;bottom:24px;right:24px;width:58px;height:58px;border-radius:50%;background:#E07B20;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 20px rgba(224,123,32,0.35);z-index:999999;transition:transform 0.15s ease}',
    '#ehc-chat-bubble:hover{transform:scale(1.06)}',
    '#ehc-chat-bubble svg{width:26px;height:26px}',
    '#ehc-chat-window{position:fixed;bottom:94px;right:24px;width:350px;max-height:480px;background:#fff;border-radius:18px;box-shadow:0 12px 40px rgba(15,23,42,0.18);border:1px solid #eef0f4;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,Arial,sans-serif;z-index:999999}',
    '#ehc-chat-window.open{display:flex}',
    '#ehc-chat-header{background:#E07B20;color:#fff;padding:16px 18px;font-weight:600;font-size:15px;display:flex;justify-content:space-between;align-items:center}',
    '#ehc-chat-header span.sub{display:inline-block;font-weight:500;font-size:10.5px;color:#fff3e0;margin-top:4px;letter-spacing:0.3px;background:rgba(255,255,255,0.12);padding:2px 8px;border-radius:20px}',
    '#ehc-chat-close{cursor:pointer;opacity:0.75;font-size:20px;line-height:1}',
    '#ehc-chat-close:hover{opacity:1}',
    '#ehc-chat-messages{flex:1;padding:14px;overflow-y:auto;background:#f8f9fb;font-size:13.5px}',
    '.ehc-msg{margin-bottom:10px;max-width:85%;padding:9px 13px;border-radius:14px;line-height:1.45}',
    '.ehc-msg.user{background:#E07B20;color:white;margin-left:auto;border-bottom-right-radius:4px}',
    '.ehc-msg.bot{background:#fff;color:#1e293b;border:1px solid #e9ecf1;margin-right:auto;border-bottom-left-radius:4px}',
    '#ehc-chat-input-row{display:flex;border-top:1px solid #eef0f4;padding:10px;background:white}',
    '#ehc-chat-input{flex:1;border:1px solid #e2e6ee;border-radius:20px;outline:none;font-size:13.5px;padding:9px 14px;background:#f8f9fb}',
    '#ehc-chat-input:focus{border-color:#E07B20}',
    '#ehc-chat-send{background:#E07B20;color:#fff;border:none;border-radius:20px;padding:0 16px;font-weight:600;font-size:13px;cursor:pointer;margin-left:8px}',
    '#ehc-chat-send:hover{opacity:0.88}'
  ].join('');
  document.head.appendChild(style);

  const bubble = document.createElement('div');
  bubble.id = 'ehc-chat-bubble';
  bubble.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  document.body.appendChild(bubble);

  const win = document.createElement('div');
  win.id = 'ehc-chat-window';
  win.innerHTML = '<div id="ehc-chat-header"><div>EHC AI Assistant<span class="sub">Ask us anything</span></div>
  document.body.appendChild(win);

  bubble.addEventListener('click', function(){ win.classList.toggle('open'); });
  document.getElementById('ehc-chat-close').addEventListener('click', function(){ win.classList.remove('open'); });

  var messagesEl = document.getElementById('ehc-chat-messages');
  var inputEl = document.getElementById('ehc-chat-input');

  function addMessage(text, sender) {
    var div = document.createElement('div');
    div.className = 'ehc-msg ' + sender;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage() {
    var question = inputEl.value.trim();
    if (!question) return;
    addMessage(question, 'user');
    inputEl.value = '';
    addMessage('Typing...', 'bot');
    try {
      var res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question })
      });
      var data = await res.json();
      messagesEl.removeChild(messagesEl.lastChild);
      addMessage(data.answer || 'Sorry, something went wrong.', 'bot');
    } catch(e) {
      messagesEl.removeChild(messagesEl.lastChild);
      addMessage('Sorry, I could not connect. Please try again later.', 'bot');
    }
  }

  document.getElementById('ehc-chat-send').addEventListener('click', sendMessage);
  inputEl.addEventListener('keypress', function(e){ if(e.key === 'Enter') sendMessage(); });
})();
  `);
};
