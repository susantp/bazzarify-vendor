import { TProductForm } from "@/modules/product.management";
import { useRef, useState } from "react";

export default function useProduct() {
  const nameRef = useRef<HTMLInputElement>(null);
  const basePriceRef = useRef<HTMLInputElement>(null);
  const productHighlightsRef = useRef<HTMLTextAreaElement>(null);
  const productBoxItemsRef = useRef<HTMLInputElement>(null);
  const [existingProductImages, setExistingProductImages] = useState<string[]>([
    // "https://placehold.co/600x400.png",
  ]);
  const [uploadedProductImages, setUploadedProductImages] = useState<File[]>(
    [],
  );
  const [existingImageIdMap, setExistingImageIdMap] = useState<
    Record<string, string>
  >({});
  const [productForm, setProductForm] = useState<TProductForm>({
    name: "",
    sku: "",
    type: "retail",
    box_items: "",
    base_price: "",
    minimum_order_quantity: "",
    category: "",
    uuid: "",
    highlights: "",
    description: "",
  });
  const handleProductForm = (key: keyof TProductForm, value: string) => {
    setProductForm((prevState) => ({ ...prevState, [key]: value }));
  };
  const handleProductImageUpload = (files: File[]) => {
    setUploadedProductImages(files);
  };
  const handleExistingProductImagesChange = (images: string[]) => {
    setExistingProductImages(images);
  };

  return {
    nameRef,
    basePriceRef,
    productHighlightsRef,
    productBoxItemsRef,
    existingProductImages,
    setExistingProductImages,
    handleExistingProductImagesChange,
    uploadedProductImages,
    handleProductImageUpload,
    productForm,
    handleProductForm,
    setProductForm,
    existingImageIdMap,
    setExistingImageIdMap,
  };
}
