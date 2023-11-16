class Clock{
    constructor(display, resolution=100){
        this.display = display;
        this.intervalId = null;
        this.resolution = resolution
    }

    start(){
        this.intervalId = setInterval(()=>this.update(), this.resolution);
    }

    update(clock_event){
        const dt = new Date();
        this.display.innerText = dt.toISOString();
    }

}

function set_clock(){
    element  = document.getElementById("clock_mount_point");
    t = new Clock(element, 1);
    t.start();
}

window.addEventListener("load", (ev)=>{
    set_clock();
})