mapboxgl.accessToken = 'pk.eyJ1IjoiYmVhdHR5cmUxIiwiYSI6ImNqOGFpY3o0cTAzcXoycXE4ZTg3d3g5ZGUifQ.VHOvVoTgZ5cRko0NanhtwA'

// my baller custom map that shouldn't be used because its way too noisy but here it is anyways cause it's sick: 'mapbox://styles/mmolta/cjkvf4ev40swv2rmxqlfsiivx'
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/beattyre1/cjhw5mutc17922sl7me19mwc8',
    attributionControl: true,
    center: [-75.2273, 40.071],
    zoom: 12 // or whatever zoom you want
});

map.fitBounds([[-76.09405517578125, 39.49211914385648], [-74.32525634765625, 40.614734298694216]]);


// helper function to ???
Quartile = array =>{
    let quarValues = {
        '0.25': undefined,
        '0.50': undefined,
        '0.75': undefined,
        'max': undefined
    }
    array.sort((a,b)=>{
        return a -b
    })
    let position = parseInt((array.length/4),10)
    if (position == 0){
        let position = 2
    }

    let max = Math.max.apply(null, array)
    // let min = Math.min.apply(null, array)
    // let interval = (max - min)/4
    cnt = 1
    for (q in quarValues){
        let index = position*cnt
        cnt == 4 ? quarValues[q] = max : quarValues[q] = array[index]
        cnt ++
    }
    console.log(array)
    return quarValues
}
// helper function to create the hex layers
hex_layer = (id, quartiles) => {
    console.log({quartiles})
    return {
        'id': id,
        'type': 'fill',
        'source': id,
        'paint': {
            /* @TODO: create a schema for colors based on count & update the values of color (and opacity?) accordingly
                    @DOUBLETODO: graduated color scheme based on range of counts returned from api response
                        @TRIPLETODO: color schemes derive color from operator logos        
            */
            'fill-color': {
                property : 'count',
                type: 'interval',
                stops: [
                    [0, '#8DE682'],
                    [quartiles['0.25'], '#8DE682'],
                    [quartiles['0.50'], '#00CAA2'],
                    [quartiles['max'],  '#005B9C']
                ]
            },
            'fill-outline-color': '#fff'
        }
    }
}

// function to get station sheds hexagons on submit
const form = document.querySelector('#main-form')

// populate dropdowns with possible query values
    // @NOTE: only works locally, on rbeatty's machine. He holds the keys to the castle.
fetch('http://localhost:8000/test')
    .then(response => {
        if (response.ok) {
            response.json()
                .then(jawn => {
                    // listener to populate year dropdown with valid values based on db on station change
                    form[0].addEventListener('change', e => {
                        // remove any artifacts
                        while (form[1].firstChild) {
                            form[1].removeChild(form[1].firstChild)
                        }
                        // get the new station value
                        let station = e.target.value
                        // loop through response, grab the years that are associated with the new station value and create an appropriate amount of dropdown options
                        jawn.forEach(feature => {
                            if (feature[station]) {
                                feature[station].forEach(year => {
                                    let option = document.createElement('option')
                                    option.value = year
                                    option.innerText = year
                                    form[1].appendChild(option)
                                })
                            }
                        })
                    })
                    // loop through stations and create a dropdown option for each one
                    jawn.forEach(station => {
                        let k = Object.keys(station)[0].toString()
                        let option = document.createElement('option')
                        option.value = k
                        option.innerText = k
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
    // @NOTE: only works locally, on rbeatty's machine. He holds the keys to the castle.
    fetch(`http://localhost:8000/query?station=${station}&year=${selectedYear}`)
        .then(response => {
            if (response.status == 200) {
                response.json()
                    .then(jawn => {
                        if (!jawn.length) alert('yo that aint right')
                        else {
                            // build your arcgis query parameter while making your db call 
                            let fids = []
                            for (let k in jawn) { fids.push(jawn[k].id) }
                            // arcgis call
                                // KNOWN BUG: Queries that return a lot of features receive a 404 error
                            fetch(
                                `https://services1.arcgis.com/LWtWv6q6BJyKidj8/ArcGIS/rest/services/HexBins_StationShed/FeatureServer/0/query?where=&objectIds=${fids}&outFields=FID&outSR=4326&f=pgeojson`, {
                                    method: 'POST'
                                }
                            ).then(response => {
                                if (response.ok) {
                                    response.json().then(hexBins => {
                                        // bind count data to arcgis response
                                        let range = []
                                        jawn.forEach(count => {
                                            let features = hexBins.features
                                            for (let i in features) {
                                                if (features[i].properties.FID == count.id) {
                                                    features[i].properties.count = count.count
                                                    range.push(count.count)
                                                }
                                            }
                                        })
                                        let quartiles = Quartile(range)
                                        // throw some honeycombs on the map #saveTheBees
                                        map.addSource('hexBins', {
                                            type: 'geojson',
                                            data: hexBins
                                        })


                                        map.addLayer(hex_layer('hexBins', quartiles))


                                        // @TODO: Get bounds of ArcGIS response and adjust map extent accordingly
                                    })
                                }
                            }).catch(error => console.error(error))
                        }
                    })
            }
        }).catch(error => console.error(error))


    /* ~*$--- THIS IS WHAT YOU USE IF YOU DON'T HOLD THE KEYS TO THE CASTLE ---$*~ */

    // assuming the selected year exists for that station --- 
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