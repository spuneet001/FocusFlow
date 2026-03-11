package com.focusflow.controller;

import com.focusflow.dto.Dto;
import com.focusflow.entity.User;
import com.focusflow.repository.TaskRepository;
import com.focusflow.repository.UserRepository;
import com.focusflow.service.WeeklyReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

// ── Weekly Report ─────────────────────────────────────────────────────────

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
class ReportController {

    private final WeeklyReportService reportService;

    /** GET /api/reports/current — generate or fetch this week's report */
    @GetMapping("/current")
    public ResponseEntity<Dto.WeeklyReportResponse> getCurrentReport(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(reportService.getCurrentWeekReport(user.getUsername()));
    }

    /** GET /api/reports/week?start=2026-03-09 — report for a specific week */
    @GetMapping("/week")
    public ResponseEntity<Dto.WeeklyReportResponse> getReportByWeek(
        @AuthenticationPrincipal UserDetails user,
        @RequestParam LocalDate start
    ) {
        return ResponseEntity.ok(reportService.getReportByWeek(user.getUsername(), start));
    }

    /** GET /api/reports — all past reports */
    @GetMapping
    public ResponseEntity<List<Dto.WeeklyReportResponse>> getHistory(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(reportService.getReportHistory(user.getUsername()));
    }
}

// ── User / Profile ────────────────────────────────────────────────────────

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TaskRepository taskRepository;

    /** GET /api/users/me */
    @GetMapping("/me")
    public ResponseEntity<Dto.UserResponse> me(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(Dto.UserResponse.from(user));
    }

    /** PATCH /api/users/me/profile — update name and profile picture */
    @PatchMapping("/me/profile")
    public ResponseEntity<Dto.UserResponse> updateProfile(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestBody Dto.UpdateProfileRequest req
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (req.getName() != null && !req.getName().isBlank()) user.setName(req.getName());
        if (req.getProfilePictureUrl() != null) user.setProfilePictureUrl(req.getProfilePictureUrl());
        userRepository.save(user);
        return ResponseEntity.ok(Dto.UserResponse.from(user));
    }

    /** PATCH /api/users/me/password — change password */
    @PatchMapping("/me/password")
    public ResponseEntity<Dto.UserResponse> changePassword(
        @AuthenticationPrincipal UserDetails userDetails,
        @Valid @RequestBody Dto.ChangePasswordRequest req
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok(Dto.UserResponse.from(user));
    }

    /** GET /api/users/me/gallery — all completion photos */
    @GetMapping("/me/gallery")
    public ResponseEntity<List<Dto.GalleryItem>> getGallery(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<Dto.GalleryItem> gallery = taskRepository.findByUserIdOrderByTaskDateAscTaskTimeAsc(user.getId())
            .stream()
            .filter(t -> t.getCompletionPhotoUrl() != null)
            .map(t -> {
                Dto.GalleryItem item = new Dto.GalleryItem();
                item.setTaskId(t.getId());
                item.setTitle(t.getTitle());
                item.setPhotoUrl(t.getCompletionPhotoUrl());
                item.setTaskDate(t.getTaskDate());
                item.setTaskTime(t.getEndTime() != null ? t.getEndTime() : t.getTaskTime());
                return item;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(gallery);
    }

    /** PATCH /api/users/me/plan — upgrade plan (hook Stripe here in prod) */
    @PatchMapping("/me/plan")
    public ResponseEntity<Dto.UserResponse> upgradePlan(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestBody Dto.UpgradePlanRequest req
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPlan(req.getPlan());
        // TODO: verify Stripe payment token before upgrading
        userRepository.save(user);
        return ResponseEntity.ok(Dto.UserResponse.from(user));
    }
}
