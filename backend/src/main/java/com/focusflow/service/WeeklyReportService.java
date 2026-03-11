package com.focusflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.focusflow.dto.Dto;
import com.focusflow.entity.User;
import com.focusflow.entity.WeeklyReport;
import com.focusflow.repository.TaskRepository;
import com.focusflow.repository.UserRepository;
import com.focusflow.repository.WeeklyReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeeklyReportService {

    private final WeeklyReportRepository reportRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final AnthropicService anthropicService;
    private final ObjectMapper mapper = new ObjectMapper();

    public Dto.WeeklyReportResponse getCurrentWeekReport(String email) {
        return getReportByWeek(email, LocalDate.now().with(DayOfWeek.MONDAY));
    }

    public Dto.WeeklyReportResponse getReportByWeek(String email, LocalDate weekStart) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        weekStart = weekStart.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = weekStart.plusDays(6);

        // Always recalculate report to include latest tasks
        // (removed caching logic so new tasks are always reflected)

        // Build daily stats
        List<Dto.DailyStat> dailyStats = new ArrayList<>();
        int totalTasks = 0, completedTasks = 0;

        for (int i = 0; i < 7; i++) {
            LocalDate day = weekStart.plusDays(i);
            int done = (int) taskRepository.countCompletedByUserAndDate(user.getId(), day);
            int total = (int) taskRepository.countTotalByUserAndDate(user.getId(), day);
            Dto.DailyStat stat = new Dto.DailyStat();
            stat.setDay(day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            stat.setDone(done);
            stat.setTotal(total);
            dailyStats.add(stat);
            totalTasks += total;
            completedTasks += done;
        }

        double pct = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 0.0;

        // Generate AI narrative (Pro+ only)
        String aiNarrative = null;
        if (user.getPlan() != User.Plan.FREE) {
            String summary = dailyStats.stream()
                .map(s -> s.getDay() + ": " + s.getDone() + "/" + s.getTotal())
                .collect(Collectors.joining(", "));
            summary += " | Overall: " + completedTasks + "/" + totalTasks + " (" + Math.round(pct) + "%)";
            aiNarrative = anthropicService.generateWeeklyReport(summary);
        }

        // Persist or update report
        try {
            var existing = reportRepository.findByUserIdAndWeekStart(user.getId(), weekStart);
            WeeklyReport report;
            
            if (existing.isPresent()) {
                report = existing.get();
                report.setTotalTasks(totalTasks);
                report.setCompletedTasks(completedTasks);
                report.setCompletionPercentage(pct);
                report.setAiNarrative(aiNarrative);
                report.setDailyStats(mapper.writeValueAsString(dailyStats));
            } else {
                report = WeeklyReport.builder()
                    .user(user)
                    .weekStart(weekStart)
                    .weekEnd(weekEnd)
                    .totalTasks(totalTasks)
                    .completedTasks(completedTasks)
                    .completionPercentage(pct)
                    .aiNarrative(aiNarrative)
                    .dailyStats(mapper.writeValueAsString(dailyStats))
                    .build();
            }
            report = reportRepository.save(report);
            return toResponse(report);
        } catch (Exception e) {
            log.error("Error saving report", e);
            throw new RuntimeException("Error generating report");
        }
    }

    public List<Dto.WeeklyReportResponse> getReportHistory(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return reportRepository.findByUserIdOrderByWeekStartDesc(user.getId())
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private Dto.WeeklyReportResponse toResponse(WeeklyReport r) {
        Dto.WeeklyReportResponse res = new Dto.WeeklyReportResponse();
        res.setId(r.getId());
        res.setWeekStart(r.getWeekStart());
        res.setWeekEnd(r.getWeekEnd());
        res.setTotalTasks(r.getTotalTasks());
        res.setCompletedTasks(r.getCompletedTasks());
        res.setCompletionPercentage(r.getCompletionPercentage());
        res.setStreakDays(r.getStreakDays());
        res.setAiNarrative(r.getAiNarrative());
        res.setCreatedAt(r.getCreatedAt());
        try {
            if (r.getDailyStats() != null) {
                res.setDailyStats(mapper.readValue(r.getDailyStats(),
                    mapper.getTypeFactory().constructCollectionType(List.class, Dto.DailyStat.class)));
            }
        } catch (Exception e) {
            log.warn("Could not parse daily stats", e);
        }
        return res;
    }
}
