export const baseLayers = {
  munis:{
    sourceDef: {
      type: "vector",
      url: "https://tiles.dvrpc.org/data/dvrpc-municipal.json"
    },
    layers: {
      muni: {
        layerDef: {
          id: 'muniBoundaries',
          type: 'line',
          source: 'munis',
          "source-layer": 'municipalities',
          paint:{
            "line-color": "#aaa",
            "line-width" : [
              'interpolate', ['linear'], ['zoom'],
              7, .25,
              10.5, 1
            ],
            "line-opacity": [
              'interpolate', ['linear'], ['zoom'],
              7, .1,
              10.5, .8
            ],
            'line-dasharray': [2, 4]
          }
        }
      },
    }
  },
  boundaries: {
    sourceDef: {
      type: "vector",
      url: "https://tiles.dvrpc.org/data/dvrpc-municipal.json",
    },
    layers: {
      county: {
        layerDef: {
          id : "countyBoundaries",
          filter: ['==', 'dvrpc', 'Yes'],
          type: "line",
          "source-layer": 'county',
          source: 'boundaries',
          paint:{
            "line-color": "#aaa",
            "line-width": 1
          }
        }
      }
    }
  },
  passengerRail: {
    sourceDef: {
      type: "geojson",
      data:
        "https://opendata.arcgis.com/datasets/5af7a3e9c0f34a7f93ac8935cb6cae3b_0.geojson"
    },
    layers: {
      base: {
        layerDef: {
          id: "railBase",
          type: "line",
          source: "passengerRail",
          paint: {
            "line-color": [
              "match",
              ["get", "TYPE"],
              "AMTRAK",
              "#004d6e",
              "NJ Transit",
              "#f18541",
              "NJ Transit Light Rail",
              "#ffc424",
              "PATCO",
              "#ed164b",
              "Rapid Transit",
              "#9e3e97",
              "Regional Rail",
              "#487997",
              "Subway",
              "#f58221",
              "Subway - Elevated",
              "#067dc1",
              "Surface Trolley",
              "#529442",
              "#323232"
            ],
            "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 12, 1],
            "line-opacity": .66
          }
        }
      },
      highlight: {
        layerDef: {
          id: "railHighlight",
          type: "line",
          source: "passengerRail",
          paint: {
            "line-color": [
              "match",
              ["get", "TYPE"],
              "AMTRAK",
              "#004d6e",
              "NJ Transit",
              "#f18541",
              "NJ Transit Light Rail",
              "#ffc424",
              "PATCO",
              "#ed164b",
              "Rapid Transit",
              "#9e3e97",
              "Regional Rail",
              "#487997",
              "Subway",
              "#f58221",
              "Subway - Elevated",
              "#067dc1",
              "Surface Trolley",
              "#529442",
              "#323232"
            ],
            "line-width": ["interpolate", ["linear"], ["zoom"], 8, 2, 12, 3]
          },
          filter: ['match', ['get', 'LINE_NAME'], '', true, false]
        }
      },
      labels: {
        layerDef: {
          id: "railLabels",
        type: "symbol",
        source: "passengerRail",
        layout: {
          "text-field": "{LINE_NAME}",
          "text-font": ["Montserrat SemiBold", "Open Sans Semibold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 8, 8, 12, 12],
          "symbol-placement": "line"
        },
        paint: {
          "text-color": "#fff",
          "text-halo-color": [
            "match",
            ["get", "TYPE"],
            "AMTRAK",
            "#004d6e",
            "NJ Transit",
            "#f18541",
            "NJ Transit Light Rail",
            "#ffc424",
            "PATCO",
            "#ed164b",
            "Rapid Transit",
            "#9e3e97",
            "Regional Rail",
            "#487997",
            "Subway",
            "#f58221",
            "Subway - Elevated",
            "#067dc1",
            "Surface Trolley",
            "#529442",
            "#323232"
          ],
          "text-halo-width": 2,
          "text-halo-blur": 3
        }
      }
      },
    }
  },
  railStations: {
    sourceDef: {
      type: 'geojson',
      data: 'https://services1.arcgis.com/LWtWv6q6BJyKidj8/arcgis/rest/services/DVRPC_LPS/FeatureServer/0/query?where=1%3D1&outFields=*&geometryPrecision=4&outSR=4326&f=pgeojson',
    },
    layers: {
      base:{
        layerDef:{
          id: 'railStations-base',
          source: 'railStations',
          type: 'circle',
          paint : {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 1, 12, 5],
            'circle-color': [
              'match',
              ['get', 'SURVEY_ID'],
              0, '#aaa',
              'green'
            ],
            'circle-stroke-color': '#fff',
            'circle-opacity': .9,
            'circle-stroke-width': .5
          }
        },
        placement: 'railLabels'
      },
      highlight: {
        layerDef : {
          id: 'railStations-highlight',
          source: 'railStations',
          type: 'circle',
          filter: ['==', 'SURVEY_ID', ''],
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5, 12, 15],
            'circle-stroke-color': '#155472',
            'circle-stroke-width': 1.5,
            'circle-color': 'green',
            'circle-opacity': .5
          }
        },
        placement: 'railLabels'
      },
      hover: {
        layerDef: {
          id: 'railStations-hover',
          source: 'railStations',
          type: 'circle',
          filter: ['==', 'SURVEY_ID', ''],
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 3, 12, 6],
            'circle-stroke-color': '#f00',
            'circle-stroke-width': 2,
            'circle-color':  [
              'match',
              ['get', 'SURVEYED'],
              ' ', '#aaa',
              'yellow'
            ],
            'circle-opacity': .9
          }
        },
        placement: 'railLabels'
      }
    }
  }
};
