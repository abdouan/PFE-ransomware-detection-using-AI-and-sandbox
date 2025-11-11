document.addEventListener("DOMContentLoaded", () => {
  function safeGet(id) {
    const el = document.getElementById(id);
    if (!el) console.error(`❌ Element with ID '${id}' not found`);
    return el;
  }
safeGet("stopRealtimeBtn")?.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "stopRealtime" }, (res) => {
    if (res?.status === "stopped") {
      loginStatus.style.display = "block";
      loginStatus.style.background = "#330000";
      loginStatus.style.border = "1px solid #ff5555";
      loginStatus.innerHTML = `<p style="color:#ff5555;">🛑 Real-Time Protection Disabled.</p>`;

      //  Hide the stop button again
      const stopBtn = safeGet("stopRealtimeBtn");
      if (stopBtn) stopBtn.style.display = "none";
    } else {
      console.error("❌ Failed to stop real-time protection.");
    }
  });
});


const minimizeBtn = safeGet("minimizeButton");
if (minimizeBtn) {
  minimizeBtn.addEventListener("click", () => {
    window.close(); // Minimizes the popup without stopping background logic
  });
}


const backBtn = document.getElementById("backToModeSelect");
const modeCard = document.getElementById("modeSelectCard"); // The card with Scan Email / Real-Time options

if (backBtn) {
  backBtn.addEventListener("click", () => {
    // Hide email selection
    emailCard.style.display = "none";
    scanButton.style.display = "none";

    // Show scan mode choice again
    if (modeCard) modeCard.style.display = "block";
  });
}


  const loginButton = safeGet("loginButton");
  const infoButton = safeGet("infoButton");
  const supportButton = safeGet("supportButton");
  const themeToggle = safeGet("themeToggle");
  const closeButton = safeGet("closeButton");

  const aboutCard = safeGet("aboutCard");
  const supportCard = safeGet("supportCard");
  const loginCard = safeGet("loginCard");
  const loginStatus = safeGet("loginStatus");

  const emailCard = safeGet("emailSelectCard");
  const scanButton = safeGet("scanButton");

  const dropdownSelected = safeGet("dropdownSelected");
  const dropdownOptions = safeGet("dropdownOptions");

  const modeRealtimeButton = safeGet("modeRealtimeButton");
  const modeEmailButton = safeGet("modeEmailButton");


  let currentPage = 0;
  const pageSize = 10;
  let allEmails = [];
  let globalToken = null;

  loginButton?.addEventListener("click", () => {
    chrome.identity.getAuthToken({ interactive: false }, (cachedToken) => {
      if (cachedToken) {
        chrome.identity.removeCachedAuthToken({ token: cachedToken }, () => {
          startInteractiveLogin();
        });
      } else {
        startInteractiveLogin();
      }
    });
  });

  function startInteractiveLogin() {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        loginStatus.style.display = "block";
        loginStatus.style.background = "#300";
        loginStatus.style.border = "1px solid #ff4c4c";
        loginStatus.innerHTML = `<p style="color:#ff4c4c;">❌ Login failed. Try again.</p>`;
        return;
      }

      globalToken = token;
      loginStatus.style.display = "block";
      loginStatus.style.background = "#002b00";
      loginStatus.style.border = "1px solid #00ff88";
      loginStatus.innerHTML = `<p style="color:#00ff88;">✅ Gmail connected. Ready to scan.</p>`;

      const emails = await fetchPaginatedEmails(token, currentPage);
allEmails = emails;
safeGet("loginCard").style.display = "none";
safeGet("modeSelectCard").style.display = "block";
safeGet("loginStatus").style.display = "none";



    });
  }

  infoButton?.addEventListener("click", () => {
    aboutCard.style.display = aboutCard.style.display === "none" ? "block" : "none";
    supportCard.style.display = "none";
  });

  supportButton?.addEventListener("click", () => {
    supportCard.style.display = supportCard.style.display === "none" ? "block" : "none";
    aboutCard.style.display = "none";
  });

  themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    themeToggle.textContent = document.body.classList.contains("light-theme") ? "☀️" : "🌙";
  });

  closeButton?.addEventListener("click", () => window.close());

  async function fetchPaginatedEmails(token, page) {
    try {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${pageSize}&labelIds=INBOX&q=is:inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const messages = data.messages || [];
      const emails = [];

      for (const msg of messages) {
        const meta = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const metaData = await meta.json();
        const headers = metaData.payload.headers;
        const subject = headers.find(h => h.name === "Subject")?.value;
        const from = headers.find(h => h.name === "From")?.value;
        emails.push({
          id: msg.id,
          subject: subject || "Untitled",
          from: from || ""
        });
      }

      return emails;
    } catch (e) {
      console.error("📩 Failed to fetch emails:", e);
      return [];
    }
  }

  function showEmailSelector(emails) {
    if (!dropdownSelected.dataset.listenerAttached) {
  dropdownSelected.addEventListener("click", () => {
    if (dropdownOptions.childElementCount === 0) {
      dropdownOptions.innerHTML = "<div class='dropdown-option'>No emails available.</div>";
    }
    dropdownOptions.style.display = dropdownOptions.style.display === "none" ? "block" : "none";
  });
  dropdownSelected.dataset.listenerAttached = "true";
}

    emailCard.style.display = "block";
    loginStatus.style.display = "none";
    dropdownOptions.innerHTML = "";

    emails.forEach(email => {
      const item = document.createElement("div");
      item.className = "dropdown-option";
      item.textContent = `"${email.subject}" — ${email.from}`;
      item.dataset.id = email.id;
      dropdownOptions.appendChild(item);
    });

    const loadMore = document.createElement("div");
    loadMore.className = "dropdown-option load-more-in-dropdown";
    loadMore.innerHTML = "🔁 Load More";
    dropdownOptions.appendChild(loadMore);

    dropdownSelected.addEventListener("click", () => {
      dropdownOptions.style.display = dropdownOptions.style.display === "none" ? "block" : "none";
    });

    dropdownOptions.addEventListener("click", async (e) => {
      const target = e.target;
      if (target.classList.contains("load-more-in-dropdown")) {
        currentPage++;
        const nextBatch = await fetchPaginatedEmails(globalToken, currentPage);
        allEmails = allEmails.concat(nextBatch);
        nextBatch.forEach(email => {
          const option = document.createElement("div");
          option.className = "dropdown-option";
          option.textContent = `"${email.subject}" — ${email.from}`;
          option.dataset.id = email.id;
          dropdownOptions.insertBefore(option, loadMore);
        });
      } else if (target.classList.contains("dropdown-option")) {
        dropdownSelected.textContent = target.textContent;
        dropdownSelected.dataset.id = target.dataset.id;
        dropdownOptions.style.display = "none";
        scanButton.style.display = "block";
      }
    });
  }

  const resultCard = document.createElement("div");
  resultCard.className = "card";
  resultCard.id = "resultCard";
  resultCard.style.display = "none";
  document.getElementById("contentArea")?.appendChild(resultCard);

  let currentTarget = null;

  scanButton?.addEventListener("click", async () => {
    const selectedId = dropdownSelected.dataset.id;
    if (!selectedId) return;

    const token = globalToken;
    const data = await fetchEmailContent(token, selectedId);
    if (!data) return;

    currentTarget = data;

    const isTextEmpty = !data.text || data.text.trim().length === 0;
    const hasUrls = Array.isArray(data.urls) && data.urls.length > 0;
    const isFileOnly = isTextEmpty && !hasUrls && (data.has_pdf || data.has_clickable_image);

    if (isFileOnly) {
      resultCard.style.display = "block";
      resultCard.innerHTML = `<h3 style="color:#00f0ff;">🔍 Scan Result</h3>
      <p><strong style="color:#ffaa00;">⚠️ File-only email detected. Skipping models.</strong></p>
      <p><em></em></p>`;
      await sendToSandbox(data);
      return;
    }

    const response = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    showScanResult(result, data);
  });

  async function fetchEmailContent(token, messageId) {
    try {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      let bodyData = extractTextFromPayload(data.payload).trim();
      if (!bodyData || bodyData.length < 5) bodyData = "";

      const urls = [...new Set(bodyData.match(/https?:\/\/[^\s"]+/g) || [])];

      let has_pdf = false;
      function checkForPdf(part) {
        if (!part) return;
        if (part.mimeType === "application/pdf") has_pdf = true;
        if (part.parts) part.parts.forEach(checkForPdf);
      }
      checkForPdf(data.payload);

      const has_clickable_image = /<a[^>]*><img[^>]*><\/a>/i.test(bodyData);

      const result = { text: bodyData, urls, has_pdf, has_clickable_image };
      result.rawMessageId = messageId;
      return result;
    } catch (e) {
      console.error("❌ Failed to fetch full email:", e);
      return null;
    }
  }

  function extractTextFromPayload(payload) {
    if (!payload) return "";
    if (payload.body?.data) {
      try {
        return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } catch {
        return "";
      }
    }
    let result = "";
    if (payload.parts) {
      for (const part of payload.parts) {
        result += extractTextFromPayload(part);
      }
    }
    return result;
  }

  async function sendToSandbox(data) {
  let input = {
    target: data.urls?.[0] || data.text,
    type: data.has_pdf ? "pdf" : "url",
  };

  // Try to extract PDF if exists
  if (data.has_pdf && data.rawMessageId) {
    try {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${data.rawMessageId}?format=full`, {
        headers: { Authorization: `Bearer ${globalToken}` },
      });
      const msgData = await res.json();

      function findPdfPart(part) {
        if (!part) return null;
        if (part.mimeType === "application/pdf" && part.body?.attachmentId) return part;
        if (part.parts) {
          for (let subPart of part.parts) {
            const found = findPdfPart(subPart);
            if (found) return found;
          }
        }
        return null;
      }

      const pdfPart = findPdfPart(msgData.payload);
      if (pdfPart) {
        const attachmentRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${data.rawMessageId}/attachments/${pdfPart.body.attachmentId}`, {
          headers: { Authorization: `Bearer ${globalToken}` },
        });
        const attachmentData = await attachmentRes.json();
        input.file_bytes = attachmentData.data; // ✅ Still base64
      } else {
        console.warn("⚠️ No PDF part found.");
      }
    } catch (e) {
      console.error("❌ Failed to fetch PDF:", e);
    }
  }

  // Fallbacks
  if (!input.target || input.target.trim() === "") {
    if (data.has_pdf) input.target = "PDF_ATTACHMENT";
    else if (data.has_clickable_image) input.target = "CLICKABLE_IMAGE";
  }
  console.log("📨 Sending to sandbox_analyze:", input);


  resultCard.innerHTML = `<p><em>⏳ Awaiting sandbox analysis...</em></p>`;

  const response = await fetch("http://127.0.0.1:8000/sandbox_analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const verdict = await response.json();

  resultCard.style.display = "block";
  resultCard.innerHTML = "";

  const title = document.createElement("h3");
  title.style.color = "#00f0ff";
  title.innerText = "🔍 Sandbox Scan Result";
  resultCard.appendChild(title);

  const verdictText = document.createElement("p");

  let verdictLabel = verdict.label || verdict.verdict || "unknown";
  if (verdictLabel === "1") verdictLabel = "malicious";
  if (verdictLabel === "0") verdictLabel = "benign";

  if (verdictLabel === "malicious") {
    verdictText.innerHTML = "<strong style='color:#ff5555;'>🚨 Threat Detected and Confirmed</strong>";
    resultCard.style.border = "2px solid #ff5555";
  } else if (verdictLabel === "benign") {
    verdictText.innerHTML = "<strong style='color:#00ff88;'>✅ The email is Safe</strong>";
    resultCard.style.border = "2px solid #00ff88";
  } else {
    verdictText.innerHTML = "<strong>⚠️ Unknown verdict.</strong>";
    resultCard.style.border = "2px solid gray";
  }

  resultCard.appendChild(verdictText);
}


  function showScanResult(result, data) {
  resultCard.style.display = "block";
  resultCard.innerHTML = "";

  const title = document.createElement("h3");
  title.style.color = "#00f0ff";
  title.innerText = "🔍 Scan Result";
  resultCard.appendChild(title);

  const verdictText = document.createElement("p");

  let verdict = result.label || result.verdict || "unknown";
  if (verdict === "0") verdict = "benign";
  if (verdict === "1") verdict = "malicious";

  let confidence = result.confidence !== undefined ? (result.confidence * 100).toFixed(2) : null;

  // Verdict display
  if (verdict === "malicious") {
    verdictText.innerHTML = "<strong style='color:#ff5555;'>🚨 Threat Detected!</strong>";
    resultCard.style.border = "2px solid #ff5555";
  } else if (verdict === "benign") {
    verdictText.innerHTML = "<strong style='color:#00ff88;'>✅ Safe</strong>";
    resultCard.style.border = "2px solid #00ff88";
  } else if (verdict === "FileOnly") {
    verdictText.innerHTML = "<strong style='color:#ffaa00;'>⚠️ File-only email detected</strong>";
    resultCard.style.border = "2px solid #ffaa00";
  } else if (result.label === "Uncertain" || result.verdict === "inconclusive") {
    verdictText.innerHTML = "<strong style='color:#ffaa00;'>⚠️ Suspicious</strong>";
    resultCard.style.border = "2px solid #ffaa00";
  } else {
    verdictText.innerHTML = "<strong style='color:#ccc;'>🤔 Unknown</strong>";
  }

  resultCard.appendChild(verdictText);

  if (confidence) {
    // Add fancy progress circle
    const circleContainer = document.createElement("div");
    circleContainer.className = "circle-container";
    circleContainer.innerHTML = `
      <svg class="progress-ring" width="120" height="120">
        <circle class="progress-ring__circle" stroke="url(#gradientStroke)" stroke-width="10" fill="transparent" r="50" cx="60" cy="60"/>
        <defs>
          <linearGradient id="gradientStroke" x1="1" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#00ffcc"/>
            <stop offset="100%" stop-color="#00ff88"/>
          </linearGradient>
        </defs>
      </svg>
      <div class="circle-text">${confidence}%</div>
    `;
    resultCard.appendChild(circleContainer);

    // Animate the stroke
    const circle = circleContainer.querySelector('.progress-ring__circle');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
    const offset = circumference - (confidence / 100) * circumference;
    setTimeout(() => {
      circle.style.strokeDashoffset = offset;
    }, 100);

    // Smooth scroll into view
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Sandbox trigger if needed
  if (result?.next === "sandbox") {
    resultCard.innerHTML += `<p><em>⏳ Awaiting sandbox analysis...</em></p>`;
    sendToSandbox(data);
  }
}
// ===  REAL-TIME SCANNING MODE ===
let realtimeRunning = false;
let lastCheckedMessageIds = new Set();

modeRealtimeButton?.addEventListener("click", () => {
  if (!globalToken) return;

  chrome.runtime.sendMessage({ type: "startRealtime", token: globalToken }, (res) => {
    if (res?.status === "started") {
      loginStatus.style.display = "block";
      loginStatus.style.background = "#002b00";
      loginStatus.style.border = "1px solid #00ff88";
      loginStatus.innerHTML = `<p style="color:#00ff88; font-size: 13px;">🛡️ Real-Time Protection Enabled.</p>`;

      safeGet("stopRealtimeBtn").style.display = "block";
    } else {
      console.error("❌ Failed to start real-time scanning.");
    }
  });
});

modeEmailButton?.addEventListener("click", async () => {
  safeGet("modeSelectCard").style.display = "none";
  emailCard.style.display = "block";

  // 🔄 If emails were already fetched during login, reuse them
  if (allEmails.length > 0) {
    showEmailSelector(allEmails);
  } else {
    // 🔁 Refetch just in case
    const fetched = await fetchPaginatedEmails(globalToken, 0);
    allEmails = fetched;
    showEmailSelector(allEmails);
  }
});






safeGet("modeEmailButton")?.addEventListener("click", () => {
  safeGet("modeSelectCard").style.display = "none";
  showEmailSelector(allEmails);
});


async function checkNewEmails(token) {
  try {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&labelIds=INBOX&q=is:unread`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const messages = data.messages || [];

    for (const msg of messages) {
      if (lastCheckedMessageIds.has(msg.id)) continue;

      lastCheckedMessageIds.add(msg.id);
      if (lastCheckedMessageIds.size > 50) {
  lastCheckedMessageIds = new Set(Array.from(lastCheckedMessageIds).slice(-25));
}

      const content = await fetchEmailContent(token, msg.id);
      if (!content) continue;

      const isTextEmpty = !content.text || content.text.trim().length === 0;
      const hasUrls = Array.isArray(content.urls) && content.urls.length > 0;
      const isFileOnly = isTextEmpty && !hasUrls && (content.has_pdf || content.has_clickable_image);

      if (isFileOnly) continue; // skip sandbox-only stuff

      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      const result = await response.json();
      console.log("🧠 Real-time model result:", result);
      notifyIfThreat(result);
    }
  } catch (e) {
    console.error("🔴 Real-time check failed:", e);
  }
}

function notifyIfThreat(result) {
  let verdict = result.label || result.verdict || "unknown";
  if (verdict === "0") verdict = "benign";
  if (verdict === "1") verdict = "malicious";

  let confidence = result.confidence !== undefined ? (result.confidence * 100).toFixed(2) : null;

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

});

