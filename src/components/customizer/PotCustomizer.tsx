import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { typography } from "@/config/typography";
import { cn } from "@/lib/utils";
import { PotPreview } from "@/components/customizer/PotPreview";
import { PatternSwatch } from "@/components/customizer/PatternSwatch";
import { AccessoryIcon } from "@/components/customizer/AccessoryIcon";
import { PotShapeThumb } from "@/components/customizer/PotShapeThumb";
import { capturePotDesignPng, downloadPotDesignPng } from "@/lib/downloadPotDesign";
import {
  CUSTOM_POT_DELIVERY_ESTIMATE,
  CUSTOM_POT_PRICE,
  CUSTOMIZER_TABS,
  DEFAULT_POT_DESIGN,
  POT_ACCESSORIES,
  POT_ACCENT_COLORS,
  POT_BASE_COLORS,
  POT_CUSTOMIZER_STORAGE_KEY,
  POT_PATTERNS,
  POT_STYLES,
  getColorHex,
  normalizePotDesign,
  type CustomizerTab,
  type PotDesign,
} from "@/config/potCustomizer";
import { Download, ShoppingCart } from "lucide-react";

const loadSavedDesign = (): PotDesign => {
  try {
    const raw = localStorage.getItem(POT_CUSTOMIZER_STORAGE_KEY);
    if (!raw) return DEFAULT_POT_DESIGN;
    const parsed = JSON.parse(raw);
    return normalizePotDesign(parsed);
  } catch {
    return DEFAULT_POT_DESIGN;
  }
};

const selectedOption =
  "border-[#0D2B52] bg-[#FCE8EE] shadow-sm";
const unselectedOption =
  "border-border/50 bg-background hover:border-[#0D2B52]/30";

const ProgressSteps = ({ activeTab }: { activeTab: CustomizerTab }) => (
  <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:gap-3 mb-8 font-sans text-xs sm:text-sm">
    {CUSTOMIZER_TABS.map((tab, index) => {
      const isActive = tab.id === activeTab;
      const activeIndex = CUSTOMIZER_TABS.findIndex((t) => t.id === activeTab);
      const isPast = index < activeIndex;

      return (
        <div key={tab.id} className="flex items-center gap-2 sm:gap-3">
          {index > 0 && (
            <span
              className={cn(
                "text-muted-foreground/40",
                isPast || isActive ? "text-[#E88CA3]" : undefined,
              )}
            >
              →
            </span>
          )}
          <span
            className={cn(
              "transition-colors",
              isActive
                ? "text-[#0D2B52] font-semibold"
                : isPast
                  ? "text-[#E88CA3]"
                  : "text-muted-foreground",
            )}
          >
            {tab.label}
          </span>
        </div>
      );
    })}
  </div>
);

export const PotCustomizer = () => {
  const [design, setDesign] = useState<PotDesign>(loadSavedDesign);
  const [activeTab, setActiveTab] = useState<CustomizerTab>("shape");
  const [adding, setAdding] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addCustomPot } = useCart();

  const baseHex = getColorHex(design.baseColor, POT_BASE_COLORS);
  const accentHex = getColorHex(design.accentColor, POT_ACCENT_COLORS);

  const update = useCallback(<K extends keyof PotDesign>(key: K, value: PotDesign[K]) => {
    setDesign((prev) => ({ ...prev, [key]: value }));
  }, []);

  const persistDesign = () => {
    localStorage.setItem(POT_CUSTOMIZER_STORAGE_KEY, JSON.stringify(design));
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    try {
      await downloadPotDesignPng(previewRef.current);
      toast({
        title: "Design downloaded",
        description: "Your pot design has been saved as a PNG.",
      });
    } catch {
      toast({
        title: "Download failed",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = async () => {
    persistDesign();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your cart",
        variant: "destructive",
      });
      navigate("/auth", { state: { from: "/design-your-pot" } });
      return;
    }

    setAdding(true);
    try {
      if (!previewRef.current) {
        throw new Error("Preview not ready");
      }
      const previewImage = await capturePotDesignPng(previewRef.current, {
        width: 560,
        height: 560,
      });
      await addCustomPot(design, previewImage);
    } catch {
      toast({
        title: "Could not add to cart",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 xl:gap-12 items-start">
      {/* Left — preview (40%) */}
      <div className="lg:col-span-2 lg:sticky lg:top-28 space-y-6 overflow-visible">
        <PotPreview ref={previewRef} design={design} />

        <div className="text-center space-y-1">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-sans">
            Price
          </p>
          <p className={`text-3xl text-brand-primary ${typography.title}`}>
            ₹{CUSTOM_POT_PRICE.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-muted-foreground font-sans pt-1">
            Made to order • Ships in {CUSTOM_POT_DELIVERY_ESTIMATE}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="quirky"
            size="lg"
            onClick={handleAddToCart}
            disabled={adding}
            className="w-full group"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleDownload}
            className="w-full"
          >
            <Download className="h-4 w-4" />
            Download Design
          </Button>
        </div>
      </div>

      {/* Right — tabs (60%) */}
      <div className="lg:col-span-3">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as CustomizerTab)}
          className="w-full"
        >
          <ProgressSteps activeTab={activeTab} />

          <TabsList className="w-full h-auto p-1 bg-muted/50 border border-border/40 rounded-xl mb-6 grid grid-cols-2 sm:grid-cols-4">
            {CUSTOMIZER_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-lg py-2.5 text-sm font-sans data-[state=active]:bg-background data-[state=active]:text-brand-primary data-[state=active]:shadow-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="shape" className="mt-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {POT_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => update("potStyle", style.id)}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/50",
                    design.potStyle === style.id ? selectedOption : unselectedOption,
                  )}
                >
                  <PotShapeThumb styleId={style.id} className="w-full max-w-[88px] mb-3 mx-auto sm:mx-0" />
                  <p className={`text-sm text-brand-primary mb-1 ${typography.heading}`}>
                    {style.label}
                  </p>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    {style.description}
                  </p>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pattern" className="mt-0 focus-visible:outline-none">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {POT_PATTERNS.map((pattern) => (
                <button
                  key={pattern.id}
                  type="button"
                  onClick={() => update("pattern", pattern.id)}
                  className={cn(
                    "rounded-xl border-2 p-3 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/50",
                    design.pattern === pattern.id ? selectedOption : unselectedOption,
                  )}
                >
                  <div className="aspect-square mb-2 rounded-lg overflow-hidden">
                    <PatternSwatch
                      patternId={pattern.id}
                      baseColor={baseHex}
                      accentColor={accentHex}
                    />
                  </div>
                  <p className="text-xs font-sans text-brand-primary text-center">
                    {pattern.label}
                  </p>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="accessory" className="mt-0 focus-visible:outline-none">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {POT_ACCESSORIES.map((accessory) => (
                <button
                  key={accessory.id}
                  type="button"
                  onClick={() => update("accessory", accessory.id)}
                  className={cn(
                    "rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/50",
                    design.accessory === accessory.id ? selectedOption : unselectedOption,
                  )}
                >
                  <AccessoryIcon
                    id={accessory.id}
                    size={30}
                    className="text-brand-primary"
                  />
                  <span className="text-[0.65rem] sm:text-xs font-sans text-muted-foreground text-center leading-tight">
                    {accessory.label}
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="color" className="mt-0 focus-visible:outline-none space-y-8">
            <div>
              <p className={`text-sm text-brand-primary mb-4 ${typography.heading}`}>
                Base Color
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {POT_BASE_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => update("baseColor", color.id)}
                    className={cn(
                      "rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/50",
                      design.baseColor === color.id ? selectedOption : unselectedOption,
                    )}
                  >
                    <span
                      className="h-10 w-10 rounded-full border border-brand-primary/15 shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[0.65rem] sm:text-xs font-sans text-muted-foreground text-center leading-tight">
                      {color.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={`text-sm text-brand-primary mb-4 ${typography.heading}`}>
                Accent Color
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {POT_ACCENT_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => update("accentColor", color.id)}
                    className={cn(
                      "rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/50",
                      design.accentColor === color.id ? selectedOption : unselectedOption,
                    )}
                  >
                    <span
                      className="h-10 w-10 rounded-full border border-brand-primary/15 shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[0.65rem] sm:text-xs font-sans text-muted-foreground text-center leading-tight">
                      {color.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
