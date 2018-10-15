export const getRailLayer = (lineName, lineColor) => {
    console.log({lineName})
    return {
        id: 'railLayer',
        type: 'line',
        source: 'passengerRailLines',
        filter: ['match', ['get', 'LINE_NAME'], lineName, true, false],
        paint: {
        "line-color": lineColor,
        "line-width":['interpolate', ['linear'], ['zoom'], 8, 1, 12, 3]
        }
    }
}