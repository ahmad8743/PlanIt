import { GOOGLE_MAPS_API_KEY } from "./creds.js";

document.addEventListener("DOMContentLoaded", async () => {
  let map;
  let mark = null;

  (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: GOOGLE_MAPS_API_KEY,
    v: "weekly",
  });

  async function initMap() {
    // Preload both libs (visualization still works, just deprecated in future)
    const [{ Map }] = await Promise.all([
      google.maps.importLibrary("maps"),
      google.maps.importLibrary("visualization"),
    ]);

    map = new Map(document.getElementById("map"), {
      center: { lat: 38.6479166, lng: -90.3099897 },
      zoom: 15.2,
      streetViewControl: false,
      mapTypeControl: false,
      clickableIcons: false,
      fullscreenControl: false
    });

    map.addListener("click", (event) => {
      if (mark) mark.setMap(null);
      if (typeof addMarker === "function") mark = addMarker(event.latLng);
      if (typeof markerValues === "function")
        lastKnownMarkerVals = new markerValues(event.latLng.lat(), event.latLng.lng());
    });
  }

  await initMap();

  // ✅ Rename file to avoid ad blockers: e.g., points.json instead of heatmap_*.json
  fetch("heatmap_test.json") // <— was "heatmap_test.json"
    .then(r => r.json())
    .then(points => {
      // Coerce + validate
      const clean = points
        .map(p => ({
          lat: Number(p.latitude ?? p.lat),
          lng: Number(p.longitude ?? p.lng),
          weight: Number(p.weight ?? 1)
        }))
        .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));

      if (clean.length === 0) {
        console.warn("No valid points to render.");
        return; // avoid fit/center NaN
      }

      const data = clean.map(p => ({
        location: new google.maps.LatLng(p.lat, p.lng),
        weight: p.weight
      }));

      // Fit to data safely
      const bounds = new google.maps.LatLngBounds();
      data.forEach(({ location }) => bounds.extend(location));
      if (!bounds.isEmpty?.() && typeof bounds.getCenter === "function") {
        map.fitBounds(bounds);
      }

      // Heatmap (works today; shows deprecation warning)
      new google.maps.visualization.HeatmapLayer({
        data,
        map,
        radius: 28,
        opacity: 0.7,
        maxIntensity: 1
      });
    })
    .catch(err => console.error("Failed to load JSON (check ad-blockers & path):", err));
});