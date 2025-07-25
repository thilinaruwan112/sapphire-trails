
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, Plus, LoaderCircle, Pencil } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';
import Link from 'next/link';
import { mapServerLocationToClient } from '@/lib/locations-data';

const API_BASE_URL = 'https://server-sapphiretrails.payshia.com';

// Simplified type for this page's needs
interface ManagedLocation {
    slug: string;
    title: string;
    cardImage: string;
}

export default function ManageContentPage() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<ManagedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLocations() {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/locations`);
        if (!response.ok) {
          throw new Error('Failed to fetch locations from the server.');
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setLocations(data.map(loc => {
            const mapped = mapServerLocationToClient(loc);
            return {
              slug: mapped.slug,
              title: mapped.title,
              cardImage: mapped.cardImage,
            };
          }));
        }
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load locations. Please ensure the server is running.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchLocations();
  }, [toast]);

  const handleDelete = async (slug: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/locations/${slug}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Failed to delete the location.');
        }

        // Remove the location from the local state to update the UI instantly
        setLocations(prevLocations => prevLocations.filter(location => location.slug !== slug));

        toast({
            title: 'Location Deleted',
            description: `The location "${slug}" has been successfully deleted.`,
        });

    } catch (error) {
        console.error('Failed to delete location:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error instanceof Error ? error.message : 'Could not connect to the server.',
        });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Manage Locations</h1>
            <p className="text-muted-foreground">Add, edit, or delete custom locations for the &quot;Explore Ratnapura&quot; page.</p>
        </div>
        <Button asChild>
          <Link href="/admin/add-content">
            <Plus className="mr-2 h-4 w-4" />
            Add New Location
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Added Locations</CardTitle>
          <CardDescription>
            This list is fetched from your server. Deleting an item is permanent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4">
              <LoaderCircle className="h-12 w-12 text-muted-foreground/50 animate-spin" />
              <p>Loading locations from server...</p>
            </div>
          ) : locations.length > 0 ? (
            <div className="grid gap-6">
              {locations.map((location) => (
                <div key={location.slug} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Image
                    src={location.cardImage}
                    alt={location.title}
                    width={80}
                    height={80}
                    className="rounded-md object-cover aspect-square bg-muted"
                  />
                  <div className="grid gap-1 text-sm flex-1">
                    <div className="font-medium text-lg break-words">{location.title}</div>
                    <div className="text-muted-foreground break-all">Slug: {location.slug}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="icon">
                      <Link href={`/admin/edit-content/${location.slug}`}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {location.title}</span>
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete {location.title}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription className="break-words">
                            This action cannot be undone. This will permanently delete the content for <span className="font-semibold text-foreground">&quot;{location.title}&quot;</span>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(location.slug)}>
                            Yes, delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground/50" />
              <p>No custom locations have been added yet.</p>
              <Button asChild variant="link" className="text-primary">
                <Link href="/admin/add-content">Add your first location</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
