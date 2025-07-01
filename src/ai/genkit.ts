// Nhập hàm `genkit` từ thư viện core của Genkit.
import {genkit} from 'genkit';
// Nhập plugin `googleAI` để kết nối Genkit với các mô hình AI của Google.
import {googleAI} from '@genkit-ai/googleai';

/**
 * Khởi tạo và cấu hình đối tượng `ai` của Genkit.
 * Đối tượng này là điểm truy cập chính để sử dụng các chức năng AI trong ứng dụng.
 */
export const ai = genkit({
  // Mảng `plugins` chứa các plugin sẽ được sử dụng. Ở đây ta dùng googleAI().
  plugins: [googleAI()],
  // `model` chỉ định mô hình ngôn ngữ mặc định sẽ được sử dụng cho các tác vụ AI.
  // 'googleai/gemini-2.0-flash' là một mô hình nhanh và hiệu quả của Google.
  model: 'googleai/gemini-2.0-flash',
});
