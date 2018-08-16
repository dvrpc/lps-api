mapboxgl.accessToken = 'pk.eyJ1IjoibW1vbHRhIiwiYSI6ImNqZDBkMDZhYjJ6YzczNHJ4cno5eTcydnMifQ.RJNJ7s7hBfrJITOBZBdcOA'

// my baller custom map that shouldn't be used because its way too noisy but here it is anyways cause it's sick: 'mapbox://styles/mmolta/cjkvf4ev40swv2rmxqlfsiivx'
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/bright-v9',
    attributionControl: true,
    center: [-75.2273, 40.071],
    zoom: 12 // or whatever zoom you want
});

map.fitBounds([[-76.09405517578125, 39.49211914385648], [-74.32525634765625, 40.614734298694216]]);

// helper function to create the hex layers
hex_layer = id => {
    return {
        'id': id,
        'type': 'fill',
        'source': id,
        'paint': {
            /* @TODO: create a schema for colors based on count & update the values of color (and opacity?) accordingly
                    @DOUBLETODO: graduated color scheme based on range of counts returned from api response
                        @TRIPLETODO: color schemes derive color from operator logos        
            */
            'fill-color': '#ef8354',
            'fill-opacity': 1
        }
    }
}

// function to get station sheds hexagons on submit
const form = document.querySelector('#main-form')

fetch('http://localhost:8000/test')
.then(response=>{
    if(response.ok){
        response.json()
        .then(jawn=>{
            jawn.forEach(station=>{
                let option = document.createElement('option')
                option.value = station.station
                option.innerText = station.station
                form[0].appendChild(option)
            })
        })
    }
})
form.onsubmit = e => {
    e.preventDefault()

    // check if a layer exists on the map already & remove it (map.removeSource())
    if (map.getSource('hexBins')) {
        map.removeLayer('hexBins')
        map.removeSource('hexBins')
    }
    let station = e.target[0].value
    let selectedYear = e.target[1].value
    // @NOTE: only works locally, on rbeatty's machine. He holds the keys to the castle. Or just use the dummy data above idc
    fetch(`http://localhost:8000/query?station=${station}&year=${selectedYear}`)
        .then(response => {
            if (response.status == 200) {
                response.json()
                    .then(jawn => {
                        // build your arcgis query parameter while making your db call 
                        let fids = []
                        for (let k in jawn){fids.push(jawn[k].id)}
                        // arcgis call
                        fetch(
                            `https://services1.arcgis.com/LWtWv6q6BJyKidj8/ArcGIS/rest/services/HexBins_StationShed/FeatureServer/0/query?where=&objectIds=${fids}&outFields=FID&outSR=4326&f=pgeojson`
                        ).then(response => {
                            if (response.ok) {
                                response.json().then(hexBins => {
                                    // bind count data to arcgis response
                                    jawn.forEach(count=>{
                                        let features = hexBins.features
                                        for (let i in features){
                                            if (features[i].properties.FID == count.id){
                                                features[i].properties.count = count.count
                                            }
                                        }
                                    })
                                    // throw some honeycombs on the map #saveTheBees
                                    map.addSource('hexBins', {
                                        type: 'geojson',
                                        data: hexBins
                                    })
                
                                    map.addLayer(hex_layer('hexBins'))
                                })
                            }
                        }).catch(error => console.error(error))
                    })
            }
        }).catch(error => console.error(error))



    // assuming the selected year exists for that station --- @TODO: bind stations to years b/c people have no way of knowing which stations had which years surveyed
    // easy to fix once real data is used b/c "I can add a function into the api that will just get a list of stations/years that they can generate from i guess or just have a reference json or something that has the stations and each survey year" -rbeatty
    // if (responseObj) {

    //     // get them ID's
    //     responseObj.forEach(shed => fids.push(shed.id))

    //     fetch(
    //         `https://services1.arcgis.com/LWtWv6q6BJyKidj8/ArcGIS/rest/services/HexBins_StationShed/FeatureServer/0/query?where=&objectIds=${fids}&outSR=4326&f=pgeojson`
    //     ).then(response => {
    //         if (response.ok) {
    //             response.json().then(hexBins => {

    //                 // throw some honeycombs on the map #saveTheBees
    //                 map.addSource('hexBins', {
    //                     type: 'geojson',
    //                     data: hexBins
    //                 })

    //                 map.addLayer(hex_layer('hexBins'))
    //             })
    //         }
    //     }).catch(error => console.error(error))
    // }
}