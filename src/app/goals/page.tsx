"use client";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getGoals, getSpendingRecommendation, updateGoalProgress, deleteGoal, setUserAutoTransfer } from "@/lib/firebase/goals";
import { db } from "@/lib/firebase"; // Import the Firestore db instance

async function fetchAIRecommendation(userId: string) {
  // You can pass user's spending/goals context if needed
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "user", content: `Based on my recent spending and goals, what is a smart monthly savings transfer amount? Please give a single number and a short explanation.` }
      ],
      pageContext: `userId: ${userId}`
    })
  });
  const data = await res.json();
  return data.response;
}

export default function GoalsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<any[]>([]);
  const [monthlyRecommendation, setMonthlyRecommendation] = useState<number | null>(null);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editName, setEditName] = useState<string>("");
  const [editTarget, setEditTarget] = useState<number>(0);
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editDescription, setEditDescription] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [aiRecommendation, setAIRecommendation] = useState<string | null>(null);
  const [showAIRec, setShowAIRec] = useState(false);
  const [acceptedAIRec, setAcceptedAIRec] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompleteOverlay, setShowCompleteOverlay] = useState(false);
  const [completedGoalName, setCompletedGoalName] = useState("");
  const confettiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);

  // Add new state for overlays and top message
  const [completedGoalId, setCompletedGoalId] = useState<string | null>(null);
  const [deletedGoalId, setDeletedGoalId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/login");
      } else {
        setUser(firebaseUser);
        // Fetch goals
        const userId = firebaseUser.uid;
        const fetchedGoals = await getGoals(userId);
        setGoals(fetchedGoals);
        setIsLoading(false);
        // Fetch AI recommendation
        const aiRec = await fetchAIRecommendation(userId);
        setAIRecommendation(aiRec);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleUpdateProgress = async (goalId: string, amount: number) => {
    try {
      await updateGoalProgress(goalId, amount);
      setEditGoalId(null);
      setEditAmount(0);
      // Refresh goals
      const userId = user.uid;
      setGoals(await getGoals(userId));
    } catch (error) {
      alert("Failed to update goal progress");
    }
  };

  const handleEditGoal = (goal: any) => {
    setEditGoalId(goal.id);
    setEditName(goal.name);
    setEditTarget(goal.targetAmount);
    setEditDate(goal.targetDate ? new Date(goal.targetDate) : null);
    setEditDescription(goal.description || "");
  };

  // Handler for saving edits (with undo support)
  const handleSaveEdit = async (goalId: string) => {
    try {
      const { updateDoc, doc, getDoc } = await import("firebase/firestore");
      if (!db) {
        alert("Firestore database is not initialized");
        return;
      }
      const goalRef = doc(db as import("firebase/firestore").Firestore, "goals", goalId);
      const prevSnap = await getDoc(goalRef);
      const prevData = prevSnap.data();
      setUndoStack(stack => [...stack, { type: "edit", goalId, prevData }]);
      await updateDoc(goalRef, {
        name: editName,
        targetAmount: editTarget,
        targetDate: editDate,
        description: editDescription,
        updatedAt: new Date(),
      });
      setEditGoalId(null);
      setActionMessage(`Goal "${editName}" updated!`);
      const userId = user.uid;
      setGoals(await getGoals(userId));
    } catch (error) {
      alert("Failed to update goal");
    }
  };

  // Handler for deleting a goal (with undo support)
  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const goalRef = doc(db as import("firebase/firestore").Firestore, "goals", goalId);
      const prevSnap = await getDoc(goalRef);
      const prevData = prevSnap.data();
      setUndoStack(stack => [...stack, { type: "delete", goalId, prevData }]);
      await deleteGoal(goalId);
      setDeletedGoalId(goalId);
      setActionMessage(`Goal "${prevData?.name || "Goal"}" deleted!`);
      setTimeout(() => setDeletedGoalId(null), 3000);
      const userId = user.uid;
      setGoals(await getGoals(userId));
    } catch (error) {
      alert("Failed to delete goal");
    }
  };

  // Handler for marking a goal as completed (with undo support and overlay)
  const handleMarkCompleted = async (goalId: string) => {
    try {
      const { updateDoc, doc, getDoc } = await import("firebase/firestore");
      if (!db) {
        alert("Firestore database is not initialized");
        return;
      }
      const goalRef = doc(db as import("firebase/firestore").Firestore, "goals", goalId);
      const prevSnap = await getDoc(goalRef);
      const prevData = prevSnap.data();
      setUndoStack(stack => [...stack, { type: "complete", goalId, prevData }]);
      await updateDoc(goalRef, {
        isCompleted: true,
        updatedAt: new Date(),
      });
      setCompletedGoalId(goalId);
      setActionMessage(`Goal "${prevData?.name || "Goal"}" marked as completed!`);
      setTimeout(() => setCompletedGoalId(null), 3000);
      const userId = user.uid;
      setGoals(await getGoals(userId));
    } catch (error) {
      alert("Failed to mark goal as completed");
    }
  };

  // Handler for accepting AI recommendation
  const handleAcceptAIRec = async () => {
    setAcceptedAIRec(true);
    // Extract the recommended amount from the AI response (try to find a $ or number)
    let amount = 0;
    let reason = aiRecommendation || "";
    const match = aiRecommendation?.match(/\$?(\d+[,.]?\d*)/);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ""));
    }
    if (user && amount > 0) {
      try {
        await setUserAutoTransfer(user.uid, amount, reason);
      } catch (e) {
        alert("Failed to save auto-transfer setting");
      }
    }
  };

  // Handler for rejecting AI recommendation
  const handleRejectAIRec = () => {
    setShowAIRec(false);
    setAcceptedAIRec(false);
  };

  // --- Update Saved/Progress UX ---
  const [progressEditGoalId, setProgressEditGoalId] = useState<string | null>(null);
  const [progressAmount, setProgressAmount] = useState<number>(0);

  const startProgressEdit = (goalId: string) => {
    setProgressEditGoalId(goalId);
    setProgressAmount(0);
  };

  // Confetti popup handler
  const triggerConfetti = () => {
    setShowConfetti(true);
    if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
    confettiTimeoutRef.current = setTimeout(() => setShowConfetti(false), 15000);
  };

  // Handler for saving progress updates (with undo support)
  const handleProgressSave = async (goalId: string) => {
    if (progressAmount <= 0) return;
    try {
      await updateGoalProgress(goalId, progressAmount);
      setUndoStack(stack => [...stack, { type: "progress", goalId, amount: progressAmount }]);
      setProgressEditGoalId(null);
      setProgressAmount(0);
      setActionMessage("Goal progress updated!");
      const userId = user.uid;
      setGoals(await getGoals(userId));
      triggerConfetti();
    } catch (error) {
      alert("Failed to update saved amount");
    }
  };

  // Undo handler (edit, delete, complete, progress)
  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    const { doc, setDoc, updateDoc } = await import("firebase/firestore");
    if (last.type === "progress") {
      await updateGoalProgress(last.goalId, -last.amount);
    } else if (last.type === "edit" && last.prevData) {
      const goalRef = doc(db as import("firebase/firestore").Firestore, "goals", last.goalId);
      await updateDoc(goalRef, last.prevData);
    } else if (last.type === "delete" && last.prevData) {
      const goalRef = doc(db as import("firebase/firestore").Firestore, "goals", last.goalId);
      await setDoc(goalRef, last.prevData);
    } else if (last.type === "complete" && last.prevData) {
      const goalRef = doc(db as import("firebase/firestore").Firestore, "goals", last.goalId);
      await updateDoc(goalRef, { ...last.prevData, isCompleted: false });
    }
    const userId = user.uid;
    setGoals(await getGoals(userId));
    setUndoStack(stack => stack.slice(0, -1));
  };

  // Clear action message on any user action (edit, delete, complete, update, undo, add, etc.)
  const clearActionMessage = () => setActionMessage("");

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {showCompleteOverlay && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-green-200 animate-fade-in-out">
          <div className="text-7xl text-green-700 mb-4">✔️</div>
          <div className="text-3xl font-bold text-green-900 mb-2">{completedGoalName} completed!</div>
          <div className="text-lg text-green-800">Congratulations on reaching your goal!</div>
        </div>
      )}
      {showConfetti && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-6xl animate-bounce">🎉🎊🎉🎊🎉</div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-green-100 border border-green-300 rounded-lg px-8 py-4 text-green-900 text-xl shadow-lg">
            Goal completed! Congratulations! 🎉
          </div>
        </div>
      )}
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={handleUndo} disabled={undoStack.length === 0}>Undo</Button>
      </div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">🎯 Financial Goals</h1>
        <Link href="/goals/new" passHref>
          <Button>
            Add Goal
          </Button>
        </Link>
      </div>
      {aiRecommendation && !acceptedAIRec && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded text-blue-900 flex flex-col gap-2">
          <div dangerouslySetInnerHTML={{ __html: aiRecommendation.replace(/\n/g, '<br/>') }} />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={handleAcceptAIRec}>Accept Recommendation</Button>
            <Button size="sm" variant="outline" onClick={handleRejectAIRec}>Reject</Button>
          </div>
        </div>
      )}
      {acceptedAIRec && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-green-900">
          ✅ Auto-transfer recommendation accepted and applied!
        </div>
      )}
      {actionMessage && (
        <div className="mb-4 px-4 py-2 bg-blue-100 border border-blue-300 text-blue-900 rounded shadow text-center font-medium">
          {actionMessage}
        </div>
      )}
      <div className="space-y-6">
        {goals.length === 0 && <p className="text-muted-foreground">No goals set yet. Start by adding one above!</p>}
        {goals.map(goal => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isEditing = editGoalId === goal.id;
          return (
            <Card key={goal.id} className={goal.isCompleted ? "opacity-60" : ""}>
              <div className="relative">
                {/* Completion overlay */}
                {completedGoalId === goal.id && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-green-100/90 rounded-lg">
                    <div className="text-6xl text-green-700 mb-2">✔️</div>
                    <div className="text-xl font-bold text-green-900 mb-1">Goal completed!</div>
                    <div className="text-green-800">Congratulations!</div>
                  </div>
                )}
                {/* Deletion overlay */}
                {deletedGoalId === goal.id && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-red-100/90 rounded-lg">
                    <div className="text-6xl text-red-700 mb-2">🗑️</div>
                    <div className="text-xl font-bold text-red-900 mb-1">Goal deleted!</div>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{isEditing ? (
                    <input
                      className="border rounded px-2 py-1 w-48 text-black"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Goal name"
                      title="Goal name"
                    />
                  ) : goal.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={progress} className="h-3" />
                      <div className="flex justify-between text-xs mt-1">
                        <span>Saved: ${goal.currentAmount.toLocaleString()}</span>
                        <span>Target: ${goal.targetAmount.toLocaleString()}</span>
                      </div>
                      {isEditing ? (
                        <>
                          <div className="flex gap-2 mt-2">
                            <label className="flex flex-col text-xs">
                              Target amount
                              <input
                                type="number"
                                className="border rounded px-2 py-1 w-24 text-black"
                                value={editTarget}
                                min={0}
                                onChange={e => setEditTarget(Number(e.target.value))}
                                placeholder="Target amount"
                                title="Target amount"
                              />
                            </label>
                            <label className="flex flex-col text-xs">
                              Target date
                              <input
                                type="date"
                                className="border rounded px-2 py-1 text-black"
                                value={editDate ? editDate.toISOString().slice(0, 10) : ""}
                                onChange={e => setEditDate(new Date(e.target.value))}
                                placeholder="Target date"
                                title="Target date"
                              />
                            </label>
                          </div>
                          <textarea
                            className="border rounded px-2 py-1 w-full mt-2 text-black"
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            rows={2}
                            title="Goal description"
                            placeholder="Enter goal description"
                          />
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => handleSaveEdit(goal.id)}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditGoalId(null)}>Cancel</Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-muted-foreground mt-1">{goal.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">Target Date: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "-"}</div>
                          <div className="flex gap-2 mt-2">
                            {progressEditGoalId === goal.id ? (
                              <>
                                <input
                                  type="number"
                                  className="border rounded px-2 py-1 w-24 text-black"
                                  placeholder="Add to saved..."
                                  title="Add to saved amount"
                                  value={progressAmount}
                                  min={0}
                                  onChange={e => setProgressAmount(Number(e.target.value))}
                                />
                                <Button size="sm" onClick={() => handleProgressSave(goal.id)}>Save</Button>
                                <Button size="sm" variant="outline" onClick={() => setProgressEditGoalId(null)}>Cancel</Button>
                              </>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => startProgressEdit(goal.id)}>Update Saved</Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {!isEditing && <Button variant="outline" size="sm" onClick={() => handleEditGoal(goal)}>Edit</Button>}
                      <Button variant="outline" size="sm" onClick={() => handleDeleteGoal(goal.id)}>Delete</Button>
                      {!goal.isCompleted && <Button size="sm" onClick={() => handleMarkCompleted(goal.id)}>Mark as Completed</Button>}
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
