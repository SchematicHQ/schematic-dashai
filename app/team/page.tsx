"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, X, AlertCircle, ArrowUp } from "lucide-react"
import { useSchematicEntitlement } from "@schematichq/schematic-react"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  initials: string
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "Viewer" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Get seat count entitlement from Schematic
  const { value, featureAllocation: allocation, featureUsage: usage } = useSchematicEntitlement("user-seat")

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const users = await response.json()
        setTeamMembers(users)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMember),
      })

      if (response.ok) {
        const addedUser = await response.json()
        setTeamMembers([...teamMembers, addedUser])
        setNewMember({ name: "", email: "", role: "Viewer" })
        setShowAddForm(false)
      } else {
        const error = await response.json()
        alert(error.message || "Failed to add member")
      }
    } catch (error) {
      console.error("Error adding member:", error)
      alert("Failed to add member")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) {
      return
    }

    try {
      const response = await fetch(`/api/users?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTeamMembers(teamMembers.filter((member) => member.id !== id))
      } else {
        const error = await response.json()
        alert(error.message || "Failed to delete member")
      }
    } catch (error) {
      console.error("Error deleting member:", error)
      alert("Failed to delete member")
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Team</h1>
            <p className="text-muted-foreground">Manage who has access to your dashboards</p>
          </div>

          {value === false && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Seat limit reached</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Upgrade your plan to add more team members</p>
                </div>
              </div>
              <Button
                size="sm"
                className="gap-2 bg-red-600 hover:bg-red-700 text-white border-0"
                onClick={() => window.location.href = "/pricing"}
              >
                <ArrowUp className="h-4 w-4" />
                Upgrade Now
              </Button>
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Team Members</CardTitle>
                <CardDescription>Invite and manage your team</CardDescription>
              </div>
              {!showAddForm && (
                <Button 
                  size="sm" 
                  className="gap-2 disabled:cursor-not-allowed disabled:opacity-60" 
                  onClick={() => setShowAddForm(true)}
                  disabled={value === false}
                  title={value === false ? "Seat limit reached" : "Invite a new team member"}
                >
                  <Plus className="h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {showAddForm && (
                <div className="mb-4 p-4 rounded-lg border border-border bg-muted/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">Add Team Member</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setShowAddForm(false)
                        setNewMember({ name: "", email: "", role: "Viewer" })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Name"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                    />
                    <Select
                      value={newMember.role}
                      onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Editor">Editor</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleAddMember}
                        disabled={isSubmitting || !newMember.name || !newMember.email}
                        className="flex-1"
                      >
                        {isSubmitting ? "Adding..." : "Add Member"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowAddForm(false)
                          setNewMember({ name: "", email: "", role: "Viewer" })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading team members...</p>
                ) : teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No team members yet. Add one to get started.</p>
                ) : (
                  teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {member.role}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{usage} of {allocation}</span> seats used on your current plan
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
