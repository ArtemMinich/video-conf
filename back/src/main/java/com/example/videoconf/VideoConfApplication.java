package com.example.videoconf;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VideoConfApplication {
    public static void main(String[] args) {
        SpringApplication.run(VideoConfApplication.class, args);
    }
}
