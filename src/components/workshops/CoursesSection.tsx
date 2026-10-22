import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { typography } from "@/config/typography";
import { useToast } from "@/hooks/use-toast";
import { useWorkshopCatalog } from "@/hooks/useWorkshopCatalog";
import { GraduationCap, Sparkles } from "lucide-react";

export const CoursesSection = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { courses, loading } = useWorkshopCatalog();

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    toast({
      title: "You're on the list!",
      description:
        "We'll notify you when structured pottery courses are available.",
    });
    setEmail("");
  };

  if (loading) {
    return <div className="h-48 rounded-xl bg-muted animate-pulse" />;
  }

  if (!courses) {
    return (
      <p className="text-sm text-muted-foreground font-sans">
        Courses are not available right now.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="border border-border/50 shadow-card overflow-hidden">
        <CardContent className="p-8 sm:p-12 text-center space-y-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-[#FCE8EE] border border-brand-secondary/30">
            <GraduationCap className="h-7 w-7 text-brand-primary" />
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className={`text-2xl sm:text-3xl text-brand-primary ${typography.heading}`}>
              {courses.title}
            </h2>
            <p className="text-muted-foreground font-sans leading-relaxed">
              {courses.description}
            </p>
            <p className={`text-lg text-brand-secondary ${typography.heading}`}>
              {courses.status}
            </p>
          </div>

          <div className="flex justify-center">
            <Sparkles className="h-5 w-5 text-brand-secondary/60" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-[#0D2B52]/10 shadow-card max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <p className={`text-sm text-brand-primary text-center ${typography.heading}`}>
            Get notified when courses launch
          </p>
          <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-sans"
            />
            <Button type="submit" variant="quirky" className="shrink-0">
              Notify Me
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
