package com.varminer.dashboard.repository;

import com.varminer.dashboard.entity.MeetingReleaseLinkEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MeetingReleaseLinkRepository extends JpaRepository<MeetingReleaseLinkEntity, Long> {
    List<MeetingReleaseLinkEntity> findByMeetingId(Long meetingId);
    void deleteByMeetingId(Long meetingId);
}
