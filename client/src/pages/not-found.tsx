import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold text-card-foreground">404 - Página Não Encontrada</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground mb-6">
            A página que você está procurando não existe ou foi movida.
          </p>

          <div className="flex gap-2">
            <Link href="/">
              <Button variant="default">
                Voltar ao Início
              </Button>
            </Link>
            <Link href="/events">
              <Button variant="outline">
                Ver Eventos
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
