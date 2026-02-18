package com.varminer.dashboard.controller;

import com.varminer.dashboard.dto.MeetingDto;
import com.varminer.dashboard.service.MeetingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class MeetingController {

    private final MeetingService meetingService;

    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @GetMapping("/meetings")
    public List<MeetingDto> list(@RequestParam(required = false) String type) {
        return meetingService.findByType(type);
    }

    @GetMapping("/meetings/overdue-actions")
    public List<com.varminer.dashboard.dto.MeetingActionItemDto> overdueActions() {
        return meetingService.findOverdueOpenActions().stream()
                .map(a -> {
                    com.varminer.dashboard.dto.MeetingActionItemDto d = new com.varminer.dashboard.dto.MeetingActionItemDto();
                    d.setId(a.getId());
                    d.setActionText(a.getActionText());
                    d.setOwner(a.getOwner());
                    d.setDueDate(a.getDueDate());
                    d.setStatus(a.getStatus());
                    return d;
                })
                .toList();
    }

    @GetMapping("/meetings/{id}")
    public ResponseEntity<MeetingDto> get(@PathVariable Long id) {
        return meetingService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/meetings")
    public MeetingDto create(@RequestBody MeetingDto dto) {
        return meetingService.create(dto);
    }

    @PutMapping("/meetings/{id}")
    public ResponseEntity<MeetingDto> update(@PathVariable Long id, @RequestBody MeetingDto dto) {
        return meetingService.update(id, dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/meetings/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return meetingService.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.noContent().build();
    }
}
