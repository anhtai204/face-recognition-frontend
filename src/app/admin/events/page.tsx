"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockEvents } from "@/utils/mock-data";
import { Plus, Edit2, Trash2, Calendar } from "lucide-react";
import { EventFormDialog } from "@/components/event-form-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Event } from "@/types/next-auth";
import { useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";
import { toast } from "sonner";

export default function AdminEventsPage() {
  const { data: session } = useSession();

  const [events, setEvents] = useState<Event[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    eventId?: string;
  }>({ open: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.access_token) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Lấy danh sách users
        const eventRes = await sendRequest<IBackendRes<Event[]>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/events/`,
          method: "GET",
          headers: { Authorization: `Bearer ${session.user.access_token}` },
        });

        if (!eventRes.data) throw new Error("No users");

        const events = eventRes.data;

        // console.log("Loaded events:", events);

        setEvents(events);
      } catch (err) {
        console.error("Lỗi load data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "class":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      case "event":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-400";
      case "shift":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400";
    }
  };

  const handleCreateNew = () => {
    setSelectedEvent(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    console.log(">>> Edit event:", event);
    setIsFormOpen(true);
  };

  const handleSaveEvent = async (event: Event) => {
    if (selectedEvent) {
      const eventUpdate = {
        title: event.title,
        event_type: event.event_type,
        start_time: event.start_time,
        end_time: event.end_time,
        department: event.department,
        description: event.description,
      };

      const resUpdateEvent = await sendRequest<Event>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/events/${event?.id}`,
        method: "PATCH",
        body: eventUpdate,
        headers: { Authorization: `Bearer ${session?.user?.access_token}` },
      });

      console.log(">>>resUpdateEvent: ", resUpdateEvent);
      if (resUpdateEvent && resUpdateEvent?.id) {
        toast.success("Cập nhật event thành công!");
      }
      // Update existing event
      setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    } else {
      // Create new event
      try {
        const resCreateEvent = await sendRequest<Event>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/events`,
          method: "POST",
          body: event,
          headers: { Authorization: `Bearer ${session?.user?.access_token}` },
        });

        console.log(">>> Create event response:", resCreateEvent);

        if (resCreateEvent && resCreateEvent.id) {
          toast.success("Tạo event thành công!");

          setEvents((prev) => [...prev, event]);
        } else {
          toast.error("Tạo event thất bại!");
          return;
        }
      } catch (error: any) {
        toast.error(`Tạo event thất bại: ${error.message}`);
        return;
      }
    }
  };

  const handleDeleteClick = (eventId: string) => {
    console.log(">>> Deleting event ID:", eventId);
    setDeleteConfirm({ open: true, eventId });
  };

  const handleConfirmDelete = async () => {
    console.log(">>> Deleting event ID:", deleteConfirm.eventId);
    if (deleteConfirm.eventId) {
      // setEvents((prev) => prev.filter((e) => e.id !== deleteConfirm.eventId));
      // setDeleteConfirm({ open: false });
      try {
        const res = await sendRequest<IBackendRes<any>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/events/${deleteConfirm.eventId}`,
          method: "DELETE",
          headers: { Authorization: `Bearer ${session?.user.access_token}` },
        });

        //  KIỂM TRA ĐÚNG
        if (res?.message != "Event deleted successfully") {
          toast.error("Xóa thất bại!");
          return;
        }

        // CẬP NHẬT STATE ĐÚNG CÁCH
        setEvents((prev) => prev.filter((e) => e.id !== deleteConfirm.eventId));
        toast.success("Xóa thành công!");
      } catch (err) {
        toast.error("Lỗi server");
      } finally {
        setDeleteConfirm({ open: false });
      }
    }
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events & Classes</h1>
        <div className="flex gap-2">
          <ThemeToggle />
          <Button className="gap-2" onClick={handleCreateNew}>
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge
                      className={`mt-2 ${getEventTypeColor(event.event_type)}`}
                    >
                      {event.event_type.charAt(0).toUpperCase() +
                        event.event_type.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span suppressHydrationWarning>
                    {new Date(event.start_time).toLocaleDateString()} -{" "}
                    {new Date(event.start_time).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Department</p>
                  {event.department == null || event.department === "" ? (
                    <p className="font-medium">Whole Company</p>
                  ) : (
                    <p className="font-medium">{event.department}</p>
                  )}
                </div>
                {event.description && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Description</p>
                    <p>{event.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <EventFormDialog
        open={isFormOpen}
        event={selectedEvent}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveEvent}
      />

      <DeleteConfirmationDialog
        open={deleteConfirm.open}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        onOpenChange={(open) => setDeleteConfirm({ open })}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}
