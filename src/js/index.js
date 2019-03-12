import { ckmeans } from "../../node_modules/simple-statistics";
import "../css/index.css";
import {
  loadLayers
} from "../utils/get-passenger-rail-layers.js";
import { baseLayers } from "../utils/baseLayers.js";
import { CreateDvrpcNavControl } from "../utils/defaultExtentControl";
import "isomorphic-fetch"

mapboxgl.accessToken =
  "pk.eyJ1IjoiYmVhdHR5cmUxIiwiYSI6ImNqOGFpY3o0cTAzcXoycXE4ZTg3d3g5ZGUifQ.VHOvVoTgZ5cRko0NanhtwA";
// color schemes for each operator
const schemes = {
  SEPTA: {
    "Rapid Transit": ["#fbd8f6", "#dda5d6", "#be72b6", "#9e3e97"],
    "Commuter Rail": ["#c1e7ff", "#86b0cc", "#4c7c9b", "#004c6d"],
    "Surface Trolley": ["#d1eac7", "#a7cd99", "#7db06d", "#529442"],
    Subway: ["#ffdbc2", "#ffbe8e", "#fca05a", "#f58221"],
    "Subway/Elevated": ["#cae5ff", "#97c1ea", "#619fd6", "#067dc1"]
  },
  DRPA: {
    "Rapid Transit": ["#ffd6d5", "#ffa3a4", "#fa6c76", "#ed164b"]
  },
  Amtrak: {
    "Intercity Passenger Rail": ["#e2e2e2", "#a4b1c0", "#65829e", "#1b567d"]
  },
  "NJ Transit": {
    "Commuter Rail": ["#e2e2e2", "#f18541", "#b02c87", "#045099"],
    "Light Rail": ["#ffd847", "#9de779", "#2ae6c2", "#00daf5"]
  },
  TMACC: {
    "Park and Ride": ["#999999", "#777777", "#575757", "#383838"]
  }
};

const baseExtent = {
  center: [-75.142241, 40.0518322],
  zoom: 8.5
};
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/light-v9",
  attributionControl: true,
  center: baseExtent.center,
  zoom: baseExtent.zoom // or whatever zoom you want
});
const ref = new mapboxgl.Map({
  container: "reference",
  style: "mapbox://styles/beattyre1/cjhw5mutc17922sl7me19mwc8",
  center: [-75, 40],
  zoom: 7,
  interactive: false
});

map.on("load", e => {
  CreateDvrpcNavControl(baseExtent, map)

  fetch(
    "https://services1.arcgis.com/LWtWv6q6BJyKidj8/arcgis/rest/services/DVRPC_LPS/FeatureServer/1/query?where=1%3D1&outFields=OBJECTID%2C+GRID_ID&outSR=4326&geometryPrecision=4&f=geojson"
  ).then(response => {
    if (response.ok) {
      response
        .json()
        .then(features => {
          map.addSource("hexBins", {
            type: "geojson",
            data: features
          });
          ref.addSource("hexBins", {
            type: "geojson",
            data: features
          });
        })
        .then(x => {
          ref.addLayer({
            id: "hexBins",
            source: "hexBins",
            type: "fill",
            paint: {
              "fill-opacity": 0
            }
          });
        });
    }
    loadLayers(map, baseLayers);
  });
});
const PerformQuery = (stationID, year) => {
  const ClearMap = () => {
    // clear layers
    let layers = ["hexBins", "railLayer", "hexClick"];
    layers.map(layer => (map.getLayer(layer) ? map.removeLayer(layer) : null));

    // clear popups
    let hexPop = document.querySelector('.map__hexPopup')
    if (hexPop) hexPop.parentNode.removeChild(hexPop)
  };

  const UpdateRailFilter = stationData => {
    // get all rail lines associated with given station
    let stationQuery = map.querySourceFeatures("railStations", {
      sourceLayer: "railStations-base",
      filter: ["==", ["get", "SURVEY_ID"], stationData.id]
    });

    // add all rail lines to stationInfo
    stationQuery.map(station => {
      let props = station.properties;
      // workaround because this data is inconsistent and this is easier
      let thisStation = {
        name: undefined,
        operator: props.OPERATOR == "PATCO" ? "DRPA" : props.OPERATOR,
        mode: props.TYPE
      };
      switch (props.LINE) {
        case "Atlantic City Line":
          if (
            stationData.line.ref.indexOf("NJ Transit Atlantic City Line") == -1
          ) {
            stationData.line.ref.push("NJ Transit Atlantic City Line");
            thisStation.name = "NJ Transit Atlantic City Line";
            stationData.line.info.push(thisStation);
          }
          break;
        case "RiverLine":
          if (stationInfo.line.ref.indexOf("River LINE") == -1) {
            stationData.line.ref.push("River LINE");
            thisStation.name = "River LINE";
            stationData.line.info.push(thisStation);
          }
          break;
        case "Northeast Corridor":
          if (stationInfo.line.ref.indexOf("Northeast Corridor Line") == -1) {
            stationData.line.ref.push("Northeast Corridor Line");
            thisStation.name = "Northeast Corridor Line";
            stationData.line.info.push(thisStation);
          }
          break;
        case "Keystone Line":
          if (stationInfo.line.ref.indexOf("Keystone Corridor") == -1) {
            stationData.line.ref.push("Keystone Corridor");
            thisStation.name = "Keystone Corridor";
            stationData.line.info.push(thisStation);
          }
          break;
        case "Multiple Routes":
          if (stationInfo.line.ref.indexOf("Amtrak") == -1) {
            stationData.line.ref.push("Amtrak");
            thisStation.name = "Amtrak";
            stationData.line.info.push(thisStation);
          }
          break;
        default:
          if (stationData.line.ref.indexOf(props.LINE) == -1) {
            stationData.line.ref.push(props.LINE);
            thisStation.name = props.LINE;
            stationData.line.info.push(thisStation);
          }
          break;
      }
    });
    // build filter and apply
    let filterExp = ["any"];
    stationInfo.line.info.map(line => {
      let filterStatement = ["==", ["get", "LINE_NAME"], line.name];
      filterExp.push(filterStatement);
    });
    map.setFilter("railHighlight", filterExp);
  };

  const HexStyling = (infoArray, colorScheme, filter) => {
    // sort object by counts
    const SortObjectsByField = field => {
      let sortOrder = 1;
      return (a, b) => {
        let result = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
        return result * sortOrder;
      };
    };
    const BuildLegend = (content, colorScheme) => {
      let range = [];
      for (let i in content.data) {
        range.push(content.data[i].count);
      }

      // create classification
      const GetUniqueCount = (value, index, self) => {
        return self.indexOf(value) === index;
      };

      let temp =
        range.filter(GetUniqueCount).length > 4
          ? ckmeans(range, 4)
          : ckmeans(range, range.filter(GetUniqueCount).length); //ckmeans, simple-statistics library
      temp.map(cluster => {
        let temp = {
          break: [cluster[0], cluster[cluster.length - 1]],
          count: cluster.length,
          features: []
        };
        // push GRID_IDs into arrays corresponding to correct classification
        for (let i in content.data) {
          if (
            content.data[i].count >= temp.break[0] &&
            content.data[i].count <= temp.break[1]
          )
            temp.features.push(content.data[i].id);
        }
        content.breaks.push(temp);
      });
      let legendBody = document.querySelector(".legend__body");
      if (content.mode == "Park and Ride") {
        legendBody.innerHTML = `
        <div class="legend__station-summary">
            <h1 class="legend__emphasis">${content.name}</h1>
            <p class="legend__text"><span class="legend__emphasis">${
              content.operator
            }</span> operated <span class="legend__emphasis">${
          content.mode
        }</span>.<br>Currently displaying results for the <span class="legend__emphasis">${
          content.year
        }</span> survey.</p>
        </div>
        <div class="legend__number-summary">
            <div class="legend__summary-container">
                <p class="legend__emphasis summary">${range.reduce(
                  (a, b) => a + b
                )}</p>
                <p class="legend__text">Total Commuter Vehicles</p>
            </div>
        </div>
        <div class="legend__distribution-summary"></div>
        `;
      } else {
        legendBody.innerHTML = `
                      <div class="legend__station-summary">
                          <h1 class="legend__emphasis">${content.name}</h1>
                          <p class="legend__text"><span class="legend__emphasis">${
                            content.operator
                          }</span> operated station and is served by the following lines:</p><ul id="legend__lines"></ul><p class="legend__text">Currently displaying results for the <span class="legend__emphasis">${
          content.year
        }</span> survey.</p>
                      </div>
                      <div class="legend__number-summary">
                          <div class="legend__summary-container">
                              <p class="legend__emphasis summary">${range.reduce(
                                (a, b) => a + b
                              )}</p>
                              <p class="legend__text">Total Commuter Vehicles</p>
                          </div>
                      </div>
                      <div class="legend__distribution-summary"></div>
                      `;
        let legendLines = legendBody.querySelector("#legend__lines");
        content.line.info.map(line => {
          let list = document.createElement("li"),
            color = schemes[line.operator][line.mode][3];
  
          list.innerHTML = `${line.name} <span style='font-weight: 400'>(${
            line.mode
          })</span>`;
          list.setAttribute("style", `font-weight: 700; color: ${color}`);
          legendLines.appendChild(list);
        });
      }
      content.name == "Wissinoming" || content.name == "Lamokin Street"
        ? (legendBody.innerHTML =
            legendBody.innerHTML +
            '<div style="order: 4"><p class="legend__text legend__emphasis">* This station is no longer operational.</p></div>')
        : null;
      // set colors appropriately based on operator/mode scheme system
      const emphasis = document.querySelectorAll(".legend__emphasis");
      for (let node of emphasis){ node.style.color = colorScheme[content.operator][content.mode][2] }

      // create legend boxes
      let i = 0;
      colorScheme[content.operator][content.mode].map(classification => {
        if (content.breaks[i]) {
          const container = document.querySelector(
              ".legend__distribution-summary"
            ),
            legendItem = document.createElement("div"),
            height = 100 / content.breaks.length,
            breakValue = content.breaks[i]["break"][1];
          legendItem.style.cssText =
            i < 2
              ? `width: ${height}%; background-color: ${classification};`
              : `width: ${height}%; background-color: ${classification}; color: white;`;

          if (i == 0) {
            legendItem.innerHTML =
              breakValue == 1
                ? `<p>${breakValue}</p>`
                : `<p>1 – ${breakValue}</p>`;
            container.appendChild(legendItem);
          } else {
            let range =
              breakValue - content.breaks[i - 1]["break"][1] > 1
                ? `<p>${content.breaks[i - 1]["break"][1] +
                    1} – ${breakValue}</p>`
                : `<p>${breakValue}</p>`;
            legendItem.innerHTML = range;
            container.appendChild(legendItem);
          }
          i++;
        }
      });
    };
    const GenerateFillFunction = (infoArray, colorScheme) => {
      let info = {
        query: `GRID_ID%20IN%20(`,
        stops: []
      };
      Object.keys(infoArray.breaks).map(key => {
        infoArray.breaks[key].features.map(feature => {
          info.stops.push([
            feature,
            colorScheme[infoArray.operator][infoArray.mode][key]
          ]);
        });
      });
      let i = 1;
      infoArray.data.map(feature => {
        i != infoArray.data.length
          ? (info.query = `${info.query} '${feature.id}',`)
          : (info.query = `${info.query} '${feature.id}')`);
        i++;
      });
      return info.stops;
    };
    const GenerateFilterFunction = values => {
      let filter = ["any"];
      values.map(v => {
        filter.push(["==", ["get", "OBJECTID"], v]);
      });
      return filter;
    };

    infoArray["data"].sort(SortObjectsByField("count"));
    BuildLegend(infoArray, schemes);
    return {
      id: "hexBins",
      type: "fill",
      source: "hexBins",
      filter: GenerateFilterFunction(filter),
      paint: {
        "fill-color": {
          property: "OBJECTID",
          type: "categorical",
          default: "#ccc",
          stops: GenerateFillFunction(infoArray, colorScheme)
        },
        "fill-outline-color": "#333",
        "fill-opacity": 0.7
      }
    };
  };

  ClearMap();

  // info to pass to HexStyling function (L212) to apply appropriate color scheme to results
  let stationInfo = {
    name: data[stationID].name,
    operator: data[stationID].operator,
    mode: data[stationID].mode,
    year: year,
    id: data[stationID].id,
    line: {
      ref: [],
      info: []
    },
    data: [],
    breaks: []
  };
  // var @data = array returned by fetch on L113 to return summary information about each permutation of commuter shed survey conducted and entered into DB
  stationInfo.mode.indexOf("(Regional Rail") != -1
    ? (stationInfo.mode = "Commuter Rail")
    : null;

  if (stationID != "default") {
    let popupReference = new Object();
    fetch(
      `https://a.michaelruane.com/api/lps/query?station=${stationID}&year=${year}`
    )
      .then(response => {
        if (response.status == 200) {
          return response.json();
        }
      })
      .then(jawn => {
        UpdateRailFilter(stationInfo);
        // create filter array for hex tile
        let hex_values = [];
        jawn.cargo.map(hex => {
          hex_values.push(hex.hex_id);
          popupReference[hex.hex_id] = hex.count;
          stationInfo.data.push({
            id: hex.hex_id,
            count: hex.count
          });
        });

        // style
        if (map.getSource("hexBins")) {
          let style = HexStyling(stationInfo, schemes, hex_values);
          map.addLayer(style, "railHighlight");
          map.on(
            "mouseover",
            "hexBins",
            e => (map.getCanvas().style.cursor = "pointer")
          );
          map.on(
            "mouseleave",
            "hexBins",
            e => (map.getCanvas().style.cursor = "")
          );
          map.on("click", e => {
            if (map.getLayer("hexClick")) map.removeLayer("hexClick");

          });

          map.on("click", "hexBins", e => {
            if (popupReference[e.features[0].properties.OBJECTID]) {
              let count = popupReference[e.features[0].properties.OBJECTID];
              let offsets = {
                top: [0, 0],
                "top-left": [0, 0],
                "top-right": [0, 0],
                bottom: [0, -15],
                "bottom-left": [0, 0],
                "bottom-right": [0, 0],
                left: [0, 0],
                right: [0, 0]
              };

              const popup = new mapboxgl.Popup({
                offset: offsets,
                className: "map__hexPopup"
              });
              let colors = schemes[stationInfo.operator][stationInfo.mode];
              let content =
                count > 1
                  ? `${count} Commuters from this area.`
                  : "1 Commuter from this area";
              popup
                .setLngLat(e.lngLat)
                .setHTML(
                  `<p style="color: ${
                    colors[colors.length - 1]
                  }">${content}</p>`
                )
                .addTo(map);
              document
                .querySelector(".mapboxgl-popup-close-button")
                .addEventListener("click", e => {
                  if (map.getLayer("hexClick")) {
                    map.removeLayer("hexClick");
                  }
                });

              map.addLayer({
                id: "hexClick",
                source: "hexBins",
                type: "line",
                filter: [
                  "match",
                  ["get", "GRID_ID"],
                  e.features[0].properties.GRID_ID,
                  true,
                  false
                ],
                paint: {
                  "line-color": "#0ff",
                  "line-width": 4
                }
              });
            }
          });
        }

        // open legend on query
        let legend = document.querySelector(".legend__body");
        !legend.classList.contains("visible")
          ? legend.classList.add("visible")
          : null;
        !legend.previousElementSibling.classList.contains('active') ? legend.previousElementSibling.classList.add('active') : null

        // move map extent to station
        let extent = map.querySourceFeatures("railStations", {
          sourceLayer: "railStations-highlight",
          filter: ["==", ["get", "SURVEY_ID"], stationInfo.id]
        });
        map.flyTo({
          center: extent[0].geometry.coordinates,
          zoom: 10,
          speed: 0.3
        });
      });
  } else {
    alert("Please select a station to continue");
  }
};
const StationPopup = event => {
  const SurveyedPopup = (props, event) => {
    const Name = data => {
      let title = document.createElement("h2");
      title.classList.add("map__stationPopup-stationInfo");
      title.style.color = colors[colors.length - 1];
      title.innerText = data.name;

      return title;
    };
    const LineInfo = props => {
      let line = document.createElement("p"),
        colorScheme =
          props.OPERATOR == "PATCO"
            ? colors
            : schemes[props.OPERATOR][props.TYPE];
      line.classList.add("map__stationPopup-lineInfo");
      line.style.color = colorScheme[colorScheme.length - 2];
      switch (props.LINE) {
        case "null":
          line.innerText = `${props.OPERATOR} Operated Park and Ride`;
          break;
        case "PATCO":
          line.innerText = "PATCO Speedline";
          break;
        case "SEPTA Main Line":
          line.innerText = props.LINE;
          break;
        default:
          line.innerText = `${props.OPERATOR} ${props.LINE}`;
          break;
      }
      return line;
    };
    const SurveyInfo = data => {
      let container = document.createElement("ul");
      container.classList.add("map__stationPopup-text");
      container.innerText = data.years.length > 1 ? "Years Surveyed"  : "Year Surveyed";
      data.years.sort((a, b) => b - a);
      data.years.map(year => {
        let list = document.createElement("li");
        list.innerText = year;
        container.appendChild(list);
      });

      return container;
    };
    let colors = props.operator != 'PATCO' ? schemes[props.operator][props.mode] : schemes.DRPA["Rapid Transit"],
      content = document.createElement("div"),
      title = Name(props),
      survey = SurveyInfo(props);

    content.appendChild(title);
    event.features.map(station => {
      let line = LineInfo(station.properties);
      content.appendChild(line);
    });
    content.appendChild(survey);
    return content.innerHTML;
  };
  const NotSurveyedPopup = (props, event) => {
    const Name = data => {
      let title = document.createElement("h2");
      title.classList.add("map__stationPopup-stationInfo");
      title.innerText = data.STATION;
      return title;
    };
    const LineInfo = props => {
      let line = document.createElement("p");
      line.classList.add("map__stationPopup-lineInfo");
      switch (props.LINE) {
        case "null":
          line.innerText = `${props.OPERATOR} Operated Park and Ride`;
          break;
        case "PATCO":
          line.innerText = "PATCO Speedline";
          break;
        case "SEPTA Main Line":
          line.innerText = "SEPTA Main Line";
          break;
        default:
          line.innerText = `${props.OPERATOR} ${props.LINE}`;
          break;
      }
      return line;
    };
    let content = document.createElement("div"),
      title = Name(props);

    content.appendChild(title);
    event.features.map(station => {
      let line = LineInfo(station.properties);
      content.appendChild(line);
    });
    content.innerHTML =
      content.innerHTML +
      '<p class="map__stationPopup-text">This station has not been surveyed <br>as part of DVRPC\'s License Plate Survey Program.</p>';

    return content.innerHTML;
  };
  let content;
  if (data[event.features[0].properties.SURVEY_ID]) {
    let stationData = data[event.features[0].properties.SURVEY_ID];
    content = SurveyedPopup(stationData, event);
  } else {
    let props = event.features[0].properties;
    content = NotSurveyedPopup(props, event);
  }
  let popup = new mapboxgl.Popup({
    offset: {
      top: [0, 0],
      "top-left": [0, 0],
      "top-right": [0, 0],
      bottom: [0, -10],
      "bottom-left": [0, 0],
      "bottom-right": [0, 0],
      left: [0, 0],
      right: [0, 0]
    },
    className: "map__stationPopup"
  });
  popup
    .setLngLat(event.lngLat)
    .setHTML(content)
    .addTo(map);
  return popup;
};

const CreateYearOptions = (form, selection) =>{
  // remove any artifacts
  while (form.firstChild) {
    form.removeChild(form.firstChild);
  }
  // grab station data
  let station = data[selection]
  // add options in order of most recent to oldest
  station.years.sort((a, b)=> b - a)
  station.years.map(year=>{
    let option = document.createElement('option')
    option.value = year
    option.label = year
    option.innerText = option.label
    form.appendChild(option)
  })
}

// function to get station sheds hexagons on submit
const form = document.querySelector("#main-form");
form.onsubmit = e => {
  e.preventDefault();
  let station = form[0].value,
    year = form[1].value;
  PerformQuery(station, year);
};
let data = new Object();
// populate dropdowns with possible query values
fetch("https://a.michaelruane.com/api/lps/test")
  .then(response =>
    response.ok
      ? response.json()
      : console.error("Failed to fetch surveyed stations")
  )
  .then(jawn => {
    // listener to populate year dropdown with valid values based on db on station change
    form[0].addEventListener("change", e => {
      CreateYearOptions(form[1], e.target.value)
      map.setFilter("railStations-highlight", [
        "==",
        ["get", "SURVEY_ID"],
        ['to-number', e.target.value]
      ]);
    });

    // loop through stations and create a dropdown option for each one
    jawn.cargo.map(station => {
      if (!data[station.id]) {
        let option = document.createElement("option");
        option.value = station.id;
        if (station.line == "Speedline")
          option.label = `${station.name} (PATCO)`;
        else if (station.line != "None")
          option.label = `${station.name} (${station.line})`;
        else option.label = `${station.name} (Park and Ride)`;
        option.innerText = option.label
        form[0].appendChild(option);
        data[station.id] = station;
      }
    });
    return data;
  });

let stationPopup;

map.on("click", "railStations-base", e => {
  let props = e.features[0].properties;
  if (props.SURVEY_ID > 0) {
    map.setFilter("railStations-highlight", [
      "==",
      ["get", "SURVEY_ID"],
      props.SURVEY_ID
    ]);
    // perform query
    let station = props.SURVEY_ID,
      year = data[props.SURVEY_ID].years[0];
    PerformQuery(station, year);

    // populate form
    let form = document.querySelector("#main-form");
    form[0].value = station;
    CreateYearOptions(form[1], station)
  }
});
map.on("mouseover", "railStations-base", e => {
  if (e.features[0].properties.SURVEY_ID > 0)
    map.getCanvas().style.cursor = "pointer";
  map.setFilter("railStations-hover", [
    "==",
    "OBJECTID",
    e.features[0].properties.OBJECTID
  ]);
  stationPopup = StationPopup(e);
});
map.on("mouseleave", "railStations-base", e => {
  map.getCanvas().style.cursor = "";
  map.setFilter("railStations-hover", ["==", "OBJECTID", ""]);
  stationPopup.remove();
});

let modalLegend = document.querySelector('#modal-legend-rail'),
  lines = baseLayers.passengerRail.layers.base.layerDef.paint["line-color"]

lines.map((value, index)=>{
  let title = document.createElement('h4')
  title.innerText = 'Passenger Rail Lines'
  if ((index>1 && index<20) && index%2 == 0){
    let box = document.createElement('div')
    box.innerText = value
    box.style.borderBottomColor = `${lines[index+1]}`
    modalLegend.appendChild(box)
  }
})

let toggle = document.querySelector(".legend__toggle");

// modal clickinator
const moreInfo = document.querySelector("#more-info");
const modal = document.querySelector("#modal");
const close = document.querySelector("#close-modal");
const modalTabs = document.querySelectorAll(".modal-tabs li")



const AriaHide = element => {
  element.classList.remove("visible");
  element.setAttribute("aria-hidden", "true");
};

const AriaShow = element => {
  element.classList.add("visible");
  element.setAttribute("aria-hidden", "false");
}; 

const ModalLinkNav = e =>{
  for (let link of modalTabs){
    let concat = link.textContent.split(' ').map(word => word.toLowerCase()).join('-')
    let target = document.querySelector(`#modal-${concat}`)
    if (link == e.target){
      link.classList.add('active')
      AriaShow(target)
    }
    else {
      link.classList.remove('active')
      AriaHide(target)
    }
  }
}
// modal navigation
for (let link of modalTabs){
  link.addEventListener('click', e=>{ ModalLinkNav(e)})
}
// open the modal
moreInfo.onclick = () =>
  (modal.style.display = "none" ? AriaShow(modal) : AriaHide(modal));
toggle.onclick = () => {
  let body = toggle.nextElementSibling;
  body.classList.contains("visible") ? AriaHide(body): AriaShow(body)
  toggle.classList.toggle('active')
};
// close the modal by clicking the 'x' or anywhere outside of it
close.onclick = () => AriaHide(modal);
window.onclick = event => {
  if (event.target == modal) AriaHide(modal);
};

document.onkeydown = e => {
  if (modal.classList.contains("visible")) {
    if (e.key === "Escape") AriaHide(modal);
  } else if (e.target.id === moreInfo.id) {
    if (e.key === "Enter") AriaShow(modal);
  } else if (e.target === toggle) {
    e.key === "Enter" && toggle.nextElementSibling.classList.contains("visible")
      ? AriaHide(toggle.nextElementSibling)
      : AriaShow(toggle.nextElementSibling);
  }
  if (e.target.classList.contains('modal-link')){ ModalLinkNav(e) }
};
