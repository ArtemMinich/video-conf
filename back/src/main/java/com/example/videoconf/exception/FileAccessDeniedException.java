package com.example.videoconf.exception;

public class FileAccessDeniedException extends RuntimeException {

    public FileAccessDeniedException(String message) {
        super(message);
    }
}
