import { type Event, type Menu } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Menu as MenuIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getQueryFn } from "@/lib/queryClient";

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  onMenuOptionsClick?: (e: React.MouseEvent, event: Event) => void;
}

export default function EventCard({ event, onClick, onMenuOptionsClick }: EventCardProps) {
  const { data: menus = [] } = useQuery<Menu[]>({
    queryKey: [`/api/events/${event.id}/menus`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!event.id,
  });

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group bg-white rounded-lg"
      onClick={onClick}
    >
      <div className="relative h-48">
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-5">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {event.title}
        </h2>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="flex items-center justify-between">
          <div 
            className="flex items-center text-sm text-gray-500 cursor-pointer"
            onClick={(e) => onMenuOptionsClick?.(e, event)}
          >
            <MenuIcon className="w-4 h-4 mr-2" />
            <span>{menus.length} {menus.length === 1 ? 'opção de menu' : 'opções de menu'}</span>
          </div>

          <span className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
            Disponível
          </span>
        </div>
      </div>
    </Card>
  );
}
