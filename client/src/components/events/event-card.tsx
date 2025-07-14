import { type Event, type Menu } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Menu as MenuIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getQueryFn } from "@/lib/queryClient";
import { useLanguage } from "@/context/language-context";

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  onMenuOptionsClick?: (e: React.MouseEvent, event: Event) => void;
}

export default function EventCard({ event, onClick, onMenuOptionsClick }: EventCardProps) {
  const { t, language } = useLanguage();
  const { data: menus = [] } = useQuery<Menu[]>({
    queryKey: [`/api/events/${event.id}/menus`, language],
    queryFn: getQueryFn({ on401: "throw", language }),
    enabled: !!event.id,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const eventTitle = event.titleEn && language === 'en' ? event.titleEn : event.title;
  const eventDescription = event.descriptionEn && language === 'en' ? event.descriptionEn : event.description;

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group bg-card rounded-lg"
      onClick={onClick}
    >
      <div className="relative h-48">
        <img 
          src={event.imageUrl || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"} 
          alt={eventTitle} 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-5">
        <h2 className="text-xl font-semibold text-card-foreground mb-2">
          {eventTitle}
        </h2>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {eventDescription}
        </p>

        <div className="flex items-center justify-between">
          <div 
            className="flex items-center text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={(e) => onMenuOptionsClick?.(e, event)}
          >
            <MenuIcon className="w-4 h-4 mr-2" />
            <span>
              {menus.length} {menus.length === 1 
                ? t('common', 'menuOption') 
                : t('common', 'menuOptions')}
            </span>
          </div>

          {event.status === 'active' ? (
          <span className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
            {t('common', 'available')}
          </span>
          ) : (
            <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
              {t('common', 'unavailable')}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
