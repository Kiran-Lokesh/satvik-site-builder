import { Mail, Phone, MapPin } from 'lucide-react';
import satvikLogo from '@/assets/satvik-logo.svg';

const Footer = () => {
  return (
    <footer className="bg-brand text-white mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <img 
              src={satvikLogo} 
              alt="Satvik Foods" 
              className="h-14 sm:h-16 md:h-18 w-auto object-contain brightness-0 invert"
            />
            <p className="text-sm text-white/80 leading-relaxed">
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
                <span>+91 XXXXX XXXXX</span>
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
              <a href="/products" className="block hover:text-accent transition-colors">Our Products</a>
              <a href="/about" className="block hover:text-accent transition-colors">About Us</a>
              <a href="/contact" className="block hover:text-accent transition-colors">Contact</a>
              <a href="#" className="block hover:text-accent transition-colors">Quality Policy</a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} Satvik Foods. All rights reserved. | Delicacy of North Karnataka
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;