// import {CACHE_NAME} from "./config.js" 
const CACHE_NAME = "AnyUniqueStringToIdentifyCache0000038";
const MAP_CACHE_NAME = "MapCache00001";

// urlsToCacheFirstとurlsToNetworkFirstに入っているものは
// serviceworkerのinstall時（初回ページ開いたとき）にキャッシュする
// それ以外はcurrent_cache_strategyの値による
const urlsToCacheFirst = [
    // "./jsoncontents/jsoncontent1.json"
]

const urlsToNetworkFirst = [
    // Main HTML file
    "./index.html",

    // css file
    "./css/main.css",

    // Service worker (this file)
    "./serviceWorker.js",

    // js file
    "./js/main.js",
    "./js/clock.js",
    "./js/api.js",
    "./js/windowconsole.js",

    "./contents/jsoncontent1.json",
    "./contents/jsoncontent2.json",
    
    // External cdn package
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    // "https://unpkg.com/leaflet@1.9.4/dist/*"
]

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
    // console.log(`${source} : ${message}`);
    self.clients.matchAll().then(clients =>
        clients.forEach(client => 
            client.postMessage({
                source: source,
                message : message
            })));
}

var current_cache_storategy = CACHE_STORATEGY.NETWORK_FIRST;

const addAllToCache = async (urls) => {
    const cache = await caches.open(CACHE_NAME);

    // let promises = [];
    for(url of urls){
        // sendMessageToAllClients('try fetch url via network', 'serviceworker');
        let responseFromNetwork = null;
        try{
            responseFromNetwork = await fetch(url);
        }catch(e){
            // nop
        }
        // response.type === "error": 
        //     ネットワークエラーです。 エラーを記述した有益な情報は使用できません。 
        //     レスポンスのステータスは 0 で、ヘッダーは空で不変です。 これは Response.error()
        //     から得られる種類のレスポンスです。
        //
        // response.type === "opaque":
        //     opaque: オリジン間リソースへの "no-cors "リクエストに対するレスポンス。 厳しく制限されています
        // 
        // #############
        //
        // installイベントからのfetchはcorsになるのでstatus:200となり、問題なくキャッシュできる
        //
        // #############

        if(responseFromNetwork && responseFromNetwork.type === "opaque"){
            console.log(`[SW install] no-cors response. cannot put to cache. ${request.url}`);
            continue
        }

        console.log(`[SW install] request to ${url}, response ${responseFromNetwork.status}`);
        if(responseFromNetwork && responseFromNetwork.ok){
            try{
                if(url.startsWith('http')){
                    const text = await responseFromNetwork.clone().text();
                    // console.log(`[SW install] http text ${text}`);
                }
                promise = await cache.put(url, responseFromNetwork);
            }catch(e){
                console.error(`failed to cache: ${e}`, '[SW install]');
            }
            sendMessageToAllClients('fetched from network and chached: ' + url, '[SW install]');
            // promises.push(promise);
        }else{
            if(responseFromNetwork){
                sendMessageToAllClients('nw response error: ' + responseFromNetwork.status + ' ' + url, '[SW install]');
            }else{
                sendMessageToAllClients('nw response is null ' + url, '[SW install]');
            }
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
    console.log("[SW install] service worker install");

    // waitUntilは複数回呼び出すことができる
    await ev.waitUntil(
        addAllToCache(urlsToCacheFirst.concat(urlsToNetworkFirst))
    );
    await ev.waitUntil(self.skipWaiting());

    // const clients = await self.clients.matchAll({includeUncontrolled: true});
    // clients.claim();
    
    console.log("[SW install] service worker install finished");
})



//新しいバージョンのServiceWorkerが有効化されたとき
self.addEventListener('activate', event => {
    sendMessageToAllClients('activate event', '[SW activate]');
    event.waitUntil(
      caches.keys().then(keys => {
        return Promise.all(
          keys.filter(key => {
            return !CACHE_KEYS.includes(key);
          }).map(key => {
            // 不要なキャッシュを削除
            sendMessageToAllClients(`delete cache: ${key}`, '[SW activate]');
            return caches.delete(key);
          })
        );
      })
    );
  });

self.addEventListener('message', async (event) => {
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
    }else if(event.data.task && event.data.task === 'report_cache_key_order'){
        // caches.cache[].keys()がどの順でkeyを返すか知りたい
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        let request_urls = [];
        for(let req of keys){
            request_urls.push(req.url);
        }
        const breakhere = 1;

    }
})

const cacheFirst = async (request)=>{
    const cache = await caches.open(CACHE_NAME);
    
    // キャッシュから取得
    const responseFromCache = await cache.match(request);

    if(responseFromCache){
        sendMessageToAllClients(`cache found. url=${request.url}`, '[SW cacheFirst]');
        return responseFromCache.clone();
    }

    // sendMessageToAllClients('cache NOT found: ' + request.url, 'serviceworker cacheFirst');

    let responseFromNetwork;
    try{
        responseFromNetwork = await fetch(request);
    }catch(e){
        // オフラインの時はfetchが例外を発生させるのでそれをそのまま再送する
        sendMessageToAllClients('failed to fetch, cache nor network unavailable ' + request.url, '[SW cacheFirst]');
        throw(e);
    }

    if(responseFromNetwork && responseFromNetwork.ok){
        // responseはstreamなので、キャッシュ用にはclone()したものを渡さなければならない。
        // さもないと、cache.put()後のresponseは使用できなくなる
        cache.put(request, responseFromNetwork.clone());
        sendMessageToAllClients('cache not found and network success: ' + request.url, '[SW cacheFirst]');
        return responseFromNetwork;
    }else{
        //
        // jsでのリクエストがCross-originでない場合、response.statusが0となり、リクエスト成功/失敗かどうかも
        // 判断できない。
        // https://stackoverflow.com/questions/40182785/why-fetch-return-a-response-with-status-0
        // 
        // leafletではTileLayerの作成時にオプションにcrossOrigin:trueをつける、(https://leafletjs.com/reference.html#tilelayer)
        // 
        // fetch()ではjs側でfetch()実行時にCORSにする必要がある。(サーバーが対応している必要もある)
        //  fetch('https://example.test', {
        //      mode: 'cors,
        //  })
        //
        // CORS modeについて
        // https://qiita.com/ryokkkke/items/79f1d338e141d4b7201b
        // 
        // ↓これは関係なかった
        // 　netword error ??????????????????
        // https://ja.stackoverflow.com/questions/36352/%E3%82%AF%E3%83%AD%E3%82%B9%E3%83%89%E3%83%A1%E3%82%A4%E3%83%B3%E9%80%9A%E4%BF%A1%E3%81%A7http-status-code-%E3%81%8C0;
        if(responseFromNetwork.status === 0){
            console.warn(`[SW cacheFirst] !!!!! Netword Error ??????????? status: ${responseFromNetwork.status} ${responseFromNetwork.statusText}`)
            sendMessageToAllClients(`!!!!! Netword Error ??????????? status: ${responseFromNetwork.status} ${responseFromNetwork.statusText}`, `[SW cacheFirst]`);
            return responseFromNetwork;
        }
        
        return responseFromNetwork;
    }
    
}

const networkFirst = async (request)=>{

    const cache = await caches.open(CACHE_NAME);

    let responseFromNetwork;
    let networkError;
    try{
        responseFromNetwork = await fetch(request);
    }catch(error){
        sendMessageToAllClients(`response error: ${error.message} ${request.url}`, `[SW networkFirst]`);
        networkError = error;
    }

    // ネットワークから取得成功
    if(responseFromNetwork && responseFromNetwork.ok){
        sendMessageToAllClients('network response success: ' + request.url, '[SW networkFirst]');
        // responseはstreamなので、cache用にclone()して渡す
        await cache.put(request.url, responseFromNetwork.clone());
        return responseFromNetwork;
    }

    // ネットワークから取得失敗した場合、cacheから探す
    const responseFromCache = await cache.match(request);
    if(responseFromCache){
        sendMessageToAllClients('request found in cache: ' + request.url, '[SW networkFirst]');
        return responseFromCache.clone();
    }

    // cacheからも見つからなければ、networkからのresponseを返す
    // jsからのリクエストがNO-CORSだった場合はこれになる。serviceworkerにはresponseの内容は見えない
    sendMessageToAllClients('networkFirst CANNOT fetch response: ' + request.url, '[SW networkFirst]');
    return responseFromNetwork;
}

const hasSameUrl = (arrUrl, full_url) => {
    for(let i=0; i<arrUrl.length-1; i++){
        let theUrlString = arrUrl[i];
        let theUrl = null;
        if(theUrlString.match(/https?:\/\//)){
            theUrl = new URL(theUrlString);
        }else{
            // self.registration.scopeは、scopeのフォルダが返ってくる
            // ex, 'https://naofumi-kudo.github.io/offlineserviceworker/'
            theUrl = new URL(theUrlString, self.registration.scope);
        }

        if(theUrl && theUrl.href === full_url){
            return true;
        }
    }
    return false;
}

self.addEventListener('fetch', async (event) => {

    // console.log(`serviceworker fetch event ${event.request.url}`, '[SW fetch]');
    // sendMessageToAllClients(`fetch event: ${event.request.method} ${event.request.url}`, source="[SW fetch]");

    let url = new URL(event.request.url);

    // if(urlsToCacheFirst.includes(event.request.url)){
    if(hasSameUrl(urlsToCacheFirst, event.request.url)){
        // sendMessageToAllClients('fetch event respond cacheFirst');
        event.respondWith(cacheFirst(event.request));
        return;
    }

    // if(urlsToNetworkFirst.includes(event.request.url)){
    if(hasSameUrl(urlsToNetworkFirst, event.request.url)){
        // sendMessageToAllClients('fetch event respond cacheFirst');
        event.respondWith(networkFirst(event.request));
        return;
    }

    if(current_cache_storategy === CACHE_STORATEGY.CACHE_FIRST){
        event.respondWith(cacheFirst(event.request));
    }else{
        event.respondWith(networkFirst(event.request));
    }
    

})


// function Util_(dom_element){

//     caches.open(CACHE_NAME).then((cache) => {
//         cache.keys().then((keys) => {
//                 keys.forEach((request, index, array) => {
//                     // cache.delete(request);
//                 });
//             });
//         });
// }