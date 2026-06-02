import { Button } from "@/components/ui/button";
import { Heart, Mail, Phone, MapPin, Instagram, Youtube } from "lucide-react";
import { BRAND_NAME, BRAND_LOGO_FOOTER, BRAND_NAVY } from "@/config/brand";
import { typography } from "@/config/typography";

const Footer = () => {
  return (
    <footer
      className="text-[#f5f3ef]"
      style={{ backgroundColor: BRAND_NAVY }}
    >
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <img
              src={BRAND_LOGO_FOOTER}
              alt={`${BRAND_NAME} logo`}
              className="h-32 sm:h-40 w-auto max-w-full object-contain object-left"
            />
            <p className="text-[#f5f3ef]/80">
              Bringing quirky charm to your daily rituals through handcrafted pottery 
              made with love and attention to detail.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`text-lg mb-4 ${typography.subheading}`}>Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Home</a>
              </li>
              <li>
                <a href="/?category=all#shop" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Shop</a>
              </li>
              <li>
                <a href="/#about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">About</a>
              </li>
              <li>
                <a href="/refund-policy" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Refund Policy</a>
              </li>
              <li>
                <a href="/shipping-policy" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Shipping Policy</a>
              </li>
              <li>
                <a href="/privacy-policy" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="/contact" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Contact Us</a>
              </li>
              <li>
                <a href="/terms-and-conditions" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Terms & Conditions</a>
              </li>
              <li>
                <a href="/cancellation-policy" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Cancellation Policy</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div id="contact">
            <h4 className={`text-lg mb-4 ${typography.subheading}`}>Get in Touch</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary-foreground/80" />
                <span className="text-primary-foreground/80">grumpyngoofy@gmail.com</span>
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
            <h4 className={`text-lg mb-4 ${typography.subheading}`}>Stay Updated</h4>
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
            {[
              { Icon: Instagram, href: "https://www.instagram.com/grumpyngoofy/", label: "Instagram" },
              { Icon: Youtube, href: "https://www.youtube.com/channel/UCwve4LS858Se5FqKv9xYisA", label: "YouTube" }
            ].map(({ Icon, href, label }, index) => (
              <a key={index} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </Button>
              </a>
            ))}
          </div>
        </div>

        <div className="text-center text-primary-foreground/60 text-sm mt-4">
          © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
