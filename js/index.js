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


// helper function to dynamically calculate quantiles for classification
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
    // fudge stuff so we're not multiplying by zero or making shitty quantiles for results that don't have a large range
    let position = parseInt((array.length/4),10)
    if (position == 0){
        let position = 2
    }
    let max = Math.max.apply(null, array)
    cnt = 1
    // assign index position of quantile breakpoints
    for (q in quarValues){
        let index = position*cnt
        cnt == 4 ? quarValues[q] = max : quarValues[q] = array[index]
        cnt ++
    }
    return quarValues
}
// helper function to create the hex layers
hex_layer = (id, quartiles, infoArray) => {
    // color schemes for each operator
    const schemes =  {
        'SEPTA': {
            'Regional Rail & Rapid Transit': ["#fbd8f6", '#dda5d6', '#be72b6', '#9e3e97'],
            'Commuter Rail': ["#c1e7ff", '#86b0cc', '#4c7c9b', '#004c6d'],
            'Surface Trolley': ['#d1eac7', '#a7cd99', '#7db06d', '#529442'],
            'Subway': ['#ffdbc2', '#ffbe8e', '#fca05a', '#f58221'],
            'Subway/Elevated': ['#cae5ff', '#97c1ea', '#619fd6', '#067dc1'],
        },
        'DRPA': ['#ffd6d5', '#ffa3a4', '#fa6c76', '#ed164b'],
        'Amtrak': ['#e2e2e2', '#a4b1c0', '#65829e', '#1b567d'],
        'NJ Transit': {
            'Commuter Rail': ['#e2e2e2','#f18541', '#b02c87', '#045099'],
            'Light Rail': ['#ffd847', '#9de779', '#2ae6c2', '#00daf5']
        },
        'PennDOT': ['#08853e', '#99a7d3', '#5b70a8', '#063e7e']
    }

    return {
        'id': id,
        'type': 'fill',
        'source': id,
        'paint': {
            'fill-color': {
                property : 'count',
                type: 'interval',
                stops: [
                    [0, schemes[infoArray[0]][infoArray[1]][0]],
                    [quartiles['0.25'], schemes[infoArray[0]][infoArray[1]][1]],
                    [quartiles['0.50'], schemes[infoArray[0]][infoArray[1]][2]],
                    [quartiles['max'],  schemes[infoArray[0]][infoArray[1]][3]]
                ]
            },
            'fill-outline-color': '#fff'
        }
    }
}

// function to get station sheds hexagons on submit
const form = document.querySelector('#main-form')
let data = undefined
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
                                feature[station]['years'].forEach(year => {
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
                        let k = Object.keys(station)[0].toString(),
                            option = document.createElement('option')
                        option.value = k
                        option.innerText = k
                        form[0].appendChild(option)
                    })
                return data = jawn
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
    let station = e.target[0].value,
        selectedYear = e.target[1].value
    
    // info to pass to hex_layer function (L186) to apply appropriate color scheme to results
    let stationInfo = []
    data.forEach(i=>{
        if(i[station]){
            stationInfo.push(i[station].operator)
            let mode = i[station].mode
             mode.indexOf('(Regional Rail') != -1 ? stationInfo.push('Commuter Rail') : stationInfo.push(mode)
        }
    })
    
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
                                // KNOWN BUG: Queries that return a lot of features receive a 404 error (known stations: Lindenwold, Ferry Avenue)
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
                                        let quartiles = Quartile(range) // calculate classification break points
                                        // throw some honeycombs on the map #saveTheBees
                                        map.addSource('hexBins', {
                                            type: 'geojson',
                                            data: hexBins
                                        })


                                        map.addLayer(hex_layer('hexBins', quartiles, stationInfo))


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