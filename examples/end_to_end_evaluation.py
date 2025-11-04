import numpy as np
import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score

class RAGEvaluation:
    def __init__(self, true_labels, predictions):
        self.true_labels = true_labels
        self.predictions = predictions

    def calculate_metrics(self):
        precision = precision_score(self.true_labels, self.predictions, average='weighted')
        recall = recall_score(self.true_labels, self.predictions, average='weighted')
        f1 = f1_score(self.true_labels, self.predictions, average='weighted')
        accuracy = accuracy_score(self.true_labels, self.predictions)
        return {"precision": precision, "recall": recall, "f1_score": f1, "accuracy": accuracy}

if __name__ == '__main__':
    # Example true labels and predictions
    true_labels = np.array([1, 0, 1, 1, 0])
    predictions = np.array([1, 0, 0, 1, 0])
    
    evaluator = RAGEvaluation(true_labels, predictions)
    metrics = evaluator.calculate_metrics()
    print("Metrics:")
    for metric, value in metrics.items():
        print(f"{metric}: {value:.2f}")