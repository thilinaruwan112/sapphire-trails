
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { mockBookings, type Booking } from '@/lib/bookings-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const ADMIN_SESSION_KEY = 'adminUser';
const ITEMS_PER_PAGE = 4;

export default function BookingRequestsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const adminUser = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!adminUser) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      const storedBookingsRaw = localStorage.getItem('bookings');
      if (storedBookingsRaw) {
        try {
            const parsed = JSON.parse(storedBookingsRaw);
            if(Array.isArray(parsed)) {
                setBookings(parsed);
            } else {
                setBookings(mockBookings);
                localStorage.setItem('bookings', JSON.stringify(mockBookings));
            }
        } catch {
            setBookings(mockBookings);
            localStorage.setItem('bookings', JSON.stringify(mockBookings));
        }
      } else {
        setBookings(mockBookings);
        localStorage.setItem('bookings', JSON.stringify(mockBookings));
      }
    }
  }, [router]);
  
  const bookingStats = useMemo(() => {
    if (!bookings) return { pending: 0, accepted: 0, rejected: 0, total: 0 };
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const accepted = bookings.filter((b) => b.status === 'accepted').length;
    const rejected = bookings.filter((b) => b.status === 'rejected').length;
    const total = bookings.length;
    return { pending, accepted, rejected, total };
  }, [bookings]);

  const { paginatedBookings, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = bookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const total = Math.ceil(bookings.length / ITEMS_PER_PAGE);
    return { paginatedBookings: paginated, totalPages: total };
  }, [bookings, currentPage]);
  
  const getStatusBadgeVariant = (status: Booking['status']) => {
    switch (status) {
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
      default:
        return 'secondary';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
        <div className='flex flex-col gap-2'>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Booking Requests</h1>
            <p className="text-muted-foreground">Manage all incoming tour booking requests from this panel.</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{bookingStats.total}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{bookingStats.pending}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Accepted Bookings</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{bookingStats.accepted}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rejected Bookings</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{bookingStats.rejected}</div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>All Requests</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">Tour Package</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="hidden sm:table-cell">Guests</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {paginatedBookings.map((booking) => (
                        <TableRow key={booking.id}>
                            <TableCell>
                                <div className="font-medium break-words">{booking.name}</div>
                                <div className="text-sm text-muted-foreground hidden md:block break-all">{booking.email}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell break-all">
                                {booking.tourType === 'gem-explorer-day-tour' ? 'Gem Explorer Day Tour' : 'Sapphire Trails Deluxe'}
                            </TableCell>
                            <TableCell>{format(new Date(booking.date), 'PPP')}</TableCell>
                            <TableCell className="hidden sm:table-cell">{booking.guests}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize">
                                {booking.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => setSelectedBooking(booking)}>View</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex items-center justify-between border-t pt-6">
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages || 1}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    >
                    Previous
                    </Button>
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    >
                    Next
                    </Button>
                </div>
            </CardFooter>
        </Card>

        <Dialog open={!!selectedBooking} onOpenChange={(isOpen) => !isOpen && setSelectedBooking(null)}>
            <DialogContent className="sm:max-w-lg">
                {selectedBooking && (
                <>
                    <DialogHeader>
                        <DialogTitle>Booking Details</DialogTitle>
                        <DialogDescription className="break-words">
                            Request from {selectedBooking.name} on {format(new Date(selectedBooking.date), 'PPP')}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">Status</Label>
                            <div>
                                <Badge variant={getStatusBadgeVariant(selectedBooking.status)} className="capitalize">
                                    {selectedBooking.status}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">Name</Label>
                            <p className="font-medium break-words">{selectedBooking.name}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">Email</Label>
                            <p className="break-all">{selectedBooking.email}</p>
                        </div>
                        {selectedBooking.phone && (
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Phone</Label>
                                <p>{selectedBooking.phone}</p>
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">Tour</Label>
                            <p>{selectedBooking.tourType === 'gem-explorer-day-tour' ? 'Gem Explorer Day Tour' : 'Sapphire Trails Deluxe'}</p>
                        </div>
                         <div className="space-y-1">
                            <Label className="text-muted-foreground">Guests</Label>
                            <p>{selectedBooking.guests}</p>
                        </div>
                        {selectedBooking.message && (
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Message</Label>
                                <p className="text-sm italic break-words">&quot;{selectedBooking.message}&quot;</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <Button variant="outline" onClick={() => setSelectedBooking(null)}>Close</Button>
                        <Button asChild>
                            <Link href={`/admin/booking-requests/${encodeURIComponent(selectedBooking.id)}`}>Edit Booking</Link>
                        </Button>
                    </DialogFooter>
                </>
                )}
            </DialogContent>
        </Dialog>
    </div>
  );
}
