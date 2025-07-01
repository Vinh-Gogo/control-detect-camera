// Nhập kiểu `Metadata` từ Next.js để định nghĩa siêu dữ liệu cho trang.
import type {Metadata} from 'next';
// Nhập file CSS toàn cục của ứng dụng.
import './globals.css';
// Nhập component `Toaster` để hiển thị các thông báo (toast notifications).
import {Toaster} from '@/components/ui/toaster';

// Biến `metadata` chứa thông tin về trang web, hữu ích cho SEO và trình duyệt.
export const metadata: Metadata = {
  title: 'Dispatch Monitoring System',
  description: 'A system for monitoring and annotating video dispatch feeds.',
};

/**
 * Component `RootLayout` là layout gốc bao bọc toàn bộ ứng dụng.
 * Mọi trang trong ứng dụng sẽ được hiển thị bên trong layout này.
 * @param {object} props - Props của component.
 * @param {React.ReactNode} props.children - Các component con (các trang) sẽ được render ở đây.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Thẻ <html> là thẻ gốc của trang, đặt ngôn ngữ là tiếng Anh và sử dụng theme tối.
    <html lang="en" className="dark">
      <head>
        {/* Các thẻ <link> để kết nối và tải font 'Inter' từ Google Fonts. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      {/* Thẻ <body> chứa toàn bộ nội dung hiển thị của trang. */}
      <body className="font-body antialiased">
        {/* `children` đại diện cho nội dung của trang hiện tại. */}
        {children}
        {/* Component `Toaster` được đặt ở đây để có thể hiển thị thông báo trên toàn bộ ứng dụng. */}
        <Toaster />
      </body>
    </html>
  );
}
