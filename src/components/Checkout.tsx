import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BRAND_NAME } from '@/config/brand';
import { isCustomPotCartItem } from '@/config/potCustomizer';
import { getWorkshopTicketLimits, isWorkshopCartItem } from '@/config/workshops';
import { isDateAllowedForWorkshop } from '@/lib/workshopSchedule';
import { cn } from '@/lib/utils';
import { WorkshopParticipantForm } from '@/components/workshops/WorkshopParticipantForm';
import {
  createEmptyParticipants,
  getCartItemLineTotal,
  getRequiredParticipantCount,
  getWorkshopAddonTotal,
  getWorkshopBookingMeta,
  resizeParticipants,
  serializeParticipantsForOrder,
  validateWorkshopParticipants,
  type WorkshopParticipant,
} from '@/lib/workshopParticipants';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ShippingAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface BillingAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface CheckoutFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  sameAsShipping: boolean;
}

interface PincodeDetails {
  postOffice: string;
  district: string;
  state: string;
}

const Checkout = () => {
  const { items, totalPrice, clearCart, updateWorkshopParticipants } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifyingPincode, setVerifyingPincode] = useState(false);
  const [pincodeValid, setPincodeValid] = useState<{ shipping: boolean | null; billing: boolean | null }>({
    shipping: null,
    billing: null
  });
  const [pincodeDetails, setPincodeDetails] = useState<{ shipping: PincodeDetails | null; billing: PincodeDetails | null }>({
    shipping: null,
    billing: null
  });
  const [productMeta, setProductMeta] = useState<Record<number, { is_template: boolean }>>({});
  const [participantsByItemId, setParticipantsByItemId] = useState<
    Record<string, WorkshopParticipant[]>
  >({});

  const emptyAddress: ShippingAddress = {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  };

  const [formData, setFormData] = useState<CheckoutFormData>({
    customerName: '',
    customerEmail: user?.email || '',
    customerPhone: '',
    shippingAddress: { ...emptyAddress },
    billingAddress: { ...emptyAddress },
    sameAsShipping: true
  });

  // Update email when user changes
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, customerEmail: user.email || '' }));
    }
  }, [user?.email]);

  useEffect(() => {
    setParticipantsByItemId((prev) => {
      const next: Record<string, WorkshopParticipant[]> = {};

      items.forEach((item) => {
        if (!isWorkshopCartItem(item.product_id, item.product_name)) return;

        const booking = getWorkshopBookingMeta(item);
        if (!booking) return;

        const required = getRequiredParticipantCount(booking.scheduleId, item.quantity);
        const existing =
          item.workshop_booking?.participants ??
          prev[item.id] ??
          createEmptyParticipants(required);

        next[item.id] = resizeParticipants(
          existing.map((participant) => ({
            name: participant.name ?? "",
            age: String(participant.age ?? ""),
          })),
          required,
        );
      });

      return next;
    });
  }, [items]);

  useEffect(() => {
    const productIds = items
      .filter((item) =>
        !isWorkshopCartItem(item.product_id, item.product_name) &&
        !isCustomPotCartItem(item.product_id, item.product_name)
      )
      .map((item) => item.product_id);

    if (productIds.length === 0) {
      setProductMeta({});
      return;
    }

    let cancelled = false;
    supabase
      .from('products')
      .select('id, is_template')
      .in('id', productIds)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const next: Record<number, { is_template: boolean }> = {};
        for (const row of data) {
          next[row.id] = { is_template: row.is_template === true };
        }
        setProductMeta(next);
      });

    return () => {
      cancelled = true;
    };
  }, [items]);

  const handleInputChange = (field: keyof CheckoutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If sameAsShipping is checked, update billing address
    if (field === 'sameAsShipping' && value === true) {
      setFormData(prev => ({ ...prev, billingAddress: { ...prev.shippingAddress } }));
      setPincodeValid(prev => ({ ...prev, billing: prev.shipping }));
      setPincodeDetails(prev => ({ ...prev, billing: prev.shipping }));
    }
  };

  const handleAddressChange = (type: 'shipping' | 'billing', field: keyof ShippingAddress, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type === 'shipping' ? 'shippingAddress' : 'billingAddress']: {
        ...prev[type === 'shipping' ? 'shippingAddress' : 'billingAddress'],
        [field]: value
      }
    }));

    // If sameAsShipping and we're updating shipping, also update billing
    if (type === 'shipping' && formData.sameAsShipping) {
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.shippingAddress,
          [field]: value
        }
      }));
    }
  };

  const verifyPincode = async (pincode: string, type: 'shipping' | 'billing') => {
    // Basic validation: Indian pincodes are 6 digits
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeValid(prev => ({ ...prev, [type]: false }));
      setPincodeDetails(prev => ({ ...prev, [type]: null }));
      return;
    }

    setVerifyingPincode(true);
    try {
      // Using PostalPinCode.in API (free, no API key required)
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        setPincodeValid(prev => ({ ...prev, [type]: true }));
        setPincodeDetails(prev => ({
          ...prev,
          [type]: {
            postOffice: postOffice.Name,
            district: postOffice.District,
            state: postOffice.State
          }
        }));

        // Auto-fill city and state from pincode details
        handleAddressChange(type, 'city', postOffice.District);
        handleAddressChange(type, 'state', postOffice.State);

        toast({
          title: "Pincode Verified",
          description: `${postOffice.Name}, ${postOffice.District}, ${postOffice.State}`,
        });
      } else {
        setPincodeValid(prev => ({ ...prev, [type]: false }));
        setPincodeDetails(prev => ({ ...prev, [type]: null }));
        toast({
          title: "Invalid Pincode",
          description: "Please enter a valid 6-digit Indian pincode.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Pincode verification error:', error);
      setPincodeValid(prev => ({ ...prev, [type]: false }));
      setPincodeDetails(prev => ({ ...prev, [type]: null }));
      toast({
        title: "Verification Failed",
        description: "Unable to verify pincode. Please check and try again.",
        variant: "destructive"
      });
    } finally {
      setVerifyingPincode(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const isWorkshopOnlyCheckout = items.length > 0 && items.every((item) =>
    isWorkshopCartItem(item.product_id, item.product_name),
  );

  const itemNeedsShipping = (item: (typeof items)[number]) => {
    if (isWorkshopCartItem(item.product_id, item.product_name)) return false;
    if (isCustomPotCartItem(item.product_id, item.product_name)) return true;
    return !productMeta[item.product_id]?.is_template;
  };

  const needsShipping = items.some(itemNeedsShipping);

  const isTemplateOnlyCheckout = items.length > 0 && items.every((item) => {
    if (isWorkshopCartItem(item.product_id, item.product_name)) return false;
    if (isCustomPotCartItem(item.product_id, item.product_name)) return false;
    return productMeta[item.product_id]?.is_template === true;
  });

  const isDigitalOnlyCheckout = !needsShipping;

  const hasWorkshopItems = items.some((item) =>
    isWorkshopCartItem(item.product_id, item.product_name),
  );

  const workshopValidation = (() => {
    if (!hasWorkshopItems) {
      return { valid: true, errors: [] as string[] };
    }

    const errors: string[] = [];
    items.forEach((item) => {
      if (!isWorkshopCartItem(item.product_id, item.product_name)) return;

      const booking = getWorkshopBookingMeta(item);
      if (!booking) {
        errors.push("Workshop booking details are missing.");
        return;
      }

      const limits = getWorkshopTicketLimits(booking.scheduleId);
      if (item.quantity < limits.min || item.quantity > limits.max) {
        errors.push(
          booking.scheduleId === "date-night"
            ? "Date Night is limited to one couple per time slot."
            : booking.scheduleId === "private-clay-parties"
              ? `Private clay parties are for ${limits.min} to ${limits.max} guests.`
              : `Drop-in sessions are limited to ${limits.max} people. For a larger group, book a private clay party.`,
        );
      }

      const [year, month, day] = booking.sessionDate.split("-").map(Number);
      const sessionDate = new Date(year, month - 1, day);
      if (!isDateAllowedForWorkshop(booking.scheduleId, sessionDate)) {
        errors.push("Workshops must be booked at least one day in advance, Wednesday through Sunday.");
      }

      const result = validateWorkshopParticipants(
        booking.scheduleId,
        item.quantity,
        participantsByItemId[item.id] ?? [],
      );
      errors.push(...result.errors);
    });

    return { valid: errors.length === 0, errors };
  })();

  const checkoutBasicsReady = Boolean(
    formData.customerName.trim() &&
    formData.customerEmail.trim() &&
    (isTemplateOnlyCheckout || formData.customerPhone.trim()),
  );

  const canSubmitPayment =
    checkoutBasicsReady && (!hasWorkshopItems || workshopValidation.valid);

  const handleParticipantChange = (
    cartItemId: string,
    participants: WorkshopParticipant[],
  ) => {
    setParticipantsByItemId((prev) => ({ ...prev, [cartItemId]: participants }));
  };

  const handlePayment = async () => {
    if (!canSubmitPayment) {
      toast({
        title: "Complete booking details",
        description: hasWorkshopItems
          ? workshopValidation.errors[0] || "Add all participant names and ages before paying."
          : "Please fill in all required details before paying.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to place an order.",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.customerName || !formData.customerEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and email.",
        variant: "destructive"
      });
      return;
    }

    if (!isTemplateOnlyCheckout && !formData.customerPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in your phone number.",
        variant: "destructive"
      });
      return;
    }

    const { shippingAddress, billingAddress } = formData;

    if (needsShipping) {
      if (
        !shippingAddress.addressLine1 ||
        !shippingAddress.city ||
        !shippingAddress.state ||
        !shippingAddress.pincode
      ) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields including complete shipping address.",
          variant: "destructive"
        });
        return;
      }

      if (pincodeValid.shipping === false) {
        toast({
          title: "Invalid Shipping Pincode",
          description: "Please verify your shipping pincode before proceeding.",
          variant: "destructive"
        });
        return;
      }

      if (!formData.sameAsShipping) {
        if (
          !billingAddress.addressLine1 ||
          !billingAddress.city ||
          !billingAddress.state ||
          !billingAddress.pincode
        ) {
          toast({
            title: "Missing Billing Information",
            description: "Please fill in all required billing address fields.",
            variant: "destructive"
          });
          return;
        }

        if (pincodeValid.billing === false) {
          toast({
            title: "Invalid Billing Pincode",
            description: "Please verify your billing pincode before proceeding.",
            variant: "destructive"
          });
          return;
        }
      }
    }

    try {
      setLoading(true);

      for (const item of items) {
        if (!isWorkshopCartItem(item.product_id, item.product_name)) continue;
        await updateWorkshopParticipants(item.id, participantsByItemId[item.id] ?? []);
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create Razorpay order
      const { data: orderData, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: totalPrice,
          currency: 'INR',
          receipt: `order_${Date.now()}`,
          customer_details: {
            name: formData.customerName,
            email: formData.customerEmail,
            phone: formData.customerPhone
          }
        }
      });

      if (error) {
        throw error;
      }

      // Configure Razorpay options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: BRAND_NAME,
        description: `Purchase from ${BRAND_NAME}`,
        order_id: orderData.order_id,
        prefill: {
          name: formData.customerName,
          email: formData.customerEmail,
          contact: formData.customerPhone
        },
        theme: {
          color: '#052b5b'
        },
        handler: async (response: any) => {
          try {
            const paymentCartItems = items.map((item) => {
              if (!isWorkshopCartItem(item.product_id, item.product_name)) {
                return item;
              }

              const booking = getWorkshopBookingMeta(item);
              if (!booking) return item;

              return {
                ...item,
                workshop_booking: {
                  scheduleId: booking.scheduleId,
                  sessionDate: booking.sessionDate,
                  slot: booking.slot,
                  addOns: booking.addOns,
                  participants: serializeParticipantsForOrder(
                    participantsByItemId[item.id] ?? [],
                  ),
                },
              };
            });

            // Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_details: {
                  user_id: user.id,
                  customer_name: formData.customerName,
                  customer_email: formData.customerEmail,
                  customer_phone: formData.customerPhone,
                  order_type: isWorkshopOnlyCheckout
                    ? 'workshop'
                    : isTemplateOnlyCheckout
                      ? 'template'
                      : 'product',
                  shipping_address: isDigitalOnlyCheckout
                    ? isTemplateOnlyCheckout
                      ? 'Digital template download — delivered by email'
                      : 'Workshop booking — in-studio session (no shipping required)'
                    : `${formData.shippingAddress.addressLine1}\n${formData.shippingAddress.addressLine2 ? formData.shippingAddress.addressLine2 + '\n' : ''}${formData.shippingAddress.city}, ${formData.shippingAddress.state} ${formData.shippingAddress.pincode}\n${formData.shippingAddress.country}`,
                  billing_address: isDigitalOnlyCheckout
                    ? isTemplateOnlyCheckout
                      ? 'Digital template download — delivered by email'
                      : 'Workshop booking — in-studio session (no shipping required)'
                    : formData.sameAsShipping
                      ? `${formData.shippingAddress.addressLine1}\n${formData.shippingAddress.addressLine2 ? formData.shippingAddress.addressLine2 + '\n' : ''}${formData.shippingAddress.city}, ${formData.shippingAddress.state} ${formData.shippingAddress.pincode}\n${formData.shippingAddress.country}`
                      : `${formData.billingAddress.addressLine1}\n${formData.billingAddress.addressLine2 ? formData.billingAddress.addressLine2 + '\n' : ''}${formData.billingAddress.city}, ${formData.billingAddress.state} ${formData.billingAddress.pincode}\n${formData.billingAddress.country}`,
                  shipping_address_details: isDigitalOnlyCheckout ? null : formData.shippingAddress,
                  billing_address_details: isDigitalOnlyCheckout
                    ? null
                    : formData.sameAsShipping ? formData.shippingAddress : formData.billingAddress,
                  total_amount: totalPrice
                },
                cart_items: paymentCartItems
              }
            });

            if (verifyError || !verifyData.success) {
              throw new Error(verifyData?.error || 'Payment verification failed');
            }

            toast({
              title: "Payment Successful!",
              description: isTemplateOnlyCheckout
                ? "Your template PDF has been sent to your email."
                : isWorkshopOnlyCheckout
                  ? "Your workshop booking is confirmed. Check your email for details."
                  : `Order ${verifyData.order_id} has been placed successfully.`,
            });

            // Clear cart and reset form
            clearCart();
            setFormData({
              customerName: '',
              customerEmail: user?.email || '',
              customerPhone: '',
              shippingAddress: { ...emptyAddress },
              billingAddress: { ...emptyAddress },
              sameAsShipping: true
            });
            setPincodeValid({ shipping: null, billing: null });
            setPincodeDetails({ shipping: null, billing: null });

            // Redirect to orders page after a short delay
            setTimeout(() => {
              navigate('/orders');
            }, 2000);

          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support.",
              variant: "destructive"
            });
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed');
          }
        }
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Your cart is empty</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => {
              const isCustomPot = isCustomPotCartItem(item.product_id, item.product_name);

              return (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img 
                    src={item.product_image} 
                    alt={item.product_name}
                    className={cn(
                      "w-12 h-12 rounded shrink-0",
                      isCustomPot ? "object-contain bg-[#FAF6F0]" : "object-cover",
                    )}
                  />
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{item.product_price} × {item.quantity}
                      {getWorkshopAddonTotal(item.workshop_booking) > 0
                        ? ` + ${(item.workshop_booking?.addOns ?? [])
                            .map((addon) => `${addon.label} ₹${addon.price}`)
                            .join(", ")}`
                        : ""}
                    </p>
                  </div>
                </div>
                <p className="font-medium">₹{getCartItemLineTotal(item).toFixed(2)}</p>
              </div>
            );
            })}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isDigitalOnlyCheckout ? "Your Details" : "Shipping Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTemplateOnlyCheckout && (
            <p className="text-sm text-muted-foreground font-sans">
              Digital templates are delivered by email — no shipping address needed.
              Your PDF download link will be sent after payment.
            </p>
          )}
          {isWorkshopOnlyCheckout && (
            <p className="text-sm text-muted-foreground font-sans">
              Workshop bookings are in-studio sessions — no shipping address needed.
              We&apos;ll email your booking details after payment.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {!isTemplateOnlyCheckout && (
          <div>
            <Label htmlFor="customerPhone">Phone Number *</Label>
            <Input
              id="customerPhone"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>
          )}

          {needsShipping && (
          <>
          <Separator className="my-4" />

          <div>
            <h3 className="text-lg font-semibold mb-3">Shipping Address *</h3>
          </div>

          <div>
            <Label htmlFor="shippingAddressLine1">Address Line 1 *</Label>
            <Input
              id="shippingAddressLine1"
              value={formData.shippingAddress.addressLine1}
              onChange={(e) => handleAddressChange('shipping', 'addressLine1', e.target.value)}
              placeholder="Apartment, suite, building, floor, etc."
              required
            />
          </div>

          <div>
            <Label htmlFor="shippingAddressLine2">Address Line 2</Label>
            <Input
              id="shippingAddressLine2"
              value={formData.shippingAddress.addressLine2}
              onChange={(e) => handleAddressChange('shipping', 'addressLine2', e.target.value)}
              placeholder="Street or landmark (optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingCity">City *</Label>
              <Input
                id="shippingCity"
                value={formData.shippingAddress.city}
                onChange={(e) => handleAddressChange('shipping', 'city', e.target.value)}
                placeholder="City"
                required
              />
            </div>
            <div>
              <Label htmlFor="shippingState">State *</Label>
              <Input
                id="shippingState"
                value={formData.shippingAddress.state}
                onChange={(e) => handleAddressChange('shipping', 'state', e.target.value)}
                placeholder="State"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingPincode">Pincode *</Label>
              <div className="flex gap-2">
                <Input
                  id="shippingPincode"
                  value={formData.shippingAddress.pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    handleAddressChange('shipping', 'pincode', value);
                    setPincodeValid(prev => ({ ...prev, shipping: null }));
                  }}
                  onBlur={(e) => {
                    if (e.target.value.length === 6) {
                      verifyPincode(e.target.value, 'shipping');
                    }
                  }}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  required
                  className="flex-1"
                />
                {formData.shippingAddress.pincode.length === 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => verifyPincode(formData.shippingAddress.pincode, 'shipping')}
                    disabled={verifyingPincode}
                  >
                    {verifyingPincode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : pincodeValid.shipping === true ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : pincodeValid.shipping === false ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <span className="text-xs">Verify</span>
                    )}
                  </Button>
                )}
              </div>
              {pincodeDetails.shipping && (
                <p className="text-xs text-muted-foreground mt-1">
                  ✓ {pincodeDetails.shipping.postOffice}, {pincodeDetails.shipping.district}, {pincodeDetails.shipping.state}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="shippingCountry">Country *</Label>
              <Input
                id="shippingCountry"
                value={formData.shippingAddress.country}
                onChange={(e) => handleAddressChange('shipping', 'country', e.target.value)}
                placeholder="Country"
                required
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sameAsShipping"
              checked={formData.sameAsShipping}
              onChange={(e) => handleInputChange('sameAsShipping', e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="sameAsShipping" className="font-normal cursor-pointer">
              Billing address is the same as shipping address
            </Label>
          </div>

          {!formData.sameAsShipping && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3">Billing Address *</h3>
              </div>

              <div>
                <Label htmlFor="billingAddressLine1">Address Line 1 *</Label>
                <Input
                  id="billingAddressLine1"
                  value={formData.billingAddress.addressLine1}
                  onChange={(e) => handleAddressChange('billing', 'addressLine1', e.target.value)}
                  placeholder="Apartment, suite, building, floor, etc."
                  required
                />
              </div>

              <div>
                <Label htmlFor="billingAddressLine2">Address Line 2</Label>
                <Input
                  id="billingAddressLine2"
                  value={formData.billingAddress.addressLine2}
                  onChange={(e) => handleAddressChange('billing', 'addressLine2', e.target.value)}
                  placeholder="Street or landmark (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingCity">City *</Label>
                  <Input
                    id="billingCity"
                    value={formData.billingAddress.city}
                    onChange={(e) => handleAddressChange('billing', 'city', e.target.value)}
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="billingState">State *</Label>
                  <Input
                    id="billingState"
                    value={formData.billingAddress.state}
                    onChange={(e) => handleAddressChange('billing', 'state', e.target.value)}
                    placeholder="State"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingPincode">Pincode *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="billingPincode"
                      value={formData.billingAddress.pincode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        handleAddressChange('billing', 'pincode', value);
                        setPincodeValid(prev => ({ ...prev, billing: null }));
                      }}
                      onBlur={(e) => {
                        if (e.target.value.length === 6) {
                          verifyPincode(e.target.value, 'billing');
                        }
                      }}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      required
                      className="flex-1"
                    />
                    {formData.billingAddress.pincode.length === 6 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => verifyPincode(formData.billingAddress.pincode, 'billing')}
                        disabled={verifyingPincode}
                      >
                        {verifyingPincode ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : pincodeValid.billing === true ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : pincodeValid.billing === false ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <span className="text-xs">Verify</span>
                        )}
                      </Button>
                    )}
                  </div>
                  {pincodeDetails.billing && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✓ {pincodeDetails.billing.postOffice}, {pincodeDetails.billing.district}, {pincodeDetails.billing.state}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="billingCountry">Country *</Label>
                  <Input
                    id="billingCountry"
                    value={formData.billingAddress.country}
                    onChange={(e) => handleAddressChange('billing', 'country', e.target.value)}
                    placeholder="Country"
                    required
                  />
                </div>
              </div>
            </>
          )}
          </>
          )}

          {hasWorkshopItems && (
            <WorkshopParticipantForm
              items={items}
              participantsByItemId={participantsByItemId}
              onChange={handleParticipantChange}
              validationErrors={workshopValidation.errors}
            />
          )}

          <Button 
            onClick={handlePayment} 
            disabled={loading || !canSubmitPayment} 
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay ₹{totalPrice.toFixed(2)} with Razorpay
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkout;