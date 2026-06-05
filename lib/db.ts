import fs from 'fs';
import path from 'path';

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: 'villas' | 'studios' | 'front_mer' | 'appartements' | string;
  pricePerDay: number;
  images: string[];
  location: string;
  capacity: number;
  amenities: string[];
  available: boolean;
}

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  clientName: string;
  clientPhone: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface DatabaseSchema {
  listings: Listing[];
  bookings: Booking[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

const DEFAULT_LISTINGS: Listing[] = [
  {
    id: "l_1",
    title: "Villa El-Marsa - Front de Mer",
    description: "Sublime villa pied dans l'eau avec accès direct à la magnifique plage de Ghazaouet. Équipée de tout le confort moderne, avec une terrasse exceptionnelle offrant une vue panoramique sur mer, idéale pour des vacances ressourçantes en famille.",
    category: "front_mer",
    pricePerDay: 15000,
    images: ["https://picsum.photos/seed/marsa/800/600"],
    location: "Plage de Ghazaouet, Tlemcen",
    capacity: 8,
    amenities: ["Climatisation", "Parking privé", "Accès direct plage", "Wi-Fi haut débit", "Cuisine équipée", "Barbecue"],
    available: true
  },
  {
    id: "l_2",
    title: "Studio Le Cap - Vue Panoramique",
    description: "Charmant studio moderne et cozy situé sur les hauteurs de Ghazaouet, offrant une vue panoramique imprenable sur le port et la mer Méditerranée. Parfait pour les couples ou voyageurs en solo souhaitant explorer la côte.",
    category: "studios",
    pricePerDay: 6000,
    images: ["https://picsum.photos/seed/lecap/800/600"],
    location: "Les Hauteurs - Ghazaouet, Tlemcen",
    capacity: 2,
    amenities: ["Climatisation", "Wi-Fi", "Télévision Smart", "Machine à café", "Balcon vue mer"],
    available: true
  },
  {
    id: "l_3",
    title: "Appartement Familial El-Yasmine",
    description: "Spacieux appartement F4 situé en plein centre-ville de Ghazaouet, à proximité de tous les commerces, restaurants et à seulement 5 minutes en voiture de la plage. Très calme, sécurisé et idéal pour les longs séjours.",
    category: "appartements",
    pricePerDay: 8500,
    images: ["https://picsum.photos/seed/yasmine/800/600"],
    location: "Centre-ville, Ghazaouet",
    capacity: 6,
    amenities: ["Wi-Fi", "Machine à laver", "Cuisine équipée", "Ascenseur", "Télévision", "Parking public"],
    available: true
  },
  {
    id: "l_4",
    title: "Villa Serena avec Piscine",
    description: "Magnifique villa d'architecte disposant d'une grande piscine privée sans vis-à-vis, d'un jardin fleuri luxuriant et d'un espace barbecue abrité. Nichée dans un quartier calme et résidentiel de Ghazaouet.",
    category: "villas",
    pricePerDay: 22000,
    images: ["https://picsum.photos/seed/serena/800/600"],
    location: "Quartier Résidentiel, Ghazaouet",
    capacity: 10,
    amenities: ["Piscine privée", "Grand Jardin", "Climatisation", "Wi-Fi gratuit", "Garage fermé", "Barbecue XXL"],
    available: true
  }
];

function initializeDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const freshDb: DatabaseSchema = {
      listings: DEFAULT_LISTINGS,
      bookings: [
        {
          id: "b_1",
          listingId: "l_1",
          listingTitle: "Villa El-Marsa - Front de Mer",
          clientName: "Mohamed Benali",
          clientPhone: "0550123456",
          startDate: "2026-07-10",
          endDate: "2026-07-17",
          totalPrice: 105000,
          status: "confirmed",
          createdAt: new Date("2026-06-01T10:00:00Z").toISOString()
        },
        {
          id: "b_2",
          listingId: "l_2",
          listingTitle: "Studio Le Cap - Vue Panoramique",
          clientName: "Amine Sahnoun",
          clientPhone: "0771987654",
          startDate: "2026-06-20",
          endDate: "2026-06-23",
          totalPrice: 18000,
          status: "pending",
          createdAt: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(freshDb, null, 2), 'utf-8');
  }
}

export function readDb(): DatabaseSchema {
  initializeDatabase();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content) as DatabaseSchema;
  } catch (error) {
    console.error("Error reading database file, returning empty schema:", error);
    return { listings: [], bookings: [] };
  }
}

export function writeDb(db: DatabaseSchema) {
  initializeDatabase();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

// Helper methods
export function getListings(): Listing[] {
  return readDb().listings;
}

export function addListing(listing: Omit<Listing, 'id' | 'available'>): Listing {
  const db = readDb();
  const newListing: Listing = {
    ...listing,
    id: `l_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    available: true
  };
  db.listings.push(newListing);
  writeDb(db);
  return newListing;
}

export function updateListing(id: string, updates: Partial<Listing>): Listing | null {
  const db = readDb();
  const index = db.listings.findIndex(l => l.id === id);
  if (index === -1) return null;

  db.listings[index] = {
    ...db.listings[index],
    ...updates
  };
  writeDb(db);
  return db.listings[index];
}

export function deleteListing(id: string): boolean {
  const db = readDb();
  const initialLength = db.listings.length;
  db.listings = db.listings.filter(l => l.id !== id);
  if (db.listings.length === initialLength) return false;
  writeDb(db);
  return true;
}

export function getBookings(): Booking[] {
  return readDb().bookings;
}

export function createBooking(booking: Omit<Booking, 'id' | 'status' | 'createdAt'>): Booking {
  const db = readDb();
  const newBooking: Booking = {
    ...booking,
    id: `b_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.bookings.push(newBooking);
  writeDb(db);
  return newBooking;
}

export function updateBooking(id: string, updates: Partial<Booking>): Booking | null {
  const db = readDb();
  const index = db.bookings.findIndex(b => b.id === id);
  if (index === -1) return null;

  db.bookings[index] = {
    ...db.bookings[index],
    ...updates
  };
  writeDb(db);
  return db.bookings[index];
}

export function deleteBooking(id: string): boolean {
  const db = readDb();
  const initialLength = db.bookings.length;
  db.bookings = db.bookings.filter(b => b.id !== id);
  if (db.bookings.length === initialLength) return false;
  writeDb(db);
  return true;
}
