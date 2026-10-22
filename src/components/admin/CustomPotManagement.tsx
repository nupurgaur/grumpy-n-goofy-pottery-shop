import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDesignYourPotVisible } from "@/hooks/useDesignYourPotVisible";
import { Paintbrush } from "lucide-react";

const CustomPotManagement = () => {
  const { visible, loading, updateVisible } = useDesignYourPotVisible();
  const { toast } = useToast();
  const [draftVisible, setDraftVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setDraftVisible(visible);
    }
  }, [visible, loading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateVisible(draftVisible);
      toast({
        title: "Design Your Own Pot updated",
        description: draftVisible
          ? "The customizer is visible in the site menu and homepage."
          : "The customizer is hidden from navigation and the homepage.",
      });
    } catch (err: unknown) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Could not save setting",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Paintbrush className="h-5 w-5" />
          Design Your Own Pot
        </CardTitle>
        <CardDescription>
          Control whether customers see the custom pot designer in the menu,
          footer, and homepage promo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1 pr-4">
            <Label htmlFor="design-pot-visible">Show on website</Label>
            <p className="text-xs text-muted-foreground">
              When off, the Design Your Own Pot page is hidden and direct links
              redirect to the homepage.
            </p>
          </div>
          <Switch
            id="design-pot-visible"
            checked={draftVisible}
            disabled={loading}
            onCheckedChange={setDraftVisible}
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={loading || saving || draftVisible === visible}
        >
          {saving ? "Saving…" : "Save visibility"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CustomPotManagement;
