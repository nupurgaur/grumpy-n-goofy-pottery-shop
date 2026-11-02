import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Menu, User, LogOut, Settings, Heart, ChevronDown, Package, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { CartIcon } from "@/components/Cart";
import { useWishlist } from "@/hooks/useWishlist";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BRAND_NAME, BRAND_LOGO_FOOTER, BRAND_NAVY } from "@/config/brand";
import { navigateToAbout } from "@/lib/navigateToAbout";
import { useDesignYourPotVisible } from "@/hooks/useDesignYourPotVisible";
import { SHOP_CATEGORIES } from "@/config/shopCategories";

const headerText = "text-[#f5f3ef]";
const headerHover = "text-[#f5f3ef] hover:text-white hover:bg-white/10";
const navLink =
  "text-[#f5f3ef]/80 hover:text-[#f5f3ef] transition-colors";

const mobileNavLink =
  "block w-full rounded-md px-3 py-2.5 text-left text-[#f5f3ef] hover:bg-white/10 transition-colors";

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { wishlist } = useWishlist();
  const { visible: designPotVisible } = useDesignYourPotVisible();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const categories = [
    { value: "all", label: "All Products" },
    ...SHOP_CATEGORIES.map(({ value, label }) => ({ value, label })),
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
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <Link to="/" className={navLink}>
            Home
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className={`flex items-center space-x-1 ${navLink}`}>
              <span>Products</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {categories.map((category) => (
                <DropdownMenuItem key={category.value} asChild>
                  {"href" in category && category.href ? (
                    <Link to={category.href} className="cursor-pointer">
                      {category.label}
                    </Link>
                  ) : (
                    <Link
                      to={`/?category=${encodeURIComponent(category.value)}#shop`}
                      className="cursor-pointer"
                    >
                      {category.label}
                    </Link>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {designPotVisible && (
            <Link to="/design-your-pot" className={navLink}>
              Design Your Own Pot
            </Link>
          )}
          <Link to="/workshop" className={navLink}>
            Workshop
          </Link>
          <Link to="/templates" className={navLink}>
            Templates
          </Link>
          <Link to="/blogs" className={navLink}>
            Blogs
          </Link>

          <button
            type="button"
            onClick={() => navigateToAbout(navigate, location.pathname)}
            className={navLink}
          >
            About
          </button>
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
                  size="icon"
                  onClick={() => navigate('/admin')}
                  className={headerHover}
                  aria-label="Admin"
                  title="Admin"
                >
                  <Settings className="h-5 w-5" />
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
          
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className={`md:hidden ${headerHover}`}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent
          className="fixed inset-y-0 right-0 left-auto top-0 z-[60] flex h-full w-[min(100%,18rem)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 border-l border-[#f5f3ef]/15 p-0 shadow-xl data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right sm:rounded-none [&>button:last-child]:hidden"
          style={{ backgroundColor: BRAND_NAVY }}
        >
          <DialogTitle className="sr-only">Site menu</DialogTitle>
          <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-6 text-[#f5f3ef]">
            <Link to="/" className={mobileNavLink} onClick={closeMobileMenu}>
              Home
            </Link>

            <p className="px-3 pt-4 pb-1 text-xs font-medium uppercase tracking-wide text-[#f5f3ef]/60">
              Products
            </p>
            {categories.map((category) => (
              <Link
                key={category.value}
                to={
                  "href" in category && category.href
                    ? category.href
                    : `/?category=${encodeURIComponent(category.value)}#shop`
                }
                className={`${mobileNavLink} pl-6 text-sm`}
                onClick={closeMobileMenu}
              >
                {category.label}
              </Link>
            ))}

            {designPotVisible && (
              <Link to="/design-your-pot" className={mobileNavLink} onClick={closeMobileMenu}>
                Design Your Own Pot
              </Link>
            )}
            <Link to="/workshop" className={mobileNavLink} onClick={closeMobileMenu}>
              Workshop
            </Link>
            <Link to="/templates" className={mobileNavLink} onClick={closeMobileMenu}>
              Templates
            </Link>
            <Link to="/blogs" className={mobileNavLink} onClick={closeMobileMenu}>
              Blogs
            </Link>
            <button
              type="button"
              className={mobileNavLink}
              onClick={() => {
                closeMobileMenu();
                navigateToAbout(navigate, location.pathname);
              }}
            >
              About
            </button>

            <div className="mt-auto border-t border-[#f5f3ef]/15 pt-4">
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className={mobileNavLink} onClick={closeMobileMenu}>
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    className={mobileNavLink}
                    onClick={() => {
                      closeMobileMenu();
                      signOut();
                    }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/auth" className={mobileNavLink} onClick={closeMobileMenu}>
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
