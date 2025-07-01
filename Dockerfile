# Sử dụng base image Python 3.11 slim (nhẹ hơn full)
FROM python:3.11-slim

# 1. Cài đặt các thư viện hệ thống cần thiết cho OpenCV
# Cập nhật danh sách gói, cài đặt các thư viện, và dọn dẹp cache
# libgl1-mesa-glx và libglib2.0-0 thường là cần thiết cho OpenCV để hoạt động ổn định trong Docker.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    ffmpeg \
    # Thêm ffmpeg nếu bạn xử lý video và gặp lỗi với codec hoặc định dạng
    && rm -rf /var/lib/apt/lists/*

# Đặt thư mục làm việc bên trong container
WORKDIR /app

# 2. Copy file requirements.txt và cài đặt các dependencies Python.
# Sử dụng COPY riêng cho requirements.txt trước khi COPY toàn bộ mã nguồn
# giúp tận dụng Docker cache hiệu quả hơn.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copy toàn bộ mã nguồn ứng dụng vào thư mục làm việc /app
# Đảm bảo rằng cấu trúc thư mục của bạn khớp với các lệnh COPY này:
# your_project/
# ├── app/
# │   └── ... (bao gồm app/models/last.pt)
# ├── templates/
# ├── static/
# ├── requirements.txt
# └── Dockerfile
COPY ./app .
COPY ./templates .
COPY ./static .

# EXPOSE cổng mà ứng dụng FastAPI sẽ lắng nghe
EXPOSE 80

# Lệnh mặc định để chạy ứng dụng khi container khởi động.
# Sử dụng `--host 0.0.0.0` để lắng nghe trên tất cả các giao diện mạng.
# Bỏ "--reload" nếu đây là môi trường sản phẩm (production).
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
# Hoặc cho môi trường phát triển:
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80", "--reload"]