
"use client";
import { useState } from 'react';
import type { MarketingMaterial as MarketingMaterialType } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import * as firestoreService from '@/lib/firestoreService';
import { PlusCircle, ShoppingBag, ImageIcon, Video, FileText, Link as LinkIcon, Pencil, Trash2, Upload, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { MarketingMaterialCard } from './marketing-card';

const MarketingMaterialSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  description: z.string().min(10, "La descripción es requerida."),
  type: z.enum(['image', 'video', 'file', 'url']),
  url: z.string().min(1, "Se requiere una URL o un archivo."),
  thumbnailUrl: z.string().min(1, "Se requiere una URL de miniatura o un archivo."),
});

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
  });
};

interface MarketingTabProps {
  marketingMaterials: MarketingMaterialType[];
  onUpdate: () => void;
  onDeleteItem: (type: 'marketing', item: MarketingMaterialType) => void;
}

export function MarketingTab({ marketingMaterials, onUpdate, onDeleteItem }: MarketingTabProps) {
  const { toast } = useToast();
  const [isMarketingDialogOpen, setIsMarketingDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MarketingMaterialType | null>(null);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);

  const handleSaveMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSavingMaterial(true);
      const formData = new FormData(e.currentTarget);

      let finalUrl = formData.get('url') as string;
      let finalThumbnailUrl = formData.get('thumbnailUrl') as string;

      try {
          if (materialFile) { finalUrl = await fileToDataUri(materialFile); }
          if (thumbnailFile) { finalThumbnailUrl = await fileToDataUri(thumbnailFile); }
          
          const dataToValidate = {
              title: formData.get('title') as string,
              description: formData.get('description') as string,
              type: formData.get('type') as MarketingMaterialType['type'],
              url: finalUrl,
              thumbnailUrl: finalThumbnailUrl || (finalUrl.startsWith('data:image') ? finalUrl : 'https://placehold.co/600x400.png'),
          };

          const result = MarketingMaterialSchema.safeParse(dataToValidate);
          if (!result.success) {
              toast({ variant: 'destructive', title: 'Errores de Validación', description: result.error.errors.map(err => err.message).join(' ') });
              return;
          }
          
          if (editingMaterial) {
              await firestoreService.updateMarketingMaterial(editingMaterial.id, result.data);
              toast({ title: "Material Actualizado" });
          } else {
              await firestoreService.addMarketingMaterial(result.data);
              toast({ title: "Material Agregado" });
          }
          
          onUpdate();
          setIsMarketingDialogOpen(false);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error al procesar archivo', description: 'No se pudo leer el archivo seleccionado.' });
      } finally {
          setIsSavingMaterial(false);
      }
  };

  const openDialog = (material: MarketingMaterialType | null) => {
    setEditingMaterial(material);
    setMaterialFile(null);
    setThumbnailFile(null);
    setIsMarketingDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle className="flex items-center gap-2"><ShoppingBag/> Material de Marketing</CardTitle>
                <CardDescription>Gestiona los recursos que las vendedoras usan para promocionar SUMA.</CardDescription>
            </div>
            <Button onClick={() => openDialog(null)}>
                <PlusCircle className="mr-2"/> Añadir Material
            </Button>
        </CardHeader>
        <CardContent>
            {marketingMaterials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketingMaterials.map((material) => (
                        <MarketingMaterialCard 
                            key={material.id} 
                            material={material} 
                            onEdit={() => openDialog(material)}
                            onDelete={() => onDeleteItem('marketing', material)}
                        />
                    ))}
                </div>
            ) : (<p className="text-center text-muted-foreground py-12">No hay materiales de marketing cargados.</p>)}
        </CardContent>
      </Card>
      
      <Dialog open={isMarketingDialogOpen} onOpenChange={setIsMarketingDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "Editar Material" : "Añadir Nuevo Material"}</DialogTitle>
            <DialogDescription>Completa la información del recurso de marketing.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveMaterial}>
            <div className="grid gap-4 py-4">
              <div><Label htmlFor="title">Título</Label><Input id="title" name="title" defaultValue={editingMaterial?.title} /></div>
              <div><Label htmlFor="description">Descripción Detallada</Label><Textarea id="description" name="description" defaultValue={editingMaterial?.description} rows={4} /></div>
              <div><Label htmlFor="type">Tipo de Material</Label>
                <Select name="type" defaultValue={editingMaterial?.type || 'image'}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image"><div className="flex items-center gap-2"><ImageIcon/> Imagen</div></SelectItem>
                    <SelectItem value="video"><div className="flex items-center gap-2"><Video/> Video</div></SelectItem>
                    <SelectItem value="file"><div className="flex items-center gap-2"><FileText/> Archivo (PDF, etc.)</div></SelectItem>
                    <SelectItem value="url"><div className="flex items-center gap-2"><LinkIcon/> Enlace</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL del Recurso</Label>
                <Input id="url" name="url" defaultValue={editingMaterial?.url} placeholder="https://..."/>
                <p className="text-xs text-center text-muted-foreground">O</p>
                <Label htmlFor="materialFile" className="text-sm">Subir Archivo de Recurso</Label>
                <Input id="materialFile" type="file" onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">URL de la Miniatura</Label>
                <Input id="thumbnailUrl" name="thumbnailUrl" defaultValue={editingMaterial?.thumbnailUrl} placeholder="https://..."/>
                 <p className="text-xs text-center text-muted-foreground">O</p>
                <Label htmlFor="thumbnailFile" className="text-sm">Subir Archivo de Miniatura</Label>
                <Input id="thumbnailFile" type="file" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}/>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isSavingMaterial}>
                {isSavingMaterial && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
