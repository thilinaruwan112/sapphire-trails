"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollAnimate } from '@/components/shared/scroll-animate';
import useEmblaCarousel from 'embla-carousel-react';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { initialTourPackages, type TourPackage } from '@/lib/packages-data';

const TourCard = ({ tour }: { tour: TourPackage }) => (
  <Card className="bg-card border-stone-800/50 flex flex-col w-full transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10 rounded-xl overflow-hidden">
    <div className="relative h-64 w-full">
      <Image
        src={tour.imageUrl}
        alt={tour.imageAlt}
        data-ai-hint={tour.imageHint}
        fill
        className="object-cover"
      />
    </div>
    <CardContent className="p-8 flex flex-col flex-grow">
      <h3 className="text-2xl font-headline font-bold text-primary mb-4">{tour.homepageTitle}</h3>
      <p className="text-muted-foreground mb-6 flex-grow">{tour.homepageDescription}</p>
      <Button asChild className="w-fit bg-primary text-primary-foreground hover:bg-primary/90 mt-auto rounded-full px-6">
        <Link href={`/tours?selected=${tour.id}`}>More Info</Link>
      </Button>
    </CardContent>
  </Card>
);


export function ToursSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [tours, setTours] = useState<TourPackage[]>(initialTourPackages);

  useEffect(() => {
    const storedPackagesRaw = localStorage.getItem('customPackages');
    if (storedPackagesRaw) {
        try {
            const customPackages = JSON.parse(storedPackagesRaw) as TourPackage[];
            if (Array.isArray(customPackages)) {
                const combined = [...initialTourPackages, ...customPackages];
                const unique: { [key: string]: TourPackage } = {};
                for (const pkg of combined) {
                    unique[pkg.id] = pkg;
                }
                setTours(Object.values(unique));
            }
        } catch (e) {
            console.error("Failed to parse custom packages", e);
            setTours(initialTourPackages);
        }
    }
  }, []);
  
  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi]);

  return (
    <section id="tours" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollAnimate>
          {/* Desktop view */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {tours.map((tour, index) => (
              <TourCard key={index} tour={tour} />
            ))}
          </div>

          {/* Mobile view swiper */}
          <div className="md:hidden relative">
             <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-4">
                {tours.map((tour, index) => (
                  <div className="flex-grow-0 flex-shrink-0 basis-full min-w-0 pl-4" key={index}>
                    <TourCard tour={tour} />
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={scrollPrev} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 p-0 z-10 bg-background/50 hover:bg-background/80 border-0 text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button onClick={scrollNext} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 p-0 z-10 bg-background/50 hover:bg-background/80 border-0 text-foreground">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </ScrollAnimate>
      </div>
    </section>
  );
}
