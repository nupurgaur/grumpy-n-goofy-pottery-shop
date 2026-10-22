import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  CUSTOM_POT_IMAGE,
  CUSTOM_POT_PRICE,
  CUSTOM_POT_PRODUCT_ID,
  buildCustomPotCartLabel,
  buildCustomPotProductName,
  type PotDesign,
} from '@/config/potCustomizer';
import {
  buildWorkshopCartName,
  getWorkshopCartProductId,
  getWorkshopTicketLimits,
} from '@/config/workshops';
import { isDateAllowedForWorkshop, type WorkshopScheduleId } from '@/lib/workshopSchedule';
import { TEMPLATE_STOCK_QUANTITY } from '@/config/templates';
import { format } from 'date-fns';
import {
  getCartItemLineTotal,
  getRequiredParticipantCount,
  type WorkshopAddOn,
  type WorkshopBookingMeta,
  type WorkshopParticipant,
} from '@/lib/workshopParticipants';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: number;
  product_name: string;
  product_price: number;
  product_image: string;
  quantity: number;
  custom_design?: PotDesign | null;
  workshop_booking?: WorkshopBookingMeta | null;
  created_at: string;
  updated_at: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  loading: boolean;
  updateWorkshopParticipants: (
    cartItemId: string,
    participants: WorkshopParticipant[],
  ) => Promise<void>;
  addItem: (product: {
    id: number;
    name: string;
    price: number;
    image: string;
    isTemplate?: boolean;
  }, stockQuantity?: number) => Promise<void>;
  addCustomPot: (design: PotDesign, previewImage: string) => Promise<void>;
  addWorkshopBooking: (booking: {
    scheduleId: WorkshopScheduleId;
    title: string;
    date: Date;
    slot: string;
    unitPrice: number;
    quantity: number;
    image: string;
    ticketLabel: string;
    addOns?: WorkshopAddOn[];
  }) => Promise<boolean>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const getSupabaseErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Unknown error";
};

const resolveCustomPotProductId = async (): Promise<number> => {
  const { data } = await supabase
    .from("products")
    .select("id")
    .ilike("name", "%Design Your Own Pot%")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return data?.id ?? CUSTOM_POT_PRODUCT_ID;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load cart items when user logs in
  useEffect(() => {
    if (user) {
      loadCartItems();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  const loadCartItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast({
        title: "Error loading cart",
        description: "Failed to load your cart items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (product: {
    id: number;
    name: string;
    price: number;
    image: string;
    isTemplate?: boolean;
  }, stockQuantity?: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your cart",
        variant: "destructive"
      });
      return;
    }

    const isTemplate = product.isTemplate === true;
    const availableStock = isTemplate ? TEMPLATE_STOCK_QUANTITY : stockQuantity;

    try {
      if (availableStock !== undefined && availableStock <= 0) {
        toast({
          title: "Out of stock",
          description: `${product.name} is currently out of stock`,
          variant: "destructive"
        });
        return;
      }

      const existingItem = items.find(item => item.product_id === product.id);
      
      if (existingItem) {
        if (availableStock !== undefined && existingItem.quantity >= availableStock) {
          toast({
            title: "Insufficient stock",
            description: `Only ${availableStock} items available`,
            variant: "destructive"
          });
          return;
        }
        await updateQuantity(product.id, existingItem.quantity + 1);
        toast({
          title: "Added to cart",
          description: `${product.name} has been added to your cart`,
        });
        return;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          product_image: product.image,
          quantity: 1
        })
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [...prev, data]);
      
      if (!isTemplate && availableStock !== undefined) {
        await supabase.rpc('update_product_stock', {
          p_product_id: product.id,
          p_quantity_change: -1,
          p_movement_type: 'sale',
          p_notes: 'Added to cart'
        });
      }

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error adding item",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };

  const addCustomPot = async (design: PotDesign, previewImage: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your cart",
        variant: "destructive",
      });
      return;
    }

    const productId = await resolveCustomPotProductId();
    const cartLabel = buildCustomPotCartLabel(design);

    const upsertPayload = {
      product_name: cartLabel,
      product_price: CUSTOM_POT_PRICE,
      product_image: previewImage || CUSTOM_POT_IMAGE,
      quantity: 1,
    };

    try {
      const existingItem = items.find(
        (item) =>
          item.product_id === productId && item.product_name === cartLabel,
      );

      if (existingItem) {
        await updateQuantity(productId, existingItem.quantity + 1);
        toast({
          title: "Added to cart",
          description: `${buildCustomPotProductName(design)} has been added to your cart`,
        });
        return;
      }

      const existingCustomLine = items.find(
        (item) =>
          item.product_id === productId ||
          item.product_name.startsWith("Custom Pot"),
      );

      if (existingCustomLine) {
        const { data, error } = await supabase
          .from("cart_items")
          .update({ ...upsertPayload, product_id: productId })
          .eq("id", existingCustomLine.id)
          .select()
          .single();

        if (error) throw error;

        setItems((prev) =>
          prev.map((item) => (item.id === existingCustomLine.id ? data : item)),
        );
      } else {
        const { data, error } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: productId,
            ...upsertPayload,
          })
          .select()
          .single();

        if (error) throw error;
        setItems((prev) => [...prev, data]);
      }

      toast({
        title: "Added to cart",
        description: `${buildCustomPotProductName(design)} has been added to your cart`,
      });
    } catch (error) {
      console.error("Error adding custom pot:", error);
      toast({
        title: "Error adding item",
        description: getSupabaseErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const addWorkshopBooking = async (booking: {
    scheduleId: WorkshopScheduleId;
    title: string;
    date: Date;
    slot: string;
    unitPrice: number;
    quantity: number;
    image: string;
    ticketLabel: string;
    addOns?: WorkshopAddOn[];
  }): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to book a workshop",
        variant: "destructive",
      });
      return false;
    }

    const productId = getWorkshopCartProductId(
      booking.scheduleId,
      booking.date,
      booking.slot,
    );
    const cartName = buildWorkshopCartName(
      booking.title,
      booking.date,
      booking.slot,
    );
    if (!isDateAllowedForWorkshop(booking.scheduleId, booking.date)) {
      toast({
        title: "Choose a later date",
        description: "Workshops must be booked at least one day in advance, Wednesday through Sunday.",
        variant: "destructive",
      });
      return false;
    }

    const ticketLimits = getWorkshopTicketLimits(booking.scheduleId);
    const workshopBooking: WorkshopBookingMeta = {
      scheduleId: booking.scheduleId,
      sessionDate: format(booking.date, "yyyy-MM-dd"),
      slot: booking.slot,
      addOns: booking.addOns?.length ? booking.addOns : undefined,
    };

    try {
      const { data: availability, error: availabilityError } = await supabase.rpc(
        "get_workshop_session_availability",
        {
          p_schedule_id: booking.scheduleId,
          p_session_date: workshopBooking.sessionDate,
          p_slot: booking.slot,
        },
      );

      if (availabilityError) throw availabilityError;

      const row = Array.isArray(availability) ? availability[0] : availability;
      const remaining = row?.remaining ?? 0;
      const isActive = row?.is_active ?? true;
      const seatsNeeded = getRequiredParticipantCount(booking.scheduleId, booking.quantity);

      if (booking.quantity < ticketLimits.min || booking.quantity > ticketLimits.max) {
        toast({
          title: "Ticket limit reached",
          description:
            booking.scheduleId === "date-night"
              ? "Date Night is limited to one couple per slot."
              : booking.scheduleId === "private-clay-parties"
                ? `Private clay parties are for ${ticketLimits.min} to ${ticketLimits.max} guests.`
                : `Drop-in sessions are limited to ${ticketLimits.max} people. For a larger group, book a private clay party.`,
          variant: "destructive",
        });
        return false;
      }

      if (!isActive) {
        toast({
          title: "Session unavailable",
          description: "This workshop session is not open for booking.",
          variant: "destructive",
        });
        return false;
      }

      if (remaining < seatsNeeded) {
        toast({
          title: "Not enough spots left",
          description: `Only ${remaining} spot${remaining === 1 ? "" : "s"} remain for this session.`,
          variant: "destructive",
        });
        return false;
      }

      const existingItem = items.find(
        (item) => item.product_id === productId,
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + booking.quantity;

        if (newQuantity > ticketLimits.max) {
          toast({
            title: "Already in your cart",
            description:
              booking.scheduleId === "date-night"
                ? "This Date Night slot is limited to one couple."
                : "This session already has the maximum number of tickets in your cart.",
            variant: "destructive",
          });
          return false;
        }

        const totalSeatsNeeded = getRequiredParticipantCount(
          booking.scheduleId,
          newQuantity,
        );

        if (remaining < totalSeatsNeeded) {
          toast({
            title: "Not enough spots left",
            description: `Only ${remaining} spot${remaining === 1 ? "" : "s"} remain for this session.`,
            variant: "destructive",
          });
          return false;
        }

        const existingAddOns = existingItem.workshop_booking?.addOns ?? [];
        const nextAddOns = [
          ...existingAddOns,
          ...(booking.addOns ?? []).filter(
            (addon) => !existingAddOns.some((existing) => existing.id === addon.id),
          ),
        ];

        const { data, error } = await supabase
          .from("cart_items")
          .update({
            quantity: newQuantity,
            workshop_booking: {
              ...workshopBooking,
              addOns: nextAddOns.length ? nextAddOns : undefined,
              participants: [],
            },
          })
          .eq("id", existingItem.id)
          .select()
          .single();

        if (error) throw error;

        setItems((prev) =>
          prev.map((item) => (item.id === existingItem.id ? data : item)),
        );
      } else {
        const { data, error } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: productId,
            product_name: cartName,
            product_price: booking.unitPrice,
            product_image: booking.image,
            quantity: booking.quantity,
            workshop_booking: workshopBooking,
          })
          .select()
          .single();

        if (error) throw error;
        setItems((prev) => [...prev, data]);
      }

      toast({
        title: "Added to cart",
        description: `${booking.title} has been added to your cart`,
      });
      return true;
    } catch (error) {
      console.error("Error adding workshop booking:", error);
      toast({
        title: "Error adding workshop",
        description: getSupabaseErrorMessage(error),
        variant: "destructive",
      });
      return false;
    }
  };

  const updateWorkshopParticipants = async (
    cartItemId: string,
    participants: WorkshopParticipant[],
  ) => {
    if (!user) return;

    try {
      const target = items.find((item) => item.id === cartItemId);
      if (!target?.workshop_booking) return;

      const { data, error } = await supabase
        .from("cart_items")
        .update({
          workshop_booking: {
            ...target.workshop_booking,
            participants,
          },
        })
        .eq("id", cartItemId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) => (item.id === cartItemId ? data : item)),
      );
    } catch (error) {
      console.error("Error updating workshop participants:", error);
      toast({
        title: "Could not save participant details",
        description: getSupabaseErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (!user || quantity < 1) return;

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => 
        prev.map(item => 
          item.product_id === productId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error updating quantity",
        description: "Failed to update item quantity",
        variant: "destructive"
      });
    }
  };

  const removeItem = async (productId: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.product_id !== productId));
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error removing item",
        description: "Failed to remove item from cart",
        variant: "destructive"
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setItems([]);
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error clearing cart",
        description: "Failed to clear your cart",
        variant: "destructive"
      });
    }
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + getCartItemLineTotal(item), 0);

  const value = {
    items,
    itemCount,
    totalPrice,
    loading,
    addItem,
    addCustomPot,
    addWorkshopBooking,
    updateWorkshopParticipants,
    updateQuantity,
    removeItem,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};