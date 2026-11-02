import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, Mail, Instagram, MapPin, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { typography } from "@/config/typography";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/config/social";
import {
  CONTACT_EMAIL,
  GOOGLE_MAPS_DIRECTIONS_URL,
  GOOGLE_MAPS_EMBED_URL,
  GOOGLE_MAPS_PROFILE_URL,
  STUDIO_ADDRESS,
} from "@/config/contact";
import { sendContactMessage } from "@/lib/sendContactMessage";
import { useLocation } from "react-router-dom";
import { useState } from "react";

const QUICK_CONTACT = [
  {
    label: "Email",
    icon: Mail,
    content: (
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="text-sm text-muted-foreground hover:text-brand-secondary transition-colors"
      >
        {CONTACT_EMAIL}
      </a>
    ),
  },
  {
    label: "Instagram",
    icon: Instagram,
    content: (
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground hover:text-brand-secondary transition-colors"
      >
        {INSTAGRAM_HANDLE}
      </a>
    ),
  },
  {
    label: "Studio",
    icon: MapPin,
    content: (
      <address className="text-sm text-muted-foreground not-italic leading-relaxed">
        {STUDIO_ADDRESS}
      </address>
    ),
  },
] as const;

type ContactLocationState = {
  subject?: string;
  message?: string;
};

const ContactPage = () => {
  const { toast } = useToast();
  const location = useLocation();
  const prefill = (location.state as ContactLocationState | null) ?? {};
  const [isSending, setIsSending] = useState(false);

  const scrollToForm = () => {
    document.getElementById("contact-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      subject: String(formData.get("subject") || ""),
      comment: String(formData.get("message") || ""),
    };

    setIsSending(true);
    try {
      await sendContactMessage(payload);
      toast({
        title: "Message sent",
        description: "Thanks for reaching out! I'll get back to you soon.",
      });
      form.reset();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Please try again later.";
      toast({
        title: "Failed to send",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
            <h1
              className={`text-4xl lg:text-5xl text-brand-primary mb-6 leading-tight ${typography.title}`}
            >
              Let&apos;s Connect
            </h1>
            <div className="space-y-4 text-muted-foreground font-sans leading-relaxed text-base sm:text-lg">
              <p>
                Whether you&apos;re interested in a ceramic piece, joining a
                workshop, collaborating on a project, or simply saying hello,
                I&apos;d love to hear from you.
              </p>
              <p>
                Goofy n Grumpy is built around creativity, curiosity, and
                community — and every conversation starts with a simple
                message.
              </p>
            </div>
          </div>
        </section>

        {/* Quick contact */}
        <section className="pb-14 sm:pb-16 border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
              {QUICK_CONTACT.map(({ label, icon: Icon, content }) => (
                <div
                  key={label}
                  className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3"
                >
                  <Icon
                    className="h-5 w-5 text-brand-secondary shrink-0"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p
                      className={`text-sm text-brand-primary mb-1 ${typography.heading}`}
                    >
                      {label}
                    </p>
                    {content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Map & directions */}
        <section className="pb-14 sm:pb-16 border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <div className="text-center mb-8">
              <h2 className={`text-2xl text-brand-primary mb-2 ${typography.title}`}>
                Visit the studio
              </h2>
              <p className="text-sm text-muted-foreground font-sans max-w-xl mx-auto">
                {STUDIO_ADDRESS}
              </p>
            </div>
            <div className="rounded-xl overflow-hidden border border-border/60 shadow-card aspect-[16/10] sm:aspect-[21/9] bg-muted/30">
              <iframe
                title="Goofy n Grumpy studio location on Google Maps"
                src={GOOGLE_MAPS_EMBED_URL}
                className="w-full h-full min-h-[240px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 mt-6">
              <Button variant="quirky" size="lg" asChild>
                <a
                  href={GOOGLE_MAPS_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Get directions
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a
                  href={GOOGLE_MAPS_PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Google Maps
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Form + details */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-start">
              {/* Left */}
              <div className="space-y-8">
                <div>
                  <h2
                    className={`text-2xl lg:text-3xl text-brand-primary mb-4 ${typography.title}`}
                  >
                    Get in Touch
                  </h2>
                  <p className="text-muted-foreground font-sans leading-relaxed">
                    Questions about ceramics, workshops, templates, custom orders,
                    or collaborations? Send a message and I&apos;ll get back to you
                    as soon as possible.
                  </p>
                </div>

                <ul className="space-y-5">
                  <li className="flex items-start gap-3">
                    <Mail className="h-4 w-4 mt-0.5 text-brand-secondary shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-brand-primary/70 font-sans mb-0.5">
                        Email
                      </p>
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="text-sm text-muted-foreground hover:text-brand-secondary transition-colors"
                      >
                        {CONTACT_EMAIL}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Instagram className="h-4 w-4 mt-0.5 text-brand-secondary shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-brand-primary/70 font-sans mb-0.5">
                        Instagram
                      </p>
                      <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-brand-secondary transition-colors"
                      >
                        {INSTAGRAM_HANDLE}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 text-brand-secondary shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-brand-primary/70 font-sans mb-0.5">
                        Studio
                      </p>
                      <address className="text-sm text-muted-foreground not-italic leading-relaxed">
                        {STUDIO_ADDRESS}
                      </address>
                      <div className="mt-2 flex flex-col gap-1">
                        <a
                          href={GOOGLE_MAPS_DIRECTIONS_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-brand-secondary hover:underline"
                        >
                          Get directions
                        </a>
                        <a
                          href={GOOGLE_MAPS_PROFILE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-brand-secondary hover:underline"
                        >
                          Google Maps profile
                        </a>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Right — form */}
              <div
                id="contact-form"
                className="scroll-mt-28 rounded-xl border border-border/60 bg-background p-6 sm:p-8 lg:p-10"
              >
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your name"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="What's this about?"
                      defaultValue={prefill.subject ?? ""}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell me a little about what you're looking for..."
                      defaultValue={prefill.message ?? ""}
                      rows={6}
                      className="bg-background resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="quirky"
                    size="lg"
                    className="w-full sm:w-auto"
                    disabled={isSending}
                  >
                    {isSending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Wholesale */}
        <section className="pb-20 sm:pb-24 lg:pb-28">
          <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
            <h2
              className={`text-2xl lg:text-3xl text-brand-primary mb-4 ${typography.title}`}
            >
              Wholesale &amp; Collaborations
            </h2>
            <div className="space-y-4 text-muted-foreground font-sans leading-relaxed mb-8">
              <p>
                Looking for custom ceramics, workshop partnerships, studio
                collaborations, café projects, gifting, or creative events?
              </p>
              <p>I&apos;d love to explore ideas together.</p>
            </div>
            <Button variant="outline" size="lg" onClick={scrollToForm}>
              Start a Conversation
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
