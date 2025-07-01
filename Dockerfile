# Giai đoạn 1: Cài đặt dependencies
# Chỉ cài đặt lại khi package.json hoặc lock file thay đổi để tận dụng Docker cache.
FROM node:20-alpine AS deps
# Gói `libc6-compat` là cần thiết để Next.js chạy trên Alpine Linux.
# https://nextjs.org/docs/pages/building-your-application/deploying/docker-image#running-nextjs-on-alpine-linux
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Cài đặt dependencies dựa trên trình quản lý gói được sử dụng (npm, yarn, pnpm).
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Giai đoạn 2: Build ứng dụng
# Chỉ build lại source code khi có sự thay đổi.
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js sẽ thu thập các tệp cần thiết cho môi trường production vào thư mục /.next/standalone.
# Xem thêm: https://nextjs.org/docs/advanced-features/output-file-tracing
RUN npm run build

# Giai đoạn 3: Tạo image cho môi trường production
# Image này nhỏ gọn và chỉ chứa những gì cần thiết để chạy ứng dụng.
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Bỏ comment dòng sau nếu bạn muốn tắt thu thập dữ liệu từ xa (telemetry) của Next.js.
# ENV NEXT_TELEMETRY_DISABLED 1

# Tạo user và group riêng để chạy ứng dụng, tăng cường bảo mật.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Tự động sử dụng output traces để giảm kích thước image.
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 9002

ENV PORT 9002

# file `server.js` được tạo ra bởi `next build` với chế độ standalone.
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
