import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, Settings, Heart, ChevronDown, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { CartIcon } from "@/components/Cart";
import { useWishlist } from "@/hooks/useWishlist";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'mugs', label: 'Mugs' },
    { value: 'bowls', label: 'Bowls' },
    { value: 'plates', label: 'Plates' },
    { value: 'ceramic-clocks', label: 'Ceramic Clocks' },
    { value: 'lamps', label: 'Lamps' },
    { value: 'spoon-rests', label: 'Spoon Rests' },
    { value: 'vases', label: 'Vases' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/5a8d33c9-9b0f-47f7-8ff5-f04b4eb1ceb5.png" 
            alt="Goofy 'n' Grumpy Logo" 
            className="h-16 w-16"
          />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-brand-primary">Goofy 'n' Grumpy</h1>
            <p className="text-sm md:text-base text-muted-foreground">Made of moods & mud</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-foreground hover:text-brand-secondary transition-colors">
            Home
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-brand-secondary transition-colors">
              <span>Shop</span>
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {categories.map((category) => (
                <DropdownMenuItem key={category.value} asChild>
                  <Link
                    to={`/?category=${encodeURIComponent(category.value)}#shop`}
                    className="cursor-pointer"
                  >
                    {category.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Link to="/#about" className="text-foreground hover:text-brand-secondary transition-colors">
            About
          </Link>
          <Link to="/contact" className="text-foreground hover:text-brand-secondary transition-colors">
            Contact
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <CartIcon />
          
          {/* Orders Button */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/orders')}
              className="relative"
            >
              <Package className="h-5 w-5" />
            </Button>
          )}
          
          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/wishlist')}
            className="relative"
          >
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Button>
          
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