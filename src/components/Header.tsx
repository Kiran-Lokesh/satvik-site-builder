import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, LogIn, LogOut, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { getEnvironment } from '@/lib/config';
import satvikLogo from '@/assets/satvik-logo.svg';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { getTotalItems, toggleCart } = useCart();
  const totalItems = getTotalItems();
  const env = getEnvironment();
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();

  // Environment-specific header classes
  const headerBgClass =
    env === 'local' ? 'bg-blue-200/80' :
    env === 'test' ? 'bg-purple-300' :
    'bg-accent'; // prod - keep original golden color

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <header className={`sticky top-0 z-50 ${headerBgClass} backdrop-blur-sm border-b border-brand/20 shadow-soft`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 sm:h-22 md:h-24 lg:h-26">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2"
            onClick={scrollToTop}
          >
            <img 
              src={satvikLogo} 
              alt="Satvik Foods" 
              className="h-14 sm:h-16 md:h-18 lg:h-20 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-brand ${
                  isActive(item.href)
                    ? 'text-brand font-semibold'
                    : 'text-brandText'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2 md:space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCart}
              className="relative p-2 hover:bg-brand/10"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-5 w-5 text-brandText" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (authLoading) return;
                if (user) {
                  logout();
                } else {
                  signInWithGoogle();
                }
              }}
              className="flex items-center gap-2"
            >
              {authLoading ? (
                <UserCircle className="h-4 w-4 animate-pulse" />
              ) : user ? (
                <>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">Log out</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span className="hidden lg:inline">Log in</span>
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={`md:hidden border-t border-brand/20 ${headerBgClass}`}>
            <nav className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-brand/10 text-brand'
                      : 'text-brandText hover:text-brand hover:bg-brand/5'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="px-3 py-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    if (authLoading) return;
                    if (user) {
                      logout();
                    } else {
                      signInWithGoogle();
                    }
                    setIsMenuOpen(false);
                  }}
                >
                  {authLoading ? (
                    <UserCircle className="h-4 w-4 animate-pulse" />
                  ) : user ? (
                    <>
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Log in</span>
                    </>
                  )}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;