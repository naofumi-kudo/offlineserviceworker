const make_leaflet_map = (mountpoint_name) => {
    const wrapper = document.getElementById(mountpoint_name);
    const map_element = document.createElement('div');
    map_element.id = 'map';
    map_element.style.height='240px';
    wrapper.appendChild(map_element);
    var leaflet_map = L.map(map_element).setView([51.505, -0.09], 13);
    
    leaflet_map.setView([35.384, 139.754], 18);

    L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(leaflet_map);
}