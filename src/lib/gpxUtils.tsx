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

export async function processAndCropGpx(file: File): Promise<string> {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");
  if (
    xmlDoc.getElementsByTagName("parsererror").length ||
    xmlDoc.documentElement.localName !== "gpx"
  ) {
    throw new Error("Fichier GPX invalide");
  }
  const trkpts = Array.from(xmlDoc.getElementsByTagName("trkpt"));

  const points = trkpts.map((pt) => {
    const lat = parseFloat(pt.getAttribute("lat") ?? "");
    const lon = parseFloat(pt.getAttribute("lon") ?? "");
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      Math.abs(lat) > 90 ||
      Math.abs(lon) > 180
    ) {
      throw new Error("Coordonnées GPX invalides");
    }
    return { lat, lon, node: pt };
  });

  // Preserve the inherited short-track fallback pending a privacy decision.
  if (points.length < 3) return text;

  let distFromStart = 0;
  const distancesFromStart: number[] = [0];
  points.forEach((point, index) => {
    const previous = points[index - 1];
    if (!previous) return;
    // A gap between recorded segments is not distance actually traveled.
    if (previous.node.parentElement === point.node.parentElement) {
      distFromStart += getDistanceFromLatLonInMeters(
        previous.lat,
        previous.lon,
        point.lat,
        point.lon,
      );
    }
    distancesFromStart.push(distFromStart);
  });

  const totalDist = distFromStart;

  // Rogne 200m au début et 200m à la fin pour la vie privée
  const filteredTrkpts = points.filter((_, index) => {
    const dStart = distancesFromStart[index];
    if (dStart === undefined) return false;
    const dEnd = totalDist - dStart;
    return dStart >= 200 && dEnd >= 200;
  });

  if (filteredTrkpts.length < 2) return text;

  // Remove discarded points from every segment without moving retained points.
  const retained = new Set(filteredTrkpts.map((point) => point.node));
  for (const point of trkpts) {
    if (!retained.has(point)) point.remove();
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
}
