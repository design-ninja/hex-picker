chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.color) {
        chrome.action.setBadgeBackgroundColor({color: message.color});
        chrome.action.setBadgeText({text: ' '}); // Set text to a space to show the badge.
    }

    if (message.query === "clear_badge") {
        chrome.action.setBadgeText({text: ''}); // Clear the badge
    }
});