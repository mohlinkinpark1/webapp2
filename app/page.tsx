'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Wifi, 
  Tv, 
  Coffee, 
  Car, 
  SlidersHorizontal, 
  Sparkles, 
  Plus, 
  Search, 
  Lock, 
  CheckCircle, 
  TrendingUp, 
  Home, 
  DollarSign, 
  X, 
  Menu, 
  Phone, 
  ExternalLink, 
  ChevronRight, 
  Info, 
  ShieldCheck,
  Check,
  AlertCircle,
  Palmtree,
  Waves
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Listing, Booking } from '@/lib/db';

export default function GhazaouetLocApp() {
  // Client listings state loaded from API
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Selected listing for reservation sheet
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Booking Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState('');

  // Admin section state
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [stats, setStats] = useState<any>(null);
  
  // Option C: Hidden easter egg / query parameter triggers
  const [showAdminTrigger, setShowAdminTrigger] = useState(false);
  const [footerClicks, setFooterClicks] = useState(0);
  
  // Admin form state for manual listing creation
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('villas');
  const [newPrice, setNewPrice] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [addingListingLoading, setAddingListingLoading] = useState(false);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');

  const getRobustUrl = (path: string): string => {
    let origin = '';
    if (typeof window !== 'undefined') {
      if (window.location.origin && window.location.origin !== 'null') {
        origin = window.location.origin;
      } else if (window.location.href) {
        try {
          const urlObj = new URL(window.location.href);
          if (urlObj.protocol.startsWith('http')) {
            origin = urlObj.origin;
          }
        } catch (err) {
          // Ignore
        }
      }
    }
    if (!origin || origin === 'null') {
      return path;
    }
    const formattedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return `${formattedOrigin}${formattedPath}`;
  };

  // Fetch listings on mount and when booking/admin triggers changes
  const fetchListings = async () => {
    try {
      // By default get public listings, but if authenticated get all including hidden
      const headers: HeadersInit = {};
      if (isAdminAuthenticated && adminToken) {
        headers['X-Admin-Token'] = adminToken;
      }
      
      const res = await fetch(getRobustUrl(`/listings${isAdminAuthenticated ? '?all=true' : ''}`), { headers });
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (e) {
      console.error('Error fetching listings:', e);
    } finally {
      setLoadingListings(false);
    }
  };

  // Fetch bookings & stats only if admin authenticated
  const fetchAdminData = async (tokenToCheck = adminToken) => {
    try {
      const resBookings = await fetch(getRobustUrl('/bookings'), {
        headers: { 'X-Admin-Token': tokenToCheck }
      });
      const resStats = await fetch(getRobustUrl('/stats'), {
        headers: { 'X-Admin-Token': tokenToCheck }
      });

      if (resBookings.ok && resStats.ok) {
        const bData = await resBookings.json();
        const sData = await resStats.json();
        setBookings(bData);
        setStats(sData);
        setIsAdminAuthenticated(true);
        setAuthError('');
        if (typeof window !== 'undefined') {
          localStorage.setItem('gh_admin_token', tokenToCheck);
          setShowAdminTrigger(true);
        }
      } else {
        setAuthError('Token incorrect ou expiré.');
        setIsAdminAuthenticated(false);
      }
    } catch (e) {
      setAuthError('Erreur de communication avec le serveur.');
      console.error('Error fetching admin data:', e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      await Promise.resolve();
      if (isMounted) {
        await fetchListings();
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [isAdminAuthenticated]);

  // Option C: Query parameter listener & session recovery on mount
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      // Defer execution to avoid synchronous state updates in the render phase
      await Promise.resolve();
      if (!isMounted || typeof window === 'undefined') return;

      const params = new URLSearchParams(window.location.search);
      const isParamAdmin = params.get('admin') === 'true' || window.location.hash === '#admin';
      const storedToken = localStorage.getItem('gh_admin_token');
      
      if (isParamAdmin) {
        setShowAdminTrigger(true);
      }
      
      if (storedToken) {
        setShowAdminTrigger(true);
        setAdminToken(storedToken);
        fetchAdminData(storedToken);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Booking Creation submission
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;

    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess(false);

    try {
      const response = await fetch(getRobustUrl('/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedListing.id,
          clientName,
          clientPhone,
          startDate,
          endDate
        })
      });

      if (response.ok) {
        setBookingSuccess(true);
        setClientName('');
        setClientPhone('');
        setStartDate('');
        setEndDate('');
        // Refresh listings in case of local availability state update
        fetchListings();
        if (isAdminAuthenticated) fetchAdminData();
      } else {
        const err = await response.json();
        setBookingError(err.error || 'Une erreur est survenue lors de la réservation.');
      }
    } catch (e) {
      setBookingError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Authenticate Admin
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken.trim()) return;
    fetchAdminData();
  };

  // Accept or Cancel booking
  const handleUpdateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled' | 'pending') => {
    try {
      const res = await fetch(getRobustUrl(`/bookings/${bookingId}`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error('Error updating booking:', e);
    }
  };

  // Toggle dynamic availability of listings in frontend Admin drawer
  const handleToggleListingAvailability = async (listingId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(getRobustUrl(`/listings/${listingId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken
        },
        body: JSON.stringify({ available: !currentStatus })
      });
      if (res.ok) {
        fetchListings();
        fetchAdminData();
      }
    } catch (e) {
      console.error('Error toggling listing status:', e);
    }
  };

  // Delete listing from frontend Admin drawer
  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette annonce ?')) return;
    try {
      const res = await fetch(getRobustUrl(`/listings/${listingId}`), {
        method: 'DELETE',
        headers: { 'X-Admin-Token': adminToken }
      });
      if (res.ok) {
        fetchListings();
        fetchAdminData();
      }
    } catch (e) {
      console.error('Error deleting listing:', e);
    }
  };

  // Manual create listings inside frontend Admin Drawer
  const handleAdminAddListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingListingLoading(true);
    setAdminSuccessMsg('');

    try {
      const res = await fetch(getRobustUrl('/listings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
          pricePerDay: Number(newPrice),
          location: newLocation,
          capacity: Number(newCapacity),
          images: newImageUrl ? [newImageUrl] : [],
          amenities: ["Wifi", "Climatisation"]
        })
      });

      if (res.ok) {
        setAdminSuccessMsg('Annonce publiée avec succès ! Elle apparaît instantanément sur le site.');
        setNewTitle('');
        setNewDescription('');
        setNewPrice('');
        setNewLocation('');
        setNewCapacity('4');
        setNewImageUrl('');
        fetchListings();
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur de publication.');
      }
    } catch (err) {
      alert('Erreur serveur lors de la création.');
    } finally {
      setAddingListingLoading(false);
    }
  };

  // Calculate dynamic pricing helper
  const bookingNights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const diffTime = eDate.getTime() - sDate.getTime();
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  const totalBookingCost = useMemo(() => {
    if (!selectedListing || bookingNights <= 0) return 0;
    return bookingNights * selectedListing.pricePerDay;
  }, [selectedListing, bookingNights]);

  // Filter listings based on search and category tabs
  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            l.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || l.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [listings, searchTerm, selectedCategory]);

  return (
    <div className="flex flex-col min-h-screen selection:bg-[#4f46e5]/10 selection:text-indigo-900" id="main-root">
      
      {/* Brand Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => {
            // Secret clicking on header logo can also reveal it as an easter egg!
            setFooterClicks(prev => {
              const next = prev + 1;
              if (next >= 5) {
                setShowAdminTrigger(true);
                setIsAdminPanelOpen(true);
                return 0;
              }
              return next;
            });
          }}>
            <div className="relative w-11 h-11 bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-650/10 overflow-hidden">
              <div className="flex flex-col items-center justify-center">
                <Palmtree className="w-5 h-5 text-white" />
                <Waves className="w-4 h-4 text-cyan-200 -mt-0.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 bg-indigo-50 text-[9px] font-extrabold tracking-wider text-indigo-600 rounded-md border border-indigo-100 uppercase">
                  {"Location d'exception"}
                </span>
              </div>
              <h1 className="font-display font-extrabold text-lg sm:text-2xl tracking-tight text-gray-900 leading-none mt-1">
                LOCATION GHAZAOUET
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {showAdminTrigger && (
              <div className="hidden md:flex items-center gap-2 mr-3 border-r border-gray-200 pr-5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">VPS Connecté</span>
              </div>
            )}
            {showAdminTrigger && (
              <button
                id="admin-space-btn"
                onClick={() => setIsAdminPanelOpen(true)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 border",
                  isAdminAuthenticated 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200/20 hover:bg-indigo-700"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isAdminAuthenticated ? "Espace Admin Actif" : "Espace Propriétaire"}
                </span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full" id="main-content">
        
        {/* Dynamic VPS Status Banner */}
        {showAdminTrigger && (
          <div className="mb-10 p-5 bg-indigo-50/50 border border-indigo-100/70 text-indigo-950 text-xs sm:text-sm rounded-2xl flex items-start sm:items-center gap-3.5 shadow-sm shadow-indigo-100/5 whitespace-normal" id="vps-status-card">
            <div className="p-1 px-2.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5 sm:mt-0">
              Node-Agent
            </div>
            <p className="font-sans leading-relaxed text-gray-600">
              <strong className="text-gray-900 font-semibold">Passerelle VPS Active :</strong> Cette application et ses points de terminaison d’API sont optimisés pour fonctionner sur votre VPS. L’application Android Admin se connectera directement à ces endpoints pour ajouter, modifier ou désactiver les annonces en temps réel.
            </p>
          </div>
        )}

        {/* Hero Headline */}
        <section className="text-center py-10 sm:py-16 max-w-3xl mx-auto" id="hero-headline">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100/75 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px] uppercase tracking-widest font-extrabold text-indigo-800">Coucher de soleil sur les Deux Frères</span>
          </div>
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-gray-900 tracking-tight leading-[1.05] mb-6">
            Trouvez le séjour de vos rêves à <span className="text-indigo-600 underline decoration-indigo-150 decoration-8 underline-offset-4">Ghazaouet</span>
          </h2>
          <p className="text-gray-500 text-base sm:text-lg lg:text-xl font-sans max-w-2xl mx-auto leading-relaxed">
            Découvrez nos villas d’exception en front de mer, appartements spacieux et studios cozy. Réservez instantanément votre coin de paradis algérien.
          </p>

          {/* Luxury Search Bar */}
          <div className="mt-10 max-w-xl mx-auto relative group" id="search-container">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              id="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une villa, un studio, ou un lieu (ex: Plage)..."
              className="w-full pl-12 pr-6 py-4 bg-white border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none rounded-2xl shadow-sm text-gray-800 text-sm sm:text-base font-sans transition-all placeholder:text-gray-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </section>

        {/* Categories Navigation Pills */}
        <section className="mb-10" id="categories-navigation">
          <div className="flex overflow-x-auto pb-4 scrollbar-none gap-2 justify-start sm:justify-center border-b border-gray-200" id="category-pills">
            {[
              { id: 'all', label: 'Tous les Biens' },
              { id: 'villas', label: 'Villas de Luxe' },
              { id: 'studios', label: 'Studios Indépendants' },
              { id: 'front_mer', label: 'Pied dans l’eau' },
              { id: 'appartements', label: 'Appartements' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "relative px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shrink-0 select-none",
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "bg-white text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50/50"
                )}
              >
                {cat.label}
                {selectedCategory === cat.id && (
                  <motion.div 
                    layoutId="activeCategoryDot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Listings Section */}
        <section className="mb-16" id="listings-grid-section">
          {loadingListings ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">Chargement des hébergements de Ghazaouet...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
              <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-display font-medium text-lg text-gray-900 mb-2">Aucun hébergement trouvé</h3>
              <p className="text-gray-400 font-sans text-sm mb-6 leading-relaxed">
                Aucune annonce ne correspond à vos critères ou n’est actuellement activée par l’administration. 
              </p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all font-sans"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="listings-grid">
              {filteredListings.map((listing) => (
                <motion.article
                  layout
                  id={`listing-card-${listing.id}`}
                  key={listing.id}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden group hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full shadow-sm"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Image wrap banner */}
                  <div className="relative h-64 bg-gray-50 overflow-hidden shrink-0">
                    <Image
                      src={listing.images[0] || "https://picsum.photos/seed/villa/800/600"}
                      alt={listing.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Floating pill overlays */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                       <span className="px-3 py-1 bg-white/95 backdrop-blur-sm shadow-sm text-indigo-700 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border border-gray-105">
                        {listing.category === 'front_mer' ? "Pied dans l’eau" : listing.category === 'villas' ? "Villa de luxe" : listing.category === 'studios' ? "Studio Cozy" : listing.category === 'appartements' ? "Appartement" : listing.category}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4">
                      {listing.available ? (
                        <span className="px-3 py-1 bg-emerald-500/95 text-white font-semibold text-[10px] uppercase rounded-full shadow-md tracking-wider">
                          Disponible
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-400/90 text-white font-semibold text-[10px] uppercase rounded-full shadow-md tracking-wider">
                          Complet ou Indisponible
                        </span>
                      )}
                    </div>

                    {/* Price banner */}
                    <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm text-white px-3.5 py-2 rounded-xl border border-white/5 shadow-md">
                      <span className="font-display font-bold text-base sm:text-lg">{listing.pricePerDay.toLocaleString()} DA</span>
                      <span className="text-[10px] text-gray-300 font-sans tracking-wide"> / nuit</span>
                    </div>
                  </div>

                  {/* Body elements */}
                  <div className="p-6 flex flex-col flex-grow bg-white">
                    <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-semibold mb-2" id={`card-loc-${listing.id}`}>
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{listing.location}</span>
                    </div>
                    
                    <h3 className="font-display font-semibold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors mb-3 leading-tight">
                      {listing.title}
                    </h3>
                    
                    <p className="text-gray-400 font-sans text-xs sm:text-sm line-clamp-3 mb-6 leading-relaxed flex-grow">
                      {listing.description}
                    </p>

                    {/* Footer amenities & action */}
                    <div className="border-t border-gray-100 pt-4 mt-auto">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-150">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>Max {listing.capacity} pers.</span>
                        </div>
                        
                        <button
                          disabled={!listing.available}
                          onClick={() => {
                            setSelectedListing(listing);
                            setBookingSuccess(false);
                            setBookingError('');
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300",
                            listing.available 
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 hover:shadow-lg cursor-pointer"
                              : "bg-gray-100 text-gray-400 border border-transparent cursor-not-allowed"
                          )}
                        >
                          {listing.available ? "Réserver" : "Indisponible"}
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Footer copyright */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto py-12" id="app-footer-brand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="cursor-pointer select-none" onClick={() => {
            // Option C: Multiple clicks to unlock
            setFooterClicks(prev => {
              const nextClicks = prev + 1;
              if (nextClicks >= 5) {
                setShowAdminTrigger(true);
                setIsAdminPanelOpen(true);
                return 0;
              }
              return nextClicks;
            });
          }}>
            <h4 className="font-display font-semibold text-white text-md tracking-wider uppercase mb-1">LOCATION GHAZAOUET</h4>
            <p className="text-slate-500 text-xs">{"Villas d'exception et réservation de vacances directes."}</p>
          </div>
          <div className="text-slate-500 text-xs font-mono space-y-1">
            <p>© 2026 LOCATION GHAZAOUET. Tous droits réservés.</p>
            <p className="text-[10px] text-slate-650">Locations de vacances à Ghazaouet.</p>
          </div>
        </div>
      </footer>

      {/* Dynamic Slide-Over Booking Panel */}
      <AnimatePresence>
        {selectedListing && (
          <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="booking-slider" role="dialog" aria-modal="true" id="booking-modal-overlay">
            <div className="absolute inset-0 overflow-hidden">
              {/* Overlay background */}
              <motion.div 
                className="absolute inset-0 bg-gray-950/45 backdrop-blur-xs transition-opacity"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedListing(null)}
              />

              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <motion.div 
                  className="pointer-events-auto w-screen max-w-md"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                >
                  <div className="flex h-full flex-col overflow-y-auto bg-[#F9FAFB] shadow-2xl border-l border-gray-100" id="booking-drawer-inner">
                    
                    {/* Header banner */}
                    <div className="bg-slate-950 px-6 py-6 text-white relative">
                      <button
                        onClick={() => setSelectedListing(null)}
                        className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] tracking-widest font-extrabold uppercase text-indigo-400 bg-indigo-500/10 px-2.5 py-1.5 border border-indigo-500/20 rounded-md">
                        Formulaire de Réservation
                      </span>
                      <h3 className="font-display font-bold text-xl text-white mt-4 tracking-tight leading-tight">
                        {selectedListing.title}
                      </h3>
                      <p className="text-slate-300 font-sans text-xs mt-1.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                        {selectedListing.location}
                      </p>
                    </div>

                    {/* Booking Form content */}
                    <div className="flex-1 px-6 py-6 overflow-y-auto">
                      
                      {bookingSuccess ? (
                        <div className="text-center py-10 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm" id="booking-success-msg">
                          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                            <Check className="w-6 h-6 text-emerald-600" />
                          </div>
                          <h4 className="font-display font-medium text-lg text-gray-900 mb-1">Demande Enregistrée!</h4>
                          <p className="text-emerald-800 text-xs font-semibold bg-emerald-50 py-1 px-2.5 rounded-full inline-block border border-emerald-200 mb-4">
                            Statut : En attente de confirmation
                          </p>
                          <p className="text-gray-500 text-sm leading-relaxed mb-6 font-sans">
                            Votre réservation pour la villa/studio a été transmise avec succès à l’administrateur. Il pourra la valider immédiatement via l’application Android.
                          </p>
                          <button
                            onClick={() => setSelectedListing(null)}
                            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
                          >
                            Fermer
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleCreateBooking} className="space-y-6" id="reservation-client-form">
                          
                          {bookingError && (
                            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <p className="font-semibold">{bookingError}</p>
                            </div>
                          )}

                          {/* Item Summary Preview */}
                          <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-3">
                            <div className="relative w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                              <Image 
                                src={selectedListing.images[0]} 
                                alt="" 
                                fill 
                                className="object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-400 uppercase font-sans tracking-wider">Tarification</p>
                              <p className="text-gray-800 font-display font-semibold text-sm leading-tight mt-0.5">{selectedListing.title}</p>
                              <p className="text-indigo-700 font-semibold text-xs mt-1 bg-indigo-50/50 py-0.5 px-2.5 rounded-xl border border-indigo-100 inline-block">
                                {selectedListing.pricePerDay.toLocaleString()} DA / nuit
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5" htmlFor="client_name">Nom Complet</label>
                              <input
                                required
                                id="client_name"
                                type="text"
                                placeholder="Votre nom et prénom..."
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none rounded-2xl text-gray-800 text-sm font-sans transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5" htmlFor="client_phone">Téléphone portable (Algérie)</label>
                              <input
                                required
                                id="client_phone"
                                type="tel"
                                placeholder="ex: 0550 12 34 56"
                                value={clientPhone}
                                onChange={(e) => setClientPhone(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none rounded-2xl text-gray-800 text-sm font-sans transition-all"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5" htmlFor="date_start">Arrivée</label>
                                <input
                                  required
                                  id="date_start"
                                  type="date"
                                  min={new Date().toISOString().split('T')[0]}
                                  value={startDate}
                                  onChange={(e) => setStartDate(e.target.value)}
                                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none rounded-2xl text-gray-800 text-xs sm:text-sm font-sans transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5" htmlFor="date_end">Départ</label>
                                <input
                                  required
                                  id="date_end"
                                  type="date"
                                  min={startDate || new Date().toISOString().split('T')[0]}
                                  value={endDate}
                                  onChange={(e) => setEndDate(e.target.value)}
                                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none rounded-2xl text-gray-800 text-xs sm:text-sm font-sans transition-all"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Dynamic Pricing Calculation Box */}
                          {bookingNights > 0 && (
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-3xl space-y-2">
                              <div className="flex justify-between items-center text-xs text-gray-400 font-sans">
                                <span>Durée du séjour</span>
                                <span className="font-semibold text-gray-800">{bookingNights} nuit{bookingNights > 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-gray-400 font-sans">
                                <span>Tarif à la nuitée</span>
                                <span className="font-semibold text-gray-800">{selectedListing.pricePerDay.toLocaleString()} DA</span>
                              </div>
                              <div className="h-px bg-gray-200/60 my-2" />
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 text-xs font-bold uppercase tracking-widest">Montant Total</span>
                                <span className="text-indigo-600 font-display font-extrabold text-lg">{totalBookingCost.toLocaleString()} DA</span>
                              </div>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={bookingLoading || (bookingNights <= 0 && startDate !== '')}
                            className={cn(
                              "w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-white cursor-pointer",
                              bookingLoading || (bookingNights <= 0 && startDate !== '')
                                ? "bg-gray-300 cursor-not-allowed text-gray-400 shadow-none"
                                : "bg-indigo-650 hover:bg-indigo-700 shadow-indigo-150"
                            )}
                          >
                            {bookingLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Enregistrement...</span>
                              </>
                            ) : (
                              <>
                                <Calendar className="w-4 h-4" />
                                <span>Demander la réservation</span>
                              </>
                            )}
                          </button>
                        </form>
                      )}

                    </div>
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Slide-Over Admin Area Drawer */}
      <AnimatePresence>
        {isAdminPanelOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden" id="admin-panel-slider" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
              
              {/* Overlay gray screen */}
              <motion.div 
                className="absolute inset-0 bg-gray-950/45 backdrop-blur-xs transition-opacity"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAdminPanelOpen(false)}
              />

              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <motion.div 
                  className="pointer-events-auto w-screen max-w-2xl"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                >
                  <div className="flex h-full flex-col overflow-y-auto bg-[#F9FAFB] shadow-2xl border-l border-gray-100" id="admin-panel-content-inner">
                    
                    {/* Header bar */}
                    <div className="bg-slate-950 px-6 py-6 text-white relative">
                      <button
                        onClick={() => setIsAdminPanelOpen(false)}
                        className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <h3 className="font-display font-bold text-2xl tracking-tight text-white flex items-center gap-2">
                        <Lock className="w-6 h-6 text-indigo-400" />
                        <span>Espace Propriétaire (Admin)</span>
                      </h3>
                      <p className="text-gray-400 text-xs mt-1.5">
                        {"Console d'administration intégrée permettant de tester et valider les API de l'application Android."}
                      </p>
                    </div>

                    {/* Content Admin area */}
                    <div className="flex-1 px-6 py-6 overflow-y-auto">
                      
                      {!isAdminAuthenticated ? (
                        /* Token request view */
                        <form onSubmit={handleAdminLogin} className="space-y-6 max-w-md mx-auto py-12" id="admin-login-form">
                          <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-150 shadow-sm">
                              <ShieldCheck className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h4 className="font-display font-medium text-lg text-gray-900">Authentification API</h4>
                            <p className="text-gray-400 font-sans text-xs mt-1.5 leading-relaxed">
                              {"Saisissez le jeton secret configuré par défaut à l'installation ("}<span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-750 font-bold border border-gray-200">supersecretadmintoken2024</span>{") pour accéder au panneau."}
                            </p>
                          </div>

                          {authError && (
                            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-sans flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span className="font-bold">{authError}</span>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5" htmlFor="admin-token-input">{"Token Secret d'Administration"}</label>
                            <input
                              required
                              id="admin-token-input"
                              type="password"
                              placeholder="Entrez votre token..."
                              value={adminToken}
                              onChange={(e) => setAdminToken(e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none rounded-2xl text-gray-800 text-sm font-sans tracking-widest transition-all"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-semibold shadow-md shadow-indigo-150 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Déverrouiller la console</span>
                          </button>
                        </form>
                      ) : (
                        /* Authenticated panel views */
                        <div className="space-y-10" id="admin-content-console">
                          
                          {/* Top mini dashboard overview metrics */}
                          {stats && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="stats-bento-grid">
                              <div className="p-4 bg-indigo-50/40 border border-indigo-100/60 rounded-2xl flex flex-col justify-between">
                                <span className="text-[10px] text-indigo-700 uppercase font-bold tracking-widest">Revenus</span>
                                <span className="font-display font-bold text-lg text-gray-900 mt-2">{(stats.totalRevenue || 0).toLocaleString()} DA</span>
                              </div>
                              <div className="p-4 bg-gray-50 border border-gray-200/60 rounded-2xl flex flex-col justify-between">
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest font-sans">Annonces</span>
                                <span className="font-display font-medium text-lg text-gray-900 mt-2">{stats.listingsCount || 0}</span>
                              </div>
                              <div className="p-4 bg-gray-50 border border-gray-200/60 rounded-2xl flex flex-col justify-between">
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest font-sans">Demandes</span>
                                <span className="font-display font-medium text-lg text-gray-900 mt-2">{stats.bookingsCount || 0}</span>
                              </div>
                              <div className="p-4 bg-emerald-50/40 border border-emerald-100/60 rounded-2xl flex flex-col justify-between">
                                <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-widest font-sans">Validées</span>
                                <span className="font-display font-bold text-lg text-emerald-950 mt-2">{stats.activeBookings || 0}</span>
                              </div>
                            </div>
                          )}

                          {/* Action panel to trigger dynamic items */}
                          <div className="border-t border-gray-150 pt-8" id="admin-bookings-tab">
                            <h4 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-indigo-600" />
                              <span>Réservations clients reçues</span>
                            </h4>

                            {bookings.length === 0 ? (
                              <p className="text-gray-405 text-sm italic py-4">Aucune demande enregistrée.</p>
                            ) : (
                              <div className="space-y-3" id="admin-bookings-list">
                                {bookings.map((booking) => (
                                  <div 
                                    key={booking.id} 
                                    className="p-4 bg-white border border-gray-100 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800 text-sm">{booking.clientName}</span>
                                        <span className={cn(
                                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                                          booking.status === 'confirmed' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                          booking.status === 'cancelled' ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                          "bg-indigo-50 text-indigo-750 border border-indigo-150"
                                        )}>
                                          {booking.status === 'confirmed' ? 'Confirmé' : booking.status === 'cancelled' ? 'Annulé' : 'En attente'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-655 font-sans flex items-center gap-1">
                                        <MapPin className="w-3 text-indigo-500" />
                                        <span>Logement: <strong className="text-indigo-700 font-semibold">{booking.listingTitle}</strong></span>
                                      </p>
                                      <div className="text-[11px] text-gray-400 font-sans space-y-0.5">
                                        <p>Dates : <strong className="text-gray-600">{booking.startDate}</strong> au <strong className="text-gray-600">{booking.endDate}</strong></p>
                                        <p>Contact : <strong className="text-gray-600 flex items-center gap-1 inline-flex"><Phone className="w-3 text-indigo-500" /> {booking.clientPhone}</strong></p>
                                      </div>
                                    </div>

                                    <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-50">
                                      <span className="font-display font-bold text-sm text-gray-900 sm:mb-2">{booking.totalPrice.toLocaleString()} DA</span>
                                      
                                      <div className="flex gap-1.5">
                                        {booking.status === 'pending' && (
                                          <>
                                            <button
                                              onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                              className="p-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                            >
                                              Accepter
                                            </button>
                                            <button
                                              onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                              className="p-1 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                            >
                                              Décliner
                                            </button>
                                          </>
                                        )}
                                        {booking.status !== 'pending' && (
                                          <button
                                            onClick={() => {
                                              if (confirm('Voulez-vous réinitialiser le statut de cette réservation ?')) {
                                                handleUpdateBookingStatus(booking.id, 'pending');
                                              }
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 text-[10px] font-medium underline"
                                          >
                                            Modifier
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Quick listings controls (simulating operations made by the APK) */}
                          <div className="border-t border-gray-150 pt-8" id="admin-listings-manager">
                            <h4 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                              <Home className="w-5 h-5 text-indigo-600" />
                              <span>Gérer les hébergements</span>
                            </h4>
                            
                            <div className="divide-y divide-gray-50 border border-gray-150 rounded-2xl overflow-hidden shadow-xs" id="admin-manage-listings-table">
                              {listings.map(item => (
                                <div key={item.id} className="p-3.5 bg-white flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3 w-3/5">
                                    <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                                      <Image src={item.images[0]} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className="font-semibold text-xs text-gray-900 truncate max-w-[200px]" title={item.title}>{item.title}</h5>
                                      <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{item.pricePerDay.toLocaleString()} DA / jour</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {/* Toggle status indicator simulating Kotlin toggles */}
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "text-[9px] font-bold uppercase",
                                        item.available ? "text-emerald-700" : "text-rose-750"
                                      )}>
                                        {item.available ? "Actif" : "Fermé"}
                                      </span>
                                      <button
                                        onClick={() => handleToggleListingAvailability(item.id, item.available)}
                                        className={cn(
                                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out font-sans",
                                          item.available ? "bg-indigo-600" : "bg-gray-300"
                                        )}
                                        role="switch"
                                        aria-checked={item.available}
                                      >
                                        <span
                                          aria-hidden="true"
                                          className={cn(
                                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                            item.available ? "translate-x-4" : "translate-x-0"
                                          )}
                                        />
                                      </button>
                                    </div>

                                    {/* Delete button simulating management deletions */}
                                    <button
                                      onClick={() => handleDeleteListing(item.id)}
                                      className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Quick manual listing creation matching AddListingScreen.kt parameters */}
                          <div className="border-t border-gray-150 pt-8" id="admin-add-listing-form-tab">
                            <h4 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                              <Plus className="w-5 h-5 text-indigo-650" />
                              <span>{"Tester la publication API d'hébergement"}</span>
                            </h4>
                            <p className="text-gray-550 text-xs mb-6 font-sans leading-relaxed">
                              {"Remplissez ce formulaire pour insérer manuellement une annonce. Cela simule exactement la requête "}<code className="font-mono bg-gray-100 p-1 border border-gray-150 text-xs font-bold rounded text-indigo-600">{"POST /listings"}</code>{" envoyée par l'application Android."}
                            </p>

                            {adminSuccessMsg && (
                              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2 mb-4 font-sans">
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                <span className="font-semibold">{adminSuccessMsg}</span>
                              </div>
                            )}

                            <form onSubmit={handleAdminAddListing} className="space-y-4" id="admin-mock-posting-form">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1" htmlFor="add-title">{"Titre de l'annonce"}</label>
                                <input
                                  required
                                  id="add-title"
                                  type="text"
                                  placeholder="ex: Appartement VIP Front de Mer"
                                  value={newTitle}
                                  onChange={(e) => setNewTitle(e.target.value)}
                                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none rounded-2xl text-gray-800 text-sm transition-all"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1" htmlFor="add-price">Prix par Jour (DA)</label>
                                  <input
                                    required
                                    id="add-price"
                                    type="number"
                                    placeholder="ex: 12000"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none rounded-2xl text-gray-800 text-sm transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1" htmlFor="add-cat">Catégorie</label>
                                  <select
                                    id="add-cat"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none rounded-2xl text-gray-700 text-sm transition-all"
                                  >
                                    <option value="villas">Villa de luxe</option>
                                    <option value="studios">Studio cozy</option>
                                    <option value="front_mer">Pied dans l’eau</option>
                                    <option value="appartements">Appartement familial</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1" htmlFor="add-loc">Localisation</label>
                                  <input
                                    required
                                    id="add-loc"
                                    type="text"
                                    placeholder="ex: Plage des Grottes, Ghazaouet"
                                    value={newLocation}
                                    onChange={(e) => setNewLocation(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none rounded-2xl text-gray-800 text-sm transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1" htmlFor="add-cap">{"Capacité d'accueil"}</label>
                                  <input
                                    required
                                    id="add-cap"
                                    type="number"
                                    value={newCapacity}
                                    onChange={(e) => setNewCapacity(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none rounded-2xl text-gray-800 text-sm transition-all"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1" htmlFor="add-image">{"URL de l'image (Laisser vide pour générer aléatoirement)"}</label>
                                <input
                                  id="add-image"
                                  type="url"
                                  placeholder="https://..."
                                  value={newImageUrl}
                                  onChange={(e) => setNewImageUrl(e.target.value)}
                                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none rounded-2xl text-gray-800 text-xs sm:text-sm font-sans transition-all"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1" htmlFor="add-desc">Description</label>
                                <textarea
                                  required
                                  id="add-desc"
                                  rows={3}
                                  placeholder="Détails du bien, atouts majeurs, proximité plage..."
                                  value={newDescription}
                                  onChange={(e) => setNewDescription(e.target.value)}
                                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none rounded-2xl text-gray-800 text-sm transition-all"
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={addingListingLoading}
                                className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-indigo-150 transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {addingListingLoading ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Publication...</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4" />
                                    <span>Publier sur l’interface client</span>
                                  </>
                                )}
                              </button>
                            </form>
                          </div>

                        </div>
                      )}

                    </div>
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
