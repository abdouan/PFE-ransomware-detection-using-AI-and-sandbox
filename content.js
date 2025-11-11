// content.js

function extractEmailLinks() {
    const emailBodies = document.querySelectorAll("div[dir='ltr'], .ii, .a3s");
    let links = [];

    emailBodies.forEach(body => {
        const anchors = body.querySelectorAll("a[href]");
        anchors.forEach(a => {
            links.push(a.href);
        });
    });

    if (links.length > 0) {
        console.log("🕵️ Detected Links:", links);
    } else {
        console.log("No links found in current email.");
    }
}

// Delay to wait for Gmail content to load
setTimeout(() => {
    extractEmailLinks();
}, 3000);
