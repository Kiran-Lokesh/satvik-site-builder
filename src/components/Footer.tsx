import { Mail, Phone, MapPin, Send } from 'lucide-react';
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
              Authentic North Karnataka Foods – bringing traditional, healthy, and wholesome products 
              from our farms to your table.
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>info@satvikfoods.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>North Karnataka, India</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <a href="/products" className="block hover:text-brand transition-colors">Our Products</a>
              <a href="/about" className="block hover:text-brand transition-colors">About Us</a>
              <a href="/contact" className="block hover:text-brand transition-colors">Contact</a>
              <a href="#" className="block hover:text-brand transition-colors">Quality Policy</a>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stay Updated</h3>
            <p className="text-sm text-muted">
              Get the latest updates on our products and offers.
            </p>
            <div className="flex flex-col space-y-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="px-3 py-2 text-sm border border-brand/20 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              <Button 
                className="bg-brand hover:bg-brand-dark text-white text-sm"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-brand/20 mt-8 pt-8 text-center">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} Satvik Foods. All rights reserved. | Delicacy of North Karnataka
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;