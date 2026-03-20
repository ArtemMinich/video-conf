package com.example.videoconf.repository;

import com.example.videoconf.model.Room;
import com.example.videoconf.model.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomId(String roomId);

    List<Room> findByStatus(RoomStatus status);

    @Transactional
    void deleteByRoomId(String roomId);
}
