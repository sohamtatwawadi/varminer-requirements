package com.varminer.dashboard.repository;

import com.varminer.dashboard.entity.MeetingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface MeetingRepository extends JpaRepository<MeetingEntity, Long> {
    List<MeetingEntity> findByOrderByMeetingDateDesc();

    List<MeetingEntity> findByMeetingTypeOrderByMeetingDateDesc(String meetingType);

    @Query("SELECT m FROM MeetingEntity m WHERE m.meetingDate BETWEEN :from AND :to ORDER BY m.meetingDate DESC")
    List<MeetingEntity> findByMeetingDateBetween(LocalDate from, LocalDate to);
}
