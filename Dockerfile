
# Stage 1: Installer - Cài đặt các dependencies
# Sử dụng base image Node.js phiên bản 20-alpine, là một phiên bản nhẹ và an toàn.
FROM node:20-alpine AS deps
WORKDIR /app

# Sao chép package.json và package-lock.json (nếu có) vào thư mục làm việc.
COPY package.json ./
# Một số dự án có thể dùng yarn.lock hoặc pnpm-lock.yaml, bạn có thể thêm chúng ở đây.
# COPY package-lock.json yarn.lock pnpm-lock.yaml ./

# Chạy `npm install` để cài đặt các thư viện cần thiết.
# Sử dụng --frozen-lockfile để đảm bảo cài đặt đúng phiên bản trong package-lock.json.
RUN npm install --frozen-lockfile


# Stage 2: Builder - Build ứng dụng Next.js
# Bắt đầu từ một base image tương tự như stage trước.
FROM node:20-alpine AS builder
WORKDIR /app

# Sao chép các thư viện đã được cài đặt từ stage 'deps'.
# Điều này tận dụng Docker cache, giúp build nhanh hơn nếu dependencies không thay đổi.
COPY --from=deps /app/node_modules ./node_modules
# Sao chép toàn bộ mã nguồn còn lại của dự án.
COPY . .

# Chạy lệnh build của Next.js để tạo ra phiên bản production tối ưu.
# Biến môi trường NEXT_TELEMETRY_DISABLED=1 để tắt thu thập dữ liệu từ Next.js.
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build


# Stage 3: Runner - Chạy ứng dụng production
# Sử dụng một base image sạch, chỉ chứa những gì cần thiết để chạy ứng dụng.
FROM node:20-alpine AS runner
WORKDIR /app

# Thiết lập môi trường là 'production' để Next.js chạy ở chế độ tối ưu.
ENV NODE_ENV=production
# Tắt thu thập dữ liệu từ Next.js trong môi trường production.
ENV NEXT_TELEMETRY_DISABLED 1

# Tạo một group và user mới không phải 'root' để tăng cường bảo mật cho container.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Sao chép các file cần thiết từ output 'standalone' của Next.js ở stage 'builder'.
# output: 'standalone' trong next.config.js sẽ gom tất cả file cần thiết vào một thư mục.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Sao chép thư mục '.next/static' chứa các assets đã được build (CSS, JS, hình ảnh, fonts).
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Chuyển sang user 'nextjs' đã tạo để chạy ứng dụng.
# Chạy với user không phải root là một best practice về bảo mật.
USER nextjs

# Mở cổng 9002 để cho phép traffic từ bên ngoài vào container.
EXPOSE 9002

# Thiết lập biến môi trường PORT. Next.js server sẽ tự động lắng nghe trên cổng này.
ENV PORT=9002

# Lệnh để khởi động server Next.js.
# File server.js được tạo ra bởi output 'standalone'.
CMD ["node", "server.js"]
