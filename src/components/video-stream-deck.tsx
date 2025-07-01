
"use client";

// Nhập các hook cần thiết từ React để quản lý state, tham chiếu và vòng đời component.
import { useState, useRef, useEffect, type MouseEvent, type ChangeEvent } from "react";
// Nhập các icon từ thư viện lucide-react để sử dụng trong giao diện.
import { Play, Pause, Upload, UtensilsCrossed, PackageOpen, Apple, Check, X, Download, RefreshCw, Trash2, Minus, Plus } from "lucide-react";
// Nhập các component giao diện người dùng từ thư viện ShadCN UI.
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Nhập hàm tiện ích `cn` để kết hợp các class CSS của Tailwind một cách có điều kiện.
import { cn } from "@/lib/utils";
// Nhập hook `useToast` để hiển thị thông báo (toast).
import { useToast } from "@/hooks/use-toast";

/**
 * Định dạng thời gian từ giây sang chuỗi "MM:SS".
 * @param {number} timeInSeconds - Thời gian tính bằng giây.
 * @returns {string} - Chuỗi thời gian đã định dạng.
 */
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

// Hằng số xác định số khung hình mỗi giây (Frames Per Second) cho video.
const FPS = 30;

// Định nghĩa kiểu dữ liệu cho số lượng các đối tượng được phát hiện.
type DetectionCounts = {
  trayWithFood: number;
  trayWithoutFood: number;
  food: number;
};

// Định nghĩa kiểu dữ liệu cho một mục trong lịch sử phát hiện.
type HistoryEntry = {
  id: number;
  currentFrame: number;
  totalFrames: number;
  counts: DetectionCounts;
  rating: 'T' | 'F'; // T = True (Đúng), F = False (Sai)
};

/**
 * Component chính của ứng dụng, hiển thị trình phát video,
 * bảng điều khiển và lịch sử phát hiện.
 */
export default function VideoStreamDeck() {
  // --- Refs ---
  // Tham chiếu đến phần tử <video> để điều khiển phát lại.
  const videoRef = useRef<HTMLVideoElement>(null);
  // Tham chiếu đến phần tử <canvas> để chụp ảnh khung hình từ video.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Tham chiếu đến container của thanh tiến trình để tính toán khi tua video.
  const progressContainerRef = useRef<HTMLDivElement>(null);
  // Tham chiếu đến bộ đếm thời gian để tự động ẩn các nút điều khiển.
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Tham chiếu đến input kiểu file để có thể kích hoạt nó một cách tự động.
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Sử dụng hook `useToast` để có thể hiển thị thông báo.
  const { toast } = useToast();

  // --- State ---
  // State lưu trữ URL nguồn của video.
  const [videoSrc, setVideoSrc] = useState("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4");
  // State lưu trữ tên file của video đang được phát.
  const [videoFileName, setVideoFileName] = useState("flower.mp4");
  // State cho biết video đang phát hay tạm dừng.
  const [isPlaying, setIsPlaying] = useState(false);
  // State lưu trữ tiến trình phát video (từ 0 đến 100).
  const [progress, setProgress] = useState(0);
  // State lưu trữ thời gian hiện tại của video dưới dạng chuỗi "MM:SS".
  const [currentTime, setCurrentTime] = useState("00:00");
  // State lưu trữ tổng thời lượng của video dưới dạng chuỗi "MM:SS".
  const [duration, setDuration] = useState("00:00");
  // State kiểm soát việc hiển thị hay ẩn các nút điều khiển video.
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  // State lưu trữ chỉ số khung hình hiện tại.
  const [currentFrame, setCurrentFrame] = useState(0);
  // State lưu trữ tổng số khung hình của video.
  const [totalFrames, setTotalFrames] = useState(0);
  // State lưu trữ URL dữ liệu của ảnh khung hình hiện tại (để hiển thị trong panel AI).
  const [frameImageDataUrl, setFrameImageDataUrl] = useState<string | null>(null);
  // State lưu trữ số lượng các đối tượng được phát hiện hiện tại.
  const [counts, setCounts] = useState<DetectionCounts>({
    trayWithFood: 0,
    trayWithoutFood: 0,
    food: 0,
  });
  // State lưu trữ lịch sử các lần xác nhận phát hiện.
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  /**
   * Chuyển đổi trạng thái phát/tạm dừng của video.
   */
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  // Effect này xử lý tất cả các sự kiện liên quan đến video.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Hàm chụp ảnh khung hình hiện tại của video và lưu vào state.
    const captureFrame = () => {
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2) { // readyState >= 2 nghĩa là có đủ dữ liệu để phát
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

    // Xử lý sự kiện "timeupdate": cập nhật tiến trình, thời gian và khung hình hiện tại.
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
    
    // Xử lý sự kiện "loadedmetadata": khi siêu dữ liệu (thời lượng, kích thước) của video đã được tải.
    const handleLoadedMetadata = () => {
      const duration = video.duration;
      setDuration(formatTime(duration));
      setTotalFrames(Math.floor(duration * FPS));
    };

    // Xử lý sự kiện "loadeddata": khi dữ liệu của khung hình hiện tại đã có.
    const handleLoadedData = () => {
      captureFrame();
    };

    // Xử lý sự kiện "seeked": khi người dùng tua video.
    const handleSeeked = () => {
      captureFrame();
    };

    // Xử lý sự kiện "ended": khi video kết thúc.
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    }
    
    // Xử lý các sự kiện "play" và "pause".
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    // Xử lý sự kiện "error": hiển thị thông báo lỗi nếu video không thể phát.
    const handleError = () => {
      if (!video) return;
      const error = video.error;
      let message = 'An unknown video error occurred.';
      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            message = 'The video playback was aborted by the user.';
            break;
          case error.MEDIA_ERR_NETWORK:
            message = 'A network error caused the video download to fail.';
            break;
          case error.MEDIA_ERR_DECODE:
            message = 'The video could not be decoded, it may be corrupt or in an unsupported format.';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = 'The video format is not supported by your browser.';
            break;
          default:
            message = 'An unknown error occurred while trying to play the video.';
        }
      }
      toast({
        variant: 'destructive',
        title: 'Video Playback Error',
        description: message,
      });
      setIsPlaying(false);
    };

    // Đăng ký các event listener.
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("error", handleError);

    // Xử lý trường hợp video đã được tải một phần trước khi listener được thêm vào.
    if (video.readyState >= 1) { // metadata loaded
        handleLoadedMetadata();
    }
    if (video.readyState >= 2) { // data for current frame available
        handleLoadedData();
    }

    // Hàm dọn dẹp: gỡ bỏ các event listener khi component bị unmount.
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("error", handleError);
    };
  }, [videoSrc, toast]); // Chạy lại effect khi `videoSrc` thay đổi.

  /**
   * Xử lý việc tua video khi người dùng click vào thanh tiến trình.
   * @param {MouseEvent<HTMLDivElement>} e - Sự kiện click chuột.
   */
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

  /**
   * Hiển thị các nút điều khiển khi di chuyển chuột vào vùng video.
   */
  const handleMouseMove = () => {
    setIsControlsVisible(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    // Nếu video đang phát, tự động ẩn đi sau một khoảng thời gian.
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 2500);
    }
  };

  /**
   * Ẩn các nút điều khiển khi chuột rời khỏi vùng video.
   */
  const handleMouseLeave = () => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      setIsControlsVisible(false);
    }
  };

  // Effect dọn dẹp timeout khi component unmount.
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Xử lý khi người dùng chọn một file video mới từ máy tính.
   * @param {ChangeEvent<HTMLInputElement>} event - Sự kiện thay đổi của input file.
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoFileName(file.name);
      // Reset lại state khi có video mới.
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

  /**
   * Kích hoạt việc chọn file khi click nút "Upload Video".
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Effect để dọn dẹp URL blob được tạo ra khi component unmount hoặc videoSrc thay đổi.
  useEffect(() => {
    const currentVideoSrc = videoSrc;
    if (currentVideoSrc.startsWith('blob:')) {
      return () => {
        URL.revokeObjectURL(currentVideoSrc);
      };
    }
  }, [videoSrc]);

  /**
   * Tăng số lượng của một loại phát hiện lên 1.
   * @param {keyof DetectionCounts} key - Khóa của loại phát hiện ('trayWithFood', 'trayWithoutFood', 'food').
   */
  const handleIncrement = (key: keyof DetectionCounts) => {
    setCounts((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  /**
   * Xử lý khi người dùng click nút "Correct" hoặc "Incorrect".
   * Tạo một mục mới trong lịch sử và reset lại bộ đếm.
   * @param {boolean} isCorrect - `true` nếu là "Correct", `false` nếu là "Incorrect".
   */
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
  
  /**
   * Xuất dữ liệu từ bảng lịch sử ra file CSV.
   */
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

    // Tự động đặt tên file dựa trên tên video.
    const baseFileName = videoFileName.lastIndexOf('.') > -1 ? videoFileName.substring(0, videoFileName.lastIndexOf('.')) : videoFileName;
    const downloadFileName = `Detection Report ${baseFileName}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", downloadFileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Xóa toàn bộ dữ liệu trong bảng lịch sử.
   */
  const handleRefresh = () => {
    setHistory([]);
  };

  /**
   * Xóa một dòng cụ thể khỏi bảng lịch sử.
   * @param {number} idToDelete - ID của dòng cần xóa.
   */
  const handleDeleteRow = (idToDelete: number) => {
    setHistory((prevHistory) => prevHistory.filter((entry) => entry.id !== idToDelete));
  };

  /**
   * Cập nhật số lượng của một loại phát hiện trong một dòng của bảng lịch sử.
   * @param {number} idToUpdate - ID của dòng cần cập nhật.
   * @param {keyof DetectionCounts} key - Khóa của loại phát hiện cần cập nhật.
   * @param {number} delta - Giá trị thay đổi (+1 hoặc -1).
   */
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

  /**
   * Cập nhật đánh giá (T/F) cho một dòng trong bảng lịch sử.
   * @param {number} idToUpdate - ID của dòng cần cập nhật.
   * @param {'T' | 'F'} newRating - Đánh giá mới.
   */
  const handleUpdateRating = (idToUpdate: number, newRating: 'T' | 'F') => {
    setHistory((prevHistory) =>
      prevHistory.map((entry) =>
        entry.id === idToUpdate ? { ...entry, rating: newRating } : entry
      )
    );
  };
  
  /**
   * Component con để hiển thị ô có thể chỉnh sửa số lượng trong bảng.
   */
  const EditableCountCell = ({
    value,
    onIncrease,
    onDecrease,
  }: {
    value: number;
    onIncrease: () => void;
    onDecrease: () => void;
  }) => (
    <TableCell className="group/cell relative text-center py-1 px-4">
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
      {/* Canvas được sử dụng để chụp ảnh khung hình nhưng được ẩn đi khỏi giao diện */}
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      {/* Lưới chính của giao diện, chia thành 2 cột trên desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Cột bên trái: Trình phát video */}
        <div>
          <div className="mb-4">
            {/* Input file ẩn, được kích hoạt bởi nút "Upload Video" */}
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
                  playsInline // Cho phép phát video trực tiếp trên iOS
                  crossOrigin="anonymous" // Cần thiết để có thể chụp ảnh từ video có nguồn khác
                >
                  Your browser does not support the video tag.
                </video>
                
                {/* Lớp phủ hiển thị nút Play/Pause ở giữa */}
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

                {/* Hiển thị thông tin khung hình */}
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

                {/* Thanh điều khiển video ở dưới */}
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent transition-all duration-300",
                    isControlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full",
                  )}
                >
                  {/* Thanh tiến trình */}
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
                  {/* Nút Play/Pause và hiển thị thời gian */}
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

        {/* Cột bên phải: Panel phân tích AI */}
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

      {/* Phần điều khiển phát hiện và lịch sử */}
      <div className="mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Detection Controls & History</CardTitle>
            {/* Các nút hành động cho bảng */}
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" disabled={history.length === 0}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Table
              </Button>
              <Button onClick={handleExport} disabled={history.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-between">
              {/* Các nút bấm để tăng số lượng phát hiện */}
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

              {/* Các nút bấm xác nhận Đúng/Sai */}
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

            {/* Bảng lịch sử phát hiện */}
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
                        <TableCell className="font-mono py-1 px-4">
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
                        {/* Ô đánh giá có thể tương tác để thay đổi */}
                        <TableCell className="group/cell relative text-center py-1 px-4">
                          {entry.rating === 'T' ? (
                            <span className="font-bold text-primary">T</span>
                          ) : (
                            <span className="font-bold text-destructive">F</span>
                          )}
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity bg-card">
                            {entry.rating === 'T' ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleUpdateRating(entry.id, 'F')}
                                aria-label="Change to Incorrect"
                              >
                                F
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white h-7 w-7 p-0"
                                onClick={() => handleUpdateRating(entry.id, 'T')}
                                aria-label="Change to Correct"
                              >
                                T
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        {/* Ô hành động với nút xóa */}
                        <TableCell className="text-center py-1 px-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
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
                    // Hiển thị khi không có dữ liệu trong lịch sử
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No history yet. Press "Correct" or "Incorrect" to log an entry.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
