import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUpload = ({ images, onChange, maxImages = 5 }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed. You have ${images.length} images and trying to add ${files.length} more.`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newImageUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file`,
            variant: "destructive"
          });
          continue;
        }

        // Validate file size (max 7MB)
        if (file.size > 7 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 7MB`,
            variant: "destructive"
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);

        newImageUrls.push(publicUrl);
      }

      if (newImageUrls.length > 0) {
        onChange([...images, ...newImageUrls]);
        toast({
          title: "Images uploaded",
          description: `Successfully uploaded ${newImageUrls.length} image(s)`,
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload error",
        description: "An unexpected error occurred while uploading",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (imageUrl: string, index: number) => {
    try {
      // Extract file path from URL for deletion
      if (imageUrl.includes('product-images')) {
        const fileName = imageUrl.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('product-images')
            .remove([fileName]);
        }
      }
      
      const updatedImages = images.filter((_, i) => i !== index);
      onChange(updatedImages);
      
      toast({
        title: "Image removed",
        description: "Image has been deleted successfully",
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete image",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Product Images (Max {maxImages})</Label>
        <p className="text-sm text-muted-foreground">
          Upload high-quality images of your product. Supported formats: JPG, PNG, WebP. Max size: 7MB each.
        </p>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Product image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveImage(imageUrl, index)}
              >
                <X className="h-3 w-3" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {images.length < maxImages && (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="space-y-2">
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Choose Images'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Click to select images or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                {images.length}/{maxImages} images uploaded
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};