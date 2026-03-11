package com.focusflow.dto;

import com.focusflow.entity.Task;
import com.focusflow.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

// ── Auth ──────────────────────────────────────────────────────────────────

public class Dto {

    @Data
    public static class RegisterRequest {
        @NotBlank private String name;
        @Email @NotBlank private String email;
        @NotBlank private String password;
    }

    @Data
    public static class LoginRequest {
        @Email @NotBlank private String email;
        @NotBlank private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private UserResponse user;
        public AuthResponse(String token, UserResponse user) {
            this.token = token;
            this.user = user;
        }
    }

    // ── User ─────────────────────────────────────────────────────────────

    @Data
    public static class UserResponse {
        private Long id;
        private String name;
        private String email;
        private User.Plan plan;
        private String profilePictureUrl;
        private LocalDateTime createdAt;

        public static UserResponse from(User u) {
            UserResponse r = new UserResponse();
            r.id = u.getId();
            r.name = u.getName();
            r.email = u.getEmail();
            r.plan = u.getPlan();
            r.profilePictureUrl = u.getProfilePictureUrl();
            r.createdAt = u.getCreatedAt();
            return r;
        }
    }

    @Data
    public static class UpdateProfileRequest {
        private String name;
        private String profilePictureUrl;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank private String currentPassword;
        @NotBlank private String newPassword;
    }

    @Data
    public static class GalleryItem {
        private Long taskId;
        private String title;
        private String photoUrl;
        private LocalDate taskDate;
        private LocalTime taskTime;
    }

    // ── Task ─────────────────────────────────────────────────────────────

    @Data
    public static class TaskRequest {
        @NotBlank private String title;
        private String description;
        private LocalDate taskDate;
        private LocalTime taskTime;
        private LocalTime startTime;
        private LocalTime endTime;
        private String alarmTune = "Bell";
        private Task.Priority priority = Task.Priority.MEDIUM;
        private Task.Category category = Task.Category.MANUAL;
        private String goalContext;
    }

    @Data
    public static class TaskResponse {
        private Long id;
        private String title;
        private String description;
        private LocalDate taskDate;
        private LocalTime taskTime;
        private LocalTime startTime;
        private LocalTime endTime;
        private Integer endTimeChanges;
        private Boolean startTimeReminderShown;
        private String alarmTune;
        private Task.Priority priority;
        private Task.Category category;
        private Boolean done;
        private Boolean aiGenerated;
        private String goalContext;
        private String completionPhotoUrl;
        private Boolean socialShared;
        private LocalDateTime createdAt;

        public static TaskResponse from(Task t) {
            TaskResponse r = new TaskResponse();
            r.id = t.getId();
            r.title = t.getTitle();
            r.description = t.getDescription();
            r.taskDate = t.getTaskDate();
            r.taskTime = t.getTaskTime();
            r.startTime = t.getStartTime();
            r.endTime = t.getEndTime();
            r.endTimeChanges = t.getEndTimeChanges();
            r.startTimeReminderShown = t.getStartTimeReminderShown();
            r.alarmTune = t.getAlarmTune();
            r.priority = t.getPriority();
            r.category = t.getCategory();
            r.done = t.getDone();
            r.aiGenerated = t.getAiGenerated();
            r.goalContext = t.getGoalContext();
            r.completionPhotoUrl = t.getCompletionPhotoUrl();
            r.socialShared = t.getSocialShared();
            r.createdAt = t.getCreatedAt();
            return r;
        }
    }

    @Data
    public static class PhotoRequest {
        @NotBlank private String photoData; // base64 encoded image
    }

    // ── AI ───────────────────────────────────────────────────────────────

    @Data
    public static class AiPlanRequest {
        @NotBlank private String goal;
    }

    @Data
    public static class AiChatRequest {
        @NotBlank private String message;
        private Long planId;
        // Full chat history from frontend to maintain context
        private List<ChatMessage> history;
    }

    @Data
    public static class ChatMessage {
        private String role; // "user" | "assistant"
        private String content;
    }

    @Data
    public static class AiChatResponse {
        private String reply;
        private Long planId;
        private List<TaskResponse> tasksAdded;
    }

    @Data
    public static class AiPlanResponse {
        private Long id;
        private String goal;
        private String generatedPlan;
        private Integer tasksAdded;
        private LocalDateTime createdAt;
    }

    // ── Report ───────────────────────────────────────────────────────────

    @Data
    public static class DailyStat {
        private String day;
        private int done;
        private int total;
    }

    @Data
    public static class WeeklyReportResponse {
        private Long id;
        private LocalDate weekStart;
        private LocalDate weekEnd;
        private Integer totalTasks;
        private Integer completedTasks;
        private Double completionPercentage;
        private Integer streakDays;
        private String aiNarrative;
        private List<DailyStat> dailyStats;
        private LocalDateTime createdAt;
    }

    // ── Subscription ─────────────────────────────────────────────────────

    @Data
    public static class UpgradePlanRequest {
        private User.Plan plan;
        private String stripePaymentToken; // from Stripe.js
    }
}
