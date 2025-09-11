import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { CartIcon } from "@/components/Cart";

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

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
          <CartIcon />
          
          {/* Auth Button */}
          {user ? (
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="hidden sm:flex items-center gap-1"
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Button>
              )}
              <Button 
                variant="ghost" 
                onClick={signOut}
                className="hidden sm:flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="hidden sm:flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span>Sign In</span>
            </Button>
          )}
          
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;