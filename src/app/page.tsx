import VideoStreamDeck from '@/components/video-stream-deck';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 font-headline text-primary">
          Video Stream Deck
        </h1>
        <VideoStreamDeck />
      </div>
    </main>
  );
}
