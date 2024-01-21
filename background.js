chrome.action.onClicked.addListener(tab => {
    chrome.windows.create({
      url: chrome.runtime.getURL("src/index.html"),
      type: "popup",
      height: 400,
      width: 700,
    })
  });