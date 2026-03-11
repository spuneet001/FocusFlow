package com.focusflow.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "task_date", nullable = false)
    private LocalDate taskDate;

    @Column(name = "task_time")
    private LocalTime taskTime;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "end_time_changes")
    @Builder.Default
    private Integer endTimeChanges = 0;

    @Column(name = "start_time_reminder_shown")
    @Builder.Default
    private Boolean startTimeReminderShown = false;

    @Column(name = "alarm_tune")
    @Builder.Default
    private String alarmTune = "Bell";

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Category category = Category.MANUAL;

    @Column(nullable = false)
    @Builder.Default
    private Boolean done = false;

    @Column(name = "ai_generated")
    @Builder.Default
    private Boolean aiGenerated = false;

    @Column(name = "goal_context", columnDefinition = "TEXT")
    private String goalContext;

    @Column(name = "completion_photo_url", columnDefinition = "TEXT")
    private String completionPhotoUrl;

    @Column(name = "social_shared")
    @Builder.Default
    private Boolean socialShared = false;

    @Column(name = "alerted_at")
    private LocalDateTime alertedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Priority { LOW, MEDIUM, HIGH }

    public enum Category { MANUAL, FITNESS, WORK, LEARNING, NUTRITION, WELLNESS, AI_PLAN }
}
