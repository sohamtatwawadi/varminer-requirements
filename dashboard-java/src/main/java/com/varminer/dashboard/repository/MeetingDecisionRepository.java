package com.varminer.dashboard.repository;

import com.varminer.dashboard.entity.MeetingDecisionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MeetingDecisionRepository extends JpaRepository<MeetingDecisionEntity, Long> {
    List<MeetingDecisionEntity> findByMeetingIdOrderBySortOrderAsc(Long meetingId);
}
