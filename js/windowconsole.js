class MyConsole{
    mount_point = null;
    console_wrapper = null;
    show_timestamps = true;
    constructor(mount_point, show_timestamps=true){
        this.mount_point = mount_point;
        this.console_wrapper = document.createElement('div');
        this.console_wrapper.style.display = 'flex';
        this.console_wrapper.style.flexGrow = 1;
        this.console_wrapper.style.flexDirection = 'column';
        this.mount_point.appendChild(this.console_wrapper);
        this.show_timestamps = show_timestamps;
    }
    _buildTS(date){
        const strHour = String(date.getHours()).padStart(2, '0');
        const strMinutes = String(date.getMinutes()).padStart(2, '0');
        const strSeconds = String(date.getSeconds()).padStart(2, '0');
        const strMillis = String(date.getMilliseconds()).padStart(3, '0');
        return `${strHour}:${strMinutes}:${strSeconds}.${strMillis}`;
    }
    print(textable){
        try{
            const line = document.createElement('div');
            line.style.display='flex';
            line.style.flexDirection = 'row';
            let timestamp = '';
            if(this.show_timestamps){
                timestamp = this._buildTS(new Date());
            }
            line.innerHTML = `<div style="fontsize:8pt; color:#aaa">${timestamp}</div><div style="width:20px;"></div><div>${String(textable)}</div>`;
            this.console_wrapper.appendChild(line);
        }catch(e){
            console.log(e);
        }

        this.mount_point.scrollTo(0, this.mount_point.scrollHeight);

        console.log(textable);
    }
    log(textable){
        this.print(textable);
    }
}