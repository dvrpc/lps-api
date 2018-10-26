export const getRailLayer = (lineName, lineColor) => {
    return {
        id: 'railLayer',
        type: 'line',
        source: 'passengerRailLines',
        // filter: ['match', ['get', 'LINE_NAME'], lineName, true, false],
        paint: {
        "line-color": lineColor,
        "line-width":['interpolate', ['linear'], ['zoom'], 8, 1, 12, 5],
        "line-opacity": .75,
        "line-dasharray": [2,2]
        }
    }
}

export const loadLayers = (map, layers) =>{
    for (let source in layers){
        map.addSource(source, layers[source].sourceDef)
        for (let layer in layers[source].layers){
            map.addLayer(layers[source].layers[layer], 'waterway-label')
        }
        
    }

}