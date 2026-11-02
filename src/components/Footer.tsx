import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Instagram, Youtube } from "lucide-react";
import { BRAND_NAME, BRAND_LOGO_FOOTER, BRAND_NAVY } from "@/config/brand";
import { CONTACT_EMAIL, GOOGLE_MAPS_DIRECTIONS_URL, STUDIO_ADDRESS } from "@/config/contact";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/config/social";
import { typography } from "@/config/typography";
import { useDesignYourPotVisible } from "@/hooks/useDesignYourPotVisible";

const EXPLORE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/?category=all#shop" },
  { label: "Design Your Pot", href: "/design-your-pot" },
  { label: "Workshops", href: "/workshop" },
  { label: "Templates", href: "/templates" },
  { label: "Blog", href: "/blogs" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/contact" },
] as const;

const RESOURCE_LINKS = [
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Cancellation Policy", href: "/cancellation-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
] as const;

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: INSTAGRAM_URL,
    Icon: Instagram,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCwve4LS858Se5FqKv9xYisA",
    Icon: Youtube,
  },
] as const;

const footerHeading = `text-xs uppercase tracking-[0.14em] text-[#f5f3ef] mb-5 ${typography.subheading} font-semibold`;
const footerLink =
  "text-sm text-[#f5f3ef]/75 hover:text-[#E88CA3] transition-colors";
const footerText = "text-sm text-[#f5f3ef]/75 leading-relaxed";

const FooterColumn = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={className}>
    <h4 className={footerHeading}>{title}</h4>
    {children}
  </div>
);

const Footer = () => {
  const { visible: designPotVisible } = useDesignYourPotVisible();
  const exploreLinks = EXPLORE_LINKS.filter(
    (link) => link.href !== "/design-your-pot" || designPotVisible,
  );

  return (
    <footer className="text-[#f5f3ef]" style={{ backgroundColor: BRAND_NAVY }}>
      <div className="container mx-auto px-4 sm:px-6 py-14 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-x-10 lg:gap-y-12 items-start">
          {/* Column 1 — Brand */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-5">
            <img
              src={BRAND_LOGO_FOOTER}
              alt={`${BRAND_NAME} logo`}
              className="h-28 sm:h-32 w-auto max-w-[220px] object-contain object-left"
            />
            <div className="space-y-3 max-w-xs">
              <p
                className={`text-sm leading-snug text-[#f5f3ef] ${typography.title}`}
              >
                Making pottery feel less intimidating.
              </p>
              <p className="text-xs text-[#f5f3ef]/65 font-sans leading-relaxed">
                Handmade ceramics, workshops, templates, and a growing clay
                community.
              </p>
            </div>
          </div>

          {/* Column 2 — Explore */}
          <FooterColumn title="Explore">
            <ul className="space-y-2.5">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  {link.label === "About" ? (
                    <Link
                      to={{ pathname: "/", hash: "about" }}
                      className={footerLink}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className={footerLink}>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </FooterColumn>

          {/* Column 3 — Resources */}
          <FooterColumn title="Resources">
            <ul className="space-y-2.5">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={footerLink}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </FooterColumn>

          {/* Column 4 — Connect */}
          <FooterColumn title="Connect">
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className={`${footerText} inline-flex items-center gap-2.5 hover:text-[#E88CA3] transition-colors`}
                >
                  <Mail className="h-4 w-4 shrink-0 text-[#E88CA3]/80" />
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${footerText} inline-flex items-center gap-2.5 hover:text-[#E88CA3] transition-colors`}
                >
                  <Instagram className="h-4 w-4 shrink-0 text-[#E88CA3]/80" />
                  {INSTAGRAM_HANDLE}
                </a>
              </li>
              {SOCIAL_LINKS.filter((link) => link.label !== "Instagram").map(
                ({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${footerText} inline-flex items-center gap-2.5 hover:text-[#E88CA3] transition-colors`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#E88CA3]/80" />
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={GOOGLE_MAPS_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${footerText} inline-flex items-start gap-2.5 hover:text-[#E88CA3] transition-colors`}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-[#E88CA3]/80 mt-0.5" />
                  <span>{STUDIO_ADDRESS}</span>
                </a>
              </li>
            </ul>
          </FooterColumn>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#f5f3ef]/15 mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p
            className={`text-sm text-[#f5f3ef]/80 italic ${typography.title}`}
          >
            From software to stoneware.
          </p>

          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#f5f3ef]/70 hover:text-[#E88CA3] hover:bg-[#f5f3ef]/10"
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </a>
            ))}
          </div>
        </div>

        <p className="text-center text-[#f5f3ef]/50 text-xs mt-6 font-sans">
          © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
