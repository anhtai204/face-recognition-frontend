"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, ImageIcon } from "lucide-react";
import { FaceEmbedding, FaceEmbeddingCreate } from "@/types/next-auth";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

interface SavedImagesGalleryProps {
  images: FaceEmbeddingCreate[];
  onRemoveImage: (imageId: string) => void;
  onAddNewImages?: () => void;
}

export function SavedImagesGallery({
  images,
  onRemoveImage,
  onAddNewImages,
}: SavedImagesGalleryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    imageId: string | null;
  }>({
    open: false,
    imageId: null,
  });

  const handleDeleteImage = (imageId: string) => {
    setDeleteConfirmation({ open: true, imageId });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.imageId) {
      onRemoveImage(deleteConfirmation.imageId);
      setDeleteConfirmation({ open: false, imageId: null });
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-6 border border-dashed rounded-lg">
        <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No face images uploaded yet
        </p>
        {onAddNewImages && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddNewImages}
            className="mt-3"
          >
            Upload Face Images
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Badge className="bg-blue-600">{images.length}</Badge>
              Saved Face Images
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Click remove to delete an image or upload new images to update
              embeddings
            </p>
          </div>
          {onAddNewImages && (
            <Button variant="outline" size="sm" onClick={onAddNewImages}>
              Add More Images
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square"
              onMouseEnter={() => setHoveredId(image.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Card className="overflow-hidden">
                <img
                  src={image.image_url || "/placeholder.svg"}
                  alt="Face embedding"
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                />
              </Card>

              {hoveredId === image.id && (
                <div className="absolute inset-0 bg-black/50 flex items-end justify-center p-2 rounded-lg">
                  <Button
                    variant="destructive"
                    size="sm"
                    // onClick={() => onRemoveImage(image.id)}
                    onClick={() => handleDeleteImage(image.id)}
                    className="w-full gap-2 h-8"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              )}

              <div className="absolute top-2 right-2 bg-black/60 rounded px-2 py-1">
                <p className="text-xs text-white font-medium">
                  {new Date(image.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteConfirmation.open}
        onOpenChange={(open) =>
          setDeleteConfirmation({ ...deleteConfirmation, open })
        }
        title="Delete Face Image"
        description="Are you sure you want to delete this face image? This will remove the associated face embedding used for facial recognition."
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
