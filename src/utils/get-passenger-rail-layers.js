export const getRailLayer = operator => {
    return {
        id: operator,
        type: 'fill',
        source: 'passengerRailLines',
        paint: {
        "line-color": [
            // ['match', ['get', 'LINE_NAME'], operator, true, false],
            'AMTRAK', '#004d6e',
            'NJ Transit', "#f18541",
            'NJ Transit Light Rail', '#ffc424',
            'PATCO', '#ed164b',
            'Rapid Transit', '#9e3e97',
            'Regional Rail', '#487997',
            'Subway', '#f58221',
            'Subway - Elevated', '#067dc1',
            'Surface Trolley',  '#529442',
            '#323232'
        ],
        "line-width":['interpolate', ['linear'], ['zoom'], 8, 1, 12, 3]
        }
    }
}