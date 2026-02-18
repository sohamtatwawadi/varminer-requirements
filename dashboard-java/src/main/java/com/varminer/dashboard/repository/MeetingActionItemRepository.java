package com.varminer.dashboard.repository;

import com.varminer.dashboard.entity.MeetingActionItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface MeetingActionItemRepository extends JpaRepository<MeetingActionItemEntity, Long> {
    List<MeetingActionItemEntity> findByMeetingIdOrderBySortOrderAsc(Long meetingId);

    @Query("SELECT a FROM MeetingActionItemEntity a WHERE a.status = 'open' AND (a.dueDate IS NULL OR a.dueDate < :today) ORDER BY a.dueDate ASC NULLS LAST")
    List<MeetingActionItemEntity> findOverdueOpenActions(LocalDate today);
}
