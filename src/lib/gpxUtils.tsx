// src/lib/gpxUtils.ts

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const GPX_NS = "http://www.topografix.com/GPX/1/1";
const CROP_METERS = 200;
const TOO_SHORT =
  "Le tracé GPX est trop court ou trop peu détaillé pour masquer le départ et l’arrivée.";

export async function processAndCropGpx(file: File): Promise<string> {
  if (file.size > 15 * 1024 * 1024) throw new Error("Fichier GPX trop volumineux (15 Mo maximum).");
  const source = await file.text();
  if (/<!DOCTYPE/i.test(source)) throw new Error("Fichier GPX invalide");
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(source, "text/xml");
  if (
    xmlDoc.getElementsByTagName("parsererror").length ||
    xmlDoc.documentElement.localName !== "gpx"
  ) {
    throw new Error("Fichier GPX invalide");
  }

  const children = (node: Element, name: string) =>
    Array.from(node.children).filter(
      (child) =>
        child.localName === name && child.namespaceURI === xmlDoc.documentElement.namespaceURI,
    );
  const segments = children(xmlDoc.documentElement, "trk").flatMap((track) =>
    children(track, "trkseg").map((segment) =>
      children(segment, "trkpt").map((point) => {
        const rawLat = point.getAttribute("lat");
        const rawLon = point.getAttribute("lon");
        const lat = rawLat?.trim() ? Number(rawLat) : NaN;
        const lon = rawLon?.trim() ? Number(rawLon) : NaN;
        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          Math.abs(lat) > 90 ||
          Math.abs(lon) > 180
        ) {
          throw new Error("Coordonnées GPX invalides");
        }
        const rawElevation = children(point, "ele")[0]?.textContent?.trim();
        const ele = rawElevation ? Number(rawElevation) : NaN;
        return { lat, lon, ele, distance: 0 };
      }),
    ),
  );

  let totalDistance = 0;
  for (const points of segments) {
    points.forEach((point, index) => {
      const previous = points[index - 1];
      // Segment gaps are not traveled distance.
      if (previous) {
        totalDistance += getDistanceFromLatLonInMeters(
          previous.lat,
          previous.lon,
          point.lat,
          point.lon,
        );
      }
      point.distance = totalDistance;
    });
  }

  const retained = segments
    .map((points) =>
      points.filter(
        (point) => point.distance >= CROP_METERS && totalDistance - point.distance >= CROP_METERS,
      ),
    )
    .filter((points) => points.length >= 2);
  // Never fall back to the unredacted file, even for sparse or very short tracks.
  if (
    !retained.some((points) =>
      points.some(
        (point, index) =>
          index > 0 &&
          (point.lat !== points[index - 1]?.lat || point.lon !== points[index - 1]?.lon),
      ),
    )
  ) {
    throw new Error(TOO_SHORT);
  }

  // Rebuild from a narrow allowlist. No raw metadata, device names, waypoints,
  // routes, timestamps, extensions, original bounds or custom attributes survive.
  const output = document.implementation.createDocument(GPX_NS, "gpx", null);
  const root = output.documentElement;
  root.setAttribute("version", "1.1");
  root.setAttribute("creator", "Chevaliers 58");
  const track = output.createElementNS(GPX_NS, "trk");
  root.appendChild(track);
  for (const points of retained) {
    const segment = output.createElementNS(GPX_NS, "trkseg");
    track.appendChild(segment);
    for (const point of points) {
      const node = output.createElementNS(GPX_NS, "trkpt");
      node.setAttribute("lat", String(point.lat));
      node.setAttribute("lon", String(point.lon));
      if (Number.isFinite(point.ele)) {
        const elevation = output.createElementNS(GPX_NS, "ele");
        elevation.textContent = String(point.ele);
        node.appendChild(elevation);
      }
      segment.appendChild(node);
    }
  }
  return new XMLSerializer().serializeToString(output);
}
