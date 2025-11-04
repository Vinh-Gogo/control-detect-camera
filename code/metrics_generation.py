class EvaluationMetrics:
    def __init__(self):
        self.total_answers = 0
        self.correct_answers = 0
        self.relevant_answers = 0
        self.hallucinated_answers = 0
        self.faithfulness_score = 0.0
        self.answer_relevancy_score = 0.0
        self.correctness_score = 0.0
        self.hallucination_rate = 0.0

    def add_answer(self, is_correct: bool, is_relevant: bool, is_hallucinated: bool):
        self.total_answers += 1
        if is_correct:
            self.correct_answers += 1
        if is_relevant:
            self.relevant_answers += 1
        if is_hallucinated:
            self.hallucinated_answers += 1
        self.update_metrics()

    def update_metrics(self):
        self.faithfulness_score = self.correct_answers / self.total_answers if self.total_answers > 0 else 0
        self.answer_relevancy_score = self.relevant_answers / self.total_answers if self.total_answers > 0 else 0
        self.correctness_score = self.correct_answers / self.total_answers if self.total_answers > 0 else 0
        self.hallucination_rate = self.hallucinated_answers / self.total_answers if self.total_answers > 0 else 0

    def get_metrics(self):
        return {
            'faithfulness_score': self.faithfulness_score,
            'answer_relevancy_score': self.answer_relevancy_score,
            'correctness_score': self.correctness_score,
            'hallucination_rate': self.hallucination_rate
        }
