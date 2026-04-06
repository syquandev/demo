import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

export function initGemini(apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export function isGeminiReady() {
  return model !== null;
}

/**
 * Teacher: Generate quiz questions from lesson content
 */
export async function generateQuestions(content, numQuestions = 5) {
  if (!model) throw new Error('Gemini chưa được khởi tạo. Vui lòng nhập API Key.');

  const prompt = `Bạn là AI giáo dục. Dựa trên nội dung bài học bên dưới, hãy tạo ${numQuestions} câu hỏi trắc nghiệm (mỗi câu 4 đáp án A, B, C, D).

**Yêu cầu:**
- Trả về JSON array theo format chính xác sau (KHÔNG thêm bất kỳ text nào khác ngoài JSON):
[
  {
    "question": "Nội dung câu hỏi?",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correctIndex": 0,
    "explanation": "Giải thích ngắn gọn tại sao đáp án đúng"
  }
]

- correctIndex là index (0-3) của đáp án đúng
- Câu hỏi phải bao gồm nhiều mức độ: nhớ, hiểu, vận dụng
- Ngôn ngữ: tiếng Việt (trừ khi nội dung bài bằng tiếng Anh thì giữ nguyên)

**Nội dung bài học:**
${content}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Không thể parse kết quả AI. Vui lòng thử lại.');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Teacher: Generate essay/open-ended questions
 */
export async function generateEssayQuestions(content, numQuestions = 3) {
  if (!model) throw new Error('Gemini chưa được khởi tạo. Vui lòng nhập API Key.');

  const prompt = `Bạn là AI giáo dục. Dựa trên nội dung bài học bên dưới, hãy tạo ${numQuestions} câu hỏi tự luận.

**Yêu cầu:**
- Trả về JSON array theo format chính xác (KHÔNG thêm text ngoài JSON):
[
  {
    "question": "Nội dung câu hỏi tự luận?",
    "sampleAnswer": "Đáp án mẫu chi tiết",
    "gradingCriteria": "Tiêu chí chấm điểm"
  }
]

- Câu hỏi cần yêu cầu tư duy phân tích, tổng hợp
- Ngôn ngữ: tiếng Việt

**Nội dung bài học:**
${content}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Không thể parse kết quả AI. Vui lòng thử lại.');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Student: AI grades the student's exercise submission
 */
export async function gradeExercise(questions, answers) {
  if (!model) throw new Error('Gemini chưa được khởi tạo. Vui lòng nhập API Key.');

  const qaList = questions.map((q, i) => {
    if (q.type === 'multiple_choice') {
      const selectedOption = q.options[answers[i]];
      const correctOption = q.options[q.correctIndex];
      return `Câu ${i + 1} (Trắc nghiệm): ${q.question}
- Đáp án đúng: ${correctOption}
- Học viên chọn: ${selectedOption || '(Không trả lời)'}
- Kết quả: ${answers[i] === q.correctIndex ? 'ĐÚNG' : 'SAI'}`;
    } else {
      return `Câu ${i + 1} (Tự luận): ${q.question}
- Đáp án mẫu: ${q.sampleAnswer}
- Tiêu chí: ${q.gradingCriteria}
- Bài làm học viên: ${answers[i] || '(Không trả lời)'}`;
    }
  }).join('\n\n');

  const prompt = `Bạn là giáo viên AI chấm bài. Hãy chấm điểm và nhận xét bài làm của học viên.

**Bài làm:**
${qaList}

**Yêu cầu trả về JSON (KHÔNG thêm text ngoài JSON):**
{
  "totalScore": 8.5,
  "maxScore": 10,
  "overallComment": "Nhận xét tổng quan về bài làm",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu 1"],
  "suggestions": ["Gợi ý cải thiện 1", "Gợi ý cải thiện 2"],
  "questionFeedback": [
    {
      "questionIndex": 0,
      "score": 1,
      "maxScore": 1,
      "feedback": "Nhận xét cho câu này"
    }
  ]
}

- Chấm điểm công bằng, chi tiết
- Nhận xét khuyến khích, mang tính xây dựng
- Tổng điểm trên thang 10`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Không thể parse kết quả chấm điểm. Vui lòng thử lại.');
  }

  return JSON.parse(jsonMatch[0]);
}
