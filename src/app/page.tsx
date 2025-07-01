// Nhập component VideoStreamDeck, là component chính của ứng dụng.
import VideoStreamDeck from '@/components/video-stream-deck';

/**
 * Component `Home` là trang chính của ứng dụng, được hiển thị tại route gốc (`/`).
 * Nó thiết lập layout chính và hiển thị component `VideoStreamDeck`.
 */
export default function Home() {
  return (
    // Thẻ <main> là container chính cho nội dung trang.
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* Tiêu đề chính của ứng dụng. */}
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 font-headline text-primary">
          Dispatch Monitoring System
        </h1>
        {/* Hiển thị component VideoStreamDeck, chứa toàn bộ chức năng chính của ứng dụng. */}
        <VideoStreamDeck />
      </div>
    </main>
  );
}
