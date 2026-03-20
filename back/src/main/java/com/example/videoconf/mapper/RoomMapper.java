package com.example.videoconf.mapper;

import com.example.videoconf.dto.RoomCreateDto;
import com.example.videoconf.dto.RoomResponseDto;
import com.example.videoconf.model.Room;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RoomMapper {

    RoomResponseDto toDto(Room room);

    List<RoomResponseDto> toDtoList(List<Room> rooms);

    Room toEntity(RoomCreateDto dto);
}
