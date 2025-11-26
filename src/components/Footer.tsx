import { Mail, Phone, MapPin, Send, Home, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import satvikLogo from '@/assets/satvik-logo.svg';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="bg-[#E6F2EF] text-brandText mt-20 border-t border-[#E5E7EB]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <img 
              src={satvikLogo} 
              alt="Satvik Foods" 
              className="h-14 sm:h-16 md:h-18 w-auto object-contain"
            />
            <p className="text-sm text-muted leading-relaxed">
              Authentic South Indian Foods – bringing traditional, healthy, and wholesome products 
              from our farms to your table.
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+1 587-581-3956</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>support@satvikfoods.ca</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Home className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="text-sm flex-1">
                    <div>210 Setonstone Landing SE</div>
                    <div>Calgary AB T3M 3R6</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Home className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="text-sm flex-1">
                    <div>187 Belmont Blvd SW</div>
                    <div>Calgary AB T2X 4W5</div>
                  </div>
                </div>
              </div>
              
              {/* Social Media Links */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-3">
                  <Instagram className="h-4 w-4 flex-shrink-0 text-pink-500" />
                  <a 
                    href="https://www.instagram.com/satvik_foods_ca/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm hover:text-brand transition-colors"
                  >
                    @satvik_foods_ca
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Facebook className="h-4 w-4 flex-shrink-0 text-blue-600" />
                  <a 
                    href="https://www.facebook.com/profile.php?id=61580878303182" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm hover:text-brand transition-colors"
                  >
                    Satvik Foods
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link 
                to="/products" 
                className="block hover:text-brand transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Our Products
              </Link>
              <Link 
                to="/about" 
                className="block hover:text-brand transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                About Us
              </Link>
              <Link 
                to="/contact" 
                className="block hover:text-brand transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Contact
              </Link>
            </div>
          </div>

          {/* WhatsApp Group */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stay Updated</h3>
            <p className="text-sm text-muted">
              Join our WhatsApp group for the latest updates on our products and offers.
            </p>
            <div className="flex flex-col space-y-2">
              <a
                href="https://chat.whatsapp.com/JUHd8HgJ9r2Hz7wJi6YD4M"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm rounded-md transition-colors"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Join WhatsApp Group
              </a>
              <p className="text-xs text-muted-foreground">
                Get instant notifications about new products and special offers
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-brand/20 mt-8 pt-8 text-center">
          <p className="text-sm text-muted">
                   © {new Date().getFullYear()} Satvik Foods. All rights reserved. | Authentic South Indian Foods
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;