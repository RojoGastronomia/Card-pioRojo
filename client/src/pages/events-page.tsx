import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import EventCard from "@/components/events/event-card";
import EventDetailsModal from "@/components/events/event-details-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/context/language-context";

export default function EventsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", language],
    queryFn: async () => {
      const response = await fetch(`/api/events?lang=${language}`);
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const filteredEvents = events?.filter((event: Event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = status ? event.status === status : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('events', 'title')}</h1>
      <p className="text-gray-600 text-lg mb-8">{t('events', 'subtitle')}</p>

      {/* Banner igual ao da HomePage */}
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70 z-10"></div>
        <img
          src="https://public.readdy.ai/ai/img_res/b8905632f9218145207ecce49d4cdfb3.jpg"
          alt={t('events', 'title')}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-start p-8 md:p-16 z-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('events', 'bannerTitle')}
          </h2>
          <p className="text-white text-lg mb-6 max-w-xl">
            {t('events', 'bannerSubtitle')}
          </p>
          <button 
            className="bg-white text-primary px-6 py-3 rounded-button font-medium hover:bg-white/90 transition-colors cursor-default"
            disabled
          >
            {t('events', 'viewAvailableEvents')}
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <span role="img" aria-label="calendar">📅</span> {t('events', 'availableEvents')}
      </h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="relative w-full md:w-auto flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder={t('events', 'searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter size={16} />
                {status ? `${t('common', 'status')}: ${t('common', status)}` : t('events', 'filterByStatus')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatus(null)}>
                {t('common', 'all')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatus("available")}>
                {t('common', 'available')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatus("unavailable")}>
                {t('common', 'unavailable')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <Skeleton className="h-48 w-full" />
              <div className="p-5">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents && filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event: Event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onClick={() => handleEventClick(event)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-700">{t('events', 'noEventsFound')}</h3>
          <p className="text-gray-500 mt-2">
            {t('events', 'adjustFilters')}
          </p>
        </div>
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={handleCloseModal}
        />
      )}
    </main>
  );
}
