import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, Settings, Heart, ChevronDown, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { CartIcon } from "@/components/Cart";
import { useWishlist } from "@/hooks/useWishlist";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BRAND_NAME, BRAND_LOGO_FOOTER, BRAND_NAVY } from "@/config/brand";

const headerText = "text-[#f5f3ef]";
const headerHover = "text-[#f5f3ef] hover:text-white hover:bg-white/10";
const navLink =
  "text-base lg:text-lg font-medium text-[#f5f3ef]/90 hover:text-[#f5f3ef] transition-colors";

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
    <header
      className={`sticky top-0 z-50 w-full ${headerText} border-b border-[#f5f3ef]/15`}
      style={{ backgroundColor: BRAND_NAVY }}
    >
      <div className="container mx-auto px-4 h-24 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center min-w-0 max-w-[min(100%,14rem)] sm:max-w-[18rem] hover:opacity-90 transition-opacity"
        >
          <img
            src={BRAND_LOGO_FOOTER}
            alt={`${BRAND_NAME} logo`}
            className="h-16 sm:h-20 lg:h-24 w-auto max-w-full object-contain object-left"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className={navLink}>
            Home
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger className={`flex items-center space-x-1 ${navLink}`}>
              <span>Shop</span>
              <ChevronDown className="h-5 w-5 shrink-0" />
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
          
          <Link to="/#about" className={navLink}>
            About
          </Link>
          <Link to="/contact" className={navLink}>
            Contact
          </Link>
        </nav>

        {/* Actions */}
        <div className={`flex items-center space-x-4 ${headerText}`}>
          <CartIcon buttonClassName={headerHover} />
          
          {/* Orders Button */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/orders')}
              className={`relative ${headerHover}`}
            >
              <Package className="h-5 w-5" />
            </Button>
          )}
          
          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/wishlist')}
            className={`relative ${headerHover}`}
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
                  className={`hidden sm:flex items-center gap-1 ${headerHover}`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Button>
              )}
              <Button 
                variant="ghost" 
                onClick={signOut}
                className={`hidden sm:flex items-center space-x-2 ${headerHover}`}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className={`hidden sm:flex items-center space-x-2 ${headerHover}`}
            >
              <User className="h-4 w-4" />
              <span>Sign In</span>
            </Button>
          )}
          
          <Button variant="ghost" size="icon" className={`md:hidden ${headerHover}`}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;