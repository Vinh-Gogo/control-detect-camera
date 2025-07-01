
"use client";

import { useState, useRef, useEffect, type MouseEvent, type ChangeEvent } from "react";
import { Play, Pause, Upload, UtensilsCrossed, PackageOpen, Apple, Check, X, Download, RefreshCw, Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

type DetectionCounts = {
  trayWithFood: number;
  trayWithoutFood: number;
  food: number;
};

type HistoryEntry = {
  id: number;
  currentFrame: number;
  totalFrames: number;
  counts: DetectionCounts;
  rating: 'T' | 'F';
};

export default function VideoStreamDeck() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoSrc, setVideoSrc] = useState("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4");
  const [videoFileName, setVideoFileName] = useState("flower.mp4");
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [duration, setDuration] = useState("00:00");
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [frameImageDataUrl, setFrameImageDataUrl] = useState<string | null>(null);

  const [counts, setCounts] = useState<DetectionCounts>({
    trayWithFood: 0,
    trayWithoutFood: 0,
    food: 0,
  });
  const [history, setHistory] = useState<HistoryEntry[]>([]);

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

    const captureFrame = () => {
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2) { 
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          setFrameImageDataUrl(canvas.toDataURL("image/jpeg"));
        }
      }
    };

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      const total = video.duration;
      setCurrentTime(formatTime(current));
      setCurrentFrame(Math.floor(current * FPS));
      if (!isNaN(total) && total > 0) {
        setProgress((current / total) * 100);
      }
      captureFrame();
    };
    
    const handleLoadedMetadata = () => {
      const duration = video.duration;
      setDuration(formatTime(duration));
      setTotalFrames(Math.floor(duration * FPS));
      setTimeout(captureFrame, 100);
    };

    const handleSeeked = () => {
      captureFrame();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    }
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    if (video.readyState >= 2) {
      handleLoadedMetadata();
    }


    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [videoSrc]);

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
      setVideoFileName(file.name);
      setHistory([]);
      setFrameImageDataUrl(null);
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

  const handleIncrement = (key: keyof DetectionCounts) => {
    setCounts((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const handleConfirmation = (isCorrect: boolean) => {
    const newEntry: HistoryEntry = {
      id: Date.now(),
      currentFrame: currentFrame,
      totalFrames: totalFrames,
      counts: { ...counts },
      rating: isCorrect ? 'T' : 'F',
    };

    setHistory((prev) => [newEntry, ...prev]);
    setCounts({ trayWithFood: 0, trayWithoutFood: 0, food: 0 });
  };
  
  const handleExport = () => {
    if (history.length === 0) {
      return;
    }

    const headers = [
      "Current Frame",
      "Total Frames",
      "Tray with Food",
      "Tray without Food",
      "Food",
      "Rating",
    ];

    const rows = history.map((entry) => [
      entry.currentFrame,
      entry.totalFrames > 0 ? entry.totalFrames : 'N/A',
      entry.counts.trayWithFood,
      entry.counts.trayWithoutFood,
      entry.counts.food,
      entry.rating,
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const baseFileName = videoFileName.lastIndexOf('.') > -1 ? videoFileName.substring(0, videoFileName.lastIndexOf('.')) : videoFileName;
    const downloadFileName = `Detection Report ${baseFileName}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", downloadFileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    setHistory([]);
  };

  const handleDeleteRow = (idToDelete: number) => {
    setHistory((prevHistory) => prevHistory.filter((entry) => entry.id !== idToDelete));
  };

  const handleUpdateCountInHistory = (idToUpdate: number, key: keyof DetectionCounts, delta: number) => {
    setHistory((prevHistory) =>
      prevHistory.map((entry) => {
        if (entry.id === idToUpdate) {
          const newCount = Math.max(0, entry.counts[key] + delta);
          return {
            ...entry,
            counts: {
              ...entry.counts,
              [key]: newCount,
            },
          };
        }
        return entry;
      })
    );
  };
  
  const EditableCountCell = ({
    value,
    onIncrease,
    onDecrease,
  }: {
    value: number;
    onIncrease: () => void;
    onDecrease: () => void;
  }) => (
    <TableCell className="group/cell relative text-center py-2 px-4">
      <span className="font-mono text-lg">{value}</span>
      <div className="absolute inset-y-0 right-0 flex items-center opacity-0 group-hover/cell:opacity-100 transition-opacity bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={onDecrease}
          disabled={value <= 0}
          aria-label="Decrease"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={onIncrease}
          aria-label="Increase"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </TableCell>
  );

  return (
    <>
      <canvas ref={canvasRef} className="hidden"></canvas>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <div className="mb-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*"
              className="hidden"
            />
            <Button onClick={handleUploadClick} className="w-full h-12">
              <Upload className="mr-2 h-4 w-4" />
              Upload Video
            </Button>
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
                  crossOrigin="anonymous"
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
                    "absolute top-2 left-2 px-3 py-2 bg-black/50 text-white rounded-lg transition-opacity duration-300 whitespace-nowrap",
                    isControlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                >
                  <div className="text-xs font-semibold tracking-widest uppercase">Frame</div>
                  <div className="text-2xl font-bold tracking-tighter">
                    {currentFrame}
                    <span className="text-base font-normal text-white/70"> / {totalFrames > 0 ? totalFrames : '...'}</span>
                  </div>
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
        </div>

        <div>
          <div className="mb-4">
            <Button className="btn-gradient text-lg font-semibold h-12 w-full">
              AI Analysis
            </Button>
          </div>
          <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10 bg-card">
            <CardContent className="p-0">
              <div className="relative aspect-video flex flex-col items-center justify-center bg-black">
                {frameImageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={frameImageDataUrl} alt="Current frame" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center p-4">
                    <div className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
                      AI analysis results will appear here
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Detection Controls & History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-2" aria-label="Detection Toggles">
                <Button 
                  onClick={() => handleIncrement('trayWithFood')} 
                  variant={counts.trayWithFood > 0 ? "default" : "outline"}
                >
                  <UtensilsCrossed className="mr-2 h-4 w-4" />
                  Tray with food ({counts.trayWithFood})
                </Button>
                <Button 
                  onClick={() => handleIncrement('trayWithoutFood')} 
                  variant={counts.trayWithoutFood > 0 ? "default" : "outline"}
                >
                  <PackageOpen className="mr-2 h-4 w-4" />
                  Tray without food ({counts.trayWithoutFood})
                </Button>
                <Button 
                  onClick={() => handleIncrement('food')} 
                  variant={counts.food > 0 ? "default" : "outline"}
                >
                  <Apple className="mr-2 h-4 w-4" />
                  Food ({counts.food})
                </Button>
              </div>

              <div className="flex flex-wrap gap-2" aria-label="Confirmation controls">
                <Button
                  onClick={() => handleConfirmation(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Correct
                </Button>
                <Button
                  onClick={() => handleConfirmation(false)}
                  variant="destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Incorrect
                </Button>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/6">Current frame / total frame</TableHead>
                    <TableHead className="text-center w-1/6">Tray with Food</TableHead>
                    <TableHead className="text-center w-1/6">Tray without Food</TableHead>
                    <TableHead className="text-center w-1/6">Food</TableHead>
                    <TableHead className="text-center w-1/6">Rating</TableHead>
                    <TableHead className="text-center w-1/6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length > 0 ? (
                    history.map((entry) => (
                      <TableRow key={entry.id} className="group">
                        <TableCell className="font-mono py-2 px-4">
                          {entry.currentFrame} / {entry.totalFrames > 0 ? entry.totalFrames : '...'}
                        </TableCell>
                        <EditableCountCell 
                          value={entry.counts.trayWithFood}
                          onIncrease={() => handleUpdateCountInHistory(entry.id, 'trayWithFood', 1)}
                          onDecrease={() => handleUpdateCountInHistory(entry.id, 'trayWithFood', -1)}
                        />
                         <EditableCountCell 
                          value={entry.counts.trayWithoutFood}
                          onIncrease={() => handleUpdateCountInHistory(entry.id, 'trayWithoutFood', 1)}
                          onDecrease={() => handleUpdateCountInHistory(entry.id, 'trayWithoutFood', -1)}
                        />
                         <EditableCountCell 
                          value={entry.counts.food}
                          onIncrease={() => handleUpdateCountInHistory(entry.id, 'food', 1)}
                          onDecrease={() => handleUpdateCountInHistory(entry.id, 'food', -1)}
                        />
                        <TableCell className="font-bold text-center py-2 px-4">
                          {entry.rating}
                        </TableCell>
                        <TableCell className="text-center py-2 px-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteRow(entry.id)}
                            aria-label="Delete row"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete row</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No history yet. Press "Correct" or "Incorrect" to log an entry.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleRefresh} variant="outline" disabled={history.length === 0}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Table
              </Button>
              <Button onClick={handleExport} disabled={history.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
