package com.example.videoconf.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserResponseDto {
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private List<String> roles;
}
