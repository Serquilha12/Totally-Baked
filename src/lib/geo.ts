/**
 * Totally Baked Pemba - Módulo de Geolocalização e Cálculo de Entregas
 * Rua da ANE, Bairro Alto Gingone, Cidade de Pemba, Cabo Delgado, Moçambique
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface NeighborhoodInfo {
  name: string;
  coords: Coordinates;
  baseDeliveryFee: number;
  estimatedMinutes: number;
}

export const STORE_ADDRESS = 'Rua da ANE, Bairro Alto Gingone, Pemba, Cabo Delgado';
export const STORE_PHONE = '+258 84 595 8546';
export const STORE_WHATSAPP = '258845958546';

// Coordenadas oficiais da Totally Baked Pemba (Rua da ANE, Bairro Alto Gingone)
export const TOTALLY_BAKED_COORDS: Coordinates = {
  lat: -12.9732,
  lng: 40.5178,
};

// Aliases para compatibilidade
export const STORE_LOCATION = TOTALLY_BAKED_COORDS;
export const calculateDistanceKm = calculateHaversineDistance;
export const calculateDeliveryFee = calculateDelivery;

// Mapeamento dos Bairros Principais de Pemba
export const PEMBA_NEIGHBORHOODS: Record<string, NeighborhoodInfo> = {
  'Alto Gingone': {
    name: 'Alto Gingone (Zona da Pastelaria)',
    coords: { lat: -12.9800, lng: 40.5200 },
    baseDeliveryFee: 100,
    estimatedMinutes: 20,
  },
  'Centro': {
    name: 'Centro da Cidade (Baixa)',
    coords: { lat: -12.9680, lng: 40.5180 },
    baseDeliveryFee: 80,
    estimatedMinutes: 20,
  },
  'Centro da Cidade': {
    name: 'Centro da Cidade (Baixa)',
    coords: { lat: -12.9680, lng: 40.5180 },
    baseDeliveryFee: 80,
    estimatedMinutes: 20,
  },
  'Wimbi': {
    name: 'Praia do Wimbi',
    coords: { lat: -12.9667, lng: 40.5500 },
    baseDeliveryFee: 150,
    estimatedMinutes: 32,
  },
  'Expansão': {
    name: 'Expansão',
    coords: { lat: -12.9850, lng: 40.5050 },
    baseDeliveryFee: 120,
    estimatedMinutes: 25,
  },
  'Cariacó': {
    name: 'Cariacó',
    coords: { lat: -12.9600, lng: 40.5100 },
    baseDeliveryFee: 100,
    estimatedMinutes: 25,
  },
  'Natite': {
    name: 'Natite',
    coords: { lat: -12.9550, lng: 40.5250 },
    baseDeliveryFee: 120,
    estimatedMinutes: 28,
  },
  'Paquitequete': {
    name: 'Paquitequete',
    coords: { lat: -12.9480, lng: 40.5150 },
    baseDeliveryFee: 130,
    estimatedMinutes: 30,
  },
  'Maringanha': {
    name: 'Maringanha',
    coords: { lat: -12.9900, lng: 40.5600 },
    baseDeliveryFee: 180,
    estimatedMinutes: 38,
  },
  'Chuiba': {
    name: 'Chuiba',
    coords: { lat: -13.0100, lng: 40.5500 },
    baseDeliveryFee: 200,
    estimatedMinutes: 42,
  },
  'Takeaway': {
    name: 'Levantamento na Loja (Rua da ANE, Alto Gingone)',
    coords: { lat: -12.9732, lng: 40.5178 },
    baseDeliveryFee: 0,
    estimatedMinutes: 15,
  },
};

/**
 * Calcula a distância em linha reta entre dois pontos na Terra usando a fórmula de Haversine.
 * Retorna a distância em Quilómetros (km).
 */
export function calculateHaversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcula a taxa de entrega e o tempo estimado para qualquer ponto de Pemba
 */
export function calculateDelivery(
  customerCoords?: Coordinates,
  neighborhoodName?: string
): { fee: number; distanceKm: number; estimatedMinutes: number; neighborhood: string } {
  if (neighborhoodName === 'Takeaway' || neighborhoodName === 'Levantamento na Loja') {
    return {
      fee: 0,
      distanceKm: 0,
      estimatedMinutes: 15,
      neighborhood: 'Levantamento na Loja (Rua da ANE, Alto Gingone)',
    };
  }

  // Se informou coordenadas GPS reais válidas
  if (customerCoords && typeof customerCoords.lat === 'number' && typeof customerCoords.lng === 'number' && !isNaN(customerCoords.lat) && !isNaN(customerCoords.lng)) {
    const distanceKm = calculateHaversineDistance(TOTALLY_BAKED_COORDS, customerCoords);

    let fee = Math.max(80, Math.round(80 + distanceKm * 20));
    fee = Math.ceil(fee / 10) * 10;

    const estimatedMinutes = Math.min(60, Math.max(20, Math.round(20 + distanceKm * 3.5)));
    const neighborhood = neighborhoodName || 'Localização GPS Personalizada';
    return { fee, distanceKm, estimatedMinutes, neighborhood };
  }

  // Fallback por Bairro selecionado
  if (neighborhoodName && PEMBA_NEIGHBORHOODS[neighborhoodName]) {
    const info = PEMBA_NEIGHBORHOODS[neighborhoodName];
    const distanceKm = calculateHaversineDistance(TOTALLY_BAKED_COORDS, info.coords);
    return {
      fee: info.baseDeliveryFee,
      distanceKm,
      estimatedMinutes: info.estimatedMinutes,
      neighborhood: info.name,
    };
  }

  // Padrão Cidade de Pemba
  return {
    fee: 100,
    distanceKm: 2.5,
    estimatedMinutes: 25,
    neighborhood: 'Cidade de Pemba',
  };
}
