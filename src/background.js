
'use strict';

const singletons = [
    'https://dataexplorer.azure.com'
];

let singletonTab = null;

const singletonCb = (tabId, changeInfo, tab) => {
    const windowId = tab.windowId;
    let url = !!tab.url ? tab.url : '';

    // handle "The Great Suspender"
    let tUrl = null;
    try {
        tUrl = new URL(url);
    } catch (e) {
        console.log('ERROR CONSTRUCTING tUrl');
    }
    if (tUrl != null) {
        if (tUrl.origin === "chrome-extension://klbibkeccnjlkjkiokjodocebajanakg" && tUrl.pathname === "/suspended.html") {
            let hashZz = null;
            try {
                hashZz = new URLSearchParams(tUrl.hash);
                let uri = hashZz.get('uri');
                if (uri !== null) {
                    url = uri;
                }
            } catch (e) {
                console.log('ERROR DESTRUCTING hashZz');
            }
        }
    }

    const match = singletons.find(x => url.startsWith(x));
    if (typeof match !== 'undefined') {
        if (singletonTab !== null && tabId !== singletonTab.tabId) {
            console.log('SINGLETON CLASH', tabId, singletonTab);
            try {
                // TODO: this is crapping out because of the second "loading" event
                //   handle this with debouncing or some shit
                chrome.tabs.get(tabId, (t) => {
                    if (typeof t !== "undefined") {
                        chrome.tabs.remove(tabId, () => {
                            if (t.windowId !== singletonTab.windowId) {
                                chrome.windows.update(singletonTab.windowId, {focused: true});
                            }
                            chrome.tabs.update(singletonTab.tabId, {highlighted: true});
                        });
                    }
                });
            } catch (err) {
                console.log('TAB NUKE FAILED', tabId, err);
            }
        } else {
            console.log('SINGLETON UPDATED', tabId);
            singletonTab = {
                tabId: tabId,
                windowId: windowId,
            };
        }
    } else {
        if (singletonTab !== null && tabId === singletonTab.tabId) {
            console.log('SINGLETON NAVIGATE AWAY', tabId);
            singletonTab = {
                tabId: null,
                windowId: null,
            }
        }
    }
    console.log('TAB UPDATED', tabId, changeInfo, tab);
}

const removeCb = (tabId, removeInfo) => {
    if (tabId === singletonTabId) {
        console.log('SINGLETON NUKED', tabId);
        singletonTab = {
            tabId: null,
            windowId: null,
        };
    }
    console.log('TAB REMOVED', tabId, removeInfo);
}

chrome.runtime.onInstalled.addListener(function() {
    chrome.tabs.onUpdated.addListener(singletonCb);
    chrome.tabs.onRemoved.addListener(removeCb);
});
