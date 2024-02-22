import { useRef, useState } from "react";
import Map, { MapRef, useMap } from "react-map-gl";
import GL from "@luma.gl/constants";
// @ts-ignore
import { MapboxLayer } from "@deck.gl/mapbox";
// @ts-ignore
import { TileLayer } from "@deck.gl/geo-layers";
import { DecodedLayer } from "@vizzuality/layer-manager-layers-deckgl";
import { Layer, LayerManager } from "@vizzuality/layer-manager-react";
import PluginMapboxGl from "@vizzuality/layer-manager-plugin-mapboxgl";
import CartoProvider from "@vizzuality/layer-manager-provider-carto";
import "./App.css";

const cartoProvider = new CartoProvider();

const alert = {
  type: "deck" as const,
  id: "integrad alerts",
  deck: [
    new MapboxLayer({
      decodeFunction: `
    float r = color.r * 255.;
    alpha = r;
`,
      decodeParams: {},
      id: "integrated",
      type: TileLayer,
      data: "https://tiles.globalforestwatch.org/gfw_integrated_alerts/latest/default/{z}/{x}/{y}.png",
      tileSize: 256,
      visible: true,
      refinementStrategy: "no-overlap",
      opacity: 1,
      renderSubLayers: (sl: any) => {
        const {
          id: subLayerId,
          data,
          tile,
          visible,
          opacity: _opacity,
          decodeFunction: dFunction,
          decodeParams: dParams,
        } = sl;

        const {
          z,
          bbox: { west, south, east, north },
        } = tile;

        if (data) {
          return new DecodedLayer({
            id: subLayerId,
            image: data,
            bounds: [west, south, east, north],
            textureParameters: {
              [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
              [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
              [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
              [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
            },
            zoom: z,
            visible,
            opacity: _opacity,
            decodeParams: dParams,
            decodeFunction: dFunction,
            updateTriggers: {
              decodeParams: dParams,
              decodeFunction: dFunction,
            },
          });
        }
        return null;
      },
      minZoom: 3,
      maxZoom: 12,
    } as any),
  ],
};

function App() {
  const [viewState, setViewState] = useState({
    longitude: -50,
    latitude: -10,
    zoom: 6,
  });
  const mapRef = useRef<MapRef | null>(null);
  const [ready, setReady] = useState(false);
  return (
    <>
      <Map
        {...viewState}
        ref={(_map) => {
          if (_map) mapRef.current = _map.getMap() as unknown as MapRef;
        }}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{
          height: "800px",
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken="pk.eyJ1IjoicmVzb3VyY2V3YXRjaCIsImEiOiJjajFlcXZhNzcwMDBqMzNzMTQ0bDN6Y3U4In0.FRcIP_yusVaAy0mwAX1B8w"
        onLoad={() => {
          setReady(true);
        }}
      >
        {ready && <LayerManagerWrapper />}
      </Map>
    </>
  );
}

function LayerManagerWrapper() {
  const { current: map } = useMap();
  return map && map.getMap() ? (
    <LayerManager
      map={map.getMap()}
      plugin={PluginMapboxGl}
      providers={{
        [cartoProvider.name]: cartoProvider.handleData,
      }}
    >
      <Layer {...alert} />
    </LayerManager>
  ) : (
    <></>
  );
}

export default App;
