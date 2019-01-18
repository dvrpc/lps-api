export const CreateDvrpcNavControl = (defaultExtent, map) =>{
  let navigationControl = new mapboxgl.NavigationControl()
  // button
  let button = document.createElement('button')
  button.classList.add('mapboxgl-ctrl-icon')
  button.classList.add('mapboxgl-ctrl-dvrpc')
  button.setAttribute('aria-label', 'Default Extent')
  button.type = 'button'
  button.addEventListener('click', e=>{
    map.flyTo({
      zoom: defaultExtent.zoom,
      center: defaultExtent.center
    })
  })

  // image 
  let icon = document.createElement('img')
  icon.src = '../img/dvrpc-bug.png'
  icon.alt = 'DVRPC Alternative Logo'
  button.appendChild(icon)

  navigationControl._extent = button
  navigationControl._container.appendChild(button)

  map.addControl(navigationControl)
}