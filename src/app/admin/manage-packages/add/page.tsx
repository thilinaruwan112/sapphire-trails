
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { packageFormSchema } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const iconOptions = ['MapPin', 'Gem', 'Landmark', 'Award', 'Utensils', 'Star', 'Package', 'Coffee', 'BedDouble', 'Leaf', 'Mountain', 'Bird', 'Home', 'Clock', 'CalendarDays', 'Ticket', 'Users', 'AlertTriangle', 'Waves', 'Camera', 'Tent', 'Thermometer'];

const steps = [
  { id: 1, name: 'Homepage Card', fields: ['id', 'homepageTitle', 'homepageDescription', 'imageUrl', 'imageAlt', 'imageHint'] as const },
  { id: 2, name: 'Tour Page Details', fields: ['tourPageTitle', 'duration', 'price', 'priceSuffix', 'tourPageDescription', 'heroImage', 'heroImageHint'] as const },
  { id: 3, name: 'Highlights & Inclusions', fields: ['tourHighlights', 'inclusions'] as const },
  { id: 4, name: 'Itinerary & Booking Link', fields: ['itinerary', 'bookingLink'] as const },
];

export default function AddPackagePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isClient, setIsClient] = useState(false);
  
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof packageFormSchema>>({
    resolver: zodResolver(packageFormSchema),
    mode: 'onBlur',
    defaultValues: {
      id: '',
      // Homepage
      imageUrl: '',
      imageAlt: '',
      imageHint: '',
      homepageTitle: '',
      homepageDescription: '',
      // Detail Page
      tourPageTitle: '',
      duration: '',
      price: '',
      priceSuffix: 'per person',
      heroImage: '',
      heroImageHint: '',
      tourPageDescription: '',
      tourHighlights: Array(3).fill({ icon: 'Star', title: '', description: '' }),
      inclusions: [{ text: '' }],
      itinerary: Array(5).fill({ time: '', title: '', description: '' }),
      bookingLink: '/booking',
    },
  });

  const { fields: highlightFields } = useFieldArray({
    control: form.control,
    name: "tourHighlights",
  });
  
  const { fields: inclusionFields, append: appendInclusion, remove: removeInclusion } = useFieldArray({
    control: form.control,
    name: "inclusions",
  });

  const { fields: itineraryFields, append: appendItinerary, remove: removeItinerary } = useFieldArray({
    control: form.control,
    name: "itinerary",
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void,
    setPreview: (value: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onChange(dataUrl);
        setPreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = async () => {
    const fields = steps[currentStep - 1].fields;
    const isValid = await form.trigger(fields, { shouldFocus: true });
    
    if (!isValid) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please fill out all required fields before proceeding.",
        });
        return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };


  async function onSubmit(data: z.infer<typeof packageFormSchema>) {
    try {
      const payload = {
        id: data.id,
        homepage_title: data.homepageTitle,
        homepage_description: data.homepageDescription,
        homepage_image_url: data.imageUrl,
        homepage_image_alt: data.imageAlt,
        homepage_image_hint: data.imageHint,
        tour_page_title: data.tourPageTitle,
        duration: data.duration,
        price: data.price,
        price_suffix: data.priceSuffix,
        hero_image_url: data.heroImage,
        hero_image_hint: data.heroImageHint,
        tour_page_description: data.tourPageDescription,
        booking_link: data.bookingLink,
      };

      const response = await fetch('http://localhost/sapphire_trails_server/tours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || 'An unexpected error occurred.';
        
        if (response.status === 422 && errorMessage.toLowerCase().includes('id')) {
            form.setError('id', { type: 'manual', message: 'This ID already exists. Please use a unique one.' });
        } else {
            toast({
                variant: 'destructive',
                title: 'Creation Failed',
                description: errorMessage,
            });
        }
        return;
      }
      
      // Note: After creating the main package, separate API calls would be needed
      // to post highlights, inclusions, and itinerary items, associating them with the new package ID.

      toast({
        title: 'Package Added!',
        description: `Package "${data.homepageTitle}" has been saved successfully.`,
      });
      router.push('/admin/manage-packages');

    } catch (error) {
      console.error('Failed to save package:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not connect to the server. Please try again later.',
      });
    }
  }

  const progressValue = (currentStep / steps.length) * 100;
  
  if (!isClient) {
    return null;
  }
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Add New Tour Package</h1>
          <p className="text-muted-foreground">Follow the steps to create a new tour package.</p>
        </div>
      </div>
      
      <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Step {currentStep} of {steps.length}: <span className="text-primary font-semibold">{steps[currentStep-1].name}</span></p>
          <Progress value={progressValue} className="h-2" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Homepage Card */}
            <div className={cn(currentStep === 1 ? 'block' : 'hidden')}>
                <Card>
                    <CardHeader>
                        <CardTitle>Homepage Card</CardTitle>
                        <CardDescription>Content that appears on the homepage and tour listing cards.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="id" render={({ field }) => (<FormItem><FormLabel>Unique ID (Slug)</FormLabel><FormControl><Input placeholder="e.g., new-deluxe-tour" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="homepageTitle" render={({ field }) => (<FormItem><FormLabel>Card Title</FormLabel><FormControl><Input placeholder="e.g., Exclusive Sapphire Mine Tour" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="homepageDescription" render={({ field }) => (<FormItem><FormLabel>Card Description</FormLabel><FormControl><Textarea placeholder="A short description for the homepage card..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="imageUrl" render={({ field }) => ( <FormItem><FormLabel>Card Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, field.onChange, setCardImagePreview)} /></FormControl><FormMessage /></FormItem>)} />
                        {cardImagePreview && <Image src={cardImagePreview} alt="Card preview" width={200} height={100} className="rounded-md object-cover border" />}
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="imageAlt" render={({ field }) => (<FormItem><FormLabel>Image Alt Text</FormLabel><FormControl><Input placeholder="Describe the image" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="imageHint" render={({ field }) => (<FormItem><FormLabel>Image AI Hint</FormLabel><FormControl><Input placeholder="e.g., tourists mining" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Step 2: Tour Page Details */}
            <div className={cn(currentStep === 2 ? 'block' : 'hidden')}>
                <Card>
                    <CardHeader>
                        <CardTitle>Tour Detail Page</CardTitle>
                        <CardDescription>Content for the dedicated single page for this tour.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="tourPageTitle" render={({ field }) => (<FormItem><FormLabel>Page Title</FormLabel><FormControl><Input placeholder="e.g., Gem Explorer Day Tour" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="duration" render={({ field }) => (<FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="e.g., 8 Hours" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price</FormLabel><FormControl><Input placeholder="e.g., $135" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="priceSuffix" render={({ field }) => (<FormItem><FormLabel>Price Suffix</FormLabel><FormControl><Input placeholder="e.g., per person" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="tourPageDescription" render={({ field }) => (<FormItem><FormLabel>Page Description</FormLabel><FormControl><Textarea placeholder="The main description for the tour highlights section..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <Separator />
                        <FormField control={form.control} name="heroImage" render={({ field }) => (<FormItem><FormLabel>Page Hero Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, field.onChange, setHeroImagePreview)} /></FormControl><FormMessage /></FormItem>)} />
                        {heroImagePreview && <Image src={heroImagePreview} alt="Hero preview" width={200} height={100} className="rounded-md object-cover border" />}
                        <FormField control={form.control} name="heroImageHint" render={({ field }) => (<FormItem><FormLabel>Hero Image AI Hint</FormLabel><FormControl><Input placeholder="e.g., happy tourists" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                </Card>
            </div>

            {/* Step 3: Highlights & Inclusions */}
            <div className={cn(currentStep === 3 ? 'block' : 'hidden')}>
                <Card>
                    <CardHeader>
                    <CardTitle>Tour Highlights (3)</CardTitle>
                    <CardDescription>The three main highlights shown on the tour page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    {highlightFields.map((item, index) => (
                        <div key={item.id} className="grid md:grid-cols-3 gap-4 p-4 border rounded-md items-end">
                        <FormField control={form.control} name={`tourHighlights.${index}.icon`} render={({ field }) => (
                            <FormItem><FormLabel>Icon</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select icon" /></SelectTrigger></FormControl>
                                    <SelectContent>{iconOptions.map(icon => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                            </FormItem> )} />
                        <FormField control={form.control} name={`tourHighlights.${index}.title`} render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Highlight title" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`tourHighlights.${index}.description`} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Short description" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    ))}
                    </CardContent>
                </Card>
                <Card className="mt-8">
                    <CardHeader>
                    <CardTitle>Inclusions</CardTitle>
                    <CardDescription>List everything that is included in this package.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    {inclusionFields.map((item, index) => (
                        <div key={item.id} className="flex items-end gap-2">
                        <FormField control={form.control} name={`inclusions.${index}.text`} render={({ field }) => (
                            <FormItem className="flex-1">
                            <FormLabel className={cn(index !== 0 && "sr-only")}>Inclusion Item</FormLabel>
                            <FormControl><Input placeholder="e.g., GUIDED MINE TOUR" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>)} />
                        <Button type="button" variant="destructive" size="icon" onClick={() => removeInclusion(index)} disabled={inclusionFields.length <= 1}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendInclusion({ text: '' })}>
                        <Plus className="mr-2 h-4 w-4" /> Add Inclusion
                    </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Step 4: Itinerary & Booking */}
             <div className={cn(currentStep === 4 ? 'block' : 'hidden')}>
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Itinerary</CardTitle>
                        <CardDescription>Add the schedule of activities for the tour.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {itineraryFields.map((item, index) => (
                            <div key={item.id} className="space-y-4 p-4 border rounded-md relative">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeItinerary(index)} disabled={itineraryFields.length <= 1}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name={`itinerary.${index}.time`} render={({ field }) => (<FormItem><FormLabel>Time</FormLabel><FormControl><Input placeholder="e.g., 9:00 a.m" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name={`itinerary.${index}.title`} render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Meet & Greet" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={form.control} name={`itinerary.${index}.description`} render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the activity" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendItinerary({ time: '', title: '', description: '' })}>
                            <Plus className="mr-2 h-4 w-4" /> Add Itinerary Item
                        </Button>
                    </CardContent>
                </Card>
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Final Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <FormField control={form.control} name="bookingLink" render={({ field }) => (<FormItem><FormLabel>Booking Link</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                </Card>
             </div>
          
            <div className="mt-8 pt-5 flex justify-between">
              <div>
                <Button type="button" onClick={handlePrev} variant="outline" className={cn(currentStep === 1 && "hidden")}>
                  Go Back
                </Button>
              </div>
              <div>
                {currentStep < steps.length && (
                  <Button type="button" onClick={handleNext}>
                    Next Step
                  </Button>
                )}
                {currentStep === steps.length && (
                  <Button type="submit" size="lg">
                    Save New Package
                  </Button>
                )}
              </div>
            </div>
        </form>
      </Form>
    </div>
  );
}
