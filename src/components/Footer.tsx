import { Button } from "@/components/ui/button";
import { Heart, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/5a8d33c9-9b0f-47f7-8ff5-f04b4eb1ceb5.png" 
                alt="Grumpy 'n' Goofy Logo" 
                className="h-10 w-10 brightness-0 invert"
              />
              <div>
                <h3 className="text-xl font-bold">Grumpy 'n' Goofy</h3>
                <p className="text-sm text-primary-foreground/80">Handcrafted Pottery</p>
              </div>
            </div>
            <p className="text-primary-foreground/80">
              Bringing quirky charm to your daily rituals through handcrafted pottery 
              made with love and attention to detail.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'Shop', 'About', 'Contact', 'Care Instructions', 'Returns'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Get in Touch</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary-foreground/80" />
                <span className="text-primary-foreground/80">hello@grumpyngoofy.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary-foreground/80" />
                <span className="text-primary-foreground/80">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-primary-foreground/80" />
                <span className="text-primary-foreground/80">Mumbai, India</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Stay Updated</h4>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Get the latest pottery pieces and studio updates delivered to your inbox.
            </p>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 rounded-md bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
              />
              <Button variant="secondary" className="w-full">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 text-primary-foreground/80">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-secondary fill-current" />
            <span>in Mumbai, India</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {[Instagram, Facebook, Twitter].map((Icon, index) => (
              <Button key={index} variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </Button>
            ))}
          </div>
        </div>

        <div className="text-center text-primary-foreground/60 text-sm mt-4">
          © 2024 Grumpy 'n' Goofy. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;