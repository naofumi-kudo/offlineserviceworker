const CACHE_NAME = "AnyUniqueStringToIdentifyCache0000010";
// import {CACHE_NAME} from "../config.js"

const update_service_worker_status_element = async () => {
    const wrapper = document.getElementById('serviceworker_status');
    while(wrapper.firstChild){
        wrapper.removeChild(wrapper.firstChild);
    }

    const registration = await navigator.serviceWorker.getRegistration();

    const worker_active = registration.active;
    const div_active = document.createElement('div');
    if(worker_active){
        div_active.innerText = '<active> ' + worker_active.scriptURL;
    }else{
        div_active.innerText = '<active> none';
    }
    wrapper.appendChild(div_active)

    const worker_waiting = registration.waiting;
    const div_waiting = document.createElement('div');
    if(worker_waiting){
        div_waiting.innerText = '<waiting> ' + worker_waiting.scriptURL;
    }else{
        div_waiting.innerText = '<waiting> none';
    }
    wrapper.appendChild(div_waiting)
 
}

const try_register_serviceworker = () =>{
    if ('serviceWorker' in navigator) {
        // serviceworker.js はオリジンからの相対URL
        // updateViaCache:noneで、アップデートを毎回サーバーに問い合わせる
        // https://nhiroki.jp/2018/02/15/service-worker-install-and-update-scripts
        navigator.serviceWorker.register('serviceWorker.js',{ updateViaCache: 'none' })
            .then((registration) => {
                if (typeof registration.update == 'function') {
                    registration.update();
                    const button_update = document.getElementById('update_serviceworker_button');
                    if(button_update){
                        button_update.onclick = (ev) => {
                            console.log('serviceworker update');
                            registration.update()
                                .then(()=>{
                                    update_service_worker_status_element();
                                })
                        }
                    }
                    console.log('serviceworker update');
                }
            })
            .then(()=>{
                return update_service_worker_status_element();
            })
            .catch(function (error) {
                console.log("Error Log: " + error);
            });
        // update_service_worker_status_element();
    }
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

function update_serviceworker(ev){

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
    try_register_serviceworker();

    
    
    document.getElementsByName("cache_strategy").forEach(
        r => r.addEventListener("change" ,
            e => changeCacheStrategyTo(parseInt(e.target.value))
        )
    );

    myconsole = new MyConsole(document.getElementById('myconsole'));

    update_network_status();
    myconsole.print("window.onload finished");
})

window.addEventListener('DOMContentLoaded', (ev)=>{
    make_leaflet_map('leafletmap_mount_point');
    update_network_status();
})


function update_network_status(){
    const element = document.getElementById('network_status');
    const ntype = navigator.connection.effectiveType?`(${navigator.connection.effectiveType})`:''
    if(window.navigator.onLine){
        element.innerHTML = "Est. ONLINE " + ntype;
        element.style.color = "green";
    }else{
        element.innerHTML = "Est. OFFLINE " + ntype;
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