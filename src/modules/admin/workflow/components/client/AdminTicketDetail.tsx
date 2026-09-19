"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  actionAddAdminTicketComment,
  actionUpdateAdminTicket,
} from "@/modules/admin/workflow/actions/adminTicket";
import type { TAdminTicket } from "@/modules/admin/workflow/schemas/AdminTicketSchema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const statuses: TAdminTicket["status"][] = [
  "open",
  "in_review",
  "changes_requested",
  "approved",
  "closed",
  "cancelled",
];
const priorities: TAdminTicket["priority"][] = [
  "low",
  "normal",
  "high",
  "urgent",
];

export default function AdminTicketDetail({
  ticket,
}: {
  ticket: TAdminTicket;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const saveTicket = async () => {
    setIsSaving(true);
    const response = await actionUpdateAdminTicket({
      uuid: ticket.uuid,
      status,
      priority,
    });
    setIsSaving(false);
    if ("error" in response) {
      toast.error(response.error);
      return;
    }
    toast.success("Ticket updated.");
    router.refresh();
  };

  const addComment = async () => {
    const body = comment.trim();
    if (!body) {
      return;
    }
    setIsSaving(true);
    const response = await actionAddAdminTicketComment({
      uuid: ticket.uuid,
      body,
    });
    setIsSaving(false);
    if ("error" in response) {
      toast.error(response.error);
      return;
    }
    setComment("");
    toast.success("Comment added.");
    router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{ticket.title}</CardTitle>
          <CardDescription>
            {ticket.description ?? "No description provided."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Type</p>
              <p className="font-medium">{ticket.type}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Subject</p>
              <p className="break-all font-mono text-xs">
                {ticket.subject_uuid}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Requester
              </p>
              <p className="font-medium">
                {ticket.requester?.name ?? ticket.requester?.email ?? "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Store</p>
              <p className="font-medium">{ticket.store?.name ?? "Unknown"}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold">Activity</h2>
            {ticket.comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            ) : (
              ticket.comments.map((entry) => (
                <div key={entry.uuid} className="rounded-md border p-3">
                  <p className="text-sm">{entry.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {entry.visibility} · {entry.created_at ?? ""}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3">
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Leave an internal review comment..."
              rows={4}
            />
            <Button onClick={addComment} disabled={isSaving || !comment.trim()}>
              Add comment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review controls</CardTitle>
          <CardDescription>
            Ticket transitions project review status back to the draft without
            coupling the queue to authoring screens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Status</p>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as TAdminTicket["status"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Urgency</p>
            <Select
              value={priority}
              onValueChange={(value) =>
                setPriority(value as TAdminTicket["priority"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={saveTicket} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save ticket"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
