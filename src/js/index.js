import { ckmeans } from '../../node_modules/simple-statistics'
import '../css/index.css'
import { getRailLayer, loadLayers } from '../utils/get-passenger-rail-layers.js'
import Logo from '../img/DVRPCLogo.png'
import Loading from '../img/cat.gif'
import { baseLayers } from '../utils/baseLayers.js';
import {fetch} from 'whatwg-fetch'
mapboxgl.accessToken = 'pk.eyJ1IjoiYmVhdHR5cmUxIiwiYSI6ImNqOGFpY3o0cTAzcXoycXE4ZTg3d3g5ZGUifQ.VHOvVoTgZ5cRko0NanhtwA'
// color schemes for each operator
const schemes = {
    'SEPTA': {
        'Rapid Transit': ["#fbd8f6", '#dda5d6', '#be72b6', '#9e3e97'],
        'Commuter Rail': ["#c1e7ff", '#86b0cc', '#4c7c9b', '#004c6d'],
        'Surface Trolley': ['#d1eac7', '#a7cd99', '#7db06d', '#529442'],
        'Subway': ['#ffdbc2', '#ffbe8e', '#fca05a', '#f58221'],
        'Subway/Elevated': ['#cae5ff', '#97c1ea', '#619fd6', '#067dc1'],
    },
    'DRPA': {
        'Rapid Transit': ['#ffd6d5', '#ffa3a4', '#fa6c76', '#ed164b']
    },
    'Amtrak': {
        'Intercity Passenger Rail': ['#e2e2e2', '#a4b1c0', '#65829e', '#1b567d']
    },
    'NJ Transit': {
        'Commuter Rail': ['#e2e2e2', '#f18541', '#b02c87', '#045099'],
        'Light Rail': ['#ffd847', '#9de779', '#2ae6c2', '#00daf5']
    },
    'TMACC': {
        'Park and Ride': ['#999999', '#777777', '#575757', '#383838']
    }
}
const logoContainer = document.querySelector('#dvrpc-logo')
let logo = new Image()
logo.src = Logo
logoContainer.appendChild(logo)

const loadingContainer = document.querySelector('#cat-loading')
let loading = new Image()
loading.src = Loading
loadingContainer.appendChild(loading)
const baseExtent = {
    center : [-75.142241, 40.0518322],
    zoom: 8.5
}
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/beattyre1/cjhw5mutc17922sl7me19mwc8',
    attributionControl: true,
    center: baseExtent.center,
    zoom: baseExtent.zoom// or whatever zoom you want
});
const ref = new mapboxgl.Map({
    container: 'reference',
    style: 'mapbox://styles/beattyre1/cjhw5mutc17922sl7me19mwc8',
    center: [-75, 40],
    zoom: 7,
    interactive: false
})

map.on('load', e=>{
    fetch('https://services1.arcgis.com/LWtWv6q6BJyKidj8/ArcGIS/rest/services/HexBins_StationShed/FeatureServer/0/query?where=1%3D1&outFields=OBJECTID%2C+GRID_ID&outSR=4326&geometryPrecision=4&f=pgeojson')
    .then(response => {
        if (response.ok) {
            response.json()
                .then(features => {
                    map.addSource('hexBins', {
                        type: 'geojson',
                        data: features
                    })
                    ref.addSource('hexBins', {
                        type: 'geojson',
                        data: features
                    })
                }).then(x=>{
                    ref.addLayer({
                        'id': 'hexBins',
                        'source': 'hexBins',
                        'type': 'fill',
                        'paint': {
                            'fill-opacity': 0
                        }
                    })
                })
        }
        loadLayers(map, baseLayers)


    })
})



/* HexStyling(id, quartiles, infoArray) -- mmolta, rbeatty
    @DESC: Styling function for aggregate geometries that will classified into quartiles based on input range
    @params:
        @id: 
            - DATA TYPE: string
            - DESC: Identifier that will be assigned to the map layer
        @quartiles: 
            - DATA TYPE: object
            - DESC: Object that contains the classification break points that is outputted by the Quartiles function (def: L26)
        @infoArray: 
            - DATA TYPE: object
            - DESC: Object that contains operator and line type information to be used to assign the appropriate color scheme
    @usage:
        - L212
*/
const HexStyling = (infoArray, colorScheme, filter) => {

    // sort object by counts
    const SortObjectsByField = field => {
        let sortOrder = 1
        return (a, b) => {
            let result = (a[field] < b[field]) ? -1 : (a[field] > b[field]) ? 1 : 0;
            return result * sortOrder
        }
    }

    const BuildLegend = (content, colorScheme) => {
        let range = []
        for (let i in content.data) {
            range.push(content.data[i].count)
        }

        // create classification
        const GetUniqueCount = (value, index, self) =>{
            return self.indexOf(value) === index
        }
        let temp = range.filter(GetUniqueCount).length > 4 ? ckmeans(range, 4) : ckmeans(range, range.filter(GetUniqueCount).length) //ckmeans, simple-statistics library
        temp.forEach(cluster => {
            let temp = { 'break': [cluster[0], cluster[cluster.length - 1]], 'count': cluster.length, 'features': [] }
            // push GRID_IDs into arrays corresponding to correct classification
            for (let i in content.data) {
                content.data[i].count >= temp.break[0] && content.data[i].count <= temp.break[1] ? temp.features.push(content.data[i].id) : undefined
            }
            content.breaks.push(temp)
        })
        const legendBody = document.querySelector(".legend__body")

        // numerical summaries
        if (content.line == null){
            legendBody.innerHTML = `
                <div class="legend__station-summary">
                    <h1 class="legend__emphasis">${content.name}</h1>
                    <p class="legend__text"><span class="legend__emphasis">${content.operator}</span> operated <span class="legend__emphasis">${content.mode}</span>.<br>Currently displaying results for the <span class="legend__emphasis">${content.year}</span> survey.</p>
                </div>
                <div class="legend__number-summary">
                    <div class="legend__summary-container">
                        <p class="legend__emphasis summary">${range.reduce((a, b) => a + b)}</p>
                        <p class="legend__text">Total Commuters</p>
                    </div>
                </div>
                <div class="legend__distribution-summary"></div>
                `;
        }
        else{
            legendBody.innerHTML = `
                    <div class="legend__station-summary">
                        <h1 class="legend__emphasis">${content.name}</h1>
                        <p class="legend__text"><span class="legend__emphasis">${content.operator}</span> operated <span class="legend__emphasis">${content.mode}</span> station<br>and is served by the <span class="legend__emphasis">${content.line}</span>.<br>Currently displaying results for the <span class="legend__emphasis">${content.year}</span> survey.</p>
                    </div>
                    <div class="legend__number-summary">
                        <div class="legend__summary-container">
                            <p class="legend__emphasis summary">${range.reduce((a, b) => a + b)}</p>
                            <p class="legend__text">Total Commuters</p>
                        </div>
                    </div>
                    <div class="legend__distribution-summary"></div>
                    `;
        }
        content.name == 'Wissinoming' || content.name == 'Lamokin Street' ? legendBody.innerHTML = legendBody.innerHTML+'<div style="order: 4"><p class="legend__text legend__emphasis">* This station is no longer operational.</p></div>' : null
        // set colors appropriately based on operator/mode scheme system
        const emphasis = document.querySelectorAll(".legend__emphasis")
        emphasis.forEach(node => {
            node.style.color = colorScheme[content.operator][content.mode][2]
        })

        // create legend boxes
        let i = 0
        colorScheme[content.operator][content.mode].forEach(classification => {
            const container = document.querySelector(".legend__distribution-summary")
            let legendItem = document.createElement("div")
            let height = document.querySelector('body').clientHeight * 0.045
            if (i < 2) {
                legendItem.style.cssText = `width: ${height}px; height: ${height}px; background-color: ${classification}; font-weight: 700`
            }
            else {
                legendItem.style.cssText = `width: ${height}px; height: ${height}px; background-color: ${classification}; color: white; font-weight: 700`
            }
            if (content.breaks[i]){
                legendItem.innerHTML = `<p>${content.breaks[i]['break'][1]}</p>`
                container.appendChild(legendItem)
            }
            i++
        })
    }


    const GenerateFillFunction = (infoArray, colorScheme) => {
        let info = {
            query: `GRID_ID%20IN%20(`,
            stops: []
        }
        Object.keys(infoArray.breaks).forEach(key => {
            infoArray.breaks[key].features.forEach(feature => {
                info.stops.push([feature, colorScheme[infoArray.operator][infoArray.mode][key]])
            })
        })
        let i = 1
        infoArray.data.forEach(feature=>{
            i != infoArray.data.length ? info.query = `${info.query} '${feature.id}',` : info.query = `${info.query} '${feature.id}')`
            i ++
        })
        return info.stops
    }


    infoArray['data'].sort(SortObjectsByField('count'))
    BuildLegend(infoArray, schemes)
    if (infoArray.operator.length != 1) {

        return {
            'id': 'hexBins',
            'type': 'fill',
            'source': 'hexBins',
            'filter': ['match', ['get', 'GRID_ID'], filter, true, false],
            'paint': {
                'fill-color': {
                    property: 'GRID_ID',
                    type: 'categorical',
                    default: '#ccc',
                    stops: GenerateFillFunction(infoArray, colorScheme)
                },
                'fill-outline-color': '#888',
                'fill-opacity': .7
            }
        }
    }
    else {
        return {
            'id': 'hexBins',
            'type': 'fill',
            'source': 'hexBins',
            'filter': ['match', ['get', 'GRID_ID'], filter, true, false],
            'paint': {
                'fill-color': {
                    property: 'GRID_ID',
                    type: 'categorical',
                    default: '#ccc',
                    stops: GenerateFillFunction(infoArray, colorScheme)
                },
                'fill-outline-color': '#666'
            }
        }
    }
}

// function to get station sheds hexagons on submit
const form = document.querySelector('#main-form')
let data = new Object();
// populate dropdowns with possible query values
fetch('https://a.michaelruane.com/api/lps/test')
    .then(response => response.ok ? response.json() : console.error('Failed to fetch surveyed stations') )
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
            data[station].years.sort((a,b)=> b - a )
            data[station]['years'].forEach(year => {
                let option = document.createElement('option')
                option.value = year
                option.innerText = year
                form[1].appendChild(option)
            })
            if (data[station].id != null) map.setFilter('railStations-highlight', ['==', 'DVRPC_ID', data[station].id]) 
            else{
                map.setFilter('railStations-highlight', ['==', 'DVRPC_ID', ''])
                alert('This option does not have a mapped station')
            }
    })

        // loop through stations and create a dropdown option for each one
        jawn.forEach(station => {
            let k = Object.keys(station)[0].toString(),
            option = document.createElement('option')
            option.value = k
            station[k].line != null ? option.innerHTML = `${k} (${station[k].line})` : option.innerHTML =   `${k} (Park and Ride)`
            form[0].appendChild(option)
            data[k] = station[k]
        })
        return data
    })

form.onsubmit = e => {
    e.preventDefault()
    // check if a layer exists on the map already & remove it
    if (map.getLayer('hexBins')) {
        map.removeLayer('hexBins')
    }
    if (map.getLayer('railLayer')) {
        map.removeLayer('railLayer')
    }
    if (document.querySelector('.map__hexPopup')){
        map.removeLayer('hexClick')
        let popup = document.querySelector('.map__hexPopup')
        popup.parentNode.removeChild(popup)
    }
    let station = e.target[0].value,
        selectedYear = e.target[1].value

    // info to pass to HexStyling function (L212) to apply appropriate color scheme to results
    let stationInfo = {
        'name': station,
        'operator': undefined,
        'mode': undefined,
        'year': selectedYear,
        'id': data[station].id,
        'data': [],
        'breaks': []
    }
    // var @data = array returned by fetch on L113 to return summary information about each permutation of commuter shed survey conducted and entered into DB
    stationInfo['operator'] = data[station].operator
    let mode = data[station].mode
    stationInfo['line'] = data[station].line
    mode.indexOf('(Regional Rail') != -1 ? stationInfo['mode'] = 'Commuter Rail' : stationInfo['mode'] = mode

    if (station != 'default') {
        fetch(`https://a.michaelruane.com/api/lps/query?station=${station}&year=${selectedYear}`)
        .then(response => {
            if (response.status == 200) { return response.json() }
        })
        .then(jawn => {
            if (jawn.code) alert(jawn.error)
            else {
                // create filter array for hex tile
                let hex = []
                let popupReference = new Object();
                for (let k in jawn) {
                    hex.push(jawn[k].id)
                    popupReference[jawn[k].id] = jawn[k].count
                    stationInfo['data'].push({
                        'id': jawn[k].id,
                        'count': jawn[k].count
                    })
                }
                // style
                if (map.getSource('hexBins')) {
                    map.addLayer(HexStyling(stationInfo, schemes, hex), 'railHighlight')
                    map.on('click', e=>{
                        if (map.getLayer('hexClick')){
                            map.removeLayer('hexClick')
                        }
                    })

                    map.on('click', 'hexBins', e=>{
                        if (popupReference[e.features[0].properties.GRID_ID]){
                            let count = popupReference[e.features[0].properties.GRID_ID]
                            let offsets = {
                                'top': [0, 0],
                                'top-left': [0,0],
                                'top-right': [0,0],
                                'bottom': [0, -15],
                                'bottom-left': [0,0],
                                'bottom-right': [0,0],
                                'left': [0,0],
                                'right': [0,0]
                                }
                            
                            const popup = new mapboxgl.Popup({ offset: offsets, className: 'map__hexPopup' })
                            let colors = schemes[stationInfo.operator][stationInfo.mode]
                            popup.setLngLat(e.lngLat)
                                .setHTML(`<p style="color: ${colors[colors.length-1]}">${count} Commuters attributed to this area.</p>`)
                                .addTo(map)
                            document.querySelector('.mapboxgl-popup-close-button').addEventListener('click', e=>{
                                if (map.getLayer('hexClick')){
                                    map.removeLayer('hexClick')
                                }
                            })
                            for (let node of document.querySelectorAll('.mapboxgl-popup-tip')){
                                node.style.borderTopColor = colors[0]
                            }
                            for (let node of document.querySelectorAll('.mapboxgl-popup-content')){
                                node.style.borderColor = colors[1]
                            }

                            map.addLayer({
                                'id': 'hexClick',
                                'source': 'hexBins',
                                'type': 'line',
                                'filter': ['match', ['get', 'GRID_ID'], e.features[0].properties.GRID_ID, true, false],
                                'paint': {
                                    'line-color': '#f00',
                                    'line-width': 2
                                }
                            })
                        }
                    })
                }
                const lineName = stationInfo.line
                map.setFilter('railHighlight', ['==', ['get', 'LINE_NAME'], lineName])
                let legend = document.querySelector('.legend__body')
                !legend.classList.contains('visible') ? legend.classList.add('visible') : null
                let extent = map.querySourceFeatures('railStations', {sourceLayer: 'railStations-highlight', filter: ['==', 'DVRPC_ID', data[station].id]})
                if (extent.length > 0) map.flyTo({ center: extent[0].geometry.coordinates, zoom: 10, speed: 0.3 })
                else map.flyTo({ center: baseExtent.center, zoom: baseExtent.zoom, speed: 0.3})
            }
        })
    }
    else { alert('Please select a station to continue') }
}
const StationPopup = event =>{
    let props = event.features[0].properties
    let popup = new mapboxgl.Popup({
        offset: {
            'top': [0, 0],
            'top-left': [0,0],
            'top-right': [0,0],
            'bottom': [0, -10],
            'bottom-left': [0,0],
            'bottom-right': [0,0],
            'left': [0,0],
            'right': [0,0]
            },
        className: 'map__stationPopup'
    })
    popup.setLngLat(event.lngLat)
        .setHTML(`<p class="map__stationPopup_stationInfo">${props.STATION} Station</p><p class="map__stationPopup_lineInfo">${props.OPERATOR} ${props.LINE}</p>`)
        .addTo(map)
    return popup
}
let stationPopup;
map.on('mouseover', 'railStations-base', e=>{
    map.getCanvas().style.cursor = 'pointer'
    map.setFilter('railStations-hover', ['==', 'DVRPC_ID', e.features[0].properties.DVRPC_ID])
    stationPopup = StationPopup(e)
})
map.on('mouseleave', 'railStations-base', e=>{
    map.getCanvas().style.cursor = ''
    map.setFilter('railStations-hover', ['==', 'DVRPC_ID', ''])
    stationPopup.remove()
})

let toggle = document.querySelector('.legend__toggle')
// toggle.addEventListener('click', e => {
//     e.preventDefault()
//     let body = e.target.nextElementSibling
//     body.classList.toggle('visible')
// })

// modal clickinator
const moreInfo = document.querySelector('#more-info')
const modal = document.querySelector('#modal')
const close = document.querySelector('#close-modal')

const AriaHide = element =>{
    element.classList.remove('visible')
    element.setAttribute('aria-hidden', 'true')
}

const AriaShow = (element) =>{
    element.classList.add('visible')
    element.setAttribute('aria-hidden', 'false')
}

// open the modal
moreInfo.onclick = () => modal.style.display = 'none' ?  AriaShow(modal) : AriaHide(modal)
toggle.onclick = () =>{
    let body = toggle.nextElementSibling
    body.classList.contains('visible') ? AriaHide(body) : AriaShow(body)
}
// close the modal by clicking the 'x' or anywhere outside of it
close.onclick = () => AriaHide(modal)
window.onclick = event => {
    if (event.target == modal) AriaHide(modal)
}
document.onkeydown(e=>{
    if ( modal.style.display === 'block') {
        if (e.keyCode === 27) AriaHide(modal)
    }
})