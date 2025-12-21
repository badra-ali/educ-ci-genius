import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, BookOpen, FileText, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useUnifiedCalendar, CalendarEvent, getEventsForDate } from "@/hooks/useUnifiedCalendar";
import { Skeleton } from "@/components/ui/skeleton";

const eventTypeConfig = {
  schedule: {
    icon: BookOpen,
    label: "Cours",
    bgClass: "bg-primary/10",
    textClass: "text-primary",
  },
  deadline: {
    icon: FileText,
    label: "Devoir",
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
  },
  exam: {
    icon: GraduationCap,
    label: "QCM",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-600",
  },
};

export function UnifiedCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const { data: events = [], isLoading } = useUnifiedCalendar();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad days to start on Monday
  const startDay = monthStart.getDay();
  const paddingDays = startDay === 0 ? 6 : startDay - 1;

  const selectedEvents = selectedDate ? getEventsForDate(events, selectedDate) : [];

  const getEventCountForDay = (day: Date) => {
    return getEventsForDate(events, day).length;
  };

  const hasDeadlineOnDay = (day: Date) => {
    return getEventsForDate(events, day).some(e => e.type === "deadline");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Calendrier Unifié</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[140px] text-center capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: fr })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4">
          {Object.entries(eventTypeConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5 text-sm">
              <div className={cn("w-3 h-3 rounded-full", config.bgClass, config.textClass)} />
              <span className="text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 p-4 border-r">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for padding */}
              {Array.from({ length: paddingDays }).map((_, i) => (
                <div key={`padding-${i}`} className="aspect-square" />
              ))}

              {days.map((day) => {
                const eventCount = getEventCountForDay(day);
                const hasDeadline = hasDeadlineOnDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square p-1 rounded-lg transition-all relative flex flex-col items-center justify-center",
                      "hover:bg-muted/50",
                      !isSameMonth(day, currentMonth) && "text-muted-foreground/50",
                      isToday(day) && "ring-2 ring-primary ring-offset-2",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <span className="text-sm font-medium">{format(day, "d")}</span>
                    {eventCount > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {eventCount <= 3 ? (
                          Array.from({ length: eventCount }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isSelected ? "bg-primary-foreground" : hasDeadline ? "bg-destructive" : "bg-primary"
                              )}
                            />
                          ))
                        ) : (
                          <span className={cn(
                            "text-xs",
                            isSelected ? "text-primary-foreground" : "text-muted-foreground"
                          )}>
                            +{eventCount}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Events Panel */}
          <div className="p-4 bg-muted/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              {selectedDate ? (
                <>
                  <span className="capitalize">
                    {format(selectedDate, "EEEE d MMMM", { locale: fr })}
                  </span>
                  {isToday(selectedDate) && (
                    <Badge variant="secondary" className="text-xs">
                      Aujourd'hui
                    </Badge>
                  )}
                </>
              ) : (
                "Sélectionnez une date"
              )}
            </h3>

            <ScrollArea className="h-[350px]">
              {selectedEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  Aucun événement ce jour
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  const config = eventTypeConfig[event.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-colors",
        config.bgClass
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            config.textClass,
            "bg-background"
          )}
          style={{ borderColor: event.color }}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{event.title}</h4>

          {event.startTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>
                {event.startTime.slice(0, 5)}
                {event.endTime && ` - ${event.endTime.slice(0, 5)}`}
              </span>
            </div>
          )}

          {event.room && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3" />
              <span>{event.room}</span>
            </div>
          )}

          {event.teacher && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <User className="h-3 w-3" />
              <span>{event.teacher}</span>
            </div>
          )}

          {event.details && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {event.details}
            </p>
          )}
        </div>

        <Badge
          variant="outline"
          className={cn("text-xs flex-shrink-0", config.textClass)}
        >
          {config.label}
        </Badge>
      </div>
    </div>
  );
}
