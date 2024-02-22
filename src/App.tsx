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
    float agreementValue = alpha * 255.;
    float r = color.r * 255.;
    float g = color.g * 255.;
    float b = color.b * 255.;
    float day = r * 255. + g;
    float confidence = floor(b / 100.) - 1.;
    float intensity = mod(b, 100.) * 150.;
    if (
      day > 0. &&
      day >= startDayIndex &&
      day <= endDayIndex &&
      agreementValue > 0.
    )
    {
      if (intensity > 255.) {
        intensity = 255.;
      }
      float confidenceValue = 0.;
      if (confirmedOnly > 0.) {
        confidenceValue = 255.;
      }
      if (agreementValue == 4. || agreementValue == 16. || agreementValue == 64.) {
        color.r = 237. / 255.;
        color.g = 164. / 255.;
        color.b = 194. / 255.;
        alpha = (intensity -confidenceValue) / 255.;
      } else if (agreementValue == 8. || agreementValue == 32. || agreementValue ==  128.){
        color.r = 220. / 255.;
        color.g = 102. / 255.;
        color.b = 153. / 255.;
        alpha = intensity / 255.;
      } else {
        color.r = 201. / 255.;
        color.g = 42. / 255.;
        color.b = 109. / 255.;
        alpha = intensity / 255.;
      }
    } else {
      alpha = 0.;
    }
`,
      decodeParams: {
        startDayIndex: 2785,
        endDayIndex: 3334,
        confirmedOnly: 0,
      },
      id: "integrated",
      type: TileLayer,
      data: "https://tiles.globalforestwatch.org/umd_glad_landsat_alerts/latest/default/{z}/{x}/{y}.png",
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
