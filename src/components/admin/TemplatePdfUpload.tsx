import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TemplatePdfUploadProps {
  pdfUrl: string;
  onChange: (url: string) => void;
}

export const TemplatePdfUpload = ({ pdfUrl, onChange }: TemplatePdfUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "PDF must be 20MB or smaller.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { data, error } = await supabase.storage
        .from("template-pdfs")
        .upload(fileName, file, { contentType: "application/pdf" });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("template-pdfs")
        .getPublicUrl(data.path);

      onChange(publicUrl);
      toast({
        title: "PDF uploaded",
        description: "Template PDF is ready for delivery after purchase.",
      });
    } catch (error: unknown) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload PDF",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    if (pdfUrl.includes("template-pdfs")) {
      const fileName = pdfUrl.split("/").pop();
      if (fileName) {
        await supabase.storage.from("template-pdfs").remove([fileName]);
      }
    }
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label>Template PDF *</Label>
      <p className="text-sm text-muted-foreground">
        Customers receive this PDF by email after payment. Max 20MB.
      </p>

      {pdfUrl ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-brand-secondary" />
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm truncate text-brand-secondary hover:underline"
            >
              View uploaded PDF
            </a>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={handleRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload PDF"}
          </Button>
        </div>
      )}
    </div>
  );
};
