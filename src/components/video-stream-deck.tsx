"use client";

import { useState, useRef, useEffect, type MouseEvent, type ChangeEvent } from "react";
import { Play, Pause, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) {
    return "00:00";
  }
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

const FPS = 30;

export default function VideoStreamDeck() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoSrc, setVideoSrc] = useState("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4");
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [duration, setDuration] = useState("00:00");
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      const total = video.duration;
      setCurrentTime(formatTime(current));
      setCurrentFrame(Math.floor(current * FPS));
      if (!isNaN(total) && total > 0) {
        setProgress((current / total) * 100);
      }
    };
    
    const handleLoadedMetadata = () => {
      const duration = video.duration;
      setDuration(formatTime(duration));
      setTotalFrames(Math.floor(duration * FPS));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    }
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && progressContainerRef.current) {
      const progressBar = progressContainerRef.current;
      const rect = progressBar.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const newTime = (offsetX / progressBar.offsetWidth) * videoRef.current.duration;
      if (isFinite(newTime)) {
          videoRef.current.currentTime = newTime;
      }
    }
  };

  const handleMouseMove = () => {
    setIsControlsVisible(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 2500);
    }
  };

  const handleMouseLeave = () => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      setIsControlsVisible(false);
    }
  };

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime("00:00");
      setDuration("00:00");
      setCurrentFrame(0);
      setTotalFrames(0);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    const currentVideoSrc = videoSrc;
    if (currentVideoSrc.startsWith('blob:')) {
      return () => {
        URL.revokeObjectURL(currentVideoSrc);
      };
    }
  }, [videoSrc]);


  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-mono text-muted-foreground">
          Frame: {currentFrame} / {totalFrames > 0 ? totalFrames : '...'}
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/*"
            className="hidden"
          />
          <Button onClick={handleUploadClick}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Video
          </Button>
        </div>
      </div>
      <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10 bg-black">
        <CardContent className="p-0">
          <div
            className="relative group/player aspect-video"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onClick={togglePlayPause}
              src={videoSrc}
              playsInline
              data-ai-hint="nature video"
            >
              Your browser does not support the video tag.
            </video>
            
            <div className={cn(
                "absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 pointer-events-none",
                !isPlaying ? "opacity-100" : "opacity-0 group-hover/player:opacity-100",
            )}>
              <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-20 h-20 text-white hover:bg-primary/20 pointer-events-auto rounded-full backdrop-blur-sm bg-black/20" 
                  onClick={togglePlayPause}
                  aria-label={isPlaying ? "Pause" : "Play"}
              >
                  {isPlaying ? 
                      <Pause className="w-12 h-12 fill-white stroke-white" /> : 
                      <Play className="w-12 h-12 fill-white stroke-white" />
                  }
              </Button>
            </div>

            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent transition-all duration-300",
                isControlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full",
              )}
            >
              <div
                  ref={progressContainerRef}
                  className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer group/progress mb-2 py-2"
                  onClick={handleSeek}
                >
                  <div
                    className="h-1.5 bg-primary rounded-full relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 scale-0 group-hover/progress:scale-100 transition-all duration-200" />
                  </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 text-white">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayPause}
                  className="text-primary hover:text-accent hover:bg-primary/10"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 sm:h-7 sm:w-7 fill-primary" />
                  ) : (
                    <Play className="h-6 w-6 sm:h-7 sm:w-7 fill-primary" />
                  )}
                </Button>
                
                <div className="text-sm font-mono whitespace-nowrap">
                  <span>{currentTime}</span> / <span>{duration}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
