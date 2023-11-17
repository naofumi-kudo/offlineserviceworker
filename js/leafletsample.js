const make_leaflet_map = (mountpoint_name) => {
    const wrapper = document.getElementById(mountpoint_name);
    const map_element = document.createElement('div');
    map_element.id = 'map';
    map_element.style.height='180px';
    wrapper.appendChild(map_element);
    var leaflet_map = L.map(map_element).setView([51.505, -0.09], 13);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(leaflet_map);
}