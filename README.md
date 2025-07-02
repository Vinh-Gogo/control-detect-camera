## Cấu trúc dự án

Dưới đây là cấu trúc cây thư mục của dự án cùng với giải thích chi tiết về vai trò và mối quan hệ của từng thành phần.

```
.
├── src/
│   ├── app/
│   │   ├── globals.css      # File CSS toàn cục, chứa các biến màu và theme của Tailwind/ShadCN.
│   │   ├── layout.tsx       # Layout gốc của ứng dụng, bao bọc tất cả các trang.
│   │   └── page.tsx         # Component trang chính (homepage), điểm vào của ứng dụng.
│   │
│   ├── components/
│   │   ├── ui/              # Chứa các component giao diện người dùng từ thư viện ShadCN (Button, Card, etc.).
│   │   └── video-stream-deck.tsx # Component chính chứa toàn bộ logic và giao diện của ứng dụng.
│   │
│   ├── ai/
│   │   ├── genkit.ts        # File cấu hình và khởi tạo Genkit, kết nối với các dịch vụ AI của Google.
│   │   └── dev.ts           # File dùng để chạy Genkit ở môi trường development.
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx   # Hook tùy chỉnh để phát hiện thiết bị có phải là mobile hay không.
│   │   └── use-toast.ts     # Hook để quản lý và hiển thị thông báo (toast).
│   │
│   └── lib/
│       └── utils.ts         # Chứa các hàm tiện ích, ví dụ như hàm `cn` để kết hợp class CSS.
│
├── next.config.ts           # File cấu hình cho Next.js (ví dụ: cấu hình images, build,...).
├── package.json             # Liệt kê các gói thư viện (dependencies) và các script (dev, build, start).
├── tailwind.config.ts       # File cấu hình cho Tailwind CSS (ví dụ: định nghĩa font, màu sắc, plugins).
└── tsconfig.json            # File cấu hình cho TypeScript, định nghĩa các quy tắc cho trình biên dịch.
```

### Giải thích chi tiết:

*   **`src/app/`**: Đây là trung tâm của ứng dụng theo kiến trúc App Router của Next.js.
    *   `layout.tsx` định nghĩa cấu trúc HTML chung (ví dụ: thẻ `<html>`, `<body>`, font chữ) cho toàn bộ trang web. Nó bao bọc `page.tsx`.
    *   `page.tsx` là nội dung chính của trang chủ. Nó sử dụng component `VideoStreamDeck` từ `src/components/`.
    *   `globals.css` định nghĩa các style toàn cục và các biến màu HSL cho theme. `tailwind.config.ts` và các component trong `src/components/ui/` đều sử dụng các biến này.

*   **`src/components/`**: Nơi chứa các khối xây dựng giao diện của ứng dụng.
    *   `ui/`: Các component cơ bản, được tạo sẵn bởi ShadCN, giúp xây dựng giao diện nhanh chóng và nhất quán.
    *   `video-stream-deck.tsx`: Đây là component "thông minh" (smart component), nơi tập trung hầu hết logic nghiệp vụ của ứng dụng: quản lý trạng thái video, xử lý sự kiện, tương tác với người dùng và hiển thị dữ liệu. Nó sử dụng rất nhiều component từ `ui/`.

*   **`src/ai/`**: Thư mục dành riêng cho các chức năng liên quan đến Trí tuệ nhân tạo (AI).
    *   `genkit.ts` là file quan trọng để thiết lập kết nối đến các mô hình AI (như Gemini). Các flow AI trong tương lai sẽ import đối tượng `ai` từ file này.

*   **`src/hooks/` & `src/lib/`**: Chứa code có thể tái sử dụng trên toàn ứng dụng.
    *   `hooks/`: Chứa các React Hook tùy chỉnh để đóng gói và tái sử dụng logic có trạng thái (stateful logic).
    *   `lib/`: Chứa các hàm tiện ích thuần túy, không phụ thuộc vào React.

*   **Các file cấu hình ở gốc dự án**:
    *   `package.json`: "Trái tim" của dự án Node.js, quản lý các thư viện bên ngoài.
    *   `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`: Các file này định nghĩa cách Next.js, Tailwind CSS và TypeScript hoạt động, giúp tùy chỉnh quá trình build và phát triển ứng dụng.

## Hướng dẫn Cài đặt và Chạy dự án

Làm theo các bước dưới đây để cài đặt và chạy dự án trên máy tính cá nhân của bạn.

### 1. Tải dự án từ GitHub

Mở Command Prompt (CMD) hoặc Terminal và sử dụng lệnh `git clone` để sao chép repository về máy. Thay thế `URL_REPOSITORY` bằng đường dẫn SSH hoặc HTTPS của repository trên GitHub.

```bash
git clone <URL_REPOSITORY>
```

Sau đó, di chuyển vào thư mục vừa tải về:

```bash
cd <TEN_THU_MUC_DU_AN>
```

### 2. Cài đặt các thư viện cần thiết

Trong thư mục gốc của dự án, chạy lệnh sau để cài đặt tất cả các thư viện được định nghĩa trong file `package.json`:

```bash
npm install
```

Lệnh này sẽ tải và cài đặt các dependencies như React, Next.js, Tailwind CSS, ShadCN, Genkit,...

### 3. Chạy ứng dụng (Môi trường Development)

Sau khi cài đặt thành công, sử dụng lệnh sau để khởi động server phát triển (development server):

```bash
npm run dev
```

Ứng dụng của bạn sẽ chạy tại địa chỉ `http://localhost:9002` (hoặc một cổng khác nếu cổng 9002 đã được sử dụng). Mở trình duyệt và truy cập địa chỉ này để xem trang web.

### 4. Chạy dự án với Docker (Môi trường Production - Khuyến nghị)

Phương pháp này sẽ khởi chạy cả ứng dụng web (Next.js) và dịch vụ AI (Python/Flask) trong các container riêng biệt, đảm bảo môi trường hoạt động nhất quán và tách biệt khỏi máy tính của bạn.

**Yêu cầu:**
*   [Docker](https://www.docker.com/get-started) đã được cài đặt trên máy của bạn.
*   [Docker Compose](https://docs.docker.com/compose/install/) (thường đi kèm với Docker Desktop).

**Các bước thực hiện:**

1.  **Build và Chạy Container:**
    Mở CMD hoặc Terminal từ thư mục gốc của dự án và chạy lệnh sau:
    ```bash
    docker-compose up --build
    ```
    *   Lệnh `docker-compose up` sẽ tìm file `docker-compose.yml`, sau đó build và khởi chạy các service (`web` và `api`) được định nghĩa trong đó.
    *   Cờ `--build` sẽ yêu cầu Docker build lại image từ đầu nếu có bất kỳ thay đổi nào trong `Dockerfile` hoặc mã nguồn, đảm bảo bạn luôn chạy phiên bản mới nhất.

2.  **Truy cập ứng dụng:**
    Sau khi các container khởi động thành công, bạn có thể truy cập ứng dụng web tại địa chỉ: `http://localhost:9002`.
    Dịch vụ API sẽ chạy ngầm và được ứng dụng web tự động gọi đến.

3.  **Dừng ứng dụng:**
    Để dừng các container, nhấn tổ hợp phím `Ctrl + C` trong terminal đang chạy. Để xóa các container và network đã tạo, bạn có thể chạy:
    ```bash
    docker-compose down
    ```
