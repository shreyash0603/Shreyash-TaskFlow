
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BasicPage() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome to Your Basic Page!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            This is a simple, clean frontend page built with Next.js and ShadCN UI.
          </p>
          <p>
            You can use this as a starting point for new features or a simpler interface.
          </p>
          <div className="mt-6">
            <Link href="/" passHref>
              <Button>Go to Main TaskFlow App</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
