import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold text-destructive">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground font-mono">
            The requested resource could not be located on this server. Check your URL or contact the administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
