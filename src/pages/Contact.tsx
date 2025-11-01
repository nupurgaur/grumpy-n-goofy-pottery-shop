import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Leaf, HandHeart, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ContactPage = () => {
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      comment: String(formData.get('comment') || ''),
    };

    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: payload
      });
      if (error) throw error;
      toast({ title: 'Message sent', description: 'Thanks for reaching out! We will get back to you soon.' });
      form.reset();
    } catch (err: any) {
      toast({ title: 'Failed to send', description: err?.message || 'Please try again later.', variant: 'destructive' });
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold text-brand-primary mb-4">Contact Us</h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                We’re here to help with orders, product questions, or feedback. Reach out and we’ll get back during support hours.
              </p>
              <p className="text-lg text-muted-foreground max-w-4xl mt-4">
                Looking for bulk orders for cafes, restaurants, or corporate gifting? We’d love to collaborate. 
                Write to us using the form below or email us at <span className="font-medium">goofyngrumpy@gmail.com</span>. 
                You can also connect with us on Instagram <span className="font-medium">@goofyngrumpy</span> for quick queries and updates.
              </p>
            </div>

            {/* Why order from us */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <Card className="shadow-card border-0">
                <CardContent className="p-5 flex items-start gap-3">
                  <Leaf className="h-5 w-5 text-brand-secondary" />
                  <div>
                    <div className="font-semibold text-brand-primary">Sustainable first</div>
                    <p className="text-sm text-muted-foreground">Eco-conscious materials and small-batch production to reduce waste.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card border-0">
                <CardContent className="p-5 flex items-start gap-3">
                  <HandHeart className="h-5 w-5 text-brand-secondary" />
                  <div>
                    <div className="font-semibold text-brand-primary">Thoughtful & handcrafted</div>
                    <p className="text-sm text-muted-foreground">Each piece is hand-thrown and finished—made to be used and loved.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card border-0">
                <CardContent className="p-5 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-brand-secondary" />
                  <div>
                    <div className="font-semibold text-brand-primary">Reliable for bulk</div>
                    <p className="text-sm text-muted-foreground">Clear timelines and careful packing for cafes, restaurants, and gifting.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Support Details */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-brand-primary">Customer Support</CardTitle>
                  <CardDescription>Monday to Friday, 10:00 am – 6:00 pm (IST)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <div className="font-semibold">Address</div>
                    <div className="text-muted-foreground">Lower Parel, Mumbai, Maharashtra 400013</div>
                  </div>
                  <div>
                    <div className="font-semibold">Phone</div>
                    <div className="text-muted-foreground">+91-93 72 65 73 21</div>
                  </div>
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-muted-foreground">goofyngrumpy@gmail.com</div>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Response times may vary with volume, but we aim to reply promptly. You can also DM us on Instagram @goofyngrumpy.
                  </p>
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-brand-primary">Contact form</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Your name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone number</Label>
                        <Input id="phone" name="phone" placeholder="+91-" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comment">Comment</Label>
                        <Textarea id="comment" name="comment" placeholder="How can we help?" rows={5} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Send</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Subscribe */}
            <Card className="shadow-card border-0 mt-8">
              <CardHeader>
                <CardTitle className="text-brand-primary">Subscribe to our emails</CardTitle>
                <CardDescription>Join our email list for exclusive offers and the latest news.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="flex flex-col sm:flex-row gap-3">
                  <Input type="email" placeholder="Email" className="flex-1" />
                  <Button type="submit" variant="accent">Subscribe</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;


