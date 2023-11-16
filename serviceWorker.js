// import {CACHE_NAME} from "./config.js" 
const CACHE_NAME = "AnyUniqueStringToIdentifyCache0000015";


// urlsToCacheFirstとurlsToNetworkFirstに入っているものは
// serviceworkerのinstall時（初回ページ開いたとき）にキャッシュする
// それ以外はcurrent_cache_strategyの値による
const urlsToCacheFirst = [
    "./jsoncontent1.json"
]

const urlsToNetworkFirst = [
    // Main HTML file
    "index.html",

    // Service worker (this file)
    "serviceWorker.js",

    // js file
    "./js/clock.js",
    "./js/api.js",
    "./js/windowconsole.js",
    
    // External cdn package
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    // "https://unpkg.com/leaflet@1.9.4/dist/*"
]

// const urlsToSwitchable = [
//     "./jsoncontent2.json"
// ]

// const urlsToCache = [
//     // Main HTML file
//     "index.html",

//     // Service worker (this file)
//     "serviceWorker.js",

//     // js file
//     "./js/clock.js",
//     "./js/api.js",
//     "./js/windowconsole.js",
    
//     // External cdn package
//     "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
//     "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
// ];

// 残したいキャッシュのバージョン(キャッシュ識別子)をこの配列に入れる
// 基本的に現行の1つだけでよい。他は削除される。
const CACHE_KEYS = [
    CACHE_NAME
];

// enumっぽく
const CACHE_STORATEGY = Object.freeze({
    CACHE_FIRST: 0, // まずCacheを探し、なければ通常のfetchをする
    NETWORK_FIRST: 1, // まずfetchし、エラーが返ってくればCacheを探す
})

function sendMessageToAllClients(message, source='serviceworker'){
    console.log(`${source} : ${message}`);
    self.clients.matchAll().then(clients =>
        clients.forEach(client => 
            client.postMessage({
                source: source,
                message : message
            })));
}

var current_cache_storategy = CACHE_STORATEGY.CACHE_FIRST;

// self.addEventListener('updatefound', (ev)=>{
//     try{
//         sendMessageToAllClients('updatefound event', 'serviceworker');
//     }catch(e){
        
//     }
//     console.log('updatefound');
// })

const addAllToCache = async (urls) => {
    const cache = await caches.open(CACHE_NAME);

    let promises = [];
    for(url of urls){
        sendMessageToAllClients('try fetch url via network', 'serviceworker');
        
        const responseFromNetwork = await fetch(url);
        if(responseFromNetwork.ok){
            sendMessageToAllClients('fetch from nw in install success, and cached ' + url, 'serviceworker');
            try{
                promise = await cache.put(url, responseFromNetwork);
            }catch(e){
                console.error(`failed to cache: ${e}`);
            }
            promises.push(promise);
        }else{
            sendMessageToAllClients('[ERROR]fetch from nw in install failed ' + url, 'serviceworker');
        }
    }

    // return Promise.allSettled(promises);
}

self.addEventListener("install", async (ev)=>{
    // ev: ExtensibleEvent
    // イベントの存続期間を延長します。 これは、インストール中 (installing) のワーカーの
    // install (en-US) イベントハンドラー と、アクティブ (active) ワーカーの 
    // activate (en-US) イベントハンドラー で呼び出すためのものです。
    // https://developer.mozilla.org/ja/docs/Web/API/ExtendableEvent

    // このイベントリスナはサービスワーカーのインストール時（ページ表示時）に実行されます
    console.log("service worker install");

    await ev.waitUntil(
        
        addAllToCache(urlsToCacheFirst.concat(urlsToNetworkFirst))

        //   .catch((e)=>{
        //       console.warn("cache open failed");
        //   })
    );

    console.log("service worker install finished");
})



//新しいバージョンのServiceWorkerが有効化されたとき
self.addEventListener('activate', event => {
    console.log('eventwroker activate event');
    event.waitUntil(
        caches.keys().then(keys => {
            // return Promise.all(
            //     keys.filter(key => {
            //         return !CACHE_KEYS.includes(key);
            //     }).map(key => {
            //         // 不要なキャッシュを削除
            //         console.log(`delete key: ${key}`);
            //         return caches.delete(key);
            //     })
            // );

            // すべての()=>{caches.delete(key)}が処理を終えるのを待つために
            // 消す必要があるkeyを消すpromiseに入れて(A)、
            // Promise.allSettled(promises)ですべてのpromiseが完了するのを待つ(B)
            let promises = [];
            keys.forEach(key=>{
                if(!CACHE_KEYS.includes(key)){
                    console.log(`delete key: ${key}`);
                    promises.push(caches.delete(key));// (A)
                }
            });
            return Promise.allSettled(promises);// (B)
        })
    );
});

self.addEventListener('message', (event) => {
    if(event.data.task && event.data.task === 'change_cache_strategy_to'){
        current_cache_storategy = event.data.value;
        let strstrategy = '';
        switch(current_cache_storategy){
            case CACHE_STORATEGY.CACHE_FIRST:
                strstrategy = 'CACHE_FIRST';
                break;
            case CACHE_STORATEGY.NETWORK_FIRST:
                strstrategy = 'NETWORK_FIRST';
                break;
            default:
                strstrategy = 'UNKNOWN';
        }
        sendMessageToAllClients(`current cache storategy: ${strstrategy}`, 'serviceworker message listener');
    }
})

const cacheFirst = async (request)=>{
    const cache = await caches.open(CACHE_NAME);
    
    // キャッシュから取得
    const responseFromCache = await cache.match(request);

    if(responseFromCache){
        sendMessageToAllClients(`cache found from ${CACHE_NAME}, url=${request.url}`, 'serviceworker cacheFirst');
        sendMessageToAllClients("fetch response is from cache: " + request.url, 'serviceworker cacheFirst');
        return responseFromCache;
    }

    sendMessageToAllClients('cache NOT found: ' + request.url, 'serviceworker cacheFirst');

    let responseFromNetwork;
    try{
        responseFromNetwork = await fetch(request);
        // responseはstreamなので、キャッシュ用にはclone()したものを渡さなければならない。
        // さもないと、cache.put()後のresponseは使用できなくなる
        cache.put(request, responseFromNetwork.clone());
        sendMessageToAllClients('fetch response putted in cache: ' + request.url, 'serviceworker cacheFirst');
        sendMessageToAllClients('fetch response is from network: ' + request.url, 'serviceworker cacheFirst');
        return responseFromNetwork;
    }catch(e){
        sendMessageToAllClients('failed to fetch: ' + request.url, 'serviceworker networkFirst');
        throw(e);
    }
    
    
    

    
}

const networkFirst = async (request)=>{

    const cache = await caches.open(CACHE_NAME);


    let responseFromNetwork;
    try{
        responseFromNetwork = await fetch(request);
    }catch(e){
        sendMessageToAllClients('failed to fetch: ' + request.url, 'serviceworker networkFirst')
    }

    // ネットワークから取得成功
    if(responseFromNetwork && responseFromNetwork.ok){
        sendMessageToAllClients('network response success: ' + request.url, 'serviceworker networkFirst');
        // responseはstreamなので、cache用にclone()して渡す
        await cache.put(request.url, responseFromNetwork.clone());
        return responseFromNetwork;
    }

    // ネットワークから取得失敗した場合、cacheから探す
    const responseFromCache = await cache.match(request);
    if(responseFromCache){
        sendMessageToAllClients('request found in cache: ' + request.url, 'serviceworker networkFirst');
        return responseFromCache
    }

    // cacheからも見つからなければ、networkからの失敗responseを返す
    sendMessageToAllClients('networkFirst CANNOT fetch response: ' + request.url, 'serviceworker networkFirst');
    return responseFromNetwork
}

self.addEventListener('fetch', async (event) => {

    console.log(`serviceworker fetch event ${event.request.url}`);
    sendMessageToAllClients(`fetch event: ${event.request.method} ${event.request.url}`, source="serviceworker fetch");
    var logmessage = '';
    logmessage += `serviceworker fetch listener\n`
    logmessage += `navigator.onLine: ${self.navigator.onLine}\n`
    logmessage += `event.request.method: ${event.request.method}\n`
    logmessage += `event.request.url: ${event.request.url}\n`

    let url = new URL(event.request.url);

    if(urlsToCacheFirst.includes(event.request.url)){
        sendMessageToAllClients('fetch event respond cacheFirst');
        event.respondWith(cacheFirst(event.request));
        return;
    }

    if(urlsToNetworkFirst.includes(event.request.url)){
        sendMessageToAllClients('fetch event respond cacheFirst');
        event.respondWith(networkFirst(event.request));
        return;
    }

    if(current_cache_storategy === CACHE_STORATEGY.CACHE_FIRST){
        event.respondWith(cacheFirst(event.request));
    }else{
        event.respondWith(networkFirst(event.request));
    }
    

})


function Util_(dom_element){

    caches.open(CACHE_NAME).then((cache) => {
        cache.keys().then((keys) => {
                keys.forEach((request, index, array) => {
                    // cache.delete(request);
                });
            });
        });
}