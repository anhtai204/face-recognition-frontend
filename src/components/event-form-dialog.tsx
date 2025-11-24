"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { Event } from "@/types/next-auth";
import { v4 as uuidv4 } from "uuid";
import { ConfirmDialog } from "./confirm-dialog";

interface EventFormDialogProps {
  open: boolean;
  event?: Event;
  onOpenChange: (open: boolean) => void;
  onSave: (event: Event) => void;
}

export function EventFormDialog({
  open,
  event,
  onOpenChange,
  onSave,
}: EventFormDialogProps) {
//   console.log("EventFormDialog event:", event);
  const isEditing = !!event;
  const [formData, setFormData] = useState<Event>(
    event || {
      id: uuidv4(),
      title: "",
      event_type: "event",
      start_time: new Date(),
      end_time: new Date(),
      department: "",
      description: "",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  useEffect(() => {
    if (open) {
      if (event) {
        setFormData({
          ...event,
          start_time: new Date(event.start_time),
          end_time: new Date(event.end_time),
          department: event.department || "",
          description: event.description || "",
        });
      } else {
        const start = new Date();
        start.setMinutes(0, 0, 0);
        start.setHours(start.getHours() + 1);
        const end = new Date(start);
        end.setHours(end.getHours() + 1);

        setFormData({
          id: uuidv4(),
          title: "",
          event_type: "event",
          start_time: start,
          end_time: end,
          department: "",
          description: "",
        });
      }
      // Xóa lỗi cũ khi mở lại form
      setErrors({});
    }
  }, [event, open]);

  //   const hasChanges = () => {
  //     if (!event) {
  //       return (
  //         formData.title.trim() !== "" ||
  //         formData.description?.trim() !== "" ||
  //         formData.department?.trim() !== ""
  //       );
  //     }
  //     return (
  //       formData.title !== event.title ||
  //       formData.event_type !== event.event_type ||
  //       formData.department !== event.department ||
  //       formData.description !== event.description ||
  //       formData.start_time !== event.start_time ||
  //       formData.end_time !== event.end_time
  //     );
  //   };

  const hasChanges = () => {
    // 1. Nếu đang tạo mới (Create)
    if (!event) {
      return (
        formData.title.trim() !== "" ||
        (formData.description || "").trim() !== "" ||
        (formData.department || "").trim() !== ""
      );
    }

    // 2. Nếu đang sửa (Edit) - So sánh kỹ từng trường

    // Helper: So sánh 2 ngày xem có cùng thời điểm không
    const isSameTime = (
      d1: Date | string | undefined,
      d2: Date | string | undefined
    ) => {
      if (!d1 || !d2) return false;
      return new Date(d1).getTime() === new Date(d2).getTime();
    };

    // Helper: So sánh chuỗi, coi null, undefined và "" là như nhau
    const isSameString = (
      s1: string | null | undefined,
      s2: string | null | undefined
    ) => {
      return (s1 || "") === (s2 || "");
    };

    return (
      formData.title !== event.title ||
      formData.event_type !== event.event_type ||
      !isSameString(formData.department, event.department) || 
      !isSameString(formData.description, event.description) || 
      !isSameTime(formData.start_time, event.start_time) || 
      !isSameTime(formData.end_time, event.end_time) 
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasChanges()) {
      setShowConfirmClose(true);
    } else {
      onOpenChange(newOpen);
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onOpenChange(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.name = "Event name is required";
    }
    // if (!formData.department.trim()) {
    //   newErrors.department = "Department is required";
    // }
    if (formData.end_time <= formData.start_time) {
      newErrors.endTime = "End time must be after start time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onOpenChange(false);
    }
  };

  const handleStartTimeChange = (date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`);
    setFormData((prev) => ({
      ...prev,
      start_time: dateTime,
    }));
  };

  const handleEndTimeChange = (date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`);
    setFormData((prev) => ({
      ...prev,
      end_time: dateTime,
    }));
  };

  const formatDateInput = (date: Date) => date.toISOString().split("T")[0];
  const formatTimeInput = (date: Date) =>
    date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Event" : "Create New Event"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Event Name */}
            <div>
              <Label htmlFor="title" className="pb-1.5">
                Event Name
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Morning Standup"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Event Type and Department */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event_type" className="pb-1.5">
                  Event Type
                </Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: value as "class" | "event" | "shift",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="shift">Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="department" className="pb-1.5">
                  Department
                </Label>
                <Input
                  id="department"
                  value={formData.department || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  placeholder="Leave empty for Whole Company"
                  className={errors.department ? "border-red-500" : ""}
                />
                {errors.department && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.department}
                  </p>
                )}
              </div>
            </div>

            {/* Start Time */}
            <div>
              <Label className="pb-1.5">Start Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={formatDateInput(formData.start_time)}
                  onChange={(e) =>
                    handleStartTimeChange(
                      e.target.value,
                      formatTimeInput(formData.start_time)
                    )
                  }
                />
                <Input
                  type="time"
                  value={formatTimeInput(formData.start_time)}
                  onChange={(e) =>
                    handleStartTimeChange(
                      formatDateInput(formData.start_time),
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            {/* End Time */}
            <div>
              <Label className="pb-1.5">End Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={formatDateInput(formData.end_time)}
                  onChange={(e) =>
                    handleEndTimeChange(
                      e.target.value,
                      formatTimeInput(formData.end_time)
                    )
                  }
                />
                <Input
                  type="time"
                  value={formatTimeInput(formData.end_time)}
                  onChange={(e) =>
                    handleEndTimeChange(
                      formatDateInput(formData.end_time),
                      e.target.value
                    )
                  }
                />
              </div>
              {errors.endTime && (
                <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
                  <AlertCircle className="h-4 w-4" />
                  {errors.endTime}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="pb-1.5">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Add event description..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? "Update Event" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={showConfirmClose}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to close without saving?"
        onConfirm={handleConfirmClose}
        onCancel={() => setShowConfirmClose(false)}
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="destructive"
      />
    </>
  );
}
