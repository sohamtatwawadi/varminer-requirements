package com.varminer.dashboard.repository;

import com.varminer.dashboard.entity.MeetingRequirementLinkEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MeetingRequirementLinkRepository extends JpaRepository<MeetingRequirementLinkEntity, Long> {
    List<MeetingRequirementLinkEntity> findByMeetingId(Long meetingId);
    void deleteByMeetingId(Long meetingId);
}
