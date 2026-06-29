package dev.flux.api.controller

import dev.flux.domain.service.MonthSummary
import dev.flux.domain.service.TimelineService
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/timeline")
class TimelineController(private val timelineService: TimelineService) {

    @GetMapping
    fun getTimeline(
        @RequestParam userId: UUID,
        @RequestParam(defaultValue = "12") months: Int
    ): List<MonthSummary> {
        val from = LocalDate.now().withDayOfMonth(1)
        return timelineService.getTimeline(userId, from, months)
    }
}
