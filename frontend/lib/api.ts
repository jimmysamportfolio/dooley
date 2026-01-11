/**
 * API Client for Dooley Backend
 * 
 * Handles communication with the FastAPI backend for video analysis,
 * execution control, and SSE streaming.
 */

// Types matching backend schemas
export interface ActionStep {
    id: number;
    action_type: "CLICK" | "TYPE" | "WAIT" | "SCROLL" | "NAVIGATE";
    description: string;
    value?: string;
    cached_selector?: string;
    semantic_intent?: string;
    alternatives?: string[];
    timestamp?: string;
    visual_context?: string;
}

export interface ExecutionPlan {
    steps: ActionStep[];
    source_url?: string;
}

// SSE Event types
export interface SSELogEvent {
    type: "log";
    level: string;
    message: string;
}

export interface SSEActionEvent {
    type: "action";
    step_id: number;
    status: "running" | "complete" | "error";
    screenshot?: string;
}

export type SSEEvent = SSELogEvent | SSEActionEvent;

// Callbacks for SSE subscription
export interface ExecutionCallbacks {
    onActionUpdate: (stepId: number, status: "running" | "complete" | "error", screenshot?: string) => void;
    onLog: (message: string, level: string) => void;
    onComplete: () => void;
    onError: (error: string) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Upload a video file and get back an ExecutionPlan
 */
export async function analyzeVideo(file: File): Promise<ExecutionPlan> {
    const formData = new FormData();
    formData.append("video", file);

    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(error.detail || "Failed to analyze video");
    }

    return response.json();
}

/**
 * Analyze a video from a URL (YouTube, direct link, etc.)
 * Note: This requires the /api/analyze-url endpoint to be added to the backend
 */
export async function analyzeUrl(url: string): Promise<ExecutionPlan> {
    const response = await fetch(`${API_BASE_URL}/api/analyze-url`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
    });

    if (!response.ok) {
        // Check if it's a 404 (endpoint doesn't exist yet)
        if (response.status === 404) {
            throw new Error("URL analysis not yet available. Please upload a video file instead.");
        }
        const error = await response.json().catch(() => ({ detail: "Analysis failed" }));
        throw new Error(error.detail || "Failed to analyze URL");
    }

    return response.json();
}

/**
 * Start executing an ExecutionPlan
 */
export async function startExecution(
    executionId: string,
    plan: ExecutionPlan
): Promise<{ execution_id: string; status: string; stream_url: string }> {
    const response = await fetch(`${API_BASE_URL}/api/execute/${executionId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(plan),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Execution failed to start" }));
        throw new Error(error.detail || "Failed to start execution");
    }

    return response.json();
}

/**
 * Subscribe to execution SSE stream for real-time updates
 */
export function subscribeToExecution(
    executionId: string,
    callbacks: ExecutionCallbacks
): () => void {
    const eventSource = new EventSource(
        `${API_BASE_URL}/api/execute/${executionId}/stream`
    );

    eventSource.onmessage = (event) => {
        try {
            const data: SSEEvent = JSON.parse(event.data);

            if (data.type === "log") {
                callbacks.onLog(data.message, data.level);

                // Check for completion
                if (data.level === "success" && data.message.includes("complete")) {
                    callbacks.onComplete();
                }
            } else if (data.type === "action") {
                callbacks.onActionUpdate(data.step_id, data.status, data.screenshot);
            }
        } catch (e) {
            console.error("Failed to parse SSE event:", e);
        }
    };

    eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        callbacks.onError("Connection to execution stream lost");
        eventSource.close();
    };

    // Return cleanup function
    return () => {
        eventSource.close();
    };
}

/**
 * Get list of active executions
 */
export async function listExecutions(): Promise<{ active: string[]; count: number }> {
    const response = await fetch(`${API_BASE_URL}/api/executions`);

    if (!response.ok) {
        throw new Error("Failed to list executions");
    }

    return response.json();
}

/**
 * Health check for the backend
 */
export async function healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
        throw new Error("Backend is not healthy");
    }

    return response.json();
}
