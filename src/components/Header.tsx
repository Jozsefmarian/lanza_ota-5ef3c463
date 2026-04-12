import React, { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  User,
  Heart,
  ShoppingBag,
  Globe,
  ChevronDown,
  LogOut,
  Building2,
} from "lucide-react";
import { User as UserType } from "../lib/auth";

interface HeaderProps {
  user?: UserType | null;
  onAuthClick: () => void;
  onDashboardClick?: () => void;
  cartCount: number;
  wishlistCount: number;
}

const CURRENCIES = ["EUR", "USD", "HUF", "GBP"] as const;
type Currency = (typeof CURRENCIES)[number];

function isCurrency(v: string | null): v is Currency {
  return v === "EUR" || v === "USD" || v === "HUF" || v === "GBP";
}

function readCurrencyFromUrl(): Currency {
  // 1) normál query: /path?currency=HUF
  const normalParams = new URLSearchParams(window.location.search);
  const c1 = normalParams.get("currency");

  // 2) HashRouter query: /#/path?currency=HUF  → query a hash-ben
  const hash = window.location.hash || "";
  const qIndex = hash.indexOf("?");
  const hashQuery = qIndex >= 0 ? hash.slice(qIndex + 1) : "";
  const hashParams = new URLSearchParams(hashQuery);
  const c2 = hashParams.get("currency");

  const c = (c1 || c2);
  const fromUrl = isCurrency(c) ? c : null;
if (fromUrl) return fromUrl;

const fromLs = localStorage.getItem("lanza_currency");
return isCurrency(fromLs) ? fromLs : "EUR";
}

function writeCurrencyToUrl(currency: Currency) {
  localStorage.setItem("lanza_currency", currency);

  const url = new URL(window.location.href);

  // HashRouter: "#/..." esetén a query-t a hash-be tesszük
  if (url.hash && url.hash.startsWith("#/")) {
    const [hashPath, hashQuery] = url.hash.split("?");
    const params = new URLSearchParams(hashQuery || "");
    params.set("currency", currency);
    url.hash = `${hashPath}?${params.toString()}`;
  } else {
    // BrowserRouter / sima URL
    url.searchParams.set("currency", currency);
  }

  window.history.replaceState({}, "", url.toString());
  window.dispatchEvent(
    new CustomEvent("lanza:currencyChanged", { detail: { currency } })
  );
}

const Header: React.FC<HeaderProps> = ({
  user,
  onAuthClick,
  onDashboardClick,
  cartCount,
  wishlistCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ✅ Itt él az aktuális deviza (URL-ből init)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() =>
    readCurrencyFromUrl()
  );

  // ✅ Currency dropdown "click outside" zárás
  const currencyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!currencyOpen) return;
      const target = e.target as Node;
      if (currencyRef.current && !currencyRef.current.contains(target)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [currencyOpen]);

  // ✅ Ha a user back/forward-ot nyom vagy hash változik → szinkronizáljuk a state-et az URL-lel
  useEffect(() => {
    const sync = () => setSelectedCurrency(readCurrencyFromUrl());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const navLinks = [
    { name: "Szállások", href: "#hotels" },
    { name: "Úti célok", href: "#destinations" },
    { name: "Akciók", href: "#deals" },
  ];

  return (
    <header className="fixed top-8 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-orange-200 bg-clip-text text-transparent">
              Lanzaventura
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Currency Selector */}
            <div ref={currencyRef} className="relative hidden md:block">
              <button
                onClick={() => setCurrencyOpen((v) => !v)}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <Globe className="w-4 h-4" />
                <span>{selectedCurrency}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {currencyOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-slate-800 rounded-xl shadow-xl border border-white/10 py-2">
                  {CURRENCIES.map((currency) => (
                    <button
                      key={currency}
                      onClick={() => {
                        setSelectedCurrency(currency);
                        setCurrencyOpen(false);
                        writeCurrencyToUrl(currency);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10"
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={user ? onDashboardClick : onAuthClick}
              className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Menu / Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-white font-medium text-sm max-w-[100px] truncate">
                    {user.fullName?.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 text-white/60" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-xl border border-white/10 py-2 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white font-medium">{user.fullName}</p>
                      <p className="text-white/60 text-sm truncate">
                        {user.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onDashboardClick?.();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Vezérlőpult</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onDashboardClick?.();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 flex items-center space-x-2"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Kedvenceim</span>
                    </button>

                    <div className="border-t border-white/10 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onDashboardClick?.();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-white/10 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Kijelentkezés</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
              >
                <User className="w-4 h-4" />
                <span>Bejelentkezés</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  {link.name}
                </a>
              ))}

              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onDashboardClick?.();
                  }}
                  className="mx-4 mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium rounded-xl"
                >
                  Vezérlőpult
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onAuthClick();
                  }}
                  className="mx-4 mt-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl"
                >
                  Bejelentkezés
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
