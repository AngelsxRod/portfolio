"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
} from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Kbd } from "@repo/ui/components/kbd";
import { Label } from "@repo/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@repo/ui/components/progress";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Separator } from "@repo/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Slider } from "@repo/ui/components/slider";
import { Switch } from "@repo/ui/components/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { Textarea } from "@repo/ui/components/textarea";
import { Toggle } from "@repo/ui/components/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";

const groups = {
  Acciones: [
    "button",
    "button-group",
    "toggle",
    "toggle-group",
    "dropdown-menu",
    "context-menu",
    "menubar",
    "command",
  ],
  Formularios: [
    "input",
    "input-group",
    "textarea",
    "checkbox",
    "radio-group",
    "switch",
    "slider",
    "select",
    "native-select",
    "combobox",
    "input-otp",
    "field",
    "label",
    "questionnaire",
  ],
  Contenido: [
    "card",
    "badge",
    "avatar",
    "alert",
    "empty",
    "item",
    "table",
    "chart",
    "code-block",
    "kbd",
    "aspect-ratio",
    "calendar",
    "carousel",
    "attachment",
    "bubble",
    "message",
    "message-scroller",
    "marker",
    "trace",
  ],
  Navegación: [
    "tabs",
    "accordion",
    "collapsible",
    "breadcrumb",
    "navigation-menu",
    "pagination",
    "sidebar",
    "scroll-area",
    "resizable",
  ],
  "Capas y estados": [
    "dialog",
    "alert-dialog",
    "sheet",
    "drawer",
    "popover",
    "hover-card",
    "tooltip",
    "sonner",
    "progress",
    "skeleton",
    "spinner",
    "separator",
    "direction",
  ],
} as const;

const entries = Object.entries(groups).flatMap(([category, names]) =>
  names.map((slug) => ({
    category,
    slug,
    name: slug
      .split("-")
      .map((part) =>
        part === "otp" ? "OTP" : part[0].toUpperCase() + part.slice(1),
      )
      .join(" "),
  })),
);

const previewSlugs = new Set([
  "accordion",
  "alert",
  "avatar",
  "badge",
  "button",
  "card",
  "checkbox",
  "dialog",
  "input",
  "kbd",
  "label",
  "popover",
  "progress",
  "radio-group",
  "select",
  "separator",
  "sheet",
  "skeleton",
  "slider",
  "switch",
  "tabs",
  "textarea",
  "toggle",
  "tooltip",
]);

function Preview({ slug }: { slug: string }) {
  switch (slug) {
    case "button":
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Button>Principal</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Sutil</Button>
        </div>
      );
    case "badge":
      return (
        <div className="flex flex-wrap gap-2">
          <Badge>Nuevo</Badge>
          <Badge variant="secondary">En progreso</Badge>
          <Badge variant="outline">Borrador</Badge>
          <Badge variant="destructive">Error</Badge>
        </div>
      );
    case "card":
      return (
        <Card className="w-full max-w-xs">
          <CardHeader>
            <CardTitle>Tu espacio</CardTitle>
            <CardDescription>Un ejemplo de contenido agrupado.</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Activo</Badge>
          </CardContent>
        </Card>
      );
    case "input":
      return (
        <div className="w-full max-w-xs space-y-2">
          <Label htmlFor="gallery-email">Correo electrónico</Label>
          <Input
            id="gallery-email"
            type="email"
            placeholder="nombre@ejemplo.com"
          />
        </div>
      );
    case "label":
      return (
        <div className="w-full max-w-xs space-y-2">
          <Label htmlFor="gallery-label">Nombre del proyecto</Label>
          <Input id="gallery-label" placeholder="Mi proyecto" />
        </div>
      );
    case "textarea":
      return (
        <div className="w-full max-w-xs space-y-2">
          <Label htmlFor="gallery-note">Nota</Label>
          <Textarea id="gallery-note" placeholder="Escribe algo aquí..." />
        </div>
      );
    case "checkbox":
      return (
        <Label className="flex items-center gap-3 text-sm">
          <Checkbox defaultChecked /> Recibir actualizaciones
        </Label>
      );
    case "switch":
      return (
        <Label className="flex items-center gap-3 text-sm">
          <Switch defaultChecked /> Notificaciones activas
        </Label>
      );
    case "slider":
      return (
        <div className="w-full max-w-xs space-y-3">
          <span className="text-sm text-muted-foreground">Intensidad</span>
          <Slider defaultValue={[35]} />
        </div>
      );
    case "radio-group":
      return (
        <RadioGroup defaultValue="personal">
          <Label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="personal" /> Personal
          </Label>
          <Label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="equipo" /> Equipo
          </Label>
        </RadioGroup>
      );
    case "select":
      return (
        <Select defaultValue="diseno">
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Selecciona un área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="diseno">Diseño</SelectItem>
            <SelectItem value="desarrollo">Desarrollo</SelectItem>
            <SelectItem value="producto">Producto</SelectItem>
          </SelectContent>
        </Select>
      );
    case "tabs":
      return (
        <Tabs defaultValue="vista" className="w-full max-w-xs">
          <TabsList>
            <TabsTrigger value="vista">Vista</TabsTrigger>
            <TabsTrigger value="detalles">Detalles</TabsTrigger>
          </TabsList>
          <TabsContent value="vista" className="pt-3 text-muted-foreground">
            Vista general del proyecto.
          </TabsContent>
          <TabsContent value="detalles" className="pt-3 text-muted-foreground">
            Detalles y configuración.
          </TabsContent>
        </Tabs>
      );
    case "accordion":
      return (
        <Accordion className="w-full max-w-xs">
          <AccordionItem value="item-1">
            <AccordionTrigger>¿Cómo funciona?</AccordionTrigger>
            <AccordionContent>
              Selecciona una sección para mostrar su contenido.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>¿Puedo abrir otra?</AccordionTrigger>
            <AccordionContent>
              Sí, prueba este segundo elemento.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    case "alert":
      return (
        <Alert className="max-w-xs">
          <AlertTitle>Todo está listo</AlertTitle>
          <AlertDescription>
            Los cambios se guardaron correctamente.
          </AlertDescription>
        </Alert>
      );
    case "avatar":
      return (
        <AvatarGroup>
          <Avatar>
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>MR</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
        </AvatarGroup>
      );
    case "progress":
      return (
        <Progress value={64} className="w-full max-w-xs">
          <ProgressLabel>Progreso</ProgressLabel>
          <ProgressValue />
        </Progress>
      );
    case "dialog":
      return (
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            Abrir diálogo
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear proyecto</DialogTitle>
              <DialogDescription>
                Este es un ejemplo interactivo de diálogo.
              </DialogDescription>
            </DialogHeader>
            <Input
              aria-label="Nombre del proyecto"
              placeholder="Nombre del proyecto"
            />
          </DialogContent>
        </Dialog>
      );
    case "sheet":
      return (
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>
            Abrir panel
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Panel lateral</SheetTitle>
              <SheetDescription>
                Contenido adicional sin abandonar la página.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );
    case "popover":
      return (
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            Abrir popover
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Acceso rápido</PopoverTitle>
              <PopoverDescription>
                Una capa compacta para acciones y detalles.
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      );
    case "tooltip":
      return (
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>
            Pasa el cursor
          </TooltipTrigger>
          <TooltipContent>Información adicional</TooltipContent>
        </Tooltip>
      );
    case "toggle":
      return (
        <Toggle variant="outline" aria-label="Activar favorito">
          ☆ Favorito
        </Toggle>
      );
    case "separator":
      return (
        <div className="w-full max-w-xs space-y-3 text-sm">
          <span>Información general</span>
          <Separator />
          <span className="text-muted-foreground">Configuración avanzada</span>
        </div>
      );
    case "skeleton":
      return (
        <div className="flex w-full max-w-xs items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      );
    case "kbd":
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Buscar <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </div>
      );
    default:
      return null;
  }
}

export function ComponentGallery() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const filtered = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (category === "Todos" || entry.category === category) &&
          `${entry.name} ${entry.slug} ${entry.category}`
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase()),
      ),
    [category, query],
  );
  const examples = filtered.filter((entry) => previewSlugs.has(entry.slug));
  const more = filtered.filter((entry) => !previewSlugs.has(entry.slug));

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10">
        <header className="flex h-18 items-center justify-between border-b border-border">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            portfolio<span className="text-muted-foreground"> / ui</span>
          </Link>
          <Badge variant="outline">@repo/ui</Badge>
        </header>

        <section className="relative overflow-hidden border-b border-border py-14 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-primary/5 blur-3xl"
          />
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Sistema de interfaz · shadcn/ui
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Galería de componentes
            <span className="text-muted-foreground">.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Explora las piezas compartidas del proyecto. Prueba los ejemplos,
            filtra por categoría y encuentra la ruta de importación de cada
            componente.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{entries.length} componentes</Badge>
            <span className="text-sm text-muted-foreground">
              {previewSlugs.size} ejemplos interactivos
            </span>
          </div>
        </section>

        <div className="sticky top-0 z-20 -mx-5 border-b border-border bg-background/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full max-w-sm">
              <Label htmlFor="component-search" className="sr-only">
                Buscar componentes
              </Label>
              <Input
                id="component-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar componentes..."
              />
            </div>
            <div
              className="flex flex-wrap gap-1"
              role="group"
              aria-label="Filtrar por categoría"
            >
              {["Todos", ...Object.keys(groups)].map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={category === item ? "secondary" : "ghost"}
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <section className="pt-10" aria-live="polite">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Vista previa
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Componentes listos para probar en esta página.
              </p>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {examples.length} resultados
            </span>
          </div>
          {examples.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {examples.map((entry) => (
                <Card key={entry.slug} size="sm" className="min-h-64">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{entry.name}</CardTitle>
                        <CardDescription>{entry.category}</CardDescription>
                      </div>
                      <Badge variant="outline">Vista</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex min-h-32 flex-1 items-center justify-center rounded-lg px-5 py-6">
                    <Preview slug={entry.slug} />
                  </CardContent>
                  <div className="border-t border-border px-3 pt-3">
                    <code className="break-all text-[11px] text-muted-foreground">
                      @repo/ui/components/{entry.slug}
                    </code>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {filtered.length === 0 && (
            <Card className="p-8 text-center">
              <p className="font-medium">No encontramos componentes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Prueba otra búsqueda o categoría.
              </p>
              <Button
                variant="outline"
                className="mx-auto mt-4"
                onClick={() => {
                  setQuery("");
                  setCategory("Todos");
                }}
              >
                Limpiar filtros
              </Button>
            </Card>
          )}
        </section>

        {more.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Más componentes
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  También disponibles en el paquete compartido.
                </p>
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">
                {more.length} componentes
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((entry) => (
                <div
                  key={entry.slug}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{entry.name}</p>
                    <code className="block truncate text-[11px] text-muted-foreground">
                      @repo/ui/components/{entry.slug}
                    </code>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {entry.category}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
