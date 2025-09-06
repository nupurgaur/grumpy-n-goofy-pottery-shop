import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate('/auth');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/5a8d33c9-9b0f-47f7-8ff5-f04b4eb1ceb5.png" 
            alt="Grumpy 'n' Goofy Logo" 
            className="h-12 w-12"
          />
          <div>
            <h1 className="text-xl font-bold text-brand-primary">Grumpy 'n' Goofy</h1>
            <p className="text-xs text-muted-foreground">Handcrafted Pottery</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#home" className="text-foreground hover:text-brand-secondary transition-colors">
            Home
          </a>
          <a href="#shop" className="text-foreground hover:text-brand-secondary transition-colors">
            Shop
          </a>
          <a href="#about" className="text-foreground hover:text-brand-secondary transition-colors">
            About
          </a>
          <a href="#contact" className="text-foreground hover:text-brand-secondary transition-colors">
            Contact
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
              0
            </span>
          </Button>
          
          {/* Auth Button */}
          <Button 
            variant="ghost" 
            onClick={handleAuthAction}
            className="hidden sm:flex items-center space-x-2"
          >
            {user ? (
              <>
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </>
            ) : (
              <>
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </>
            )}
          </Button>
          
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;