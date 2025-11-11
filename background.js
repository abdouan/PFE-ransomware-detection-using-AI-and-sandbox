let globalToken = null;
let realtimeRunning = false;
let pollingInterval = null;
let lastCheckedMessageIds = new Set();

chrome.storage.local.get(["globalToken", "realtimeRunning"], (data) => {
  if (data.globalToken && data.realtimeRunning) {
    globalToken = data.globalToken;
    realtimeRunning = true;
    console.log("🔄 Restoring real-time scanning state...");
    startPolling();
  }
});

//  Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "startRealtime" && message.token) {
    globalToken = message.token;
    realtimeRunning = true;
    startPolling();
    sendResponse({ status: "started" });
  }

  if (message.type === "stopRealtime") {
    realtimeRunning = false;
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = null;
    sendResponse({ status: "stopped" });
  }
});

//  Start polling Gmail
function startPolling() {
  if (!pollingInterval) {
    pollingInterval = setInterval(() => {
      if (realtimeRunning && globalToken) {
        checkNewEmails(globalToken);
      }
    }, 30000);
    console.log(" Real-time polling started.");
  }
}

//  Check new unread emails
async function checkNewEmails(token) {
  try {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&labelIds=INBOX&q=is:unread", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const messages = data.messages || [];

    for (const msg of messages) {
      if (lastCheckedMessageIds.has(msg.id)) continue;

      lastCheckedMessageIds.add(msg.id);
      const content = await fetchEmailContent(token, msg.id);
      if (!content) continue;

      const isTextEmpty = !content.text || content.text.trim().length === 0;
      const hasUrls = Array.isArray(content.urls) && content.urls.length > 0;
      const isFileOnly = isTextEmpty && !hasUrls && (content.has_pdf || content.has_clickable_image);

      if (isFileOnly) continue;

      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      const result = await response.json();
      notifyIfThreat(result);
    }
  } catch (e) {
    console.error("🔴 Real-time check failed:", e);
  }
}

//  Extract email content
async function fetchEmailContent(token, messageId) {
  try {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    let body = extractText(data.payload).trim();
    if (!body || body.length < 5) body = "";

    const urls = [...new Set(body.match(/https?:\/\/[^\s"]+/g) || [])];

    let has_pdf = false;
    function check(part) {
      if (!part) return;
      if (part.mimeType === "application/pdf") has_pdf = true;
      if (part.parts) part.parts.forEach(check);
    }
    check(data.payload);

    const has_clickable_image = /<a[^>]*><img[^>]*><\/a>/i.test(body);
    return { text: body, urls, has_pdf, has_clickable_image };
  } catch {
    return null;
  }
}

function extractText(payload) {
  if (!payload) return "";
  if (payload.body?.data) {
    try {
      return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return "";
    }
  }
  let res = "";
  if (payload.parts) {
    for (const part of payload.parts) {
      res += extractText(part);
    }
  }
  return res;
}

//  Notification system
function notifyIfThreat(result) {
  let verdict = result.label || result.verdict || "unknown";
  if (verdict === "0") verdict = "benign";
  if (verdict === "1") verdict = "malicious";

  const confidence = result.confidence !== undefined ? (result.confidence * 100).toFixed(2) : null;

  if (verdict === "malicious") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "xenix_ph.png",
      title: "🚨 Malicious Email Detected",
      message: `This email is dangerous! (${confidence || "?"}%)`,
      priority: 2,
    });
  } else if (result.label === "Uncertain" || result.verdict === "inconclusive") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "xenix_ph.png",
      title: "⚠️ Suspicious Email",
      message: `This email might be dangerous. (${confidence || "?"}%)`,
      priority: 1,
    });
  }
}

