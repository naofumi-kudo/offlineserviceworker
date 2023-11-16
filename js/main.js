const CACHE_NAME = "AnyUniqueStringToIdentifyCache000004";
// import {CACHE_NAME} from "../config.js"

if ('serviceWorker' in navigator) {
    // serviceworker.js はオリジンからの相対URL
    navigator.serviceWorker.register('serviceWorker.js')
        .then((registration) => {
                if (typeof registration.update == 'function') {
                    registration.update();
                    console.log('serviceworker update');
                }
            })
        .catch(function (error) {
            console.log("Error Log: " + error);
        });
}

// function onSwitchCacheStorategy(){
//     const swcontroller = this.navigator.serviceWorker.controller;
//     if(!swcontroller){
//         myconsole.print("ServiceWorker controller NOT found");
//     }
//     swcontroller.postMessage({
//         task: 'switch_cache_storategy'
//     });
// }

function changeCacheStrategyTo(value){
    const swcontroller = this.navigator.serviceWorker.controller;
    if(!swcontroller){
        myconsole.print("ServiceWorker controller NOT found");
    }
    swcontroller.postMessage({
        task: 'change_cache_strategy_to',
        value: value
    });
}

async function onfetchjsoncontent(event){
    const wrapper = document.getElementById('fetch_json_content_mount_point');
    while( wrapper.firstChild ){
        wrapper.removeChild( wrapper.firstChild );
    }

    const json1 = await fetch('./contents/jsoncontent1.json');
    const json2 = await fetch('./contents/jsoncontent2.json');
    const json1el = document.createElement('div');
    json1el.innerHTML = json1.ok? await json1.text(): "ERROR:"+json1.status;
    wrapper.appendChild(json1el);

    const json2el = document.createElement('div');
    json2el.innerHTML = json2.ok? await json2.text(): "ERROR:"+json2.status;
    wrapper.appendChild(json2el);

    
}

var myconsole;
try{
    myconsole = new MyConsole(document.getElementById('myconsole'));
}catch(e){
    console.log('failed to create myconsole');
}

window.addEventListener('load', (ev) => {
    update_network_status();
    
    document.getElementsByName("cache_strategy").forEach(
        r => r.addEventListener("change" ,
            e => changeCacheStrategyTo(parseInt(e.target.value))
        )
    );


    myconsole = new MyConsole(document.getElementById('myconsole'));
    myconsole.print("window.onload finished");
})


function update_network_status(){
    const element = document.getElementById('network_status');
    if(window.navigator.onLine){
        element.innerHTML = "ONLINE (navigator.onLine === true)";
        element.style.color = "green";
    }else{
        element.innerHTML = "OFFLINE (navigator.onLine === false)";
        element.style.color = "red";
    }
}

window.addEventListener('online', (ev) => {
    update_network_status();
});
window.addEventListener('offline', (ev) => {
    update_network_status();
})

window.navigator.serviceWorker.addEventListener('message', (ev)=>{
    try{
        myconsole.print(ev.data.source + " : " + ev.data.message);
    }catch(e){
        console.log(ev.data.source + " : " + ev.data.message);
    }
    
});

// function onPrintCacheClick(ev){
//     const printCacheElement = document.getElementById("print_cache_mount_point");
    
//     Util_
//     // f
//     // caches.open(CACHE_NAME).then((cache) => {
//     //     cache.keys().then((keys) => {
//     //             keys.forEach((request, index, array) => {
//     //                 // cache.delete(request);
//     //             });
//     //         });
//     //     });
// }